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
const EXPORTER_PACKAGE = 'chatgpt-thread-exporter';

console.log('🚧 Checking AI Chat Exporter bundle boundaries...');

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
    assert(!read(file).includes(EXPORTER_PACKAGE), `${file} should not import ${EXPORTER_PACKAGE}`, failures);
  });

assert(!read('vite.config.ts').includes(EXPORTER_PACKAGE), `vite.config.ts should not reference ${EXPORTER_PACKAGE}`, failures);

if (exists('assets/react')) {
  listFiles('assets/react')
    .filter((file) => /\.(js|css)$/.test(file))
    .forEach((file) => {
      assert(!read(file).includes(EXPORTER_PACKAGE), `${file} should not include ${EXPORTER_PACKAGE}`, failures);
    });
}

report(failures, '✅ AI Chat Exporter bundle boundaries passed.');
