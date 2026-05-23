const fs = require('fs');
const path = require('path');
const {
  assert,
  exists,
  read,
  report,
  root,
} = require('./ai-chat-exporter-test-utils');

const failures = [];
const EXPORTER_PACKAGES = ['chatgpt-thread-exporter', 'claude-thread-exporter'];

console.log('🚧 Checking AI Chat Exporter bundle boundaries...');

const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const claudeDependency = packageJson.dependencies?.['claude-thread-exporter'];
const claudeLockDependency = packageLock.packages?.['']?.dependencies?.['claude-thread-exporter'];
const claudePackageLock = packageLock.packages?.['node_modules/claude-thread-exporter'];

assert(
  typeof claudeDependency === 'string' &&
    claudeDependency.startsWith('git+https://github.com/LindsayB610/claude-thread-exporter.git#'),
  'package.json should pin claude-thread-exporter to a GitHub dependency, not a local file path',
  failures,
);
assert(
  claudeLockDependency === claudeDependency,
  'package-lock root dependency should match the package.json Claude exporter dependency',
  failures,
);
assert(
  typeof claudePackageLock?.resolved === 'string' &&
    claudePackageLock.resolved.startsWith('git+https://github.com/LindsayB610/claude-thread-exporter.git#'),
  'package-lock should resolve claude-thread-exporter from GitHub, not a local file path',
  failures,
);
assert(
  !packageLock.packages?.['../claude-thread-exporter'],
  'package-lock should not contain a sibling-folder claude-thread-exporter package entry',
  failures,
);

function listFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];

  const files = [];
  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absoluteEntry = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absoluteEntry);
      } else {
        files.push(path.relative(root, absoluteEntry));
      }
    }
  }

  walk(absoluteDir);
  return files.sort();
}

listFiles('src/react')
  .filter((file) => /\.(tsx?|jsx?)$/.test(file))
  .forEach((file) => {
    EXPORTER_PACKAGES.forEach((exporterPackage) => {
      assert(!read(file).includes(exporterPackage), `${file} should not import ${exporterPackage}`, failures);
    });
  });

EXPORTER_PACKAGES.forEach((exporterPackage) => {
  assert(!read('vite.config.ts').includes(exporterPackage), `vite.config.ts should not reference ${exporterPackage}`, failures);
});

if (exists('assets/react')) {
  listFiles('assets/react')
    .filter((file) => /\.(js|css)$/.test(file))
    .forEach((file) => {
      EXPORTER_PACKAGES.forEach((exporterPackage) => {
        assert(!read(file).includes(exporterPackage), `${file} should not include ${exporterPackage}`, failures);
      });
    });
}

report(failures, '✅ AI Chat Exporter bundle boundaries passed.');
