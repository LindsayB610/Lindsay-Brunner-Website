/**
 * Guards the repository's default branch naming.
 *
 * The production branch is main. This test keeps docs, templates, scripts, and
 * config from reintroducing deprecated default-branch references.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const forbiddenTerms = [
  ['mast', 'er'].join(''),
  ['origin/', 'mast', 'er'].join(''),
  ['refs/heads/', 'mast', 'er'].join(''),
  ['/mast', 'er/'].join(''),
  ['ai_', 'mast', 'er'].join(''),
];

const ignoredDirs = new Set([
  '.git',
  '.hugo_build.lock',
  '.netlify',
  'node_modules',
  'public',
  'resources',
]);

const scannedExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.toml',
  '.txt',
  '.yaml',
  '.yml',
]);

const scannedFilenames = new Set([
  '.gitignore',
  '_headers',
  '_redirects',
]);

function shouldScan(filePath) {
  const basename = path.basename(filePath);
  return scannedFilenames.has(basename) || scannedExtensions.has(path.extname(filePath));
}

function listScannableFiles(dir) {
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listScannableFiles(entryPath));
      continue;
    }

    if (entry.isFile() && shouldScan(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

function findForbiddenReferences() {
  const findings = [];

  for (const filePath of listScannableFiles(repoRoot)) {
    const relativePath = path.relative(repoRoot, filePath);
    const contents = fs.readFileSync(filePath, 'utf8');
    const lines = contents.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      const matchedTerm = forbiddenTerms.find((term) => lowerLine.includes(term));
      if (matchedTerm) {
        findings.push({
          file: relativePath,
          line: index + 1,
          term: matchedTerm,
          text: line.trim(),
        });
      }
    });
  }

  return findings;
}

function main() {
  console.log('🧭 Validating default branch references...');

  const findings = findForbiddenReferences();
  if (findings.length > 0) {
    console.error('\n❌ Deprecated default-branch references found:');
    findings.forEach((finding) => {
      console.error(`   - ${finding.file}:${finding.line} contains "${finding.term}": ${finding.text}`);
    });
    process.exit(1);
  }

  console.log('✅ No deprecated default-branch references found.');
}

if (require.main === module) {
  main();
}
