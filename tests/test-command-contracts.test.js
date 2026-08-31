/**
 * Keep focused test commands honest about build and browser behavior.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts || {};
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function commands(scriptName) {
  return (scripts[scriptName] || '').split('&&').map((command) => command.trim());
}

const blogCommands = commands('test:blog');
const fullSuiteCommands = commands('test');
const expectedBlogCommands = [
  'npm run build',
  'npm run test:content',
  'npm run test:blog-migration',
  'npm run test:blog-navigation',
  'npm run test:workshop-launch',
  'npm run test:commands',
  'npm run test:spell',
  'npm run test:og-images',
  'npm run test:schedule',
];

assert(
  JSON.stringify(blogCommands) === JSON.stringify(expectedBlogCommands),
  `test:blog should match the browser-free publishing allowlist; got: ${blogCommands.join(', ')}`,
);

assert(
  scripts['test:workshop'] === 'npm run build && npm run test:workshop:built',
  'test:workshop should build the site before running its rendered-page checks',
);
assert(
  scripts['test:workshop:built'] === 'node tests/workshop-page.test.js',
  'test:workshop:built should remain the no-rebuild leaf for composed suites',
);
assert(
  fullSuiteCommands.includes('npm run test:workshop:built'),
  'the full suite should reuse its pretest build for the Workshop browser checks',
);
assert(
  !fullSuiteCommands.includes('npm run test:workshop'),
  'the full suite should not rebuild the site when it reaches the Workshop checks',
);

if (failures.length) {
  console.error('\n❌ Test command contracts failed:');
  failures.forEach((failure) => console.error(`   - ${failure}`));
  process.exit(1);
}

console.log('✅ Focused test command contracts passed.');
