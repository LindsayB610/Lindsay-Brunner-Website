/** Focused, browser-free contracts for the Codex display article's images. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { Config, Parser } = require('html-validate');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'content/blog/build-e-ink-codex-usage-display-with-ai.md'), 'utf8');
const frontMatter = yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)[1]);
const date = new Date(frontMatter.date).toISOString().slice(0, 10);
const pagePath = path.join(root, 'public/blog', date, frontMatter.slug, 'index.html');
const slides = JSON.parse(fs.readFileSync(path.join(root, 'data/codex_usage_display_process.json'), 'utf8'));

// Hugo may minify attribute quotes and escape captions. Parse the actual HTML
// with the existing validator, then decode Hugo's HTML escaping for comparisons.
function decoded(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return (value || '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()];
    return String.fromCodePoint(entity[1].toLowerCase() === 'x'
      ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10));
  });
}

function attr(node, name) {
  return decoded(node.getAttributeValue(name));
}

function one(node, selector) {
  const matches = node.querySelectorAll(selector);
  assert.equal(matches.length, 1, `Expected exactly one ${selector}; got ${matches.length}`);
  return matches[0];
}

function assetExists(url, directory) {
  assert.match(url, /^\/images\//, `Expected a local image path: ${url}`);
  const base = path.join(root, directory);
  const file = path.resolve(base, `.${url}`);
  assert(file.startsWith(`${base}${path.sep}`), `Image escapes ${directory}: ${url}`);
  assert(fs.existsSync(file) && fs.statSync(file).isFile(), `Missing ${directory} image: ${url}`);
}

async function article() {
  assert(fs.existsSync(pagePath), `Built Codex display article missing. Run npm run build first: ${pagePath}`);
  const config = await Config.fromObject([], { elements: ['html5'] });
  const dom = new Parser(await config.resolve()).parseHtml(fs.readFileSync(pagePath, 'utf8'));
  return { dom, content: one(dom, '.article-content') };
}

test('progress data has meaningful required fields and real image files', () => {
  assert(Array.isArray(slides) && slides.length > 0, 'Progress data must be a nonempty array');
  for (const [index, slide] of slides.entries()) {
    for (const field of ['phase', 'src', 'alt', 'caption']) {
      assert.equal(typeof slide?.[field], 'string', `Slide ${index + 1}: ${field} must be a string`);
      assert(slide[field].trim(), `Slide ${index + 1}: ${field} must not be blank`);
    }
    assetExists(slide.src, 'static');
  }
});

test('built progress gallery preserves all slides, loading policy, and accessible captions', async () => {
  const { dom, content } = await article();
  const carousel = one(content, '[data-carousel]');
  assert.equal(attr(carousel, 'aria-roledescription'), 'carousel');
  assert(attr(carousel, 'aria-label').trim(), 'Carousel needs an accessible name');
  const track = one(carousel, '[data-carousel-track]');
  assert.equal(attr(track, 'tabindex'), '0', 'Photo track must be keyboard focusable');
  const rendered = track.querySelectorAll('[data-carousel-slide]');
  assert.equal(rendered.length, slides.length, 'Rendered slide count must match progress data');

  for (const [index, figure] of rendered.entries()) {
    const slide = slides[index];
    const image = one(figure, 'img');
    assert.equal(attr(image, 'src'), slide.src, `Slide ${index + 1}: image/order mismatch`);
    assetExists(attr(image, 'src'), 'public');
    assert.equal(attr(image, 'alt'), slide.alt, `Slide ${index + 1}: alt text mismatch`);
    assert.equal(attr(image, 'loading'), index === 0 ? 'eager' : 'lazy', `Slide ${index + 1}: loading policy`);
    assert.equal(attr(figure, 'aria-roledescription'), 'slide');
    assert.equal(attr(figure, 'aria-label'), `${index + 1} of ${slides.length}`, `Slide ${index + 1}: position label`);
    assert.equal(attr(figure, 'data-slide-phase'), slide.phase, `Slide ${index + 1}: phase mismatch`);
    assert.equal(attr(figure, 'data-slide-caption'), slide.caption, `Slide ${index + 1}: caption mismatch`);
  }

  const caption = one(carousel, '[aria-live="polite"]');
  assert.equal(decoded(one(caption, '[data-carousel-caption-phase]').textContent).trim(), slides[0].phase);
  assert.equal(decoded(one(caption, '[data-carousel-caption]').textContent).trim(), slides[0].caption);
  for (const direction of ['previous', 'next']) {
    const button = one(carousel, `button[data-carousel-${direction}]`);
    assert.equal(attr(button, 'type'), 'button');
    assert(attr(button, 'aria-label').trim(), `${direction} button needs an accessible name`);
  }
  one(dom, 'script[src="/js/carousel.js"]');
});

test('inline responsive images retain usable srcsets and every candidate is shipped', async () => {
  const { content } = await article();
  const inlineImages = content.querySelectorAll('img').filter((image) => !image.closest('[data-carousel]'));
  const responsive = inlineImages.filter((image) => image.hasAttribute('srcset'));
  assert(responsive.length > 0, 'Article must retain responsive image candidates');
  // Losing a single srcset must not pass just because other images still have one.
  for (const image of inlineImages) {
    if (/\.webp$/.test(attr(image, 'src')) && Number(attr(image, 'width')) > 800) {
      assert(image.hasAttribute('srcset'), `Wide inline image needs a srcset: ${attr(image, 'src')}`);
    }
  }
  for (const image of responsive) {
    const src = attr(image, 'src');
    for (const directory of ['static', 'public']) assetExists(src, directory);
    assert(attr(image, 'sizes').trim(), `${src}: responsive widths need sizes`);
    const candidates = attr(image, 'srcset').split(',').map((candidate) => candidate.trim());
    assert(candidates.length >= 2, `${src}: expected multiple responsive widths`);
    const widths = new Set();
    for (const candidate of candidates) {
      const match = candidate.match(/^(\S+)\s+([1-9]\d*)w$/);
      assert(match, `${src}: malformed width candidate: ${candidate}`);
      assert(!widths.has(match[2]), `${src}: duplicate responsive width ${match[2]}w`);
      widths.add(match[2]);
      for (const directory of ['static', 'public']) assetExists(match[1], directory);
    }
  }
});
