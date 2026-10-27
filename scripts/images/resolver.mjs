// Browser safe: imported by the HTML finalizer and task03's consumer adapters.
import { imageOrigin, profiles } from "./config.mjs";
export function canonicalImageUrl(
  value,
  documentUrl = "/",
  origin = imageOrigin,
) {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Missing image URL");
  if (/^data:image\//i.test(value))
    return { external: true, placeholder: true, sourceUrl: value };
  // Check before WHATWG URL normalizes away traversal. Decode exactly once.
  const rawPath = value.split(/[?#]/)[0];
  for (const segment of rawPath.split("/")) {
    let decoded;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      throw new Error(`Malformed encoding: ${value}`);
    }
    if ((decoded === ".." && segment !== "..") || /[\\/\0]/.test(decoded))
      throw new Error(`Image path escape: ${value}`);
  }
  const base = new URL(documentUrl, origin);
  // Ordinary ../ is valid within a root, but climbing above it is not.
  const localRaw = rawPath.replace(/^https?:\/\/[^/]+/i, "");
  const depth = localRaw.startsWith("/")
    ? []
    : base.pathname
        .split("/")
        .filter(Boolean)
        .slice(0, base.pathname.endsWith("/") ? undefined : -1);
  for (const segment of localRaw.split("/")) {
    if (segment === "..") {
      if (!depth.length) throw new Error(`Image path escape: ${value}`);
      depth.pop();
    } else if (segment && segment !== ".") depth.push(segment);
  }
  const url = new URL(value, base);
  if (url.origin !== origin || !/^https?:$/.test(url.protocol))
    return { external: true, sourceUrl: url.href };
  for (const key of url.searchParams.keys())
    if (!["v", "ver", "version"].includes(key))
      throw new Error(`Unsupported image query: ${value}`);
  const pathname = url.pathname
    .split("/")
    .map((s) => encodeURIComponent(decodeURIComponent(s)))
    .join("/");
  return {
    pathname,
    sourceUrl: pathname + url.search + url.hash,
    external: false,
  };
}
export function parseSrcset(value) {
  if (!value) return [];
  return value.split(",").map((part) => {
    const match = part.trim().match(/^(\S+)\s+([1-9]\d*)(w|x)$/);
    if (!match) throw new Error(`Unsupported srcset candidate: ${part}`);
    return { url: match[1], value: Number(match[2]), unit: match[3] };
  });
}
export function resolveImage(manifest, sourceUrl, options = {}) {
  const normalized = canonicalImageUrl(
    sourceUrl,
    options.documentUrl,
    options.origin,
  );
  if (normalized.external)
    throw new Error(
      `External/placeholder image needs explicit policy: ${sourceUrl}`,
    );
  const entry = manifest.images[normalized.pathname];
  if (!entry)
    throw new Error(`Missing image in manifest: ${normalized.pathname}`);
  if (
    ["unpublished bundle", "excluded authoring artifact"].includes(entry.reason)
  )
    throw new Error(`Excluded image source: ${sourceUrl}`);
  const profile = profiles[options.profile || "body"];
  if (!profile) throw new Error(`Unknown image profile: ${options.profile}`);
  const fetchPriority = options.fetchPriority || profile.fetchPriority;
  const loading =
    options.loading || (fetchPriority === "high" ? "eager" : profile.loading);
  if (
    !["eager", "lazy"].includes(loading) ||
    (fetchPriority && !["auto", "high", "low"].includes(fetchPriority))
  )
    throw new Error("Invalid loading or fetchPriority");
  if (fetchPriority === "high" && loading === "lazy")
    throw new Error("High-priority image cannot be lazy");
  const descriptor = {
    sourceUrl: normalized.sourceUrl,
    width: entry.width,
    height: entry.height,
    src: normalized.sourceUrl,
    sizes: options.sizes || profile.sizes,
    loading,
    ...(fetchPriority ? { fetchPriority } : {}),
    disposition: entry.disposition,
  };
  if (entry.disposition !== "raster") return descriptor;
  const candidates = (format) => {
    const unique = new Map();
    for (const v of entry.variants)
      if (v.format === format && !unique.has(v.width)) unique.set(v.width, v);
    return [...unique.values()].sort((a, b) => a.width - b.width);
  };
  const webps = candidates("webp");
  const fallback = candidates(
    entry.hasAlpha || entry.policy === "lossless" ? "png" : "jpeg",
  );
  const srcset = (values) =>
    values.map((v) => `${v.url} ${v.width}w`).join(", ");
  if (!fallback.length || !webps.length)
    throw new Error(`Missing variants: ${sourceUrl}`);
  descriptor.src =
    fallback.find((v) => v.width >= 800)?.url || fallback.at(-1).url;
  descriptor.srcSet = srcset(fallback);
  descriptor.webpSrcSet = srcset(webps);
  return descriptor;
}
