const {
  assert,
  exists,
  read,
  report,
} = require('./ai-chat-exporter-test-utils');

const failures = [];

console.log('📚 Checking AI Chat Exporter docs page...');

assert(
  exists('content/ai-chat-exporter-docs/index.md'),
  'AI Chat Exporter docs content should exist at content/ai-chat-exporter-docs/index.md',
  failures,
);
assert(
  exists('public/ai-chat-exporter/docs/index.html'),
  'public/ai-chat-exporter/docs/index.html should exist. Run npm run build first.',
  failures,
);

if (exists('content/ai-chat-exporter-docs/index.md')) {
  const content = read('content/ai-chat-exporter-docs/index.md');
  assert(content.includes('type: "page"'), 'docs page should use a plain Hugo page renderer, not the React exporter layout', failures);
  assert(content.includes('url: "/ai-chat-exporter/docs/"'), 'docs content should pin the public /ai-chat-exporter/docs/ route', failures);
  assert(content.includes('Claude share link'), 'docs content should explain the Claude share link path', failures);
  assert(content.includes('Claude snapshot JSON'), 'docs content should explain the Claude snapshot JSON path', failures);
  assert(content.includes('ChatGPT share URL'), 'docs content should explain the ChatGPT share URL path', failures);
  assert(content.includes('## CLI tool repos'), 'docs content should include a dedicated CLI tool repos section', failures);
  assert(content.includes('https://github.com/LindsayB610/chatgpt-thread-exporter'), 'docs content should link to the ChatGPT exporter repo', failures);
  assert(content.includes('https://github.com/LindsayB610/claude-thread-exporter'), 'docs content should link to the Claude exporter repo', failures);
  assert(content.includes('/ai-chat-exporter/'), 'docs content should link back to the exporter tool', failures);
}

if (exists('public/ai-chat-exporter/docs/index.html')) {
  const html = read('public/ai-chat-exporter/docs/index.html');
  const h1Count = (html.match(/<h1\b/g) || []).length;
  assert(h1Count === 1, `docs page should render exactly one h1; got ${h1Count}`, failures);
  assert(html.includes('AI Chat Exporter docs'), 'docs page should render the docs h1', failures);
  assert(!html.includes('id="ai-chat-exporter-root"'), 'docs page should not mount the AI Chat Exporter React island', failures);
  assert(!/\/react\/assets\/ai-chat-exporter-[^"']+\.js/.test(html), 'docs page should not load the AI Chat Exporter React bundle', failures);
  assert(html.includes('Claude share link'), 'built docs page should mention Claude share link', failures);
  assert(html.includes('Claude snapshot JSON'), 'built docs page should mention Claude snapshot JSON', failures);
  assert(html.includes('ChatGPT share URL'), 'built docs page should mention ChatGPT share URL', failures);
  assert(html.includes('CLI tool repos'), 'built docs page should include a dedicated CLI tool repos section', failures);
  assert(html.includes('https://github.com/LindsayB610/chatgpt-thread-exporter'), 'built docs page should link to the ChatGPT exporter repo', failures);
  assert(html.includes('https://github.com/LindsayB610/claude-thread-exporter'), 'built docs page should link to the Claude exporter repo', failures);
  assert(/href=["']?\/ai-chat-exporter\/["']?/.test(html), 'built docs page should link back to the exporter tool', failures);
}

if (exists('src/react/ai-chat-exporter.tsx')) {
  const islandSource = read('src/react/ai-chat-exporter.tsx');
  assert(islandSource.includes('/ai-chat-exporter/docs/'), 'exporter app should link to the docs page', failures);
}

if (exists('layouts/ai-chat-exporter/single.html')) {
  const fallbackSource = read('layouts/ai-chat-exporter/single.html');
  assert(fallbackSource.includes('/ai-chat-exporter/docs/'), 'exporter fallback HTML should link to the docs page for crawlers', failures);
}

report(failures, '✅ AI Chat Exporter docs page passed.');
