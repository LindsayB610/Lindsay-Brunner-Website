// Stable source families are independent of the current page's presentation role.
export const imageOrigin = "https://lindsaybrunner.com";
export const imageConfig = {
  origin: imageOrigin,
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
  // Reviewed same-art resize pairs, pinned to BOTH source and target bytes.
  // Any replacement requires renewed visual review and new hashes; never auto-refresh.
  authoredSourceAliases: {
    "/images/blog/codex-usage-display/cad-exact-assembly-800.webp": {
      "target": "/images/blog/codex-usage-display/cad-exact-assembly.webp",
      "sourceSha256": "77685121b6eeb4cdcc294365163eea8d164ebf7ba440bacb6684c5b41f152eb8",
      "targetSha256": "ed372608c5f229239d035171bc226bd4e45b7c3a3dfd2bcfa973f51b2f634d3f"
    },
    "/images/blog/codex-usage-display/device-depth-800.webp": {
      "target": "/images/blog/codex-usage-display/device-depth.webp",
      "sourceSha256": "7ad020c1ae8da697b36654a56a5b39586428a74a9eba89745fcee0d3708257a5",
      "targetSha256": "80a6a6e5ad93f52080f4504033d49d02b3d1cf8c23e22d82414b652e0d76b3ad"
    },
    "/images/blog/codex-usage-display/enclosure-directions-800.webp": {
      "target": "/images/blog/codex-usage-display/enclosure-directions.webp",
      "sourceSha256": "34caa2e56e17be4c402caa86661fccb09b5bed15b86cba50cbe7d67545ae2d58",
      "targetSha256": "27b7f6a85744c1e854c215081607cb0a14c8c8e553f04ee207aef2d0c5a44e61"
    },
    "/images/blog/codex-usage-display/final-in-situ-close-800.webp": {
      "target": "/images/blog/codex-usage-display/final-in-situ-close.webp",
      "sourceSha256": "34fabae7106bada2336296268c1b0b01c4e8d3c6c938434b59ccb522bb41bc3f",
      "targetSha256": "83594cb0f059d9edc7b18bd6288cdc36e8d7d1c86ef5936239da4f09bc5ec15e"
    },
    "/images/blog/codex-usage-display/final-side-profile-800.webp": {
      "target": "/images/blog/codex-usage-display/final-side-profile.webp",
      "sourceSha256": "06b97eed8e0af18c7be2c9ebc970d791f0f771f9521148633be0944ba7cbffe8",
      "targetSha256": "e28d982d5c02b1c1f80f05eff9a2884f5babf3947bde7e1055fbaf3d15604dd9"
    },
    "/images/blog/codex-usage-display/final-three-quarter-800.webp": {
      "target": "/images/blog/codex-usage-display/final-three-quarter.webp",
      "sourceSha256": "26ad58741091ab95122335a82ed7b9bb4254b0a90e8ede1e517ac92948194148",
      "targetSha256": "e60ef9e858ba7f5325905855615e80c9f10e2a97d1814c5f0db36cdd73418767"
    },
    "/images/blog/codex-usage-display/first-print-parts-800.webp": {
      "target": "/images/blog/codex-usage-display/first-print-parts.webp",
      "sourceSha256": "b907b380a05f854a3f2bd2f99ea99db131f3bdfac6838137bfad9bfa4d3a883f",
      "targetSha256": "a23d81be3beeb965c5f5b72fa77db58363f80e9fe7f6f8e244c75e6a29de0f95"
    },
    "/images/blog/codex-usage-display/magnet-installation-800.webp": {
      "target": "/images/blog/codex-usage-display/magnet-installation.webp",
      "sourceSha256": "14b2e612e6869014457cb6a8b69627de28ce5dac23ca9f6dc9722b7371a77bbe",
      "targetSha256": "c4ba5522455c47f4f66b252ffe1f3d58b0bd872ad4944434025e41fc885ea080"
    },
    "/images/blog/codex-usage-display/magnets-and-backplate-800.webp": {
      "target": "/images/blog/codex-usage-display/magnets-and-backplate.webp",
      "sourceSha256": "3f54f463372907b6f1bdbc5df11d9a334ea8ff313bea55688452da7471f5c06f",
      "targetSha256": "8ec5cf66d35360a54b78271552bb162c1292a319b6168471039e3c37142c0889"
    },
    "/images/blog/codex-usage-display/v2-spaghetti-800.webp": {
      "target": "/images/blog/codex-usage-display/v2-spaghetti.webp",
      "sourceSha256": "640410a2c404b00f37a64e4da8e23b8089f171c9af22a6e35cc40180a360aa9f",
      "targetSha256": "f04902fcab7655970e810c8bfe11e6284b1816cec4ec2dd872bda943002aeb06"
    },
    "/images/blog/codex-usage-display/v3-leg-contact-800.webp": {
      "target": "/images/blog/codex-usage-display/v3-leg-contact.webp",
      "sourceSha256": "99ca696ba976ef52de77db51032306c7613302da845d70b0b5b7b0f4441b0fa0",
      "targetSha256": "c43ff143e936ec690e2e46508a308844bf78be50f98454f9e8ccbcdb0034a51c"
    }
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
