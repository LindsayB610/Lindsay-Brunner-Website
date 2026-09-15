/** Exercise the real parsers and native image library used by publishing. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const yaml = require('js-yaml');
const sharp = require('sharp');
const { generatePNGFromSVG } = require('../scripts/generate-png-from-svg');
const { loadTsModule } = require('./ai-chat-exporter-test-utils');

async function checkBlobsClient() {
  const { getStore } = await import('@netlify/blobs');
  const previousContext = globalThis.netlifyBlobsContext;
  const previousFetch = globalThis.fetch;
  const hadContext = Object.hasOwn(globalThis, 'netlifyBlobsContext');
  // Use the real SDK with a local in-memory transport. No Netlify credentials,
  // sockets, or production storage are involved, even inside a Netlify build.
  globalThis.netlifyBlobsContext = Buffer.from(JSON.stringify({
    siteID: 'fixture-site', token: 'fixture-token',
    edgeURL: 'https://cached.example.invalid',
    uncachedEdgeURL: 'https://strong.example.invalid',
  })).toString('base64');
  const requests = [];
  const entries = new Map();
  let denyWrites = false;
  let denyReads = false;
  let malformedReads = false;
  const fetchFixture = async (url, options) => {
    requests.push({ url, options });
    if (options.method.toUpperCase() === 'PUT') {
      if (denyWrites) return new Response(null, { status: 403 });
      entries.set(url, options.body);
      return new Response(null, { status: 200, headers: { etag: 'fixture-etag' } });
    }
    if (denyReads) return new Response(null, { status: 503 });
    if (malformedReads) return new Response('{not-json', { headers: { 'content-type': 'application/json' } });
    return entries.has(url)
      ? new Response(entries.get(url), { headers: { 'content-type': 'application/json' } })
      : new Response(null, { status: 404 });
  };
  try {
    const store = getStore({
      name: 'ai-chat-exporter-rate-limits', consistency: 'strong',
      fetch: fetchFixture,
    });
    const key = 'pdf/fixture-client';
    assert.equal(await store.get(key, { type: 'json' }), null);
    const bucket = { count: 1, resetAt: '2026-09-14T18:00:00.000Z' };
    await store.setJSON(key, bucket);
    assert.deepEqual(await store.get(key, { type: 'json' }), bucket);
    denyWrites = true;
    await assert.rejects(store.setJSON(key, { ...bucket, count: 2 }), /Netlify Blobs/);
    assert.equal(requests.length, 4);
    for (const { url, options } of requests) {
      assert.equal(new URL(url).hostname, 'strong.example.invalid', 'Rate-limit reads must bypass the cache');
      assert.ok(new URL(url).pathname.endsWith('/site:ai-chat-exporter-rate-limits/pdf/fixture-client'));
      assert.equal(new Headers(options.headers).get('authorization'), 'Bearer fixture-token');
    }

    // Exercise the actual request handler and its private rate-limit function,
    // keeping the real SDK and replacing only HTTP transport and PDF rendering.
    entries.clear();
    denyWrites = false;
    globalThis.fetch = fetchFixture;
    const { handleExportChatRequest } = loadTsModule('netlify/functions/export-chat.mts');
    let exports = 0;
    const request = (clientIp = '192.0.2.1') => handleExportChatRequest(new Request('https://example.invalid/api/export-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-nf-client-connection-ip': clientIp },
      body: JSON.stringify({ sharedUrl: 'https://chatgpt.com/share/fixture-thread', format: 'pdf' }),
    }), {
      getTurnstileSecret: () => undefined,
      exportChat: async () => { exports++; return new Response('%PDF-fixture'); },
    });
    for (let i = 0; i < 5; i++) assert.equal((await request()).status, 200);
    const limited = await request();
    assert.equal(limited.status, 429, 'The sixth PDF must be rejected by the real limiter');
    assert.ok(Number(limited.headers.get('Retry-After')) > 0);
    assert.equal(exports, 5, 'Limited requests must not start PDF rendering');
    assert.equal(entries.size, 1, 'Requests from the same client must share one bucket');
    const [bucketUrl] = entries.keys();
    assert.equal(JSON.parse(entries.get(bucketUrl)).count, 5);
    assert.equal((await request('198.51.100.2')).status, 200,
      'A second client must be able to export after the first client reaches its limit');
    assert.equal(entries.size, 2, 'Different clients must use separate rate-limit buckets');
    const secondBucketUrl = [...entries.keys()].find((url) => url !== bucketUrl);
    assert.ok(secondBucketUrl, 'The second client should create a distinct bucket URL');
    assert.equal(JSON.parse(entries.get(secondBucketUrl)).count, 1);
    assert.equal((await request()).status, 429, 'The first client must remain limited after another client exports');
    assert.equal(exports, 6, 'Only the second client should start one additional PDF render');
    for (const resetAt of ['2000-01-01T00:00:00.000Z', 'invalid-date']) {
      entries.set(bucketUrl, JSON.stringify({ count: 5, resetAt }));
      assert.equal((await request()).status, 200, 'Expired or invalid windows must reset');
      assert.equal(JSON.parse(entries.get(bucketUrl)).count, 1);
    }
    denyWrites = true;
    const exportsBeforeFailure = exports;
    const failed = await request();
    assert.equal(failed.status, 500, 'Storage failures must return 500');
    assert.deepEqual(await failed.json(), { error: 'The export failed. Please try again.' });
    assert.equal(exports, exportsBeforeFailure, 'A failed storage write must stop PDF rendering');

    denyWrites = false;
    denyReads = true;
    const entriesBeforeDeniedRead = new Map(entries);
    const requestsBeforeDeniedRead = requests.length;
    const exportsBeforeDeniedRead = exports;
    const deniedRead = await request('203.0.113.3');
    assert.equal(deniedRead.status, 500, 'Storage read failures must return 500');
    assert.deepEqual(await deniedRead.json(), { error: 'The export failed. Please try again.' });
    assert.equal(exports, exportsBeforeDeniedRead, 'A failed storage read must stop PDF rendering');
    assert.deepEqual(entries, entriesBeforeDeniedRead, 'A failed storage read must not write a new bucket');
    assert.ok(requests.slice(requestsBeforeDeniedRead).every(({ options }) => options.method.toUpperCase() === 'GET'),
      'A failed storage read must not be followed by a bucket write');

    denyReads = false;
    malformedReads = true;
    const entriesBeforeMalformedRead = new Map(entries);
    const requestsBeforeMalformedRead = requests.length;
    const exportsBeforeMalformedRead = exports;
    const malformedRead = await request('203.0.113.4');
    assert.equal(malformedRead.status, 500, 'Malformed storage data must return 500');
    assert.deepEqual(await malformedRead.json(), { error: 'The export failed. Please try again.' });
    assert.equal(exports, exportsBeforeMalformedRead, 'Malformed storage data must stop PDF rendering');
    assert.deepEqual(entries, entriesBeforeMalformedRead, 'Malformed storage data must not write a new bucket');
    assert.ok(requests.slice(requestsBeforeMalformedRead).every(({ options }) => options.method.toUpperCase() === 'GET'),
      'Malformed storage data must not be followed by a bucket write');
    malformedReads = false;

    assert.ok(requests.every(({ url }) => new URL(url).hostname === 'strong.example.invalid'),
      'The actual function must use uncached storage for every rate-limit operation');
  } finally {
    globalThis.fetch = previousFetch;
    if (hadContext) globalThis.netlifyBlobsContext = previousContext;
    else delete globalThis.netlifyBlobsContext;
  }
}

async function run() {
  // Preserve dates, Unicode, lists and ordinary YAML aliases used in content.
  const content = yaml.load(`
title: "A recipe with ½ Cup"
date: 2026-09-14
draft: false
defaults: &defaults
  recipeYield: "4 servings"
recipe:
  <<: *defaults
  dietary: [vegetarian, gluten-free]
`);
  assert.equal(content.title, 'A recipe with ½ Cup');
  assert.equal(content.date.toISOString(), '2026-09-14T00:00:00.000Z');
  assert.equal(content.draft, false);
  assert.deepEqual(content.recipe, {
    recipeYield: '4 servings', dietary: ['vegetarian', 'gluten-free'],
  });
  // The security fix must count empty merge sources too. Keep the fixture tiny:
  // an old parser fails this assertion without making the test consume CPU.
  assert.throws(
    () => yaml.load('empty: &empty {}\nmerged:\n  <<: [*empty, *empty, *empty]\n', { maxTotalMergeKeys: 2 }),
    yaml.YAMLException,
    'Empty YAML merge sources must respect the configured work limit',
  );

  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lb-image-runtime-'));
  try {
    const svgPath = path.join(temporaryDir, 'social.svg');
    const pngPath = path.join(temporaryDir, 'social.png');
    fs.writeFileSync(svgPath, '<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1260"><rect width="2400" height="1260" fill="#000000"/><rect x="1200" width="1200" height="1260" fill="#ff1b8d"/></svg>');
    await generatePNGFromSVG(svgPath, pngPath);
    const metadata = await sharp(pngPath).metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, 2400);
    assert.equal(metadata.height, 1260);
    for (const [left, expected] of [[100, [0, 0, 0]], [1300, [255, 27, 141]]]) {
      const pixel = await sharp(pngPath).extract({ left, top: 100, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
      assert.deepEqual([...pixel], expected, 'SVG conversion should preserve the site colors');
    }
    for (const format of ['jpeg', 'webp', 'avif']) {
      const encoded = await sharp(pngPath).resize(120, 63).toFormat(format).toBuffer();
      const decoded = await sharp(encoded).raw().toBuffer({ resolveWithObject: true });
      assert.equal(decoded.info.width, 120);
      assert.equal(decoded.info.height, 63);
      assert.ok(decoded.data.length > 0, `${format} should decode successfully`);
    }
    await assert.rejects(sharp(Buffer.from('invalid image')).toBuffer());
  } finally {
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
  await checkBlobsClient();
  console.log('✅ YAML safety, image publishing, and Blobs client runtime checks passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
