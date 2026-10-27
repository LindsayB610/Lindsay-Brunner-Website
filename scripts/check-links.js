#!/usr/bin/env node

/** Crawl the existing finalized public output without invoking Hugo or rebuilding. */
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');

const LINK_CHECK_TIMEOUT_MS = 60_000;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function netlifyExternalRedirectSkips(projectRoot, baseUrl) {
  const configPath = path.join(projectRoot, 'netlify.toml');
  if (!require('fs').existsSync(configPath)) return [];

  const config = require('fs').readFileSync(configPath, 'utf8');
  const redirectBlocks = config.split(/\[\[redirects\]\]/).slice(1);

  return redirectBlocks.flatMap((block) => {
    const from = block.match(/^from\s*=\s*"([^"]+)"/m)?.[1];
    const to = block.match(/^to\s*=\s*"(https?:\/\/[^\"]+)"/m)?.[1];
    const status = Number(block.match(/^status\s*=\s*(\d+)/m)?.[1]);

    if (!from || !to || ![301, 302, 303, 307, 308].includes(status) || from.includes('*') || from.includes(':')) {
      return [];
    }

    return [`^${escapeRegex(`${baseUrl}${from}`)}$`];
  });
}


async function startStaticServer(publicRoot, port = 1314) {
  const root = await fs.promises.realpath(publicRoot);
  await fs.promises.access(path.join(root, 'index.html'));
  const server = http.createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405).end();
        return;
      }
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(root, `.${pathname}`);
      if (!file.startsWith(`${root}${path.sep}`) && file !== root) {
        res.writeHead(403).end();
        return;
      }
      const stat = await fs.promises.stat(file);
      if (stat.isDirectory()) {
        if (!pathname.endsWith('/')) {
          res.writeHead(301, { Location: `${pathname}/${new URL(req.url, 'http://localhost').search}` }).end();
          return;
        }
        file = path.join(file, 'index.html');
      }
      file = await fs.promises.realpath(file);
      if (!file.startsWith(`${root}${path.sep}`)) {
        res.writeHead(403).end();
        return;
      }
      const body = await fs.promises.readFile(file);
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
        '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.webp': 'image/webp', '.avif': 'image/avif' };
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Content-Length': body.length });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      res.writeHead(error instanceof URIError ? 400 : 404).end();
    }
  });
  server.listen(port, '127.0.0.1');
  await once(server, 'listening'); // EADDRINUSE fails; never touch another process.
  return server;
}

async function runLinkCheck(projectRoot, { port = Number(process.env.LINK_CHECK_PORT || 1314),
  timeoutMs = LINK_CHECK_TIMEOUT_MS } = {}) {
  const server = await startStaticServer(path.join(projectRoot, 'public'), port);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let child;
  let timer;
  let killTimer;
  let stopped = false;
  let failure = 0;
  const stop = (code) => {
    failure = code;
    if (stopped) return;
    stopped = true;
    if (child) {
      child.kill('SIGTERM');
      killTimer = setTimeout(() => child.kill('SIGKILL'), 1000);
    }
  };
  const interrupt = () => stop(130);
  const terminate = () => stop(143);
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', terminate);
  try {
    console.log(`Checking finalized public output at ${baseUrl} (max ${timeoutMs / 1000}s)`);
    const skips = netlifyExternalRedirectSkips(projectRoot, baseUrl);
    // Launch the installed CLI directly: no npx wrapper or unmanaged descendants.
    const cli = path.join(path.dirname(require.resolve('linkinator')), 'cli.js');
    child = spawn(process.execPath, [cli, baseUrl, '--recurse',
      '--skip', 'index\\.xml$', '--skip',
      `^https?://(?!(localhost|127\\.0\\.0\\.1):${server.address().port})`,
      ...skips.flatMap((skip) => ['--skip', skip]),
      '--timeout', '10000', '--verbosity', 'warning'],
    { cwd: projectRoot, stdio: 'inherit', shell: false });
    timer = setTimeout(() => {
      console.error('Link check exceeded its time limit.');
      stop(1);
    }, timeoutMs);
    const [code] = await once(child, 'close');
    return failure || (code ?? 1);
  } finally {
    clearTimeout(timer);
    clearTimeout(killTimer);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', terminate);
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
  }
}

module.exports = { startStaticServer, runLinkCheck, netlifyExternalRedirectSkips };
if (require.main === module) {
  runLinkCheck(path.join(__dirname, '..')).then((code) => { process.exitCode = code; })
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
