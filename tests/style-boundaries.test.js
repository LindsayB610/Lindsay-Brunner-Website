const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function listCssFiles(relativeDir) {
  const directory = path.join(root, relativeDir);

  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.css'))
    .map((file) => path.join(relativeDir, file));
}

console.log('🧱 Checking React style boundaries...');

const header = read('layouts/partials/header.html');
const siteCss = read('static/css/main.css');

assert(
  header.includes('class="site-container"'),
  'the shared header must use the site-owned .site-container class',
);
assert(
  siteCss.includes('.site-container {'),
  'main.css must define the site-owned .site-container class',
);
assert(
  !header.includes('class="container"'),
  'the shared header must not use Tailwind’s generic .container class',
);

const reactCssFiles = listCssFiles('assets/react/assets');
assert(
  reactCssFiles.length > 0,
  'React CSS assets must exist. Run npm run build:react before this check.',
);

for (const cssFile of reactCssFiles) {
  const css = read(cssFile);
  assert(
    !css.includes('.site-container'),
    `${cssFile} must not redefine the site-owned .site-container layout class`,
  );
}

if (failures.length) {
  console.error('\n❌ Style-boundary checks failed:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('✅ React assets do not control shared site layout.');
