import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { parse, serialize } from "parse5";
import yaml from "js-yaml";
import { imageConfig } from "./config.mjs";
import { canonicalImageUrl, resolveImage, parseSrcset } from "./resolver.mjs";
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
const image = /\.(png|jpe?g|webp|avif|gif|svg)$/i;
const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
function set(n, k, v) {
  n.attrs ||= [];
  const a = n.attrs.find((a) => a.name === k);
  if (a) a.value = String(v);
  else n.attrs.push({ name: k, value: String(v) });
}
function nodes(node) {
  return [
    node,
    ...(node.childNodes || []).flatMap(nodes),
    ...(node.content ? nodes(node.content) : []),
  ];
}
async function walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
  const out = [];
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink())
      throw new Error(`Unsupported image-root symlink: ${p}`);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
async function write(file, bytes) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, bytes);
}
function localPath(root, url) {
  const decoded = decodeURIComponent(url);
  const file = path.resolve(root, "." + decoded);
  if (!file.startsWith(path.resolve(root) + path.sep))
    throw new Error(`Path escape: ${url}`);
  return file;
}
async function atomic(file, bytes) {
  const tmp = file + `.${process.pid}.${crypto.randomUUID()}.tmp`;
  await write(tmp, bytes);
  await fs.rename(tmp, file);
}
function options(input) {
  const root = path.resolve(input.root || process.cwd());
  return {
    ...input,
    root,
    generatedDir: input.generatedDir || path.join(root, ".generated/images"),
    cacheDir: input.cacheDir || path.join(root, ".cache/image-optimization"),
    publishDir: input.publishDir || path.join(root, "public"),
    config: { ...imageConfig, ...input.config },
  };
}
async function sources(root) {
  const result = [];
  for (const file of await walk(path.join(root, "static"))) {
    if (!image.test(file)) continue;
    const rel = path
      .relative(path.join(root, "static"), file)
      .split(path.sep)
      .join("/");
    result.push({
      file,
      url: "/" + rel.split("/").map(encodeURIComponent).join("/"),
      excluded: rel.startsWith("images/social/working-files/"),
    });
  }
  for (const file of await walk(path.join(root, "content"))) {
    if (!image.test(file)) continue;
    const dir = path.dirname(file),
      index = path.join(dir, "index.md");
    let text;
    try {
      text = await fs.readFile(index, "utf8");
    } catch {
      throw new Error(
        `Ambiguous Hugo bundle mapping (register explicit URL): ${file}`,
      );
    }
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) throw new Error(`Unsupported bundle front matter: ${index}`);
    const data = yaml.load(fm[1]);
    const rel = path.relative(path.join(root, "content"), dir).split(path.sep);
    let base;
    if (data.url && /^\/(?!\/).*\/$/.test(data.url))
      base = data.url.replace(/\/?$/, "/");
    else if (
      !data.url &&
      ["blog", "recipes"].includes(rel[0]) &&
      rel.length === 2 &&
      data.date &&
      !data.aliases &&
      !data.type &&
      !data.path
    ) {
      const date = new Date(data.date);
      if (Number.isNaN(+date)) throw new Error(`Invalid bundle date: ${index}`);
      base = `/${rel[0]}/${date.toISOString().slice(0, 10)}/${data.slug || rel[1]}/`;
    } else if (rel.length === 1 && !data.url && !data.slug && !data.type)
      base = `/${rel[0]}/`;
    else throw new Error(`Ambiguous Hugo bundle permalink: ${index}`);
    result.push({
      file,
      url: canonicalImageUrl(base + encodeURIComponent(path.basename(file)))
        .pathname,
      excluded:
        data.draft === true ||
        (data.date && new Date(data.date).getTime() > Date.now()),
      exclusionReason: "unpublished bundle",
    });
  }
  return result.sort((a, b) => a.url.localeCompare(b.url));
}
export async function prepareImages(input = {}) {
  const { root, generatedDir, cacheDir, config } = options(input);
  const all = await sources(root);
  const manifest = {
    version: 1,
    policyVersion: config.policyVersion,
    encoder: { sharp: sharp.versions.sharp, vips: sharp.versions.vips },
    images: {},
  };
  await fs.rm(generatedDir, { recursive: true, force: true });
  await fs.mkdir(cacheDir, { recursive: true });
  let cursor = 0;
  const entries = new Map();
  async function processSource(source) {
    const bytes = await fs.readFile(source.file);
    let meta;
    try {
      meta = await sharp(bytes, { animated: true }).metadata();
    } catch (e) {
      throw new Error(`Cannot decode ${source.file}: ${e.message}`);
    }
    const rotated = [5, 6, 7, 8].includes(meta.orientation);
    const width = rotated ? meta.height : meta.width;
    const height = rotated ? meta.width : meta.pageHeight || meta.height;
    const animated = (meta.pages || 1) > 1;
    const svg = /\.svg$/i.test(source.file);
    const identity =
      /\/favicons\/|\/(?:favicon[^/]*|apple-touch-icon[^/]*)\./.test(
        source.url,
      );
    const lossless =
      !config.photoSources.includes(source.url) &&
      (/\.png$/i.test(source.file) ||
        /screen|diagram|guideforge|guppi|logos|workshop|enclosure-(?:directions|first-easel)|(?:^|[/-])cad[/-]/.test(
          source.url,
        ));
    const disposition = source.excluded
      ? "identity"
      : svg
        ? "svg"
        : animated
          ? "animated"
          : identity
            ? "identity"
            : "raster";
    const entry = {
      sourcePath: path.relative(root, source.file).split(path.sep).join("/"),
      sourceUrl: source.url,
      sourceSha256: hash(bytes),
      width,
      height,
      bytes: bytes.length,
      format: meta.format,
      hasAlpha: !!meta.hasAlpha,
      animated,
      disposition,
      policy: lossless ? "lossless" : "photo",
      variants: [],
    };
    if (disposition !== "raster")
      entry.reason = source.excluded
        ? source.exclusionReason || "excluded authoring artifact"
        : svg
          ? "vector passthrough"
          : animated
            ? "animation preserved"
            : "icon identity";
    if (disposition === "raster") {
      const widths = [
        ...new Set([
          ...config.widths,
          ...(config.extraWidths[source.url] || []),
          ...(source.url.startsWith("/images/testimonials/")
            ? [64, 128, 256]
            : []),
        ]),
      ].sort((a, b) => a - b);
      const formats = ["webp", entry.hasAlpha || lossless ? "png" : "jpeg"];
      for (const requestedWidth of widths)
        for (const format of formats) {
          const actualWidth = Math.min(width, requestedWidth);
          const encoder = {
            format,
            width: actualWidth,
            quality: config.photoQuality,
            lossless,
            alpha: entry.hasAlpha,
            version: config.policyVersion,
            ...manifest.encoder,
          };
          const key = hash(
            Buffer.concat([bytes, Buffer.from(JSON.stringify(encoder))]),
          );
          const cacheFile = path.join(cacheDir, key + ".bin");
          let encoded;
          try {
            encoded = await fs.readFile(cacheFile);
            const sha = await fs.readFile(cacheFile + ".sha256", "utf8");
            if (hash(encoded) !== sha) encoded = null;
          } catch {
            encoded = null;
          }
          if (!encoded) {
            let transform = sharp(bytes)
              .rotate()
              .resize({ width: actualWidth, withoutEnlargement: true });
            if (format === "webp")
              transform = transform.webp(
                lossless
                  ? { lossless: true }
                  : { quality: config.photoQuality },
              );
            else if (format === "png")
              transform = transform.png({ compressionLevel: 9 });
            else
              transform = transform.jpeg({
                quality: config.photoQuality,
                mozjpeg: true,
              });
            encoded = await transform.toBuffer();
            await atomic(cacheFile, encoded);
            await atomic(cacheFile + ".sha256", hash(encoded));
          }
          const m = await sharp(encoded).metadata();
          const url = `/_img${source.url}/${entry.policy}/${requestedWidth}.${format === "jpeg" ? "jpg" : format}`;
          await write(localPath(generatedDir, url), encoded);
          entry.variants.push({
            url,
            width: m.width,
            height: m.height,
            bytes: encoded.length,
            format,
            sha256: hash(encoded),
            requestedWidth,
          });
        }
    }
    entries.set(source.url, entry);
  }
  const workers = await Promise.allSettled(
    Array.from({ length: config.concurrency }, async () => {
      while (cursor < all.length) {
        const s = all[cursor++];
        await processSource(s);
      }
    }),
  );
  const failure = workers.find((r) => r.status === "rejected");
  if (failure) throw failure.reason;
  for (const s of all) {
    if (manifest.images[s.url])
      throw new Error(`Canonical image collision: ${s.url}`);
    manifest.images[s.url] = entries.get(s.url);
  }
  await atomic(
    path.join(generatedDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  const runtimeSources = all
    .map((s) => s.url)
    .filter(
      (u) =>
        u === "/images/avatar-color-trans.png" ||
        u === "/images/workshop/workshop-shelf.png" ||
        u.startsWith("/images/logos/") ||
        u.startsWith("/images/testimonials/"),
    );
  await atomic(
    path.join(generatedDir, "runtime-manifest.json"),
    JSON.stringify(pickBrowserManifest(manifest, runtimeSources)) + "\n",
  );
  return manifest;
}
function candidateEntry(manifest, url, documentUrl) {
  const normalized = canonicalImageUrl(url, documentUrl);
  if (normalized.external)
    throw new Error(`Unregistered external image: ${url}`);
  const e = manifest.images[normalized.pathname];
  if (e) {
    if (
      ["unpublished bundle", "excluded authoring artifact"].includes(e.reason)
    )
      throw new Error(`Excluded image candidate: ${url}`);
    return e;
  }
  for (const item of Object.values(manifest.images)) {
    const v = item.variants.find((v) => v.url === normalized.pathname);
    if (v) return v;
  }
  throw new Error(`Missing image candidate: ${url}`);
}
function validateSrcset(manifest, value, documentUrl) {
  for (const c of parseSrcset(value)) {
    const e = candidateEntry(manifest, c.url, documentUrl);
    if (c.unit === "w" && e.width !== c.value)
      throw new Error(
        `Image descriptor mismatch: ${c.url} says ${c.value}, decoded ${e.width}`,
      );
  }
}
function inferredProfile(node, documentUrl) {
  if (documentUrl.startsWith("/christmas-2026-lucas/")) {
    if ((attr(node, "class") || "").split(" ").includes("christmas-cover"))
      return "christmas-cover";
    for (let p = node.parentNode; p; p = p.parentNode) {
      if ((attr(p, "class") || "").split(" ").includes("characters"))
        return "christmas-character";
      if ((attr(p, "class") || "").split(" ").includes("bath-gallery"))
        return "christmas-bath";
    }
    return "christmas-product";
  }
  return /width\s*:\s*50%/.test(attr(node, "style") || "")
    ? "half-body"
    : "body";
}
export function transformHtml({
  html,
  documentUrl = "/",
  manifest,
  config = {},
}) {
  const doc = parse(html);
  const list = nodes(doc);
  const base = attr(list.find((n) => n.tagName === "base") || {}, "href");
  const effective = base
    ? new URL(base, new URL(documentUrl, imageConfig.origin)).href
    : documentUrl;
  const usages = [];
  for (const node of list.filter((n) => n.tagName === "img")) {
    const src = attr(node, "src");
    if (!src) continue;
    if (/^data:image\/gif;base64,R0lGODlhAQABA/.test(src)) {
      usages.push({ sourceUrl: src, reason: "one-pixel dialog placeholder" });
      continue;
    }
    if (attr(node, "data-image-source")) {
      candidateEntry(manifest, src, effective);
      validateSrcset(manifest, attr(node, "srcset"), effective);
      continue;
    }
    const profile =
      attr(node, "data-image-profile") || inferredProfile(node, documentUrl);
    const d = resolveImage(manifest, src, {
      documentUrl: effective,
      profile,
      sizes: attr(node, "sizes"),
      loading: attr(node, "loading"),
      fetchPriority: attr(node, "fetchpriority"),
    });
    const existing = attr(node, "srcset");
    if (existing) validateSrcset(manifest, existing, effective);
    // An existing picture's media/type/art direction is authoritative. Validate, never flatten.
    const picture =
      node.parentNode?.tagName === "picture" ? node.parentNode : null;
    if (picture)
      for (const s of picture.childNodes.filter((n) => n.tagName === "source"))
        validateSrcset(manifest, attr(s, "srcset"), effective);
    set(node, "data-image-source", d.sourceUrl);
    set(node, "data-image-profile", profile);
    if (!attr(node, "width")) set(node, "width", d.width);
    if (!attr(node, "height")) set(node, "height", d.height);
    set(node, "loading", d.loading);
    if (d.fetchPriority) set(node, "fetchpriority", d.fetchPriority);
    if (!picture && !existing && d.webpSrcSet) {
      // WebP srcset on img avoids wrappers changing direct-child CSS and runtime structure.
      // Browsers without srcset use the original-format fallback src.
      set(node, "src", d.src);
      set(node, "srcset", d.webpSrcSet);
      set(node, "sizes", d.sizes);
    }
    usages.push({
      sourceUrl: d.sourceUrl,
      profile,
      disposition: d.disposition,
      existingPicture: !!picture,
      existingSrcset: !!existing,
    });
  }
  return { html: serialize(doc), usages };
}
export async function publishImages(input) {
  const { manifest, generatedDir, publishDir } = options(input);
  for (const entry of Object.values(manifest.images))
    for (const v of entry.variants) {
      const bytes = await fs.readFile(localPath(generatedDir, v.url));
      if (hash(bytes) !== v.sha256)
        throw new Error(`Corrupt staged derivative: ${v.url}`);
      await write(localPath(publishDir, v.url), bytes);
    }
}
export async function finalizeHtml(input) {
  const { manifest, publishDir, config } = options(input);
  const usages = [];
  for (const file of await walk(publishDir)) {
    if (!file.endsWith(".html")) continue;
    const documentUrl =
      "/" +
      path
        .relative(publishDir, file)
        .split(path.sep)
        .join("/")
        .replace(/index\.html$/, "");
    const result = transformHtml({
      html: await fs.readFile(file, "utf8"),
      documentUrl,
      manifest,
      config,
    });
    await fs.writeFile(file, result.html);
    usages.push(...result.usages.map((u) => ({ documentUrl, ...u })));
  }
  return usages;
}
export async function validateImages(input) {
  const { manifest, publishDir, config } = options(input);
  let variants = 0,
    images = 0;
  const decoded = new Map();
  const budgets = new Set();
  const usedExceptions = new Set();
  for (const exception of config.budgetExceptions || []) {
    if (
      !exception.owner ||
      !exception.reason ||
      !exception.documentUrl ||
      !exception.sourceUrl ||
      !exception.profile ||
      !exception.width ||
      !exception.maxBytes ||
      JSON.stringify(exception).includes("*") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(exception.reviewDate || "") ||
      exception.reviewDate < new Date().toISOString().slice(0, 10)
    )
      throw new Error("Invalid or expired image budget exception");
  }
  for (const entry of Object.values(manifest.images)) {
    if (
      ["excluded authoring artifact", "unpublished bundle"].includes(
        entry.reason,
      )
    )
      continue;
    const original = await fs.readFile(localPath(publishDir, entry.sourceUrl));
    if (hash(original) !== entry.sourceSha256)
      throw new Error(`Original changed/missing: ${entry.sourceUrl}`);
    const requiresAlpha =
      entry.hasAlpha && !(await sharp(original).stats()).isOpaque;
    for (const v of entry.variants) {
      const bytes = await fs.readFile(localPath(publishDir, v.url));
      if (hash(bytes) !== v.sha256)
        throw new Error(`Derivative hash corrupt: ${v.url}`);
      let meta = decoded.get(v.sha256);
      if (!meta) {
        meta = await sharp(bytes).metadata();
        await sharp(bytes).stats(); // Fully decode once for identical bytes, not merely headers.
        decoded.set(v.sha256, meta);
      }
      if (
        meta.width !== v.width ||
        meta.height !== v.height ||
        bytes.length !== v.bytes ||
        meta.width > entry.width ||
        (requiresAlpha && !meta.hasAlpha)
      )
        throw new Error(`Derivative dimensions/alpha corrupt: ${v.url}`);
      variants++;
    }
  }
  for (const file of await walk(publishDir)) {
    if (!file.endsWith(".html")) continue;
    const documentUrl =
      "/" + path.relative(publishDir, file).split(path.sep).join("/");
    const doc = parse(await fs.readFile(file, "utf8"));
    const list = nodes(doc);
    if (documentUrl === "/christmas-2026-lucas/index.html") {
      const robots =
        attr(
          list.find(
            (n) => n.tagName === "meta" && attr(n, "name") === "robots",
          ) || {},
          "content",
        ) || "";
      if (
        !["noindex", "nofollow", "noarchive"].every((token) =>
          robots.split(/[,\s]+/).includes(token),
        )
      )
        throw new Error("Christmas page robots policy missing");
    }
    const base = attr(list.find((n) => n.tagName === "base") || {}, "href");
    const effective = base
      ? new URL(base, new URL(documentUrl, imageConfig.origin)).href
      : documentUrl;
    for (const n of list.filter(
      (n) =>
        n.tagName === "img" ||
        (n.tagName === "source" && n.parentNode?.tagName === "picture"),
    )) {
      const src = attr(n, "src");
      if (src && !/^data:image\/gif;base64,R0lGODlhAQABA/.test(src)) {
        candidateEntry(manifest, src, effective);
        images++;
      }
      validateSrcset(manifest, attr(n, "srcset"), effective);
      for (const candidate of parseSrcset(attr(n, "srcset"))) {
        const variant = candidateEntry(manifest, candidate.url, effective);
        if (variant.format !== "webp" || !variant.sha256) continue;
        const source = attr(n, "data-image-source");
        const entry = source
          ? manifest.images[canonicalImageUrl(source, effective).pathname]
          : null;
        if (!entry) continue;
        const profile = attr(n, "data-image-profile");
        const limit =
          entry.policy === "lossless"
            ? variant.width <= 1600
              ? 1000000
              : 2000000
            : profile === "christmas-cover"
              ? variant.width <= 800
                ? 150000
                : variant.width <= 1600
                  ? 300000
                  : 600000
              : variant.width <= 1600
                ? 400000
                : 800000;
        const exception = (config.budgetExceptions || []).find(
          (e) =>
            e.sourceUrl === source &&
            e.documentUrl === documentUrl.replace(/index\.html$/, "") &&
            e.profile === profile &&
            e.width === variant.width,
        );
        if (exception) usedExceptions.add(exception);
        if (variant.bytes > (exception?.maxBytes || limit))
          throw new Error(
            `Image budget exceeded: ${candidate.url}: ${variant.bytes} > ${limit}; review quality/policy before changing limits`,
          );
        budgets.add(candidate.url);
      }
      if (attr(n, "loading") === "lazy" && attr(n, "fetchpriority") === "high")
        throw new Error(`Lazy high-priority image: ${file}`);
      if (
        n.tagName === "img" &&
        src &&
        !src.startsWith("data:") &&
        !attr(n, "data-image-source")
      )
        throw new Error(`Unfinalized image: ${file}: ${src}`);
    }
  }
  if (config.requireHeaders) {
    const headers = await fs.readFile(
      path.join(publishDir, "_headers"),
      "utf8",
    );
    const block =
      headers.match(/^\/_img\/\*\n((?:[ \t]+[^\n]*\n?)+)/m)?.[1] || "";
    if (
      !block.includes("Cache-Control: public, max-age=0, must-revalidate") ||
      !block.includes(
        "Netlify-CDN-Cache-Control: public, max-age=0, must-revalidate",
      )
    )
      throw new Error("Derivative browser/CDN revalidation missing");
    if (
      !headers.includes(
        "/_img/christmas-2026-lucas/*\n  X-Robots-Tag: noindex, nofollow, noarchive",
      )
    )
      throw new Error("Christmas derivative noindex missing");
  }
  return {
    images,
    variants,
    budgetedCandidates: budgets.size,
    budgetExceptions: [...usedExceptions],
  };
}

// Build-time selection: never import the full encoding manifest into a browser bundle.
export function pickBrowserManifest(manifest, sourceUrls) {
  const images = {};
  for (const url of sourceUrls) {
    const e = manifest.images[url];
    if (!e) throw new Error(`Missing runtime image: ${url}`);
    images[url] = {
      sourceUrl: e.sourceUrl,
      width: e.width,
      height: e.height,
      hasAlpha: e.hasAlpha,
      disposition: e.disposition,
      policy: e.policy,
      variants: e.variants.map(({ url, width, height, format }) => ({
        url,
        width,
        height,
        format,
      })),
    };
  }
  return { version: manifest.version, images };
}
