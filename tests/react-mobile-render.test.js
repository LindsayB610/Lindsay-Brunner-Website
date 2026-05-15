const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const failures = [];

const routes = [
  { path: '/', label: 'homepage' },
  { path: '/about/', label: 'about page' },
  { path: '/ai-chat-exporter/', label: 'AI Chat Exporter page' },
];

const viewports = [
  { width: 390, height: 844, label: '390px phone' },
  { width: 360, height: 740, label: '360px phone' },
];

const contentTypeByExtension = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function resolvePublicPath(requestUrl) {
  const url = new URL(requestUrl, 'http://localhost');
  const decodedPath = decodeURIComponent(url.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(publicDir, normalizedPath);

  if (decodedPath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!filePath.startsWith(publicDir)) {
    return null;
  }

  return filePath;
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const filePath = resolvePublicPath(request.url);

    if (!filePath || !fs.existsSync(filePath)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'content-type': contentTypeByExtension[extension] || 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        origin: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function collectMobileMetrics(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;

    const isVisible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    };

    const contentOffenders = [...document.querySelectorAll('body *')]
      .filter(isVisible)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          selector: [
            el.tagName.toLowerCase(),
            el.id ? `#${el.id}` : '',
            String(el.className || '')
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 4)
              .map((className) => `.${className}`)
              .join(''),
          ].join(''),
          text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter(
        (item) =>
          item.text &&
          item.width > 0 &&
          item.height > 0 &&
          (item.left < -1 || item.right > doc.clientWidth + 1),
      )
      .slice(0, 12);

    const smallTargets = [...document.querySelectorAll('a, button')]
      .filter(isVisible)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          text: (el.textContent || el.getAttribute('aria-label') || '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 90),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
        };
      })
      .filter((item) => item.width < 44 || item.height < 44)
      .slice(0, 12);

    const testimonialIndicatorIssues = [...document.querySelectorAll('button[aria-label^="Show testimonial"]')]
      .filter(isVisible)
      .flatMap((button) => {
        const style = getComputedStyle(button);
        const span = button.querySelector('span');
        const spanRect = span?.getBoundingClientRect();
        const issues = [];

        if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          issues.push(`button background is ${style.backgroundColor}`);
        }

        if (spanRect && (spanRect.width > 28 || spanRect.height > 12)) {
          issues.push(`visible dot is ${Math.round(spanRect.width)}x${Math.round(spanRect.height)}`);
        }

        return issues;
      });

    const aboutTimelineHeading = [...document.querySelectorAll('#about-root h2')]
      .find((heading) => heading.textContent?.includes('timeline'));

    return {
      overflowX: doc.scrollWidth - doc.clientWidth,
      scrollHeight: doc.scrollHeight,
      contentOffenders,
      smallTargets,
      testimonialIndicatorIssues,
      aboutTimelineHeadingTop: aboutTimelineHeading
        ? Math.round(aboutTimelineHeading.getBoundingClientRect().top)
        : null,
    };
  });
}

function formatItems(items) {
  return items
    .map((item) => `${item.selector || item.text || 'target'} (${item.width}x${item.height})`)
    .join(', ');
}

async function run() {
  console.log('📱 Running React mobile render checks...');

  assert(fs.existsSync(path.join(publicDir, 'index.html')), 'public/index.html should exist. Run npm run build first.');
  assert(
    fs.existsSync(path.join(publicDir, 'about', 'index.html')),
    'public/about/index.html should exist. Run npm run build first.',
  );

  const { chromium } = await import('playwright');
  const { server, origin } = await startStaticServer();

  let browser;
  try {
    browser = await chromium.launch({ headless: true });

    for (const route of routes) {
      for (const viewport of viewports) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 2,
          isMobile: true,
        });

        await page.goto(`${origin}${route.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(250);
        const metrics = await collectMobileMetrics(page);
        await page.close();

        const label = `${route.label} at ${viewport.label}`;
        assert(metrics.overflowX === 0, `${label} should not create horizontal document overflow`);
        assert(
          metrics.contentOffenders.length === 0,
          `${label} should not have visible text/content clipped outside the viewport: ${formatItems(metrics.contentOffenders)}`,
        );
        assert(
          metrics.smallTargets.length === 0,
          `${label} should not have visible link/button targets smaller than 44px: ${formatItems(metrics.smallTargets)}`,
        );

        if (route.path === '/') {
          assert(
            metrics.testimonialIndicatorIssues.length === 0,
            `${label} testimonial carousel indicators should render as small transparent controls: ${metrics.testimonialIndicatorIssues.join(', ')}`,
          );
        }

        if (route.path === '/about/') {
          const maxTimelineStart = viewport.width <= 360 ? 1750 : 1700;
          assert(
            metrics.aboutTimelineHeadingTop !== null && metrics.aboutTimelineHeadingTop < maxTimelineStart,
            `${label} should reach the timeline before ${maxTimelineStart}px; got ${metrics.aboutTimelineHeadingTop}`,
          );
        }

        if (route.path === '/') {
          const maxHeight = viewport.width <= 360 ? 6800 : 6600;
          assert(
            metrics.scrollHeight < maxHeight,
            `${label} should stay reasonably compact on mobile; got ${metrics.scrollHeight}px`,
          );
        }
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length > 0) {
    console.error('\n❌ React mobile render checks failed:');
    failures.forEach((failure) => console.error(`   - ${failure}`));
    process.exit(1);
  }

  console.log('✅ React mobile render checks passed.');
}

run().catch((error) => {
  console.error('\n❌ React mobile render checks failed unexpectedly:');
  console.error(error);
  process.exit(1);
});
