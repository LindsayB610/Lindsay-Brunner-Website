const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { startStaticServer, runLinkCheck, netlifyExternalRedirectSkips } = require('../scripts/check-links');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'finalized-links-'));
  await fs.mkdir(path.join(root, 'public/_img'), { recursive: true });
  await fs.writeFile(path.join(root, 'public/_img/photo.webp'), 'fixture');
  await fs.writeFile(path.join(root, 'public/index.html'), '<html><body><img data-image-source="/images/photo.jpg" src="/_img/photo.webp"><a href="/external">redirect</a></body></html>');
  await fs.writeFile(path.join(root, 'netlify.toml'), '[[redirects]]\nfrom = "/external"\nto = "https://example.com/"\nstatus = 302\n');
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('crawl serves finalized bytes, follows generated images, and preserves external redirect skips', async (t) => {
  const root = await fixture(t);
  const before = await fs.readFile(path.join(root, 'public/index.html'));
  assert.equal(await runLinkCheck(root, { port: 0 }), 0);
  assert.deepEqual(await fs.readFile(path.join(root, 'public/index.html')), before);
  await fs.unlink(path.join(root, 'public/_img/photo.webp'));
  assert.equal(await runLinkCheck(root, { port: 0 }), 1, 'missing derivative must fail');
});

test('server rejects occupied ports without disturbing the owner and serves nested index files', async (t) => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, 'public/nested'));
  await fs.writeFile(path.join(root, 'public/nested/index.html'), 'nested');
  const server = await startStaticServer(path.join(root, 'public'), 0);
  t.after(() => { server.closeAllConnections(); server.close(); });
  const port = server.address().port;
  await assert.rejects(startStaticServer(path.join(root, 'public'), port), { code: 'EADDRINUSE' });
  assert.equal(await (await fetch(`http://127.0.0.1:${port}/nested`)).text(), 'nested');
  assert.equal((await fetch(`http://127.0.0.1:${port}/%ZZ`)).status, 400);
  await fs.symlink(path.join(root, 'netlify.toml'), path.join(root, 'public/outside'));
  assert.equal((await fetch(`http://127.0.0.1:${port}/outside`)).status, 403);
});

test('bounded crawl timeout releases its owned port', async (t) => {
  const root = await fixture(t);
  const probe = await startStaticServer(path.join(root, 'public'), 0);
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  assert.equal(await runLinkCheck(root, { port, timeoutMs: 1 }), 1);
  const replacement = await startStaticServer(path.join(root, 'public'), port);
  await new Promise(resolve => replacement.close(resolve));
});

test('redirect skip patterns remain exact and exclude wildcard rules', async (t) => {
  const root = await fixture(t);
  const skips = netlifyExternalRedirectSkips(root, 'http://127.0.0.1:1234');
  assert.equal(skips.length, 1);
  assert(new RegExp(skips[0]).test('http://127.0.0.1:1234/external'));
  assert(!new RegExp(skips[0]).test('http://127x0x0x1:1234/external'));
});
