import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function deploymentSteps() {
  // Netlify builds are unprivileged. Browser launches below validate host libraries.
  return [
    ['node', ['node_modules/playwright/cli.js', 'install', '--only-shell', 'chromium']],
    ['npm', ['test']],
    ['npm', ['run', 'test:images:presentation']],
    ['npm', ['run', 'test:images:runtime']],
    // Check the final local publish directory, never the old production site.
    ['npm', ['run', 'test:visual-layout']],
  ];
}

export function runDeploymentGate({ run = spawnSync, env = process.env } = {}) {
  const testEnv = { ...env };
  delete testEnv.VISUAL_AUDIT_ORIGIN;
  for (const [command, args] of deploymentSteps()) {
    console.log(`Deployment gate: ${command} ${args.join(' ')}`);
    const result = run(command, args, { stdio: 'inherit', env: testEnv });
    if (result.error || result.signal || result.status !== 0) {
      console.error(`Deployment blocked: ${command} ${args.join(' ')}`);
      return Number.isInteger(result.status) && result.status > 0 ? result.status : 1;
    }
  }
  console.log('Deployment gate passed: all required checks succeeded.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runDeploymentGate();
}
