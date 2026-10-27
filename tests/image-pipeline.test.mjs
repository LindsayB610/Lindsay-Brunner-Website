import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import {
  prepareImages,
  publishImages,
  transformHtml,
  validateImages,
} from "../scripts/images/pipeline.mjs";
import { resolveImage } from "../scripts/images/resolver.mjs";

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "image-pipeline-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "static"), { recursive: true });
  const image = async (name, width = 900, alpha = false) => {
    const dest = path.join(root, "static", name);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await sharp({
      create: {
        width,
        height: 600,
        channels: alpha ? 4 : 3,
        background: alpha ? "#ff007780" : "#cc5533",
      },
    })
      .png()
      .toFile(dest);
  };
  return {
    root,
    image,
    generatedDir: path.join(root, ".generated/images"),
    publishDir: path.join(root, "public"),
  };
}

test("standalone discovery, stable release URLs, immutable originals, cache repair and decoded descriptors", async (t) => {
  const f = await fixture(t);
  await f.image("only here.png", 900, true);
  const before = await fs.readFile(path.join(f.root, "static/only here.png"));
  const m = await prepareImages(f);
  const entry = m.images["/only%20here.png"];
  assert.equal(entry.hasAlpha, true);
  assert.ok(entry.variants.length >= 14);
  const d = resolveImage(m, "only%20here.png?v=1#art", { documentUrl: "/" });
  assert.equal(d.sourceUrl, "/only%20here.png?v=1#art");
  assert.equal(d.loading, "lazy");
  assert.ok(d.webpSrcSet.includes("320w"));
  for (const v of entry.variants) {
    const b = await fs.readFile(
      path.join(f.generatedDir, decodeURIComponent(v.url)),
    );
    const meta = await sharp(b).metadata();
    assert.equal(meta.width, v.width);
    assert.equal(meta.height, v.height);
    assert.equal(meta.hasAlpha, true);
  }
  assert.deepEqual(
    await fs.readFile(path.join(f.root, "static/only here.png")),
    before,
  );
  assert.deepEqual(await prepareImages(f), m);
  const cache = path.join(f.root, ".cache/image-optimization");
  const files = await fs.readdir(cache);
  await fs.writeFile(
    path.join(
      cache,
      files.find((x) => x.endsWith(".bin")),
    ),
    "corrupt",
  );
  assert.deepEqual(await prepareImages(f), m);
  const oldUrls = entry.variants.map((v) => v.url);
  await f.image("only here.png", 200, true);
  await fs.rm(cache, { recursive: true });
  const next = await prepareImages(f);
  await publishImages({ ...f, manifest: next });
  for (const url of oldUrls)
    assert.ok(
      (await fs.stat(path.join(f.publishDir, decodeURIComponent(url)))).size >
        0,
    );
  assert.ok(
    next.images["/only%20here.png"].variants.every((v) => v.width <= 200),
  );
  assert.equal(
    new Set(
      resolveImage(next, "/only%20here.png")
        .webpSrcSet.split(",")
        .map((x) => x.trim().split(" ")[1]),
    ).size,
    1,
  );
});

test("parsed transform preserves metadata, styles, URL semantics and idempotence; gate catches tampering", async (t) => {
  const f = await fixture(t);
  await f.image("folder/a.png");
  const manifest = await prepareImages(f);
  const original =
    '<html><head><base href="/folder/"><meta property="og:image" content="a.png"><meta name="robots" content="noindex"></head><body><a href="a.png"><img src="a.png?v=2#hi" alt="a &amp; b" style="width:50%" fetchpriority="high"></a></body></html>';
  const result = transformHtml({
    html: original,
    documentUrl: "/other/",
    manifest,
  });
  assert.match(result.html, /content="a.png"/);
  assert.match(result.html, /href="a.png"/);
  assert.match(result.html, /style="width:50%"/);
  assert.match(result.html, /loading="eager"/);
  assert.equal(
    transformHtml({ html: result.html, documentUrl: "/other/", manifest }).html,
    result.html,
  );
  await publishImages({ ...f, manifest });
  await fs.cp(path.join(f.root, "static"), f.publishDir, { recursive: true });
  await fs.writeFile(path.join(f.publishDir, "index.html"), result.html);
  await validateImages({ ...f, manifest, config: { requireHeaders: false } });
  const variant = manifest.images["/folder/a.png"].variants[0];
  await fs.writeFile(
    path.join(f.publishDir, decodeURIComponent(variant.url)),
    "bad",
  );
  await assert.rejects(
    validateImages({ ...f, manifest, config: { requireHeaders: false } }),
    /corrupt|hash|decode/i,
  );
  for (const src of [
    "/missing.png",
    "/%2e%2e/escape.png",
    "/folder/a.png?width=3",
    "/folder/%zz.png",
  ])
    assert.throws(
      () => resolveImage(manifest, src),
      /missing|escape|encoding|query/i,
    );
  assert.throws(
    () =>
      transformHtml({
        html: '<base href="https://elsewhere.test/"><img src="a.png">',
        documentUrl: "/",
        manifest,
      }),
    /external/i,
  );
});

test("existing picture keeps art direction and validates candidates", async (t) => {
  const f = await fixture(t);
  await f.image("a.png");
  await f.image("b.png");
  const manifest = await prepareImages(f);
  const html =
    '<picture><source media="(min-width: 600px)" type="image/png" srcset="/b.png 900w"><img src="/a.png" srcset="/a.png 900w"></picture>';
  const out = transformHtml({ html, documentUrl: "/", manifest }).html;
  assert.equal((out.match(/<picture>/g) || []).length, 1);
  assert.match(out, /media="\(min-width: 600px\)"/);
  assert.match(out, /type="image\/png"/);
  assert.throws(
    () =>
      transformHtml({
        html: '<img src="/a.png" srcset="/b.png 1200w">',
        documentUrl: "/",
        manifest,
      }),
    /descriptor/i,
  );
});

test("corrupt source and escaping symlink fail; simple bundle mapping; tiny SVG orientation and animation", async (t) => {
  const f = await fixture(t);
  await f.image("tiny.png", 20);
  await fs.writeFile(
    path.join(f.root, "static/icon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="10"></svg>',
  );
  await sharp({
    create: { width: 30, height: 50, channels: 3, background: "red" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toFile(path.join(f.root, "static/rotated.jpg"));
  await fs.writeFile(
    path.join(f.root, "static/animated.gif"),
    Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAAQABAAACAkQBADs=",
      "base64",
    ),
  );
  await fs.mkdir(path.join(f.root, "content/blog/bundle"), { recursive: true });
  await fs.writeFile(
    path.join(f.root, "content/blog/bundle/index.md"),
    "---\ntitle: Test\ndate: 2026-10-27\nslug: bundle\n---\n",
  );
  await fs.copyFile(
    path.join(f.root, "static/tiny.png"),
    path.join(f.root, "content/blog/bundle/photo.png"),
  );
  const manifest = await prepareImages(f);
  assert.ok(manifest.images["/blog/2026-10-27/bundle/photo.png"]);
  assert.equal(manifest.images["/icon.svg"].disposition, "svg");
  assert.equal(manifest.images["/rotated.jpg"].width, 50);
  assert.ok(manifest.images["/tiny.png"].variants.every((v) => v.width === 20));
  await fs.writeFile(path.join(f.root, "static/bad.png"), "bad");
  await assert.rejects(prepareImages(f), /bad.png/);
  await fs.unlink(path.join(f.root, "static/bad.png"));
  await fs.symlink("/etc/passwd", path.join(f.root, "static/escape.png"));
  await assert.rejects(prepareImages(f), /symlink/i);
});

test("animated passthrough, lean browser selection, corrupt/missing derivatives and header contracts", async (t) => {
  const f = await fixture(t);
  await f.image("same.png", 70);
  await f.image("same.jpg", 90);
  const raw = Buffer.alloc(10 * 20 * 4, 127);
  raw.fill(240, 10 * 10 * 4);
  await sharp(raw, {
    raw: { width: 10, height: 20, channels: 4, pageHeight: 10 },
  })
    .gif({ loop: 0, delay: [100, 100] })
    .toFile(path.join(f.root, "static/moving.gif"));
  const manifest = await prepareImages(f);
  assert.equal(manifest.images["/moving.gif"].disposition, "animated");
  assert.equal(manifest.images["/moving.gif"].variants.length, 0);
  assert.notEqual(
    manifest.images["/same.png"].variants[0].url,
    manifest.images["/same.jpg"].variants[0].url,
  );
  const { pickBrowserManifest } = await import(
    "../scripts/images/pipeline.mjs"
  );
  const lean = pickBrowserManifest(manifest, ["/same.png"]);
  assert.deepEqual(Object.keys(lean.images), ["/same.png"]);
  assert.ok(!JSON.stringify(lean).includes("sha256"));
  assert.ok(!JSON.stringify(lean).includes("sourcePath"));
  await publishImages({ ...f, manifest });
  await fs.cp(path.join(f.root, "static"), f.publishDir, { recursive: true });
  await fs.writeFile(
    path.join(f.publishDir, "_headers"),
    "/_img/*\n  Cache-Control: public, max-age=0, must-revalidate\n",
  );
  await assert.rejects(validateImages({ ...f, manifest }), /revalidation/);
  await fs.unlink(
    path.join(
      f.publishDir,
      decodeURIComponent(manifest.images["/same.png"].variants[0].url),
    ),
  );
  await assert.rejects(
    validateImages({ ...f, manifest, config: { requireHeaders: false } }),
    /ENOENT/,
  );
});

test("canonical build is browser free, prepares before Hugo and gates finalized output", async () => {
  const pkg = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const steps = pkg.scripts.build.split(" && ");
  assert.ok(
    steps.indexOf("npm run images:prepare") <
      steps.indexOf("npm run build:react"),
  );
  assert.ok(
    steps.findIndex((s) => s.startsWith("hugo ")) <
      steps.indexOf("npm run images:finalize"),
  );
  assert.equal(steps.at(-1), "npm run test:images");
  assert.equal(
    pkg.scripts["test:images"].split(" && ")[0],
    "node scripts/images/cli.mjs validate",
  );
  for (const name of ["pipeline.mjs", "resolver.mjs", "cli.mjs"])
    assert.doesNotMatch(
      await fs.readFile(
        new URL("../scripts/images/" + name, import.meta.url),
        "utf8",
      ),
      /playwright|puppeteer|chromium|child_process/,
    );
});

test("draft bundle stays private; ambiguous mapping and bad priority fail; AVIF decodes", async (t) => {
  const f = await fixture(t);
  await f.image("a.png", 100, true);
  await sharp(path.join(f.root, "static/a.png"))
    .avif()
    .toFile(path.join(f.root, "static/a.avif"));
  const bundle = path.join(f.root, "content/blog/draft");
  await fs.mkdir(bundle, { recursive: true });
  await fs.writeFile(
    path.join(bundle, "index.md"),
    "---\ntitle: Hidden\ndate: 2026-01-01\ndraft: true\n---\n",
  );
  await fs.copyFile(
    path.join(f.root, "static/a.png"),
    path.join(bundle, "private.png"),
  );
  const m = await prepareImages(f);
  assert.equal(
    m.images["/blog/2026-01-01/draft/private.png"].reason,
    "unpublished bundle",
  );
  assert.equal(
    m.images["/blog/2026-01-01/draft/private.png"].variants.length,
    0,
  );
  assert.throws(
    () => resolveImage(m, "/blog/2026-01-01/draft/private.png"),
    /Excluded/,
  );
  assert.equal(m.images["/a.avif"].width, 100);
  assert.equal(
    resolveImage(m, "https://lindsaybrunner.com/a.png?v=1#x").sourceUrl,
    "/a.png?v=1#x",
  );
  assert.equal(
    resolveImage(m, "../a.png", { documentUrl: "/folder/" }).width,
    100,
  );
  assert.throws(
    () => resolveImage(m, "../../a.png", { documentUrl: "/folder/" }),
    /escape/,
  );
  assert.throws(
    () => resolveImage(m, "/a.png", { loading: "lazy", fetchPriority: "high" }),
    /cannot be lazy/,
  );
  await fs.writeFile(
    path.join(bundle, "index.md"),
    "---\nurl: /ambiguous.html\n---\n",
  );
  await assert.rejects(prepareImages(f), /Ambiguous/);
  await assert.rejects(
    validateImages({
      ...f,
      manifest: m,
      config: { budgetExceptions: [{ sourceUrl: "*" }] },
    }),
    /Invalid or expired/,
  );
});
