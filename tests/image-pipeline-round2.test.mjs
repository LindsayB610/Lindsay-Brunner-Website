import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { parse } from 'parse5';
import { prepareImages, publishImages, transformHtml, validateImages } from '../scripts/images/pipeline.mjs';

const nodes = n => [n, ...(n.childNodes || []).flatMap(nodes)];
const img = html => Object.fromEntries(nodes(parse(html)).find(n => n.tagName === 'img').attrs.map(a => [a.name, a.value]));
async function fixture(t, small = 320, large = 640) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'image-round2-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'static'));
  await sharp({ create: { width: large, height: large * 3 / 5, channels: 3, background: 'red' } }).png().toFile(path.join(root, 'static/a.png'));
  await sharp(path.join(root, 'static/a.png')).resize(small).toFile(path.join(root, 'static/small.png'));
  const f = { root, publishDir: path.join(root, 'public'), config: { requireHeaders: false, budgetExceptions: [], authoredSourceAliases: {} } };
  f.manifest = await prepareImages(f);
  f.config.authoredSourceAliases['/small.png'] = { target: '/a.png', sourceSha256: f.manifest.images['/small.png'].sourceSha256, targetSha256: f.manifest.images['/a.png'].sourceSha256 };
  await publishImages(f);
  await fs.cp(path.join(root, 'static'), f.publishDir, { recursive: true });
  return f;
}
async function gate(f, html) {
  await fs.writeFile(path.join(f.publishDir, 'index.html'), html);
  return validateImages(f);
}

test('incomplete real markers and full width sets without sizes fail transform and gate', async t => {
  const f = await fixture(t);
  const full = transformHtml({ ...f, html: '<img src="/a.png" data-image-profile="christmas-cover">' }).html;
  const singleton = `<img src="${f.manifest.images['/a.png'].variants.find(v => v.width === 320 && v.format === 'webp').url}" data-image-source="/a.png" data-image-profile="christmas-cover">`;
  for (const html of [singleton, full.replace(/ sizes="[^"]*"/, ''), full.replace(/ fetchpriority="[^"]*"/, ''), full.replace(/ width="[^"]*"/, '')]) {
    assert.throws(() => transformHtml({ ...f, html }), /finalized.*presentation/i);
    await assert.rejects(gate(f, html), /finalized.*presentation/i);
  }
  await gate(f, full);
  assert.equal(transformHtml({ ...f, html: full }).html, full);
});

test('ladder-aligned densities retain exact pixels and 1x intrinsic display dimensions', async t => {
  const f = await fixture(t);
  const out = transformHtml({ ...f, html: '<img src="/small.png" srcset="/small.png 1x, /a.png 2x">' }).html;
  const a = img(out);
  assert.equal(a.width, '320'); assert.equal(a.height, '192');
  for (const [index, candidate] of a.srcset.split(', ').entries()) {
    const [url, density] = candidate.split(' ');
    const v = f.manifest.images['/a.png'].variants.find(v => v.url === url);
    assert.equal(v.width, (index + 1) * 320); assert.equal(density, `${index + 1}x`);
    const decoded = await sharp(path.join(f.publishDir, url)).metadata();
    assert.equal(decoded.width / (index + 1), 320);
  }
  await gate(f, out); assert.equal(transformHtml({ ...f, html: out }).html, out);
});

test('non-ladder density pixel widths fail explicitly instead of rounding', async t => {
  const f = await fixture(t, 500, 1000);
  assert.throws(() => transformHtml({ ...f, html: '<img src="/small.png" srcset="/small.png 1x, /a.png 2x">' }), /density.*(?:ladder|exact)/i);
});

test('reviewed resize aliases accept genuine bytes then reject either side artwork drift', async t => {
  const f = await fixture(t);
  const html = '<img src="/small.png">';
  const good = transformHtml({ ...f, html }).html;
  assert.equal(img(good)['data-image-source'], '/a.png'); await gate(f, good);
  for (const [file, width] of [['small.png', 320], ['a.png', 640]]) {
    const original = await fs.readFile(path.join(f.root, 'static', file));
    await sharp({ create: { width, height: width * 3 / 5, channels: 3, background: 'blue' } }).png().toFile(path.join(f.root, 'static', file));
    f.manifest = await prepareImages(f);
    assert.throws(() => transformHtml({ ...f, html }), /alias.*(?:hash|drift|review)/i);
    await fs.writeFile(path.join(f.root, 'static', file), original);
  }
});

test('single-sided authored dimensions preserve aspect ratio for ordinary and density images', async t => {
  const f = await fixture(t);
  for (const set of ['', ' srcset="/small.png 1x, /a.png 2x"']) {
    for (const [dimension, value, width, height] of [['width', 200, '200', '120'], ['height', 60, '100', '60']]) {
      const out = transformHtml({ ...f, html: `<img src="/a.png" ${dimension}="${value}"${set}>` }).html;
      assert.equal(img(out).width, width); assert.equal(img(out).height, height);
      await gate(f, out);
    }
  }
});


test('resize alias delivery retains authored intrinsic dimensions', async t => {
  const f = await fixture(t);
  const out = transformHtml({...f, html: '<img src="/small.png">'}).html;
  assert.equal(img(out).width, '320'); assert.equal(img(out).height, '192');
  assert.equal(img(out)['data-image-source'], '/a.png');
  await gate(f, out);
});

test('native responsive completion preserves dimension shape and browser default sizes', async t => {
  const f = await fixture(t);
  for (const dimensions of ['', 'width="100"', 'height="60"', 'width="100" height="100"']) {
    for (const html of [
      `<img src="/a.png" srcset="/small.png 320w, /a.png 640w" ${dimensions}>`,
      `<picture><source media="(min-width:600px)" type="image/png" srcset="/small.png 1x, /a.png 2x"><img src="/a.png" ${dimensions}></picture>`,
    ]) {
      const out = transformHtml({...f, html}).html, a = img(out);
      assert.equal(a.width, dimensions.includes('width=') ? '100' : undefined);
      assert.equal(a.height, dimensions.includes('height=') ? (dimensions.includes('width=') ? '100' : '60') : undefined);
      assert.equal(a.sizes, html.startsWith('<picture>') ? '640px' : '100vw');
      await gate(f, out);
      assert.equal(transformHtml({...f, html: out}).html, out);
      const broken = out.replace(/data-image-native-dimensions="[^"]*"/, 'data-image-native-dimensions="invalid"');
      assert.throws(() => transformHtml({...f, html: broken}), /finalized.*presentation/i);
      await assert.rejects(gate(f, broken), /finalized.*presentation/i);
      if (a.width) await assert.rejects(gate(f, out.replace(/ width="100"/, '')), /finalized.*presentation/i);
    }
  }
});
