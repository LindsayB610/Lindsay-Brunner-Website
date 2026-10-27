import { resolveImage, type BrowserManifest, type ImageOptions } from "../../scripts/images/resolver.mjs";

export function setResponsiveImage(image: HTMLImageElement, manifest: BrowserManifest, source: string, options: ImageOptions = {}) {
  const descriptor = resolveImage(manifest, source, { documentUrl: image.ownerDocument.baseURI, ...options });
  const picture = image.closest("picture");
  picture?.querySelectorAll("source").forEach((node) => node.remove());
  for (const attribute of ["srcset", "sizes", "fetchpriority"]) image.removeAttribute(attribute);
  image.width = descriptor.width;
  image.height = descriptor.height;
  image.loading = descriptor.loading;
  if (descriptor.fetchPriority) image.fetchPriority = descriptor.fetchPriority;
  image.sizes = descriptor.sizes;
  if (descriptor.webpSrcSet) image.srcset = descriptor.webpSrcSet;
  image.src = descriptor.src;
  image.dataset.imageSource = descriptor.sourceUrl;
  image.dataset.imageProfile = options.profile || "body";
  return descriptor;
}
