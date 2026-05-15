const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const failures = [];

const routes = [
  { path: '/', label: 'homepage', h1: 'Complex technical ideas, made clear enough to trust.' },
  { path: '/about/', label: 'about page', h1: "Hey, I'm Lindsay Brunner" },
  { path: '/ai-chat-exporter/', label: 'AI Chat Exporter page', h1: 'AI Chat Exporter' },
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

async function collectAccessibilityMetrics(page) {
  return page.evaluate(() => {
    const parseColor = (value) => {
      const canvas = parseColor.canvas || (parseColor.canvas = document.createElement('canvas'));
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = '#000000';
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      }

      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return { r: 0, g: 0, b: 0, a: 0 };
      const [r, g, b, a = '1'] = match[1].split(',').map((part) => part.trim());
      return {
        r: Number(r),
        g: Number(g),
        b: Number(b),
        a: Number(a),
      };
    };

    const blend = (foreground, background) => {
      const alpha = foreground.a + background.a * (1 - foreground.a);
      if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
        g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
        b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
        a: alpha,
      };
    };

    const relativeLuminance = (color) => {
      const convert = (channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * convert(color.r) + 0.7152 * convert(color.g) + 0.0722 * convert(color.b);
    };

    const contrastRatio = (first, second) => {
      const l1 = relativeLuminance(first);
      const l2 = relativeLuminance(second);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

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

    const accessibleName = (el) => {
      const aria = el.getAttribute('aria-label');
      if (aria) return aria.trim();
      const title = el.getAttribute('title');
      if (title) return title.trim();
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
      if (text) return text;
      const imgAlt = el.querySelector('img[alt]')?.getAttribute('alt');
      return imgAlt?.trim() || '';
    };

    const directText = (el) => [...el.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const effectiveBackground = (el) => {
      let background = { r: 0, g: 0, b: 0, a: 1 };
      const colors = [];
      let current = el;

      while (current && current.nodeType === Node.ELEMENT_NODE) {
        colors.push(parseColor(getComputedStyle(current).backgroundColor));
        current = current.parentElement;
      }

      colors.reverse().forEach((color) => {
        if (color.a > 0) background = blend(color, background);
      });

      return background;
    };

    const selectorFor = (el) => [
      el.tagName.toLowerCase(),
      el.id ? `#${el.id}` : '',
      String(el.className || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((className) => `.${className}`)
        .join(''),
    ].join('');

    const visibleHeadings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(isVisible)
      .map((heading) => ({
        level: Number(heading.tagName.slice(1)),
        text: (heading.textContent || '').trim().replace(/\s+/g, ' '),
      }));

    const headingSkips = visibleHeadings
      .slice(1)
      .flatMap((heading, index) => {
        const previous = visibleHeadings[index];
        return heading.level > previous.level + 1
          ? [`${previous.text} (h${previous.level}) to ${heading.text} (h${heading.level})`]
          : [];
      });

    const unnamedControls = [...document.querySelectorAll('a, button')]
      .filter(isVisible)
      .filter((el) => !accessibleName(el))
      .map(selectorFor)
      .slice(0, 12);

    const badLinks = [...document.querySelectorAll('a[href]')]
      .filter(isVisible)
      .flatMap((el) => {
        const href = el.getAttribute('href') || '';
        const target = el.getAttribute('target');
        const rel = el.getAttribute('rel') || '';
        const issues = [];
        if (!href.trim() || href === '#') issues.push(`${accessibleName(el) || selectorFor(el)} has an empty/hash href`);
        if (target === '_blank' && !/\bnoopener\b/.test(rel) && !/\bnoreferrer\b/.test(rel)) {
          issues.push(`${accessibleName(el) || selectorFor(el)} opens a new tab without noopener/noreferrer`);
        }
        return issues;
      });

    const imageIssues = [...document.querySelectorAll('img')]
      .filter(isVisible)
      .flatMap((img) => {
        const issues = [];
        if (!img.hasAttribute('alt')) issues.push(`${selectorFor(img)} missing alt`);
        return issues;
      });

    const ariaHiddenFocusable = [...document.querySelectorAll('[aria-hidden="true"]')]
      .flatMap((el) => [...el.querySelectorAll('a, button, input, select, textarea, [tabindex]')])
      .filter((el) => el.getAttribute('tabindex') !== '-1')
      .map(selectorFor)
      .slice(0, 12);

    const contrastIssues = [...document.querySelectorAll('body *')]
      .filter((el) => !el.closest('svg') && isVisible(el) && directText(el))
      .flatMap((el) => {
        const style = getComputedStyle(el);
        const hasGradientText = (
          style.backgroundImage !== 'none' &&
          (style.color === 'rgba(0, 0, 0, 0)' || style.webkitTextFillColor === 'rgba(0, 0, 0, 0)')
        );
        if (hasGradientText) return [];

        const foreground = blend(parseColor(style.color), effectiveBackground(el));
        const background = effectiveBackground(el);
        const ratio = contrastRatio(foreground, background);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const required = isLargeText ? 3 : 4.5;

        if (ratio + 0.01 >= required) return [];

        return [{
          selector: selectorFor(el),
          text: directText(el).slice(0, 90),
          ratio: Number(ratio.toFixed(2)),
          required,
        }];
      })
      .slice(0, 12);

    const noscriptVisible = [...document.querySelectorAll('noscript')].some(isVisible);

    return {
      title: document.title,
      mainCount: document.querySelectorAll('main').length,
      visibleHeadings,
      headingSkips,
      h1Count: visibleHeadings.filter((heading) => heading.level === 1).length,
      unnamedControls,
      badLinks,
      imageIssues,
      ariaHiddenFocusable,
      contrastIssues,
      noscriptVisible,
    };
  });
}

function formatContrastIssues(issues) {
  return issues
    .map((issue) => `${issue.selector} "${issue.text}" ${issue.ratio}:1, needs ${issue.required}:1`)
    .join('; ');
}

async function run() {
  console.log('♿ Running React accessibility render checks...');

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
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      });

      await page.goto(`${origin}${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      const metrics = await collectAccessibilityMetrics(page);
      await page.close();

      assert(metrics.mainCount === 1, `${route.label} should have exactly one main landmark`);
      assert(metrics.h1Count === 1, `${route.label} should have exactly one visible h1`);
      assert(
        metrics.visibleHeadings.some((heading) => heading.level === 1 && heading.text.includes(route.h1)),
        `${route.label} should expose the expected h1`,
      );
      assert(metrics.headingSkips.length === 0, `${route.label} should not skip heading levels: ${metrics.headingSkips.join('; ')}`);
      assert(metrics.unnamedControls.length === 0, `${route.label} should not have unnamed links/buttons: ${metrics.unnamedControls.join(', ')}`);
      assert(metrics.badLinks.length === 0, `${route.label} should not have unsafe or empty links: ${metrics.badLinks.join('; ')}`);
      assert(metrics.imageIssues.length === 0, `${route.label} should not have image alt issues: ${metrics.imageIssues.join('; ')}`);
      assert(metrics.ariaHiddenFocusable.length === 0, `${route.label} should not hide focusable controls with aria-hidden: ${metrics.ariaHiddenFocusable.join(', ')}`);
      assert(metrics.contrastIssues.length === 0, `${route.label} should not have text contrast issues: ${formatContrastIssues(metrics.contrastIssues)}`);
      assert(metrics.noscriptVisible === false, `${route.label} should not visibly render no-JS fallback when JavaScript is available`);
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length > 0) {
    console.error('\n❌ React accessibility render checks failed:');
    failures.forEach((failure) => console.error(`   - ${failure}`));
    process.exit(1);
  }

  console.log('✅ React accessibility render checks passed.');
}

run().catch((error) => {
  console.error('\n❌ React accessibility render checks failed unexpectedly:');
  console.error(error);
  process.exit(1);
});
