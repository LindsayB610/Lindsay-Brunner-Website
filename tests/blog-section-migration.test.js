const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function sourceFiles(directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];

  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(relative) : [relative];
  });
}

function frontMatterValue(content, field) {
  const match = content.match(new RegExp(`^${field}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
  return match?.[1]?.trim();
}

assert(exists('content/blog'), 'content/blog should exist');
assert(exists('layouts/blog'), 'layouts/blog should exist');
assert(!exists('content/thoughts'), 'legacy content/thoughts directory should not exist');
assert(!exists('layouts/thoughts'), 'legacy layouts/thoughts directory should not exist');

const config = read('config.toml');
assert(
  /^\s*blog\s*=\s*"\/blog\/:year-:month-:day\/:slug\/"\s*$/m.test(config),
  'config should preserve dates in blog permalinks',
);
assert(!/^\s*thoughts\s*=/m.test(config), 'config should not define a Thoughts permalink');

const redirects = read('static/_redirects');
const redirectLines = redirects.split('\n')
  .map((line, index) => ({ line: line.trim(), index }))
  .filter(({ line }) => line && !line.startsWith('#'));
const parsedRedirects = redirectLines.map(({ line, index }) => {
  const [from, to, status] = line.split(/\s+/);
  return { from, to, status, index };
});

function redirect(from) {
  return parsedRedirects.find((rule) => rule.from === from);
}

assert(!redirect('/blog/'), '/blog/ must not redirect away from the live blog index');
assert(redirect('/thoughts/')?.to === '/blog/', 'legacy section index should redirect to /blog/');
assert(redirect('/thoughts/*')?.to === '/blog/:splat', 'legacy dated URLs should preserve their path via :splat');
assert(
  parsedRedirects.every((rule) => !rule.to?.startsWith('/thoughts')),
  'redirect destinations should never point back into /thoughts',
);

const wildcardIndex = redirect('/thoughts/*')?.index ?? -1;
[
  '/thoughts/2024-01-08/the-future-of-technical-content/',
  '/thoughts/2025-11-14/recipe-sweet-potato-casserole/',
  '/thoughts/meet_guppi/',
].forEach((from) => {
  const rule = redirect(from);
  assert(rule, `specific legacy redirect should exist for ${from}`);
  assert(rule && wildcardIndex > rule.index, `${from} should appear before the wildcard redirect`);
});

const textSourceRoots = ['content', 'layouts', 'src', 'scripts', 'tests', 'docs', '.github'];
const sourceExtensions = new Set(['.md', '.html', '.js', '.mjs', '.ts', '.tsx', '.toml', '.yml', '.yaml']);
const rootSourceFiles = ['README.md', 'BRAND.md', 'agents.md', 'package.json', 'config.toml'];
const legacySourceReferences = [...textSourceRoots.flatMap(sourceFiles), ...rootSourceFiles]
  .filter((file) => sourceExtensions.has(path.extname(file)))
  .filter((file) => file !== 'tests/blog-section-migration.test.js')
  .flatMap((file) => {
    const content = read(file);
    return ['/thoughts/', 'content/thoughts', 'layouts/thoughts', 'public/thoughts']
      .filter((needle) => content.includes(needle))
      .map((needle) => `${file}: ${needle}`);
  });
assert(
  legacySourceReferences.length === 0,
  `legacy section references should exist only in static/_redirects; found ${legacySourceReferences.join(', ')}`,
);

assert(exists('public/blog/index.html'), 'built blog index should exist');
assert(exists('public/blog/index.xml'), 'built blog RSS feed should exist');
assert(!exists('public/thoughts'), 'build should not emit a public/thoughts directory');

const publishedPosts = fs.readdirSync(path.join(root, 'content', 'blog'))
  .filter((file) => file.endsWith('.md') && file !== '_index.md')
  .map((file) => ({ file, content: read(path.join('content', 'blog', file)) }))
  .filter(({ content }) => frontMatterValue(content, 'draft') !== 'true');

publishedPosts.forEach(({ file, content }) => {
  const date = frontMatterValue(content, 'date');
  const slug = frontMatterValue(content, 'slug') || file.replace(/\.md$/, '');
  const builtPath = path.join('public', 'blog', date || '', slug, 'index.html');
  assert(date, `${file} should have a date`);
  assert(exists(builtPath), `${file} should build at /blog/${date}/${slug}/`);

  if (exists(builtPath)) {
    const html = read(builtPath);
    const canonicalMatch = html.match(/<link[^>]+rel=["']?canonical["']?[^>]+href=(?:["']([^"']+)["']|([^\s>]+))/i);
    const canonical = canonicalMatch?.[1] || canonicalMatch?.[2];
    const expectedPathname = `/blog/${date}/${slug}/`;
    assert(canonical, `${file} should emit a canonical URL`);
    if (canonical) {
      const canonicalPathname = new URL(canonical, 'https://lindsaybrunner.com').pathname;
      assert(canonicalPathname === expectedPathname, `${file} canonical should use ${expectedPathname}`);
    }
    assert(!html.includes('lindsaybrunner.com/thoughts/'), `${file} should not emit legacy absolute URLs`);
  }
});

const sitemap = read('public/sitemap.xml');
const rss = read('public/blog/index.xml');
assert(!sitemap.includes('/thoughts/'), 'sitemap should not contain legacy Thoughts URLs');
assert(!rss.includes('/thoughts/'), 'blog RSS should not contain legacy Thoughts URLs');
assert(rss.includes('/blog/'), 'blog RSS should contain blog URLs');

if (failures.length > 0) {
  console.error('❌ Blog section migration contract failed:');
  failures.forEach((failure) => console.error(`   - ${failure}`));
  process.exit(1);
}

console.log(`✅ Blog section migration contract passed for ${publishedPosts.length} published posts.`);
