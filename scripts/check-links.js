#!/usr/bin/env node

/**
 * Check Links Script
 *
 * Starts a Hugo dev server, waits for it to be ready, runs linkinator
 * against localhost:1313, then stops the server. Used by `npm run test:links`.
 *
 * Run with: npm run test:links
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = Number(process.env.LINK_CHECK_PORT || 1314);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const READY_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 300;
/** Max time for the linkinator crawl; prevents test suite from hanging. */
const LINK_CHECK_TIMEOUT_MS = 60_000; // 1 minute (66 pages should finish well under this)

function clearPort(projectRoot) {
  try {
    // Try to find any Hugo process from this project using the port. lsof can
    // also return browser helper processes with open connections, so do not
    // blindly kill every PID on the port.
    const pids = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8', stdio: 'pipe' })
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const hugoPids = pids.filter((pid) => {
      try {
        const command = execSync(`ps -p ${pid} -o command=`, { encoding: 'utf8', stdio: 'pipe' });
        return command.includes('hugo') && command.includes(projectRoot);
      } catch (err) {
        return false;
      }
    });
    if (hugoPids.length > 0) {
      console.log(`Found Hugo process ${hugoPids.join(', ')} on port ${PORT}, killing it...`);
      execSync(`kill -9 ${hugoPids.join(' ')}`, { stdio: 'pipe' });
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
  const hugoBinary = path.join(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'hugo.cmd' : 'hugo'
  );

  currentHugo = spawn(hugoBinary, ['server', '--port', String(PORT)], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: false,
  });
  let hugoOutput = '';

  currentHugo.on('error', async (err) => {
    console.error('Failed to start Hugo server:', err.message);
    if (!retry) {
      console.log('Attempting to clear port and retry...');
      await clearPort(projectRoot);
      startServerAndCheck(projectRoot, true);
    } else {
      process.exit(1);
    }
  });

  let resolved = false;
  currentHugo.stdout?.on('data', (chunk) => {
    const text = chunk.toString();
    hugoOutput += text;
    if (resolved) process.stdout.write(chunk);
  });
  currentHugo.stderr?.on('data', (chunk) => {
    const text = chunk.toString();
    hugoOutput += text;
    if (resolved) process.stderr.write(chunk);
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
      const linkinator = spawn(
        'npx',
        [
          'linkinator',
          BASE_URL,
          '--recurse',
          '--skip',
          'index\\.xml$',
          '--skip',
          `^https?://(?!(localhost|127\\.0\\.0\\.1):${PORT})`,
          '--timeout',
          '10000',
          '--verbosity',
          'warning',
        ],
        { cwd: projectRoot, stdio: 'inherit', shell: false }
      );
      const linkCheckTimeout = setTimeout(() => {
        if (linkinator.kill) {
          console.error('\nError: Link check did not finish within %ds. Stopping to avoid hanging.', LINK_CHECK_TIMEOUT_MS / 1000);
          linkinator.kill('SIGKILL');
        }
        cleanup();
        process.exit(1);
      }, LINK_CHECK_TIMEOUT_MS);
      linkinator.on('close', (code, signal) => {
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
        await clearPort(projectRoot);
        startServerAndCheck(projectRoot, true);
      } else {
        console.error('Error:', err.message);
        if (hugoOutput.trim()) {
          console.error('\nHugo output before timeout:\n%s', hugoOutput.trim());
        }
        process.exit(1);
      }
    });
}

function main() {
  const projectRoot = path.join(__dirname, '..');
  startServerAndCheck(projectRoot);
}

main();
