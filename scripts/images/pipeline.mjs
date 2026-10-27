import { discoverRuntimeSources } from "./runtime-sources.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { parse, serialize } from "parse5";
import yaml from "js-yaml";
import { imageConfig, profiles } from "./config.mjs";
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
    const parsedData = yaml.load(fm[1]);
    if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData))
      throw new Error(`Unsupported bundle front matter: ${index}`);
    const data = Object.fromEntries(Object.entries(parsedData).map(([k, v]) => [k.toLowerCase(), v]));
    // Bounded leaf-bundle support: never guess inherited visibility/build rules.
    if (data.cascade || data.build || data._build || data.headless || data.resources)
      throw new Error(`Unsupported bundle build/publication mapping: ${index}`);
    for (let ancestor = path.dirname(dir); ancestor.startsWith(path.join(root, "content")); ancestor = path.dirname(ancestor)) {
      const branch = path.join(ancestor, "_index.md");
      let parentText;
      try { parentText = await fs.readFile(branch, "utf8"); }
      catch (e) { if (e.code === "ENOENT") continue; throw e; }
      const parentFm = parentText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!parentFm) throw new Error(`Unsupported inherited bundle front matter: ${branch}`);
      const parentData = yaml.load(parentFm[1]) || {};
      if (Object.keys(parentData).some(k => ["cascade", "build", "_build", "draft", "publishdate", "expirydate", "headless"].includes(k.toLowerCase())))
        throw new Error(`Unsupported inherited cascade/publication mapping: ${branch}`);
    }
    const publication = data.publishdate ?? data.pubdate ?? data.date;
    const expiry = data.expirydate;
    for (const date of [publication, expiry].filter(v => v != null))
      if (Number.isNaN(new Date(date).getTime())) throw new Error(`Invalid bundle publication date: ${index}`);
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
        (publication && new Date(publication).getTime() > Date.now()) ||
        (expiry && new Date(expiry).getTime() <= Date.now()),
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
  const runtimeSources = await discoverRuntimeSources(root, manifest);
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
function imageCandidates(node) {
  return [
    ...(attr(node, "src") ? [{ url: attr(node, "src"), fallback: true }] : []),
    ...parseSrcset(attr(node, "srcset")),
  ];
}
function candidateOwner(manifest, url, effective) {
  const pathname = canonicalImageUrl(url, effective).pathname;
  candidateEntry(manifest, url, effective);
  return manifest.images[pathname] || Object.values(manifest.images).find(e => e.variants.some(v => v.url === pathname));
}
// Density sets are supported only when every candidate has the same intrinsic
// CSS dimensions and exact decoded dimensions exist in the target ladder.
function densityDimensions(candidates, manifest, effective) {
  if (!candidates.some(c => c.unit === "x")) return null;
  if (candidates.some(c => c.unit !== "x") || new Set(candidates.map(c => c.value)).size !== candidates.length)
    throw new Error(`Unsupported density descriptors in ${effective}`);
  const dimensions = candidates.map(c => {
    const v = candidateEntry(manifest, c.url, effective);
    return { width: v.width / c.value, height: v.height / c.value };
  });
  const first = dimensions[0];
  if (!Number.isInteger(first.width) || !Number.isInteger(first.height) ||
      dimensions.some(d => d.width !== first.width || d.height !== first.height))
    throw new Error(`Unsupported density intrinsic dimensions in ${effective}`);
  return first;
}
function presentationDimensions(node, intrinsic) {
  const width = attr(node, "width"), height = attr(node, "height");
  for (const value of [width, height])
    if (value !== undefined && (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))))
      throw new Error("Unsupported image presentation dimension");
  return {
    width: width || (height ? Math.max(1, Math.round(Number(height) * intrinsic.width / intrinsic.height)) : intrinsic.width),
    height: height || (width ? Math.max(1, Math.round(Number(width) * intrinsic.height / intrinsic.width)) : intrinsic.height),
  };
}
function verifyFinalized(node, manifest, effective) {
  const marker = attr(node, "data-image-source");
  const entry = marker && manifest.images[canonicalImageUrl(marker, effective).pathname];
  if (!entry) throw new Error(`Invalid image completion marker: ${marker}`);
  if (!profiles[attr(node, "data-image-profile")]) throw new Error(`Invalid finalized image profile: ${marker}`);
  candidateEntry(manifest, marker, effective);
  validateSrcset(manifest, attr(node, "srcset"), effective);
  for (const c of imageCandidates(node)) {
    const pathname = canonicalImageUrl(c.url, effective).pathname;
    if (candidateOwner(manifest, c.url, effective) !== entry ||
        (entry.disposition === "raster" && !entry.variants.some(v => v.url === pathname)))
      throw new Error(`Image marker membership/unfinalized candidate: ${c.url} for ${marker}`);
    const type = attr(node, "type");
    const variant = entry.variants.find(v => v.url === pathname);
    if (type && variant && type !== `image/${variant.format}`)
      throw new Error(`Image format/type mismatch: ${c.url}`);
  }
  if (entry.disposition === "raster") {
    const fail = () => { throw new Error(`Incomplete finalized image presentation: ${marker}`); };
    const selected = parseSrcset(attr(node, "srcset"));
    if (!selected.length) fail();
    const density = densityDimensions(selected, manifest, effective);
    if (!density) {
      if (!attr(node, "sizes")?.trim() || selected.some(c => c.unit !== "w")) fail();
      const format = candidateEntry(manifest, selected[0].url, effective).format;
      const expected = new Set(entry.variants.filter(v => v.format === format).map(v => v.width));
      if (selected.length !== expected.size || new Set(selected.map(c => c.value)).size !== expected.size ||
          selected.some(c => !expected.has(c.value) || candidateEntry(manifest, c.url, effective).format !== format)) fail();
    }
    if (node.tagName === "img") {
      if (!attr(node, "src") || !attr(node, "loading")) fail();
      const native = attr(node, "data-image-native-dimensions");
      if (native !== undefined) {
        // Record exactly which authored attributes remain. This is a distinct
        // completion shape, not permission to accept a partially stripped img.
        const shape = [attr(node, "width") !== undefined ? "width" : "", attr(node, "height") !== undefined ? "height" : ""].filter(Boolean).join("-") || "none";
        if (native !== shape || !["none", "width", "height", "width-height"].includes(native)) fail();
      } else if (!attr(node, "width") || !attr(node, "height")) fail();
      presentationDimensions(node, density || entry);
      const d = resolveImage(manifest, marker, {
        profile: attr(node, "data-image-profile"), loading: attr(node, "loading"), fetchPriority: attr(node, "fetchpriority"),
      });
      if (d.fetchPriority && attr(node, "fetchpriority") !== d.fetchPriority) fail();
    }
  }
  return entry;
}
function optimizeNode(node, manifest, effective, profile, config) {
  if (attr(node, "data-image-source")) {
    verifyFinalized(node, manifest, effective);
    return;
  }
  const candidates = imageCandidates(node);
  validateSrcset(manifest, attr(node, "srcset"), effective);
  const source = candidates[0]?.url;
  if (!source) return;
  const authoredOwner = (url) => {
    const owner = candidateOwner(manifest, url, effective);
    const alias = config.authoredSourceAliases?.[owner.sourceUrl];
    if (!alias) return owner;
    const target = manifest.images[alias.target];
    if (typeof alias !== "object" || !/^[a-f0-9]{64}$/.test(alias.sourceSha256 || "") ||
        !/^[a-f0-9]{64}$/.test(alias.targetSha256 || "") ||
        owner.sourceSha256 !== alias.sourceSha256 || target?.sourceSha256 !== alias.targetSha256)
      throw new Error(`Authored image alias hash drift; review pair again: ${owner.sourceUrl}`);
    if (!target || target.disposition !== "raster" || owner.disposition !== "raster" ||
        owner.width > target.width || Math.abs(owner.height / owner.width - target.height / target.width) > 1 / owner.width)
      throw new Error(`Invalid authored image alias: ${owner.sourceUrl}`);
    return target;
  };
  const entry = authoredOwner(source);
  if (candidates.some(c => authoredOwner(c.url) !== entry))
    throw new Error(`Unsupported art direction in ${effective} <${node.tagName}> candidate set`);
  const authored = parseSrcset(attr(node, "srcset"));
  const density = densityDimensions(authored, manifest, effective);
  const intrinsic = candidateEntry(manifest, source, effective);
  const widthSet = authored.length > 0 && !density;
  const picture = node.parentNode?.tagName === "picture";
  // A width set's default source size is 100vw, not our body profile. Its
  // density-corrected natural dimensions vary with the viewport. Picture img
  // dimensions also belong to the selected branch, not the fallback file.
  const nativeDimensions = picture || widthSet;
  const sizes = picture && !authored.length ? `${intrinsic.width}px` :
    attr(node, "sizes") || (widthSet ? "100vw" : undefined);
  const d = resolveImage(manifest, entry.sourceUrl, {
    documentUrl: effective, profile, sizes,
    loading: attr(node, "loading"), fetchPriority: attr(node, "fetchpriority"),
  });
  // Retain version/hash identity on authored original URLs.
  const original = canonicalImageUrl(source, effective);
  set(node, "data-image-source", original.pathname === entry.sourceUrl ? original.sourceUrl : entry.sourceUrl);
  set(node, "data-image-profile", profile);
  if (node.tagName === "img") {
    const dimensions = presentationDimensions(node, density || intrinsic);
    if (nativeDimensions) {
      set(node, "data-image-native-dimensions", [attr(node, "width") !== undefined ? "width" : "", attr(node, "height") !== undefined ? "height" : ""].filter(Boolean).join("-") || "none");
    } else {
      set(node, "width", dimensions.width);
      set(node, "height", dimensions.height);
    }
    set(node, "loading", d.loading);
    if (d.fetchPriority) set(node, "fetchpriority", d.fetchPriority);
    set(node, "src", d.src);
  }
  if (d.webpSrcSet) {
    const type = attr(node, "type");
    const format = type ? type.replace(/^image\//, "") : "webp";
    const available = entry.variants.filter(v => v.format === format);
    if (!available.length) throw new Error(`Unsupported picture format ${type} in ${effective}`);
    if (density) {
      // Never round pixels while retaining density labels.
      set(node, "srcset", authored.map(c => {
        const original = candidateEntry(manifest, c.url, effective);
        const v = available.find(v => v.width === original.width && v.height === original.height);
        if (!v) throw new Error(`Unsupported density candidate: exact dimensions absent from ladder: ${c.url}`);
        return `${v.url} ${c.value}x`;
      }).join(", "));
    } else {
      const byWidth = new Map();
      for (const v of available) if (!byWidth.has(v.width)) byWidth.set(v.width, v);
      const unique = [...byWidth.values()];
      set(node, "srcset", unique.map(v => `${v.url} ${v.width}w`).join(", "));
      set(node, "sizes", d.sizes);
    }
  }
}
export function transformHtml({ html, documentUrl = "/", manifest, config = {} }) {
  config = { ...imageConfig, ...config };
  const doc = parse(html);
  const list = nodes(doc);
  const base = attr(list.find(n => n.tagName === "base") || {}, "href");
  const effective = base ? new URL(base, new URL(documentUrl, imageConfig.origin)).href : documentUrl;
  const usages = [];
  for (const node of list.filter(n => n.tagName === "img")) {
    const src = attr(node, "src");
    if (/^data:image\/gif;base64,R0lGODlhAQABA/.test(src || "")) {
      if (attr(node, "srcset")) throw new Error(`Placeholder has network candidates: ${effective}`);
      usages.push({ sourceUrl: src, reason: "one-pixel dialog placeholder" });
      continue;
    }
    const profile = attr(node, "data-image-profile") || inferredProfile(node, documentUrl);
    optimizeNode(node, manifest, effective, profile, config);
    const picture = node.parentNode?.tagName === "picture" ? node.parentNode : null;
    if (picture) for (const source of picture.childNodes.filter(n => n.tagName === "source"))
      optimizeNode(source, manifest, effective, profile, config);
    if (attr(node, "data-image-source")) usages.push({ sourceUrl: attr(node, "data-image-source"), profile });
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
      if (imageCandidates(n).length && !/^data:image\/gif;base64,R0lGODlhAQABA/.test(src || "")) {
        if (!attr(n, "data-image-source")) throw new Error(`Unfinalized image: ${file}: ${src || attr(n, "srcset")}`);
        verifyFinalized(n, manifest, effective);
      }
      if (/^data:image\/gif;base64,R0lGODlhAQABA/.test(src || "") && attr(n, "srcset"))
        throw new Error(`Placeholder has network candidates: ${file}`);
      validateSrcset(manifest, attr(n, "srcset"), effective);
      for (const candidate of imageCandidates(n)) {
        if (/^data:image\/gif;base64,R0lGODlhAQABA/.test(candidate.url)) continue;
        const variant = candidateEntry(manifest, candidate.url, effective);
        // Fallback img src has a separate format cost; selected source sets are gated.
        if (!variant.sha256 || (candidate.fallback && attr(n, "srcset") && variant.format !== "webp")) continue;
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
            : profile === "thumbnail" && variant.width <= 1200
              ? variant.width <= 640 ? 100000 : 250000
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
