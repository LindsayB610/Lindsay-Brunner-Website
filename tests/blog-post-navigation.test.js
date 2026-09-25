/**
 * Blog post navigation contract.
 *
 * Chronological navigation should read in the direction it travels: newer
 * posts point back, and older posts point backward in the archive.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'layouts', 'blog', 'single.html');
const template = fs.readFileSync(templatePath, 'utf8');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '..');
const posts = fs.readdirSync(path.join(root, 'content/blog'))
  .filter((file) => file.endsWith('.md') && file !== '_index.md')
  .map((file) => {
    const source = fs.readFileSync(path.join(root, 'content/blog', file), 'utf8');
    const meta = yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)[1]);
    if (meta.draft) return null;
    const date = new Date(meta.date).toISOString().slice(0, 10);
    return { ...meta, date, url: `/blog/${date}/${meta.slug || file.slice(0, -3)}/` };
  })
  .filter((post) => post && new Date(post.date) <= new Date())
  .sort((a, b) => b.date.localeCompare(a.date));

assert(posts.length >= 3, 'Build at least three published blog posts before testing navigation');
for (const index of new Set([0, Math.floor(posts.length / 2), posts.length - 1])) {
  const post = posts[index];
  const html = fs.readFileSync(path.join(root, 'public', post.url, 'index.html'), 'utf8');
  const navigation = (html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi) || [])
    .filter((nav) => /(?:Newer|Older) Post/.test(nav));
  assert.strictEqual(navigation.length, 1, `${post.url} should have one chronological navigation`);
  for (const [label, neighbor] of [['Newer', posts[index - 1]], ['Older', posts[index + 1]]]) {
    const links = [...navigation[0].matchAll(new RegExp(`${label} Post<\/div>\\s*<a\\b[^>]*href=(?:"([^"]+)"|'([^']+)'|([^\\s>]+))`, 'g'))];
    assert.strictEqual(links.length, neighbor ? 1 : 0, `${post.url}: ${label} boundary`);
    if (neighbor) assert.strictEqual(links[0][1] || links[0][2] || links[0][3], neighbor.url, `${post.url}: ${label} destination`);
  }
}

assert(
  template.includes('← {{ $olderPost.Title }}'),
  'Older-post links should begin with a left-pointing arrow',
);
assert(
  !template.includes('{{ $olderPost.Title }} →'),
  'Older-post links should not end with a right-pointing arrow',
);

console.log('✅ Blog post navigation contract passed!');
