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
  if (!condition) {
    failures.push(message);
  }
}

function assertIncludes(content, expected, label) {
  assert(content.includes(expected), `${label} should include "${expected}"`);
}

function assertNotIncludes(content, unexpected, label) {
  assert(!content.includes(unexpected), `${label} should not include "${unexpected}"`);
}

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  return Object.fromEntries(
    match[1].split('\n')
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/))
      .filter(Boolean)
      .map((match) => {
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        return [match[1], value];
      }),
  );
}

function formatDisplayDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return date;

  const month = months[Number(match[2]) - 1];
  const day = String(Number(match[3]));
  return `${month} ${day}, ${match[1]}`;
}

function getLatestThoughtsFromContent() {
  return fs.readdirSync(path.join(root, 'content/thoughts'))
    .filter((file) => file.endsWith('.md') && file !== '_index.md')
    .map((file) => {
      const content = read(path.join('content/thoughts', file));
      const frontMatter = parseFrontMatter(content);
      const slug = frontMatter.slug || file.replace(/\.md$/, '');
      const date = frontMatter.date || '';
      return {
        date,
        displayDate: formatDisplayDate(date),
        draft: frontMatter.draft === true,
        title: frontMatter.title,
        description: frontMatter.subtitle || frontMatter.description,
        href: `/thoughts/${date.slice(0, 4)}-${date.slice(5, 7)}-${date.slice(8, 10)}/${slug}/`,
      };
    })
    .filter((thought) => !thought.draft && thought.date && thought.title)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
}

function listFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absoluteEntry = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(absoluteEntry);
        continue;
      }

      files.push(path.relative(root, absoluteEntry));
    }
  }

  walk(absoluteDir);
  return files.sort();
}

function listBuiltHtmlPages() {
  if (!exists('public')) return [];

  return listFiles('public')
    .filter((file) => file.endsWith('/index.html') || file === 'public/index.html')
    .sort();
}

function readBuiltPage(relativePath) {
  return read(relativePath);
}

function getPageKind(relativePath) {
  if (relativePath === 'public/index.html') return 'home';
  if (relativePath === 'public/about/index.html') return 'about';
  if (relativePath === 'public/ai-chat-exporter/index.html') return 'ai-chat-exporter';
  if (relativePath.startsWith('public/thoughts/')) return 'thoughts';
  if (relativePath.startsWith('public/recipes/')) return 'recipes';
  return 'other';
}

function checkBuiltFallbacks() {
  console.log('🏠 Checking built homepage and about static island content...');

  assert(exists('public/index.html'), 'public/index.html should exist. Run npm run build first.');
  assert(exists('public/about/index.html'), 'public/about/index.html should exist. Run npm run build first.');

  const home = read('public/index.html');
  const about = read('public/about/index.html');

  [
    'Freelance technical content',
    'Complex technical ideas, made clear enough to trust.',
    'Talk to me about a project',
    'What I Do',
    'How I Think',
    'Bring Me Your Weird Content Problem',
    'Freelance Technical Content Strategist',
    'Developer Marketing',
    'AI Content Workflows',
    'AI-era content workflows',
    'Ghostwriting and POV',
    'Developer audience research',
    'Mentorship and enablement',
    'Trusted by the best',
    'Companies Lindsay has worked with include Okta, Braze, Builder.io, ngrok, and Split.',
    'Samples beat adjectives',
    'Start on LinkedIn',
  ].forEach((expected) => assertIncludes(home, expected, 'built homepage'));

  [
    'Bring Me Your Weird Content Problem',
    'Start the conversation',
    'A freelance practice for technical content, developer marketing, and AI-era editorial systems.',
    'Went deep on AI, content strategy, and the new shape of technical storytelling.',
    'Owned the messy middle where content, DevRel, product, and go-to-market meet.',
    'Built the foundation in developer content, technical editing, and audience trust.',
    'Read my blog',
  ].forEach((expected) => assertIncludes(about, expected, 'built about page'));

  assert(
    /<div id=homepage-root>\s*<section class=hero>/.test(home) ||
      /<div id=["']homepage-root["']>\s*<section class=["']hero["']>/.test(home),
    'built homepage should include meaningful static HTML inside the React mount point',
  );
  assert(
    /<div id=about-root>\s*<section class="section about-devpro-fallback">/.test(about) ||
      /<div id=["']about-root["']>\s*<section class=["']section about-devpro-fallback["']>/.test(about),
    'built about page should include meaningful static HTML inside the React mount point',
  );
  assertNotIncludes(
    home,
    '<noscript>',
    'built homepage should not depend on noscript for machine-readable content',
  );
  assertNotIncludes(
    about,
    '<noscript>',
    'built about page should not depend on noscript for machine-readable content',
  );
  [
    {
      html: home,
      label: 'homepage',
      root: 'homepage-root',
      fallbackPattern: /html\.js-enabled #homepage-root\s*>\s*section/,
    },
    {
      html: about,
      label: 'about page',
      root: 'about-root',
      fallbackPattern: /html\.js-enabled #about-root\s*>\s*\.about-devpro-fallback/,
    },
  ].forEach(({ html, label, root, fallbackPattern }) => {
    assertIncludes(
      html,
      'document.documentElement.classList.add("js-enabled")',
      `built ${label} should mark JavaScript-capable browsers before first paint`,
    );
    assertIncludes(
      html,
      `html.js-enabled #${root}`,
      `built ${label} should reserve a black React island shell before hydration`,
    );
    assert(
      fallbackPattern.test(html),
      `built ${label} should hide static fallback content before React hydration`,
    );
  });
  assertNotIncludes(
    home,
    '\\"Lindsay Brunner\\"',
    'homepage JSON-LD should not double-encode the author name',
  );
  assert(
    /<script[^>]+type=["']?module["']?[^>]+src=["']?\/react\/assets\/homepage-[^"'>]+\.js["']?[^>]*>/.test(home),
    'built homepage should load the Vite homepage entry script',
  );
  assert(
    /<link[^>]+rel=["']?modulepreload["']?[^>]+href=["']?\/react\/assets\/styles-[^"'>]+\.js["']?[^>]*>/.test(home),
    'built homepage should modulepreload the shared Vite chunk',
  );
  assert(
    /<link[^>]+rel=["']?stylesheet["']?[^>]+href=["']?\/react\/assets\/styles-[^"'>]+\.css["']?[^>]*>/.test(home),
    'built homepage should load the shared Vite CSS',
  );
  assert(
    /<script[^>]+type=["']?module["']?[^>]+src=["']?\/react\/assets\/about-[^"'>]+\.js["']?[^>]*>/.test(about),
    'built about page should load the Vite about entry script',
  );
  assert(
    /<link[^>]+rel=["']?modulepreload["']?[^>]+href=["']?\/react\/assets\/styles-[^"'>]+\.js["']?[^>]*>/.test(about),
    'built about page should modulepreload the shared Vite chunk',
  );
  assert(
    /<link[^>]+rel=["']?stylesheet["']?[^>]+href=["']?\/react\/assets\/styles-[^"'>]+\.css["']?[^>]*>/.test(about),
    'built about page should load the shared Vite CSS',
  );
}

function checkReactManifest() {
  console.log('⚛️  Checking React island manifest...');

  assert(exists('assets/react/.vite/manifest.json'), 'Vite manifest should exist under assets/react/.vite');

  const manifest = JSON.parse(read('assets/react/.vite/manifest.json'));
  const expectedEntries = [
    'src/react/homepage.tsx',
    'src/react/about.tsx',
    'src/react/ai-chat-exporter.tsx',
  ];

  expectedEntries.forEach((entryName) => {
    const entry = manifest[entryName];
    assert(entry, `Vite manifest should include ${entryName}`);
    assert(entry && entry.isEntry === true, `${entryName} should be marked as an entry`);
    assert(entry && exists(path.join('assets/react', entry.file)), `${entryName} output file should exist`);

    (entry?.css || []).forEach((cssFile) => {
      assert(exists(path.join('assets/react', cssFile)), `${entryName} CSS file ${cssFile} should exist`);
    });

    (entry?.imports || []).forEach((importKey) => {
      const imported = manifest[importKey];
      assert(imported, `${entryName} imported chunk ${importKey} should exist in manifest`);
      assert(imported && exists(path.join('assets/react', imported.file)), `${importKey} output file should exist`);
      (imported?.css || []).forEach((cssFile) => {
        assert(exists(path.join('assets/react', cssFile)), `${importKey} CSS file ${cssFile} should exist`);
      });
    });
  });
}

function checkReactAssetCleanliness() {
  console.log('🧹 Checking generated React asset cleanliness...');

  const files = listFiles('assets/react');
  const allowedFilePattern = /^assets\/react\/(?:\.vite\/manifest\.json|assets\/[^/]+\.(?:css|js))$/;

  files.forEach((file) => {
    assert(allowedFilePattern.test(file), `Unexpected generated React asset: ${file}`);
  });

  [
    'assets/react/index.html',
    'assets/react/_headers',
    'assets/react/_redirects',
    'assets/react/css/main.css',
    'assets/react/recipes/index.html',
    'assets/react/thoughts/index.html',
    'assets/react/images/social/default-og.png',
  ].forEach((unexpectedPath) => {
    assert(!exists(unexpectedPath), `${unexpectedPath} should not be copied into the Vite output`);
  });
}

function checkBuiltReactContainment() {
  console.log('🧱 Checking built React containment...');

  const publicFiles = listFiles('public');
  const leakedReactPages = publicFiles.filter((file) => (
    file.startsWith('public/react/') &&
    !/^public\/react\/assets\/[^/]+\.(?:css|js)$/.test(file)
  ));

  leakedReactPages.forEach((file) => {
    assert(false, `${file} should not exist; React output should only publish hashed assets`);
  });
}

function checkBuiltSiteIsolation() {
  console.log('🧯 Checking React island does not leak into the rest of the site...');

  const pages = listBuiltHtmlPages();
  assert(pages.length > 10, 'built site should include enough HTML pages to run isolation checks');

  const home = readBuiltPage('public/index.html');
  const about = readBuiltPage('public/about/index.html');
  const nonIslandPages = pages.filter((page) => ![
    'public/index.html',
    'public/about/index.html',
  ].includes(page));

  assert(
    nonIslandPages.some((page) => page.startsWith('public/thoughts/') && page !== 'public/thoughts/index.html'),
    'isolation checks should include at least one individual Thoughts page',
  );
  assert(
    nonIslandPages.some((page) => page.startsWith('public/recipes/') && page !== 'public/recipes/index.html'),
    'isolation checks should include at least one individual Recipe page',
  );

  [
    'homepage-root',
    'homepage-thoughts-data',
    'Freelance technical content, developer marketing, and AI-era editorial strategy',
    'Complex technical ideas, made clear enough to trust.',
    'What I Do',
    'How I Think',
    'Trusted by the best',
    'Companies Lindsay has worked with',
  ].forEach((homeOnly) => {
    nonIslandPages.forEach((page) => {
      assertNotIncludes(
        readBuiltPage(page),
        homeOnly,
        `${page} should not receive homepage-only React content`,
      );
    });
  });

  [
    'about-root',
    'Start the conversation',
  ].forEach((aboutOnly) => {
    pages
      .filter((page) => page !== 'public/about/index.html')
      .forEach((page) => {
        assertNotIncludes(
          readBuiltPage(page),
          aboutOnly,
          `${page} should not receive about-only React content`,
        );
      });
  });

  pages.forEach((page) => {
    const html = readBuiltPage(page);
    const kind = getPageKind(page);
    const loadsReact = /\/react\/assets\/[^"']+\.(?:css|js)/.test(html);
    const loadsHomepageEntry = /\/react\/assets\/homepage-[^"']+\.js/.test(html);
    const loadsAboutEntry = /\/react\/assets\/about-[^"']+\.js/.test(html);
    const loadsAiChatExporterEntry = /\/react\/assets\/ai-chat-exporter-[^"']+\.js/.test(html);
    const loadsSharedReact = /\/react\/assets\/styles-[^"']+\.(?:css|js)/.test(html);

    if (kind === 'home') {
      assert(loadsHomepageEntry, 'homepage should load only the homepage React entry');
      assert(!loadsAboutEntry, 'homepage should not load the about contact React entry');
      assert(!loadsAiChatExporterEntry, 'homepage should not load the AI Chat Exporter React entry');
      assert(loadsSharedReact, 'homepage should load shared React CSS/chunk assets');
      return;
    }

    if (kind === 'about') {
      assert(loadsAboutEntry, 'about page should load only the about contact React entry');
      assert(!loadsHomepageEntry, 'about page should not load the homepage React entry');
      assert(!loadsAiChatExporterEntry, 'about page should not load the AI Chat Exporter React entry');
      assert(loadsSharedReact, 'about page should load shared React CSS/chunk assets');
      return;
    }

    if (kind === 'ai-chat-exporter') {
      assert(loadsAiChatExporterEntry, 'AI Chat Exporter page should load only the AI Chat Exporter React entry');
      assert(!loadsHomepageEntry, 'AI Chat Exporter page should not load the homepage React entry');
      assert(!loadsAboutEntry, 'AI Chat Exporter page should not load the about React entry');
      assert(loadsSharedReact, 'about page should load shared React CSS/chunk assets');
      return;
    }

    assert(!loadsReact, `${page} should not load any React island assets`);
    assert(!loadsHomepageEntry, `${page} should not load the homepage React entry`);
    assert(!loadsAboutEntry, `${page} should not load the about React entry`);
    assert(!loadsAiChatExporterEntry, `${page} should not load the AI Chat Exporter React entry`);
  });

  assert(/\sid=(["']?)homepage-root\1/.test(home), 'built homepage should include the homepage React root');
  assert(!/\sid=(["']?)about-root\1/.test(home), 'built homepage should not include the about React root');
  assert(/\sid=(["']?)about-root\1/.test(about), 'built about page should include the about React root');
  assert(!/\sid=(["']?)homepage-root\1/.test(about), 'built about page should not include the homepage React root');
}

function checkReactCssScoping() {
  console.log('🎚️  Checking React CSS remains scoped...');

  const reactStyles = read('src/react/styles.css');
  const headPartial = read('layouts/partials/head.html');
  const reactAssetsPartial = read('layouts/partials/react-assets.html');
  const generatedCssFiles = listFiles('assets/react')
    .filter((file) => /^assets\/react\/assets\/[^/]+\.css$/.test(file));

  assert(generatedCssFiles.length > 0, 'React build should emit a CSS file');

  [
    '@import "tailwindcss/theme";',
    '@import "tailwindcss/utilities";',
    '#homepage-root',
    '#about-root',
    '#ai-chat-exporter-root',
  ].forEach((expected) => assertIncludes(reactStyles, expected, 'React CSS source'));

  [
    '@import "tailwindcss/preflight";',
    'body {',
    'html {',
  ].forEach((unexpected) => {
    assertNotIncludes(reactStyles, unexpected, 'React CSS source should avoid global resets');
  });

  assert(
    !/^\s*(?:body|html|main|article|section|a|p|h1|h2|h3|h4|h5|h6|\*)\s*\{/m.test(reactStyles),
    'React CSS source should not define unscoped element selectors',
  );
  assert(
    /^#homepage-root a::after,\n#about-root a::after,\n#ai-chat-exporter-root a::after \{/m.test(reactStyles),
    'React link pseudo reset should stay scoped to React mount points',
  );
  assertIncludes(
    headPartial,
    '{{ if .IsHome }}{{ partial "react-assets.html" "src/react/homepage.tsx" }}{{ end }}',
    'head partial should load the homepage island only on the homepage',
  );
  assertIncludes(
    headPartial,
    '{{ if eq .RelPermalink "/about/" }}{{ partial "react-assets.html" "src/react/about.tsx" }}{{ end }}',
    'head partial should load the about island only on /about/',
  );
  assertNotIncludes(
    headPartial,
    'react-assets.html" }}',
    'head partial should not include an unconditional React assets partial',
  );
  assertIncludes(
    reactAssetsPartial,
    'assets/react/.vite/manifest.json',
    'React assets partial should resolve files through the Vite manifest',
  );
  assertIncludes(
    reactAssetsPartial,
    'resources.Get (printf "react/%s"',
    'React assets partial should publish only generated React resources',
  );

  generatedCssFiles.forEach((file) => {
    const css = read(file);
    [
      '.recipe-card',
      '.thought-card',
      '.site-header',
      '.site-logo',
      '.page-recipe',
      '.page-thought',
    ].forEach((legacySelector) => {
      assertNotIncludes(css, legacySelector, `${file} should not contain legacy site selectors`);
    });
  });
}

function checkHomepageSourceContent() {
  console.log('✍️  Checking homepage React source content...');

  const homepage = read('src/react/homepage.tsx');
  const hero = read('src/block/hero-section-with-beams-and-grid.tsx');
  const contact = read('src/block/contact-section-with-shader.tsx');
  const logoCloud = read('src/block/single-row-logo-cloud.tsx');
  const featureSection = read('src/components/features-section-demo-2.tsx');
  const reactStyles = read('src/react/styles.css');
  const combined = [homepage, hero, contact, logoCloud, featureSection, reactStyles].join('\n');

  [
    'Freelance technical content, developer marketing, and AI-era editorial strategy',
    'getHomepageEssays',
    'homepage-thoughts-data',
    'text-[clamp(2.75rem,6.5vw,6rem)]',
    'WebkitTextFillColor: "#ffffff"',
    'Complex technical ideas, made clear enough to trust.',
    'Developer marketing strategy',
    'Technical content',
    'Mentorship and enablement',
    'Editorial systems',
    'AI-era content workflows',
    'Developer audience research',
    'Ghostwriting and POV',
    'Content rescue missions',
    'Okta',
    'Split',
    'ngrok',
    'Builder.io',
    'Braze',
    '/images/logos/okta.svg',
    '/images/logos/braze.svg',
    '/images/logos/builder.svg',
    '/images/logos/ngrok.svg',
    '/images/logos/split.svg',
    'Companies Lindsay has worked with',
    'Trusted by the best',
    'Samples beat adjectives',
    'group-hover:bg-[length:100%_2px]',
    '/thoughts/2026-04-21/the-problem-is-usually-not-the-prompt/',
    '/thoughts/2026-04-11/building-a-cli-with-ai/',
    '/thoughts/2026-03-05/content-resonance-framework-beyond-engagement-metrics/',
    'Bring me your weird content problems',
    'Start on LinkedIn',
  ].forEach((expected) => assertIncludes(combined, expected, 'homepage React source'));

  [
    'AI-era content workflows',
    'Technical content',
    'Ghostwriting and POV',
    'Content rescue missions',
    'Developer marketing strategy',
    'Developer audience research',
    'Editorial systems',
    'Mentorship and enablement',
  ].reduce((previousIndex, title) => {
    const currentIndex = featureSection.indexOf(`title: "${title}"`);
    assert(currentIndex > previousIndex, `homepage feature "${title}" should appear in the intended order`);
    return currentIndex;
  }, -1);

  [
    'href: "/about/"',
    'label: "More about me"',
  ].forEach((expected) => assertIncludes(homepage, expected, 'homepage quote CTA source'));

  [
    'Idea to website in minutes',
    'not hours',
    'Get the best beam tracking services',
    'Buy now',
    'Explore beams',
    'Contact Us',
    'Please reach out to us',
    'Manu Arora',
    'hello@johndoe.com',
    'Aceternity Labs',
    'Enter your message here',
    'Sarah Chen',
    'TechCorp',
    'StartupXYZ',
    'assets.aceternity.com/pro/aceternity-landing.webp',
    'assets.aceternity.com/logos/',
    'Spotify',
    'Twitch',
    'Netflix',
    'Raycast',
    'CharacterAI',
    'via-neutral-100',
    'Built for developers',
    'Ease of use',
    "It's as easy as using an Apple",
    'Pricing like no other',
    '100% Uptime guarantee',
    'Multi-tenant Architecture',
    'Money back guarantee',
    'And everything else',
    'I just ran out of copy ideas',
  ].forEach((unexpected) => assertNotIncludes(combined, unexpected, 'homepage React source'));

  [
    'bg-site-black px-4 py-20',
    'rgba(0,0,0,0.72)',
    'via-white/[0.08]',
    'bg-black/30',
    'bg-black/75',
    '"#000000"',
    '"#ff0037"',
    '"#ff1b8d"',
    '"#ffdd00"',
    'MotionConfig reducedMotion="user"',
    'prefers-reduced-motion: reduce',
    'Show testimonial ${index + 1} of ${testimonials.length}',
    'appearance-none items-center justify-center rounded-full border-0 bg-transparent p-0 shadow-none',
    'AnimatePresence mode="popLayout"',
    'const LOGOS_PER_ROW = 5',
    'setSetIndex((i) => (i + 1) % setCount)',
    '}, 5200)',
    'duration: 0.55',
    'key={logo.id}',
    'alt={logo.title}',
    '#homepage-root :where(p, h1, h2, h3, h4, h5, h6)',
    '#about-root :where(p, h1, h2, h3, h4, h5, h6)',
    'margin: 0;',
    '#homepage-root a::after',
    '#about-root a::after',
    'content: none !important;',
    'display: none !important;',
    'width: 0 !important;',
    '#about-root h1',
    '-webkit-text-fill-color: #ffffff !important;',
    '#about-root .about-name-gradient',
    '@/components/features-section-demo-2',
    'group/feature',
    'lg:grid-cols-4',
    'group-hover/feature:translate-x-2',
    'group-hover/feature:bg-brand-pink',
  ].forEach((expected) => assertIncludes(combined, expected, 'homepage accessibility source'));

  [
    'Experience with',
    'label="Best fit"',
    'label="Common projects"',
    'label="Proof"',
    'ProofCard',
    'Built in the rooms where product, marketing, and DevRel collide',
    'I have spent the last decade translating technical products into useful, credible content',
    'rounded-2xl border border-white/10 bg-site-surface p-8 sm:p-10',
    'rounded-2xl border border-white/10 bg-white/[0.04]',
    'BentoGrid',
    'BentoGridItem',
    'ServiceHeader',
    'border-y border-white/10',
    'from-brand-pink/18',
    'from-brand-red/18',
    'group-hover/feature:opacity-100',
    '"#ff6b35"',
    '"#1b0038"',
    '"#7c3aed"',
  ].forEach((unexpected) => assertNotIncludes(combined, unexpected, 'single-row logo cloud should stay lightweight'));

  [
    '/recipes/',
    'Recent Recipes',
    'recipe-',
  ].forEach((unexpected) => assertNotIncludes(homepage, unexpected, 'homepage React island'));
}

function checkAboutSourceContent() {
  console.log('👤 Checking about page React source content...');

  const about = read('src/react/about.tsx');
  const timeline = read('src/components/ui/timeline.tsx');
  const layout = read('layouts/about/single.html');
  const headPartial = read('layouts/partials/head.html');
  const combined = [about, timeline, layout, headPartial].join('\n');

  [
    'Hey, I&apos;m',
    'Lindsay Brunner',
    'DevRel-shaped content person in the San Francisco Bay Area',
    "Here's the timeline version",
    'Consultant + Advisor · lindsaybrunner.com',
    'Jan 2022-present',
    'Builder.io',
    'Apr 2025-Jan 2026',
    'Advisor · Braze',
    'Mar-Aug 2025',
    'Head of Content and Developer Relations · ngrok',
    'Aug 2023-Jan 2025',
    'Head of Marketing · Architect.io',
    'Director, Content + Advocacy · Split',
    'Advisor · Architect.io',
    'Stormpath and Okta',
    'src/react/about.tsx',
    'about-root',
    'avatar-color-trans.png',
    'ContactSectionWithShader',
    '<Timeline',
    'about-name-gradient',
    'heading?: string',
    'description?: string',
    'bg-site-black',
    'heightTransform',
    'opacityTransform',
    'bg-brand-pink/40 border border-brand-pink',
    'bg-gradient-to-t from-brand-red via-brand-pink to-brand-yellow',
    '[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]',
    'from-brand-red via-brand-pink to-brand-yellow',
  ].forEach((expected) => assertIncludes(combined, expected, 'about page React source'));

  [
    'href: "/thoughts/"',
    'label: "Read my blog"',
  ].forEach((expected) => assertIncludes(about, expected, 'about quote CTA source'));

  [
    'Tyler Durden',
    'full stack soap engineer',
    'code ninja',
    'slaying bugs',
    'hot sauce',
    'dad jokes',
    'Changelog from my journey',
    'I&apos;ve been working on Aceternity',
    'from-purple-500 via-blue-500',
    'about-contact-root',
    'aboutContact',
  ].forEach((unexpected) => assertNotIncludes(combined, unexpected, 'about page React source'));
}

function checkHomepageThoughtData() {
  console.log('📰 Checking homepage latest thoughts data...');

  const home = read('public/index.html');
  const latestThoughts = getLatestThoughtsFromContent();
  const scriptMatch = home.match(/<script id=homepage-thoughts-data type=application\/json>([\s\S]*?)<\/script>/) ||
    home.match(/<script id="homepage-thoughts-data" type="application\/json">([\s\S]*?)<\/script>/);

  assert(scriptMatch, 'built homepage should include latest thoughts JSON data');
  if (!scriptMatch) return;

  const parsedThoughts = JSON.parse(scriptMatch[1]);
  const homepageThoughts = typeof parsedThoughts === 'string' ? JSON.parse(parsedThoughts) : parsedThoughts;

  assert(homepageThoughts.length === 3, 'homepage latest thoughts JSON should include exactly three posts');
  latestThoughts.forEach((thought, index) => {
    const actual = homepageThoughts[index];
    assert(actual, `homepage latest thoughts JSON should include item ${index + 1}`);
    assert(actual?.title === thought.title, `homepage thought ${index + 1} should be latest title "${thought.title}"`);
    assert(actual?.href === thought.href, `homepage thought ${index + 1} should link to "${thought.href}"`);
    assert(actual?.description === thought.description, `homepage thought ${index + 1} should use the current subtitle/description`);
    assert(actual?.date === thought.displayDate, `homepage thought ${index + 1} should include display date "${thought.displayDate}"`);
  });
}

function checkTestimonials() {
  console.log('💬 Checking testimonial proof points...');

  const contact = read('src/block/contact-section-with-shader.tsx');
  const testimonialBlock = contact.slice(
    contact.indexOf('const testimonials = ['),
    contact.indexOf('function RotatingTestimonials'),
  );

  [
    'Steve Sewell',
    'CEO, Builder.io',
    'Kaitlyn Barnard',
    'Product Marketing, Apollo GraphQL',
    'Scott McAllister',
    'Principal Developer Advocate, vCluster',
    'Randall Degges',
    'VP Developer Relations, Snyk',
    '/images/testimonials/steve-sewell.jpg',
    '/images/testimonials/kaitlyn-barnard.jpg',
    '/images/testimonials/scott-mcallister.jpg',
    '/images/testimonials/randall-degges.jpg',
    'function TestimonialAvatar',
    'mt-7 flex items-center gap-4 md:mt-10',
    'flex min-w-0 flex-col gap-0',
    'block text-xl leading-[1.05] font-bold text-white',
    'mt-1 block text-base leading-[1.05] text-white/70',
    'onError={() => setHasImage(false)}',
    'unique and deep understanding of the developer audience',
    'north star for what a great developer content leader looks like',
    '20% month over month organic growth',
    'balance big-picture strategy with genuine care',
    "Okta's developer content",
  ].forEach((expected) => assertIncludes(contact, expected, 'contact testimonial source'));

  [
    '<p className="text-xl leading-none font-bold text-white">',
    '<p className="text-base leading-[1.15] text-white/70">',
    'flex min-w-0 flex-col gap-1',
  ].forEach((unexpected) => assertNotIncludes(contact, unexpected, 'contact testimonial byline source'));

  assertNotIncludes(
    testimonialBlock,
    'kaitlyn-barnard.jpg",\n  },\n  {\n    quote:\n      "Lindsay just gets it',
    'contact testimonial ordering',
  );
}

function checkLogoAssets() {
  console.log('🏷️  Checking homepage logo assets...');

  [
    'static/images/logos/okta.svg',
    'static/images/logos/braze.svg',
    'static/images/logos/builder.svg',
    'static/images/logos/ngrok.svg',
    'static/images/logos/split.svg',
  ].forEach((asset) => {
    assert(exists(asset), `${asset} should exist for the homepage logo cloud`);
    assertIncludes(read(asset), '<svg', `${asset} should be an SVG logo asset`);
  });
}

function checkTestimonialAssets() {
  console.log('🖼️  Checking testimonial headshot assets...');

  [
    'static/images/testimonials/steve-sewell.jpg',
    'static/images/testimonials/kaitlyn-barnard.jpg',
    'static/images/testimonials/scott-mcallister.jpg',
    'static/images/testimonials/randall-degges.jpg',
  ].forEach((asset) => {
    assert(exists(asset), `${asset} should exist for the testimonial avatar`);
  });
}

function checkReferencedRoutes() {
  console.log('🔗 Checking homepage-linked routes exist...');

  [
    'public/thoughts/index.html',
    'public/about/index.html',
    'public/thoughts/2026-04-21/the-problem-is-usually-not-the-prompt/index.html',
    'public/thoughts/2026-04-11/building-a-cli-with-ai/index.html',
    'public/thoughts/2026-03-05/content-resonance-framework-beyond-engagement-metrics/index.html',
  ].forEach((route) => assert(exists(route), `${route} should exist for a homepage link`));
}

function checkProtectedBrandRules() {
  console.log('🔒 Checking protected homepage brand rules...');

  const mainCss = read('static/css/main.css');
  const customCss = read('static/css/custom.css');
  const layoutsIndex = read('layouts/index.html');

  assert(
    /h1\s*{[\s\S]*?font-family:\s*[\s\S]*?"Inter"[\s\S]*?}/.test(mainCss),
    'main.css should keep h1 on Inter for gradient rendering consistency',
  );
  assertIncludes(mainCss, 'background-size: 80% 100% !important', 'main.css protected hero gradient');
  assertIncludes(customCss, 'background-size: 80% 100% !important', 'custom.css protected hero gradient override');
  assertIncludes(customCss, '.page-home .hero h1', 'custom.css should keep the fallback positioning H1 readable');
  assertNotIncludes(layoutsIndex, 'hero-nameplate', 'Hugo homepage fallback should not render a visual nameplate');
  assertNotIncludes(layoutsIndex, 'Lindsay Brunner</p>', 'Hugo homepage fallback should not render the name as hero copy');
  assertIncludes(
    layoutsIndex,
    '<h1>Complex technical ideas, made clear enough to trust.</h1>',
    'Hugo homepage fallback should use the positioning line as the H1',
  );
}

checkBuiltFallbacks();
checkReactManifest();
checkReactAssetCleanliness();
checkBuiltReactContainment();
checkBuiltSiteIsolation();
checkReactCssScoping();
checkHomepageSourceContent();
checkAboutSourceContent();
checkHomepageThoughtData();
checkTestimonials();
checkLogoAssets();
checkTestimonialAssets();
checkReferencedRoutes();
checkProtectedBrandRules();

if (failures.length > 0) {
  console.error('\n❌ Homepage React island validation failed:');
  failures.forEach((failure) => console.error(`   - ${failure}`));
  process.exit(1);
}

console.log('\n✅ Homepage React island validation passed.');
