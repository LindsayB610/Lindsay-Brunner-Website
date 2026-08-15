/**
 * Workshop product-page contract.
 *
 * Covers the published route, Workshop → Slate/Pulse hierarchy, local image
 * assets, CTA and navigation contracts, scoped page CSS, and real browser
 * layout at desktop and phone widths.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const renderedPagePath = path.join(publicDir, 'workshop', 'index.html');
const layoutPath = path.join(root, 'layouts', 'workshop', 'single.html');
const contentPath = path.join(root, 'content', 'workshop', 'index.md');
const cssPath = path.join(root, 'static', 'css', 'workshop.css');
const headPath = path.join(root, 'layouts', 'partials', 'head.html');
const headerPath = path.join(root, 'layouts', 'partials', 'header.html');
const footerPath = path.join(root, 'layouts', 'partials', 'footer.html');
const failures = [];

const expectedImages = [
  {
    src: '/images/workshop/workshop-shelf.png',
    alt: 'Workshop desktop app with Slate and Pulse ready to install',
  },
  {
    src: '/images/workshop/pulse-take-out-trash.png',
    alt: 'Pulse reminders dashboard showing a Take out trash reminder and an online runner',
  },
  {
    src: '/images/workshop/pulse-edit-take-out-trash.png',
    alt: 'Pulse editor for the Take out trash reminder, showing its weekly schedule and snooze timing',
  },
];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  }[extension] || 'application/octet-stream';
}

function publicFileForRequest(requestUrl) {
  const decodedPath = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^([.][.][/\\])+/, '');
  let filePath = path.join(publicDir, normalizedPath);

  if (decodedPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  return filePath.startsWith(publicDir) ? filePath : null;
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const filePath = publicFileForRequest(request.url);
    if (!filePath || !fs.existsSync(filePath)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'content-type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

function testSourceContracts() {
  console.log('🧰 Validating Workshop source contracts...');

  [contentPath, layoutPath, cssPath, headPath, headerPath, footerPath].forEach((filePath) => {
    assert(fs.existsSync(filePath), `Expected Workshop support file is missing: ${path.relative(root, filePath)}`);
  });

  if (!fs.existsSync(layoutPath) || !fs.existsSync(cssPath)) return;

  const layout = read(layoutPath);
  const css = read(cssPath);
  const head = read(headPath);
  const header = read(headerPath);
  const footer = read(footerPath);

  assert(layout.includes('id="workshop-title"'), 'Workshop layout should expose an identified hero heading');
  assert(layout.includes('Workshop is the host. Slate and Pulse live inside it.'), 'Workshop layout should state the host → tool relationship');
  assert(
    (layout.match(/Inside Workshop/g) || []).length >= 2,
    'Slate and Pulse should both be explicitly labeled as Workshop tools',
  );
  assert(!layout.includes('workshop-flow'), 'Workshop layout should not restore the removed duplicate how-it-works section');

  assert(head.includes('eq .RelPermalink "/workshop/"'), 'Workshop stylesheet should load only on the Workshop route');
  assert(css.includes('.workshop-page'), 'Workshop stylesheet should use a page-scoped root selector');
  assert(css.includes('.workshop-button {') && css.includes('border: 0;'), 'Workshop primary buttons should not restore a visible border');
  assert(css.includes('@media (max-width: 640px)'), 'Workshop stylesheet should include a phone layout breakpoint');
  assert(header.includes('href="/workshop/"'), 'Site header should expose Workshop navigation');
  assert(
    header.indexOf('href="/workshop/"') < header.indexOf('class="nav-dropdown"'),
    'Workshop should be a top-level navigation item before More',
  );
  assert(footer.includes('href="/workshop/"'), 'Site footer should expose Workshop navigation');
}

function testRenderedContracts() {
  console.log('📄 Validating rendered Workshop markup and assets...');

  assert(fs.existsSync(renderedPagePath), 'public/workshop/index.html should exist. Run npm run build first.');
  if (!fs.existsSync(renderedPagePath)) return;

  const rendered = read(renderedPagePath);
  const workshopIndex = rendered.indexOf('One desktop home. Two focused tools.');
  const slateIndex = rendered.indexOf('Slate is the Workshop tool');
  const pulseIndex = rendered.indexOf('Pulse is the Workshop tool');

  assert(rendered.includes('/css/workshop.css'), 'Rendered Workshop page should load its dedicated stylesheet');
  assert(rendered.includes('A home for the tools that keep your real work moving.'), 'Rendered Workshop page should retain its approved hero promise');
  assert(rendered.includes('Workshop, Slate, and Pulse are open source.'), 'Rendered Workshop page should state that Workshop and its included tools are open source');
  assert(workshopIndex !== -1 && slateIndex > workshopIndex && pulseIndex > slateIndex, 'Rendered Workshop page should introduce Workshop before Slate, then Pulse');
  assert(!rendered.includes('Small tools. Clear boundaries.'), 'Rendered Workshop page should not restore duplicate flow copy');

  expectedImages.forEach(({ src, alt }) => {
    const staticPath = path.join(root, 'static', src.replace(/^\//, ''));
    const builtPath = path.join(publicDir, src.replace(/^\//, ''));
    assert(fs.existsSync(staticPath), `Workshop source image is missing: ${src}`);
    assert(fs.existsSync(builtPath), `Workshop built image is missing: ${src}`);
    assert(rendered.includes(`src=${src}`), `Workshop page should render ${src}`);
    assert(rendered.includes(`alt="${alt}"`), `Workshop image should retain descriptive alt text: ${src}`);
  });

  assert(
    rendered.includes('href=https://github.com/LindsayB610/workshop') &&
      rendered.includes('target=_blank') &&
      rendered.includes('rel="noopener noreferrer"'),
    'Workshop GitHub CTA should keep its destination and safe external-link attributes',
  );
}

async function testBrowserLayout() {
  console.log('🖥️  Validating Workshop browser layout...');

  if (!fs.existsSync(renderedPagePath)) return;

  const { chromium } = await import('playwright');
  const { server, origin } = await startStaticServer();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    for (const viewport of [
      { width: 1440, height: 1000, label: 'desktop' },
      { width: 390, height: 844, label: 'mobile' },
    ]) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.label === 'mobile' ? 2 : 1,
        isMobile: viewport.label === 'mobile',
      });

      await page.goto(`${origin}/workshop/`, { waitUntil: 'networkidle' });
      await page.locator('.workshop-pulse-shot--detail').scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const imageMetrics = [...document.querySelectorAll('.workshop-page img')].map((image) => ({
          src: image.getAttribute('src'),
          alt: image.getAttribute('alt'),
          complete: image.complete,
          naturalWidth: image.naturalWidth,
        }));
        const heroCta = document.querySelector('.workshop-hero .workshop-button--primary');
        const closingCta = document.querySelector('.workshop-closing .workshop-button--primary');
        const headingTexts = [...document.querySelectorAll('.workshop-page h1, .workshop-page h2')]
          .map((heading) => heading.textContent.trim());
        const foundationCards = document.querySelector('.workshop-foundation__cards');
        const slateTool = document.querySelector('.workshop-tool--slate');
        const pulseTool = document.querySelector('.workshop-tool--pulse');

        return {
          overflowX: doc.scrollWidth - doc.clientWidth,
          h1Count: document.querySelectorAll('.workshop-page h1').length,
          hasWorkshopRoot: Boolean(document.querySelector('.workshop-page')),
          hasSlateLabel: headingTexts.some((text) => text.startsWith('Slate is the Workshop tool')),
          hasPulseLabel: headingTexts.some((text) => text.startsWith('Pulse is the Workshop tool')),
          imageMetrics,
          heroCtaText: heroCta?.textContent.trim() || '',
          heroCtaHref: heroCta?.getAttribute('href') || '',
          closingCtaText: closingCta?.textContent.trim() || '',
          foundationColumns: foundationCards ? getComputedStyle(foundationCards).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          slateColumns: slateTool ? getComputedStyle(slateTool).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
          pulseColumns: pulseTool ? getComputedStyle(pulseTool).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
        };
      });

      await page.locator('.workshop-hero .workshop-button--primary').focus();
      const focusMetrics = await page.locator('.workshop-hero .workshop-button--primary').evaluate((button) => {
        const styles = getComputedStyle(button);
        return {
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          borderWidth: styles.borderWidth,
        };
      });
      const screenshot = await page.screenshot({ fullPage: false });
      await page.close();

      assert(metrics.hasWorkshopRoot, `Workshop ${viewport.label} render should include the page root`);
      assert(metrics.h1Count === 1, `Workshop ${viewport.label} render should have exactly one H1`);
      assert(metrics.hasSlateLabel, `Workshop ${viewport.label} render should clearly identify Slate as a Workshop tool`);
      assert(metrics.hasPulseLabel, `Workshop ${viewport.label} render should clearly identify Pulse as a Workshop tool`);
      assert(metrics.overflowX === 0, `Workshop ${viewport.label} render should not create horizontal overflow; got ${metrics.overflowX}px`);
      assert(metrics.imageMetrics.length === expectedImages.length, `Workshop ${viewport.label} render should show all product screenshots`);
      metrics.imageMetrics.forEach((image) => {
        assert(image.alt, `Workshop ${viewport.label} screenshot ${image.src} should have alt text`);
        assert(image.complete && image.naturalWidth > 0, `Workshop ${viewport.label} screenshot ${image.src} should load successfully`);
      });
      assert(metrics.heroCtaText.includes('View Workshop on GitHub'), `Workshop ${viewport.label} hero should retain the GitHub CTA`);
      assert(metrics.heroCtaHref === 'https://github.com/LindsayB610/workshop', `Workshop ${viewport.label} hero CTA should point to the Workshop repository`);
      assert(metrics.closingCtaText.includes('View Workshop on GitHub'), `Workshop ${viewport.label} closing should repeat the GitHub CTA`);
      assert(focusMetrics.borderWidth === '0px', `Workshop ${viewport.label} gradient CTA should remain borderless`);
      assert(focusMetrics.outlineWidth === '3px' && focusMetrics.outlineStyle === 'solid', `Workshop ${viewport.label} gradient CTA should retain a visible keyboard focus treatment`);
      assert(screenshot.length > 10_000, `Workshop ${viewport.label} screenshot should contain rendered page content`);

      if (viewport.label === 'desktop') {
        assert(metrics.foundationColumns === 3, 'Workshop desktop foundation should keep three cards in one row');
        assert(metrics.slateColumns === 2, 'Workshop desktop Slate section should keep copy and preview side by side');
        assert(metrics.pulseColumns === 2, 'Workshop desktop Pulse section should keep screenshots and copy side by side');
      } else {
        assert(metrics.foundationColumns === 1, 'Workshop mobile foundation should stack its cards');
        assert(metrics.slateColumns === 1, 'Workshop mobile Slate section should stack copy and preview');
        assert(metrics.pulseColumns === 1, 'Workshop mobile Pulse section should stack screenshots and copy');
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function run() {
  testSourceContracts();
  testRenderedContracts();
  await testBrowserLayout();

  if (failures.length) {
    console.error('\n❌ Workshop page contract failed:');
    failures.forEach((failure) => console.error(`   - ${failure}`));
    process.exitCode = 1;
    return;
  }

  console.log('\n✅ Workshop page contract passed.');
}

run().catch((error) => {
  console.error('\n❌ Workshop page contract failed unexpectedly:');
  console.error(error);
  process.exitCode = 1;
});
