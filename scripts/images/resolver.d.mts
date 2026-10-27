export type Variant = {
  url: string;
  width: number;
  height: number;
  format: string;
};
export type BrowserEntry = {
  sourceUrl: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  disposition: "raster" | "svg" | "animated" | "identity";
  policy: string;
  variants: Variant[];
};
export type BrowserManifest = {
  version: number;
  images: Record<string, BrowserEntry>;
};
export type ImageOptions = {
  documentUrl?: string;
  origin?: string;
  profile?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
};
export type ImageDescriptor = {
  sourceUrl: string;
  width: number;
  height: number;
  src: string;
  srcSet?: string;
  webpSrcSet?: string;
  sizes: string;
  loading: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  disposition: BrowserEntry["disposition"];
};
export function resolveImage(
  manifest: BrowserManifest,
  sourceUrl: string,
  options?: ImageOptions,
): ImageDescriptor;
export function canonicalImageUrl(
  value: string,
  documentUrl?: string,
  origin?: string,
): {
  pathname?: string;
  sourceUrl: string;
  external: boolean;
  placeholder?: boolean;
};
export function parseSrcset(
  value?: string,
): Array<{ url: string; value: number; unit: string }>;
