import { useLayoutEffect, useRef, type ImgHTMLAttributes } from "react";
import manifest from "../../.generated/images/runtime-manifest.json";
import { resolveImage, type BrowserManifest } from "../../scripts/images/resolver.mjs";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  src: string;
  profile?: string;
};

// The same descriptor and WebP srcset are used by the final HTML transform.
// Intrinsic dimensions reserve space. For proportional CSS width changes, pair
// w-full/max-width with h-auto (height: auto); explicit height/crop classes such
// as h-full object-cover remain the caller's layout contract.
export function ResponsiveImage({ src, profile = "body", sizes, loading, fetchPriority, ...props }: Props) {
  const image = resolveImage(manifest as BrowserManifest, src, { profile, sizes, loading, fetchPriority });
  return <img {...props} src={image.src} srcSet={image.webpSrcSet}
    sizes={image.sizes} loading={image.loading} fetchPriority={image.fetchPriority}
    width={props.width ?? image.width} height={props.height ?? image.height}
    data-image-source={image.sourceUrl} data-image-profile={profile} />;
}

// Reuse a loaded Hugo image during createRoot takeover. A replacement DOM image
// can fetch identical bytes again when the response is not cacheable.
type RetainedProps = Pick<Props, "src" | "profile" | "alt" | "className"> & {
  fallbackImage: HTMLImageElement | null;
};

export function RetainedResponsiveImage({ fallbackImage, ...props }: RetainedProps) {
  const image = resolveImage(manifest as BrowserManifest, props.src, { profile: props.profile });
  const attributes: Record<string, string | undefined> = {
    src: image.src, srcset: image.webpSrcSet, sizes: image.sizes,
    loading: image.loading, fetchpriority: image.fetchPriority,
    width: String(image.width), height: String(image.height),
    "data-image-source": image.sourceUrl, "data-image-profile": props.profile ?? "body",
  };
  // Never adopt a stale/different descriptor. The ordinary adapter remains the
  // safe fallback for an absent or incompatible server-rendered image.
  if (!fallbackImage || !Object.entries(attributes).every(([key, value]) =>
    fallbackImage.getAttribute(key) === (value ?? null))) {
    return <ResponsiveImage {...props} />;
  }
  return <RetainedImage image={fallbackImage} alt={props.alt} className={props.className} />;
}

function RetainedImage({ image, alt, className }: {
  image: HTMLImageElement; alt?: string; className?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const container = host.current;
    if (!container) return;
    image.alt = alt ?? "";
    image.className = className ?? "";
    container.appendChild(image);
    return () => {
      // StrictMode may replay this effect. Keep the same image object, and
      // only detach it if this host still owns it; never reset source attrs.
      if (image.parentNode === container) container.removeChild(image);
    };
  }, [image, alt, className]);
  return <span ref={host} style={{ display: "contents" }} data-image-react-host="retained" />;
}
