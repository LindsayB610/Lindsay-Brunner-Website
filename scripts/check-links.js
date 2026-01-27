#!/usr/bin/env node

/**
 * Check Links Script
 *
 * Starts a Hugo dev server, waits for it to be ready, runs broken-link-checker
 * against localhost:1313, then stops the server. Used by `npm run test:links`.
 *
 * Run with: npm run test:links
 */

const { spawn, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 1313;
const BASE_URL = `http://localhost:${PORT}`;
const READY_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 300;

function waitForServer() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let done = false;

    function poll() {
      if (done) return;
      if (Date.now() - start > READY_TIMEOUT_MS) {
        done = true;
        reject(new Error(`Server did not become ready within ${READY_TIMEOUT_MS / 1000}s`));
        return;
      }

      const req = http.get(BASE_URL, (res) => {
        if (done) return;
        res.resume();
        if (res.statusCode >= 200 && res.statusCode < 400) {
          done = true;
          resolve();
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      });
      req.on('error', () => {
        if (done) return;
        setTimeout(poll, POLL_INTERVAL_MS);
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (done) return;
        setTimeout(poll, POLL_INTERVAL_MS);
      });
    }

    poll();
  });
}

function main() {
  const projectRoot = path.join(__dirname, '..');
  const hugo = spawn('hugo', ['server', '--port', String(PORT)], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: true,
  });

  hugo.on('error', (err) => {
    console.error('Failed to start Hugo server:', err.message);
    process.exit(1);
  });

  let resolved = false;
  hugo.stderr?.on('data', (chunk) => {
    if (!resolved) return;
    process.stderr.write(chunk);
  });

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (hugo.kill) {
      hugo.kill('SIGTERM');
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  console.log('Starting Hugo server on', BASE_URL, '...');
  waitForServer()
    .then(() => {
      resolved = true;
      console.log('Server ready. Running link check...\n');
      const blc = spawnSync(
        'npx',
        ['blc', '--recursive', '--exclude-external', '--filter-level', '2', BASE_URL],
        { cwd: projectRoot, stdio: 'inherit', shell: true }
      );
      cleanup();
      process.exit(blc.status ?? 1);
    })
    .catch((err) => {
      console.error('Error:', err.message);
      cleanup();
      process.exit(1);
    });
}

main();
