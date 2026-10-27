/**
 * Lucas Christmas catalog contract.
 *
 * The catalog is intentionally standalone and unlisted, so it needs its own
 * cheap regression checks instead of relying on the Hugo page suite.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'static', 'christmas-2026-lucas', 'index.html');
const cssPath = path.join(root, 'static', 'christmas-2026-lucas', 'christmas-catalog-v2.css');
const headersPath = path.join(root, 'static', '_headers');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function unique(values) {
  return [...new Set(values)];
}

function testCatalogContracts() {
  console.log('🎄 Validating Lucas Christmas catalog contracts...');

  [catalogPath, cssPath, headersPath].forEach((filePath) => {
    assert(fs.existsSync(filePath), `Expected catalog support file is missing: ${path.relative(root, filePath)}`);
  });

  if (!fs.existsSync(catalogPath) || !fs.existsSync(cssPath) || !fs.existsSync(headersPath)) return;

  const html = read(catalogPath);
  const css = read(cssPath);
  const headers = read(headersPath);
  const catalogRoot = path.dirname(catalogPath);

  assert(html.includes('<meta name="robots" content="noindex, nofollow, noarchive">'), 'Catalog must remain unlisted and excluded from archives');
  assert(html.includes('<link rel="stylesheet" href="christmas-catalog-v2.css">'), 'Catalog should load its scoped stylesheet');
  assert(html.includes('rel="icon" type="image/svg+xml" href="https://lindsaybrunner.com/christmas-2026-lucas/favicon-v2.svg"'), 'Catalog should retain its current favicon');
  assert(html.includes('property="og:url" content="https://lindsaybrunner.com/christmas-2026-lucas/"'), 'Catalog should expose its canonical Open Graph URL');
  assert(html.includes('property="og:image" content="https://lindsaybrunner.com/christmas-2026-lucas/lucas-christmas-2026-v2-og-1200x630.png"'), 'Catalog should expose the current wish-book social image');
  assert(html.includes('property="og:image:secure_url" content="https://lindsaybrunner.com/christmas-2026-lucas/lucas-christmas-2026-v2-og-1200x630.png"'), 'Catalog should expose a secure Open Graph image URL');
  assert(html.includes('<meta name="twitter:card" content="summary_large_image">'), 'Catalog should retain a large Twitter card');
  assert(headers.includes('/christmas-2026-lucas/*'), 'Netlify headers should keep the catalog route explicitly scoped');
  assert(headers.includes('X-Robots-Tag: noindex, nofollow, noarchive'), 'Netlify should reinforce the catalog noindex policy');

  const sectionIds = [...html.matchAll(/<section class="gift-section" id="([^"]+)">/g)].map((match) => match[1]);
  assert(
    JSON.stringify(sectionIds) === JSON.stringify(['clothing-sizes', 'transformers', 'avengers', 'magic', 'star-wars', 'lush', 'books-yoto-puzzles']),
    `Catalog sections should retain their ordered anchors, found: ${sectionIds.join(', ')}`,
  );

  const sectionStarts = [...html.matchAll(/<section class="gift-section" id="([^"]+)">/g)];
  sectionStarts.slice(1).forEach((match, index) => {
    const sectionStart = match.index + match[0].length;
    const nextSectionStart = sectionStarts[index + 2]?.index ?? html.indexOf('</main>', sectionStart);
    const sectionHtml = html.slice(sectionStart, nextSectionStart);
    assert(
      (sectionHtml.match(/<a href="#interests">Back to the interests list ↑<\/a>/g) || []).length === 1,
      `Gift section ${sectionIds[index + 1]} should retain exactly one back-link to the interests list`,
    );
  });
  const jumpTargets = [...html.matchAll(/<a class="jump" href="#([^"]+)"/g)].map((match) => match[1]);
  assert(JSON.stringify(jumpTargets) === JSON.stringify(sectionIds), 'Interest jump links should target each section in order');
  assert(!html.includes('Young Jedi'), 'Removed Young Jedi product content should stay absent');

  const localImages = unique([...html.matchAll(/(?:src|content)="(assets\/[^"#?]+|lucas-christmas-2026-v2-og-1200x630\.png)"/g)].map((match) => match[1]));
  localImages.forEach((relativePath) => {
    const assetPath = path.join(catalogRoot, relativePath);
    assert(fs.existsSync(assetPath), `Catalog local asset should exist: ${relativePath}`);
  });

  assert(css.includes('@media(max-width:650px)'), 'Catalog CSS should retain its mobile breakpoint');
  assert(css.includes('.interest-list,.products,.characters,.bath-gallery{grid-template-columns:1fr}'), 'Catalog mobile layout should stack multi-column groups');
  assert(css.includes('@media print'), 'Catalog CSS should retain print-specific rules');
  assert(css.includes('.jump,.back{display:none}'), 'Catalog print layout should hide navigation-only controls');
}

testCatalogContracts();

if (failures.length) {
  console.error(failures.map((failure) => `❌ ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('✅ Lucas Christmas catalog contracts passed.');
}
