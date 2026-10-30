import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { deploymentSteps, runDeploymentGate } from '../scripts/deploy-gate.mjs';

test('every deploy context uses the gate, with no build-only override', () => {
  const config = fs.readFileSync('netlify.toml', 'utf8');
  const commands = [...config.matchAll(/^command\s*=\s*"([^"]+)"/gm)].map(m => m[1]);
  assert.deepEqual(commands, ['npm ci && npm run deploy:gate', 'npm run dev:optimized']);
  const scripts = JSON.parse(fs.readFileSync('package.json')).scripts;
  assert.equal(scripts['deploy:gate'], 'node scripts/deploy-gate.mjs');
  assert.ok(scripts.test.includes('npm run test:deploy-gate'));
  assert.ok(scripts.test.includes('npm run test:visual-layout'));
  assert.equal(scripts.pretest, 'npm run build');
});

test('required stages execute in order and test local output even with a live-origin environment variable', () => {
  const calls = [];
  const env = { PATH: process.env.PATH, VISUAL_AUDIT_ORIGIN: 'https://old-production.example' };
  assert.equal(runDeploymentGate({ platform: 'linux', env, run(command, args, options) {
    calls.push([command, args]);
    assert.equal(options.env.VISUAL_AUDIT_ORIGIN, undefined);
    assert.equal(options.env.PATH, process.env.PATH);
    return { status: 0 };
  }}), 0);
  assert.deepEqual(calls, [
    ['node', ['node_modules/playwright/cli.js', 'install', '--only-shell', '--with-deps', 'chromium']],
    ['npm', ['test']],
    ['npm', ['run', 'test:images:presentation']],
    ['npm', ['run', 'test:images:runtime']],
    ['npm', ['run', 'test:visual-layout']],
  ]);
  assert.ok(env.VISUAL_AUDIT_ORIGIN, 'Do not mutate the caller environment');
});

for (let failure = 0; failure < deploymentSteps().length; failure++) {
  for (const result of [{ status: 23 }, { status: null, signal: 'SIGTERM' }, { error: new Error('cannot start') }]) {
    test(`stage ${failure} blocks deployment and stops later commands on ${result.status ?? result.signal ?? 'launch error'}`, () => {
      let calls = 0;
      assert.notEqual(runDeploymentGate({ run() { return calls++ === failure ? result : { status: 0 }; } }), 0);
      assert.equal(calls, failure + 1);
    });
  }
}

test('the executable gate returns failure to its caller and never reaches later stages', async () => {
  const os = await import('node:os');
  const path = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-gate-'));
  try {
    // Fake only external commands; execute the real gate entrypoint as Netlify does.
    const stub = '#!/bin/sh\nprintf "%s\\n" "$*" >> "$GATE_TEST_LOG"\ncase "$*" in *"$GATE_TEST_FAIL"*) exit 37;; esac\nexit 0\n';
    for (const name of ['node', 'npm']) fs.writeFileSync(path.join(dir, name), stub, { mode: 0o755 });
    for (const [index, failure] of ['node_modules/playwright', 'test', 'test:images:presentation', 'test:images:runtime', 'test:visual-layout'].entries()) {
      const log = path.join(dir, 'calls');
      fs.writeFileSync(log, '');
      const result = spawnSync(process.execPath, ['scripts/deploy-gate.mjs'], {
        encoding: 'utf8', env: { ...process.env, PATH: dir, GATE_TEST_LOG: log, GATE_TEST_FAIL: failure },
      });
      assert.equal(result.status, 37, result.stderr);
      assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').length, index + 1);
      assert.ok(!result.stdout.includes('Deployment gate passed'));
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
