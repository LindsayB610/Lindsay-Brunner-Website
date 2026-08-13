/**
 * Guards the repo-local Codex runtime config.
 *
 * This repo intentionally pins GUPPI MCP access to a specific profile and
 * workspace root. If those values drift, Codex can start with the wrong
 * capabilities or target the wrong checkout.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const configPath = path.join(repoRoot, '.codex', 'config.toml');
const requiredChecks = [
  {
    label: 'GUPPI MCP section',
    pattern: /^\[mcp_servers\.guppi\]$/m,
  },
  {
    label: 'node command',
    pattern: /^command = "node"$/m,
  },
  {
    label: 'GUPPI server entrypoint',
    pattern: /args = \[[^\]]*"\/Users\/lindsaybrunner\/Developer\/GUPPI\/mcp\/src\/server\.mjs"/m,
  },
  {
    label: 'personal-creative profile',
    pattern: /"--profile", "personal-creative"/m,
  },
  {
    label: 'website workspace root',
    pattern: /"--workspace-root", "\/Users\/lindsaybrunner\/Documents\/Lindsay-Brunner-Website"/m,
  },
  {
    label: 'GUPPI MCP cwd',
    pattern: /^cwd = "\/Users\/lindsaybrunner\/Developer\/GUPPI\/mcp"$/m,
  },
];

function main() {
  console.log('🤖 Validating Codex config...');

  if (!fs.existsSync(configPath)) {
    console.error(`\n❌ Missing expected Codex config: ${path.relative(repoRoot, configPath)}`);
    process.exit(1);
  }

  const contents = fs.readFileSync(configPath, 'utf8');
  const failures = requiredChecks
    .filter(({ pattern }) => !pattern.test(contents))
    .map(({ label }) => label);

  if (failures.length > 0) {
    console.error('\n❌ Codex config is missing required settings:');
    failures.forEach((failure) => {
      console.error(`   - ${failure}`);
    });
    process.exit(1);
  }

  console.log('✅ Codex config matches expected GUPPI MCP settings.');
}

if (require.main === module) {
  main();
}
