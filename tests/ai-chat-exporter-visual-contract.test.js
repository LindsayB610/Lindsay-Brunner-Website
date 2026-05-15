const fs = require('fs');
const http = require('http');
const path = require('path');
const { assert, report, root } = require('./ai-chat-exporter-test-utils');

const failures = [];
const publicDir = path.join(root, 'public');

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

async function run() {
  console.log('🎨 Checking AI Chat Exporter visual contract...');

  assert(
    fs.existsSync(path.join(publicDir, 'ai-chat-exporter', 'index.html')),
    'public/ai-chat-exporter/index.html should exist. Run npm run build first.',
    failures,
  );

  const { chromium } = await import('playwright');
  const { server, origin } = await startStaticServer();

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

    await page.goto(`${origin}/ai-chat-exporter/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);

    const metrics = await page.evaluate(() => {
      const toRect = (element) => {
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          height: rect.height,
          top: rect.top,
          width: rect.width,
        };
      };

      const computed = (selector) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element) : null;
      };

      const h1 = computed('#ai-exporter-title');
      const input = computed('#ai-exporter-url');
      const radio = computed('input[type="radio"]');
      const focusedRadio = document.querySelector('input[type="radio"]');
      focusedRadio.focus();
      const radioFocus = getComputedStyle(focusedRadio);
      const pageRect = toRect(document.querySelector('.ai-exporter-page'));
      const footerRect = toRect(document.querySelector('.site-footer'));
      const visibleText = [];
      const walker = document.createTreeWalker(
        document.querySelector('#ai-chat-exporter-root'),
        NodeFilter.SHOW_TEXT,
      );

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent.trim().replace(/\s+/g, ' ');
        const parent = node.parentElement;

        if (!text || !parent || parent.closest('.sr-only')) {
          continue;
        }

        const style = getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();

        if (
          rect.width > 1 &&
          rect.height > 1 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0'
        ) {
          visibleText.push(text);
        }
      }

      return {
        footerGap: Math.round((footerRect.top - pageRect.bottom) * 100) / 100,
        h1: {
          fontFamily: h1.fontFamily,
          fontWeight: h1.fontWeight,
          whiteSpace: h1.whiteSpace,
        },
        input: {
          backdropFilter: input.backdropFilter || input.webkitBackdropFilter,
          backgroundColor: input.backgroundColor,
        },
        radio: {
          accentColor: radio.accentColor,
          focusBoxShadow: radioFocus.boxShadow,
          focusOutlineStyle: radioFocus.outlineStyle,
          focusOutlineWidth: radioFocus.outlineWidth,
        },
        visibleText,
      };
    });

    assert(metrics.footerGap === 0, `exporter section should meet the existing footer line without a gap; got ${metrics.footerGap}px`, failures);
    assert(metrics.h1.fontFamily.includes('Space Grotesk'), `H1 should use the site-standard Space Grotesk stack; got ${metrics.h1.fontFamily}`, failures);
    assert(metrics.h1.fontWeight === '600', `H1 should be unbolded to weight 600; got ${metrics.h1.fontWeight}`, failures);
    assert(metrics.h1.whiteSpace === 'nowrap', `desktop H1 should stay on one line; got ${metrics.h1.whiteSpace}`, failures);
    assert(metrics.input.backgroundColor === 'rgba(20, 20, 20, 0.74)', `URL input should be translucent; got ${metrics.input.backgroundColor}`, failures);
    assert(metrics.input.backdropFilter.includes('blur'), `URL input should soften beams with backdrop blur; got ${metrics.input.backdropFilter}`, failures);
    assert(metrics.radio.accentColor === 'rgb(255, 27, 141)', `radio selected accent should be brand pink; got ${metrics.radio.accentColor}`, failures);
    assert(metrics.radio.focusBoxShadow === 'none', `radio focus should not draw a Chrome focus square box-shadow; got ${metrics.radio.focusBoxShadow}`, failures);
    assert(metrics.radio.focusOutlineStyle === 'none' || metrics.radio.focusOutlineWidth === '0px', `radio focus should not draw a boxy outline; got ${metrics.radio.focusOutlineWidth} ${metrics.radio.focusOutlineStyle}`, failures);
    assert(!metrics.visibleText.includes('Shared ChatGPT URL'), 'URL label should be visually hidden while remaining accessible', failures);
    assert(!metrics.visibleText.includes('Export format'), 'format legend should be visually hidden while remaining accessible', failures);

    await page.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  report(failures, '✅ AI Chat Exporter visual contract passed.');
}

run().catch((error) => {
  failures.push(error?.stack || error?.message || String(error));
  report(failures, '✅ AI Chat Exporter visual contract passed.');
});
