/**
 * Prevent Netlify from reinstalling Hugo through the fragile hugo-bin postinstall hook.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const netlifyConfig = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const packageLock = fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8');
const hugoCheck = fs.readFileSync(path.join(root, 'scripts', 'check-hugo-version.js'), 'utf8');
const linkCheck = fs.readFileSync(path.join(root, 'scripts', 'check-links.js'), 'utf8');
const hugoMaintenanceWorkflows = [
  fs.readFileSync(path.join(root, '.github', 'workflows', 'security-check.yml'), 'utf8'),
  fs.readFileSync(path.join(root, '.github', 'workflows', 'check-hugo-version.yml'), 'utf8'),
].join('\n');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

console.log('🛡️  Validating Netlify native-Hugo build contract...');

assert(netlifyConfig.includes('command = "npm ci && npm run build"'), 'Netlify should use npm ci for deterministic dependency installation');
assert(!netlifyConfig.includes('npm install'), 'Netlify config should not use npm install in any deploy context');
assert(netlifyConfig.includes('[build.environment]'), 'Netlify should define shared build environment variables');
assert(netlifyConfig.includes('HUGO_VERSION = "0.152.2"'), 'Netlify should pin Hugo 0.152.2');
const nodeMajor = fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
assert(nodeMajor === '24', 'Local development should use the supported Node 24 LTS line');
assert(netlifyConfig.includes(`NODE_VERSION = "${nodeMajor}"`), 'Netlify and local development should use the same Node major');
assert(packageJson.engines?.node === '>=24 <25', 'Package engines should describe the tested Node 24 runtime');
for (const file of fs.readdirSync(path.join(root, '.github', 'workflows')).filter((file) => /\.ya?ml$/.test(file))) {
  const workflow = require('js-yaml').load(fs.readFileSync(path.join(root, '.github', 'workflows', file), 'utf8'));
  for (const job of Object.values(workflow.jobs || {})) {
    for (const step of job.steps || []) {
      if (step.uses?.startsWith('actions/setup-node@')) {
        assert(String(step.with?.['node-version']) === nodeMajor, `${file} should use the same Node major as Netlify`);
      }
    }
  }
}
assert(!packageJson.dependencies?.['hugo-bin'] && !packageJson.devDependencies?.['hugo-bin'], 'package.json should not depend on hugo-bin');
assert(!packageLock.includes('node_modules/hugo-bin'), 'package-lock.json should not retain hugo-bin');
assert(packageJson.scripts?.build?.includes('hugo --gc --minify --cleanDestinationDir'), 'The production build should invoke Hugo directly');
assert(packageJson.scripts?.test?.includes('test:netlify-build'), 'The full test suite should include the Netlify build contract');
assert(hugoCheck.includes('netlify.toml HUGO_VERSION'), 'Hugo maintenance checks should read the Netlify Hugo pin instead of hugo-bin metadata');
assert(!hugoMaintenanceWorkflows.includes('hugo-bin'), 'Hugo maintenance workflows should not reintroduce hugo-bin');
assert(!linkCheck.includes("'node_modules',\n    '.bin',"), 'Link checks should resolve Hugo from PATH, not node_modules');

if (failures.length) {
  console.error('\n❌ Netlify native-Hugo build contract failed:');
  failures.forEach((failure) => console.error(`   - ${failure}`));
  process.exit(1);
}

console.log('✅ Netlify native-Hugo build contract passed.');
