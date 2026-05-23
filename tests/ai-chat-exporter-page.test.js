const {
  assert,
  exists,
  loadTsModule,
  pending,
  read,
  report,
} = require('./ai-chat-exporter-test-utils');

const failures = [];
const { AI_CHAT_EXPORTER_CONTRACT } = loadTsModule('src/lib/ai-chat-exporter.ts');

console.log('📄 Checking AI Chat Exporter page contract...');

assert(AI_CHAT_EXPORTER_CONTRACT.route === '/ai-chat-exporter/', 'route contract should be stable', failures);
assert(AI_CHAT_EXPORTER_CONTRACT.rootId === 'ai-chat-exporter-root', 'root id contract should be stable', failures);

if (!exists('src/react/ai-chat-exporter.tsx')) {
  pending('AI Chat Exporter React island is not implemented yet; page route checks begin in Phase 1.');
  report(failures, '✅ AI Chat Exporter page contract scaffold passed.');
  process.exit(0);
}

assert(exists('src/components/ui/background-beams-with-collision.tsx'), 'Background Beams With Collision component should exist for the AI Chat Exporter visual treatment', failures);
assert(exists('src/components/ui/stateful-button.tsx'), 'Stateful Button component should exist for Phase 2 export action', failures);
assert(exists('public/ai-chat-exporter/index.html'), 'public/ai-chat-exporter/index.html should exist. Run npm run build first.', failures);
assert(exists('assets/react/.vite/manifest.json'), 'Vite manifest should exist under assets/react/.vite. Run npm run build first.', failures);

const islandSource = read('src/react/ai-chat-exporter.tsx');
const pageContent = read('content/ai-chat-exporter/index.md');
const headersContent = read('static/_headers');
assert(pageContent.includes('description: "Export public ChatGPT share links to Markdown."'), 'AI Chat Exporter should define a meta description in front matter', failures);
assert(pageContent.includes('social_image: "/images/social/ai-chat-exporter-og.png"'), 'AI Chat Exporter should define a page-specific social image', failures);
assert(exists('static/images/social/ai-chat-exporter-og.png'), 'AI Chat Exporter social image should exist', failures);
assert(headersContent.includes('script-src') && headersContent.includes('https://challenges.cloudflare.com'), 'site CSP should allow Cloudflare Turnstile scripts', failures);
assert(headersContent.includes('connect-src') && headersContent.includes('https://challenges.cloudflare.com'), 'site CSP should allow Cloudflare Turnstile verification connections', failures);
assert(headersContent.includes('frame-src https://challenges.cloudflare.com'), 'site CSP should allow the Cloudflare Turnstile iframe', failures);
assert(islandSource.includes('BackgroundBeamsWithCollision'), 'AI Chat Exporter island should use BackgroundBeamsWithCollision', failures);
assert(islandSource.includes('StatefulButton'), 'AI Chat Exporter island should use StatefulButton', failures);
assert(islandSource.includes('enabledFormats'), 'AI Chat Exporter island should read enabled formats from the shared launch contract', failures);
assert(islandSource.includes('turnstileSiteKey'), 'AI Chat Exporter island should include the Cloudflare Turnstile site key', failures);
assert(islandSource.includes('challenges.cloudflare.com/turnstile/v0/api.js'), 'AI Chat Exporter island should load the Cloudflare Turnstile script only on this page', failures);
assert(islandSource.includes('turnstileToken'), 'AI Chat Exporter island should include the Turnstile token in export requests', failures);
assert(islandSource.includes('role="tablist"'), 'AI Chat Exporter island should render a tablist for provider/mode selection', failures);
assert(islandSource.includes('Claude JSON'), 'AI Chat Exporter island should include the Claude JSON tab shell', failures);
assert(islandSource.includes('Claude Link'), 'AI Chat Exporter island should include the Claude Link tab shell', failures);
assert(!islandSource.includes('PDF (coming soon)'), 'AI Chat Exporter island should not label PDF as coming soon now that it is enabled', failures);
assert(islandSource.includes('isExportingRef'), 'AI Chat Exporter should guard duplicate submissions synchronously', failures);
assert(islandSource.includes('role="status"'), 'AI Chat Exporter island should expose status text through role="status"', failures);
assert(islandSource.includes('aria-busy={isExporting}'), 'AI Chat Exporter should expose export busy state on the StatefulButton', failures);

if (exists('src/components/ui/background-beams-with-collision.tsx')) {
  const beamsSource = read('src/components/ui/background-beams-with-collision.tsx');
  assert(beamsSource.includes('CollisionMechanism'), 'BackgroundBeamsWithCollision should keep the Aceternity collision mechanism', failures);
  assert(beamsSource.includes('AnimatePresence'), 'BackgroundBeamsWithCollision should keep the Aceternity explosion animation behavior', failures);
  assert(beamsSource.includes('setInterval(checkCollision, 50)'), 'BackgroundBeamsWithCollision should keep collision polling behavior', failures);
  assert(beamsSource.includes('#ffdd00') && beamsSource.includes('#ff1b8d'), 'BackgroundBeamsWithCollision should use site brand colors', failures);
  assert(beamsSource.includes('w-px'), 'BackgroundBeamsWithCollision falling beams should stay visibly thinner than the original Aceternity width', failures);
  assert(beamsSource.includes('shadow-[0_0_10px_rgba(255,221,0,0.46)]'), 'BackgroundBeamsWithCollision falling beams should keep a tighter glow so they read thinner', failures);
  assert(beamsSource.includes('"absolute z-10 h-2 w-2"'), 'BackgroundBeamsWithCollision should keep the explosion origin size unchanged', failures);
  assert(beamsSource.includes('"absolute h-1 w-1 rounded-full'), 'BackgroundBeamsWithCollision should keep explosion particle size unchanged', failures);
}

if (exists('src/components/ui/stateful-button.tsx')) {
  const statefulButtonSource = read('src/components/ui/stateful-button.tsx');
  assert(statefulButtonSource.includes('useAnimate'), 'StatefulButton should use the Aceternity useAnimate implementation', failures);
  assert(statefulButtonSource.includes('animateLoading'), 'StatefulButton should include the Aceternity loading animation', failures);
  assert(statefulButtonSource.includes('animateSuccess'), 'StatefulButton should include the Aceternity success animation', failures);
  assert(statefulButtonSource.includes('className="loader text-white"'), 'StatefulButton should include the Aceternity loader icon', failures);
  assert(statefulButtonSource.includes('className="check text-white"'), 'StatefulButton should include the Aceternity check icon', failures);
}

if (exists('public/ai-chat-exporter/index.html')) {
  const page = read('public/ai-chat-exporter/index.html');
  assert(page.includes(`id="${AI_CHAT_EXPORTER_CONTRACT.rootId}"`) || page.includes(`id=${AI_CHAT_EXPORTER_CONTRACT.rootId}`), 'built page should include the React island root', failures);
  assert(page.includes('AI Chat Exporter'), 'built page should include useful static fallback copy', failures);
  assert(/<button[^>]*type=["']?submit["']?[^>]*>Export<\/button>/.test(page), 'static fallback form should include a real submit button for accessibility validation', failures);
  assert(
    page.includes('document.documentElement.classList.add("js-enabled")'),
    'built page should mark JavaScript-capable browsers before first paint',
    failures,
  );
  assert(
    page.includes('html.js-enabled #ai-chat-exporter-root'),
    'built page should reserve a black React island shell before hydration',
    failures,
  );
  assert(
    /html\.js-enabled #ai-chat-exporter-root\s*>\s*\.ai-exporter-fallback/.test(page),
    'built page should hide the static fallback before React hydration',
    failures,
  );
  assert(
    /<script[^>]+type=["']?module["']?[^>]+src=["']?\/react\/assets\/ai-chat-exporter-[^"'>]+\.js["']?[^>]*>/.test(page),
    'built page should load the Vite AI Chat Exporter entry script',
    failures,
  );
  assert(
    /<meta\s+name=["']?description["']?\s+content=["']Export public ChatGPT share links to Markdown\.["']/.test(page),
    'built page should include the AI Chat Exporter meta description',
    failures,
  );
  assert(
    /<meta\s+property=["']og:image["']\s+content=["']https?:\/\/[^"']+\/images\/social\/ai-chat-exporter-og\.png["']/.test(page),
    'built page should include the page-specific AI Chat Exporter OG image',
    failures,
  );
  assert(
    /<meta\s+name=["']?twitter:image["']?\s+content=["']https?:\/\/[^"']+\/images\/social\/ai-chat-exporter-og\.png["']/.test(page),
    'built page should include the page-specific AI Chat Exporter Twitter image',
    failures,
  );
}

if (exists('assets/react/.vite/manifest.json')) {
  const manifest = JSON.parse(read('assets/react/.vite/manifest.json'));
  const entry = manifest['src/react/ai-chat-exporter.tsx'];
  assert(entry, 'Vite manifest should include src/react/ai-chat-exporter.tsx', failures);
  assert(entry?.isEntry === true, 'AI Chat Exporter manifest entry should be marked as an entry', failures);
}

report(failures, '✅ AI Chat Exporter page contract passed.');
