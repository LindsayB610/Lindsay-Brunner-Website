// Stable source families are independent of the current page's presentation role.
export const imageConfig = {
  origin: "https://lindsaybrunner.com",
  policyVersion: "1",
  concurrency: 2,
  widths: [320, 480, 640, 800, 1200, 1600, 2400],
  photoQuality: 85,
  // PNG is conservatively lossless unless explicitly registered as photographic art.
  photoSources: [
    "/christmas-2026-lucas/lucas-christmas-2026-v2-og-1200x630.png",
  ],
  extraWidths: {
    "/images/avatar-color-trans.png": [160],
    "/images/logos/parasail.png": [64, 128, 256],
  },
  // Explicit same-art authored resize pairs; never infer identity from filenames.
  authoredSourceAliases: {
    "/images/blog/codex-usage-display/cad-exact-assembly-800.webp":
      "/images/blog/codex-usage-display/cad-exact-assembly.webp",
    "/images/blog/codex-usage-display/device-depth-800.webp":
      "/images/blog/codex-usage-display/device-depth.webp",
    "/images/blog/codex-usage-display/enclosure-directions-800.webp":
      "/images/blog/codex-usage-display/enclosure-directions.webp",
    "/images/blog/codex-usage-display/final-in-situ-close-800.webp":
      "/images/blog/codex-usage-display/final-in-situ-close.webp",
    "/images/blog/codex-usage-display/final-side-profile-800.webp":
      "/images/blog/codex-usage-display/final-side-profile.webp",
    "/images/blog/codex-usage-display/final-three-quarter-800.webp":
      "/images/blog/codex-usage-display/final-three-quarter.webp",
    "/images/blog/codex-usage-display/first-print-parts-800.webp":
      "/images/blog/codex-usage-display/first-print-parts.webp",
    "/images/blog/codex-usage-display/magnet-installation-800.webp":
      "/images/blog/codex-usage-display/magnet-installation.webp",
    "/images/blog/codex-usage-display/magnets-and-backplate-800.webp":
      "/images/blog/codex-usage-display/magnets-and-backplate.webp",
    "/images/blog/codex-usage-display/v2-spaghetti-800.webp":
      "/images/blog/codex-usage-display/v2-spaghetti.webp",
    "/images/blog/codex-usage-display/v3-leg-contact-800.webp":
      "/images/blog/codex-usage-display/v3-leg-contact.webp",
  },
  budgetExceptions: [
    {
      sourceUrl: "/images/pork-shoulder-two-pieces-new.jpg",
      documentUrl:
        "/recipes/2026-01-14/recipe-sous-vide-pulled-pork-arbys-bbq/",
      profile: "body",
      width: 1600,
      maxBytes: 401000,
      owner: "Website maintenance",
      reviewedOn: "2026-10-27",
      reviewDate: "2026-11-27",
      reason:
        "Measured q85 output is 400438 bytes, 438 bytes over the provisional ceiling. Preserve approved photo quality; no encoder reduction.",
    },
  ],
  requireHeaders: true,
};
export const profiles = {
  body: {
    sizes:
      "(max-width: 480px) calc(100vw - 32px), (max-width: 800px) calc(100vw - 48px), 752px",
    loading: "lazy",
  },
  "half-body": {
    sizes:
      "(max-width: 480px) calc((100vw - 32px) / 2), (max-width: 800px) calc((100vw - 48px) / 2), 376px",
    loading: "lazy",
  },
  "christmas-cover": {
    sizes: "(max-width: 1180px) 100vw, 1180px",
    loading: "eager",
    fetchPriority: "high",
  },
  "christmas-product": {
    sizes:
      "(max-width: 650px) calc(100vw - 88px), (max-width: 900px) calc((100vw - 208px) / 2), calc((min(100vw, 1180px) - 244px) / 2)",
    loading: "lazy",
  },
  // Content pixels after border/card/image padding. Character image padding is 10px;
  // bath image padding is 24px (20px mobile). No wrapper alters those CSS rules.
  "christmas-character": {
    sizes:
      "(max-width: 650px) calc(100vw - 104px), (max-width: 900px) calc((100vw - 218px) / 2), calc((min(100vw, 1180px) - 334px) / 3)",
    loading: "lazy",
  },
  "christmas-bath": {
    sizes:
      "(max-width: 650px) calc(100vw - 116px), (max-width: 900px) calc((100vw - 274px) / 2), calc((min(100vw, 1180px) - 310px) / 2)",
    loading: "lazy",
  },
  portrait: { sizes: "(min-width: 768px) 252px, 192px", loading: "eager" },
  avatar: { sizes: "64px", loading: "lazy" },
  logo: { sizes: "126px", loading: "eager" },
  "homepage-workshop": {
    sizes:
      "(max-width: 639px) calc(100vw - 74px), (max-width: 1328px) calc(100vw - 90px), 1238px",
    loading: "lazy",
  },
  thumbnail: { sizes: "(max-width: 640px) 100vw, 640px", loading: "lazy" },
};
