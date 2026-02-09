#!/usr/bin/env node

/**
 * Check Links Script
 *
 * Starts a Hugo dev server, waits for it to be ready, runs broken-link-checker
 * against localhost:1313, then stops the server. Used by `npm run test:links`.
 *
 * Run with: npm run test:links
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 1313;
const BASE_URL = `http://localhost:${PORT}`;
const READY_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 300;
/** Max time for the broken-link-checker crawl; prevents test suite from hanging. */
const LINK_CHECK_TIMEOUT_MS = 60_000; // 1 minute (66 pages should finish well under this)

function clearPort() {
  try {
    // Try to find and kill any process using the port
    const pid = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    if (pid) {
      console.log(`Found process ${pid} on port ${PORT}, killing it...`);
      execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
      // Give it a moment to fully release the port
      return new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (err) {
    // No process found on port, or lsof/kill failed - that's okay
  }
  return Promise.resolve();
}

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

let currentHugo = null;
let cleaned = false;

const cleanup = () => {
  if (cleaned) return;
  cleaned = true;
  if (currentHugo && currentHugo.kill) {
    currentHugo.kill('SIGTERM');
  }
};

// Set up cleanup handlers once
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

function startServerAndCheck(projectRoot, retry = false) {
  currentHugo = spawn('hugo', ['server', '--port', String(PORT)], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: true,
  });

  currentHugo.on('error', async (err) => {
    console.error('Failed to start Hugo server:', err.message);
    if (!retry) {
      console.log('Attempting to clear port and retry...');
      await clearPort();
      startServerAndCheck(projectRoot, true);
    } else {
      process.exit(1);
    }
  });

  let resolved = false;
  currentHugo.stderr?.on('data', (chunk) => {
    if (!resolved) return;
    process.stderr.write(chunk);
  });

  if (retry) {
    console.log('Retrying: Starting Hugo server on', BASE_URL, '...');
  } else {
    console.log('Starting Hugo server on', BASE_URL, '...');
  }

  waitForServer()
    .then(() => {
      resolved = true;
      console.log('Server ready. Running link check (max %ds)...\n', LINK_CHECK_TIMEOUT_MS / 1000);
      const blc = spawn(
        'npx',
        ['blc', '--recursive', '--exclude-external', '--filter-level', '2', BASE_URL],
        { cwd: projectRoot, stdio: 'inherit', shell: true }
      );
      const linkCheckTimeout = setTimeout(() => {
        if (blc.kill) {
          console.error('\nError: Link check did not finish within %ds. Stopping to avoid hanging.', LINK_CHECK_TIMEOUT_MS / 1000);
          blc.kill('SIGKILL');
        }
        cleanup();
        process.exit(1);
      }, LINK_CHECK_TIMEOUT_MS);
      blc.on('close', (code, signal) => {
        clearTimeout(linkCheckTimeout);
        cleanup();
        process.exit(code !== null && code !== undefined ? code : 1);
      });
    })
    .catch(async (err) => {
      if (currentHugo && currentHugo.kill) {
        currentHugo.kill('SIGTERM');
      }
      if (!retry && err.message.includes('did not become ready')) {
        console.error('Error:', err.message);
        console.log('Attempting to clear port and retry...');
        await clearPort();
        startServerAndCheck(projectRoot, true);
      } else {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}

function main() {
  const projectRoot = path.join(__dirname, '..');
  startServerAndCheck(projectRoot);
}

main();
