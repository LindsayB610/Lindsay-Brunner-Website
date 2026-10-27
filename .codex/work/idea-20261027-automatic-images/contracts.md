# Image delivery contracts (task 01)

Base: `b70a2b147c991f257ea8bcbf3f40ac4cb558999a`. Discovery only, 2026-10-27. Coordinator accepted the retention adjustment below in this chat. This document resolves implementation decisions for tasks 02–05; measured quality/performance and deployed enforcement still require validation. No source artwork is changed.

## 1. Bounded compatibility decision

Use stable public URLs derived from canonical source pathname, policy family, fixed width and format. Example: `/_img/images/avatar-color-trans.png/photo/320.webp`. Preserve the source extension in the path to avoid JPEG/PNG basename collisions. Christmas derivatives instead live under `/_img/christmas-2026-lucas/...` and inherit an explicit `X-Robots-Tag: noindex, nofollow, noarchive` rule. Preserve the existing original-page/assets noindex rules, page robots meta, and social URLs.

Content hashes identify transform-cache entries, not public delivery URLs. Hash source bytes + normalized encoder options + Sharp/libvips versions + policy version. Set BOTH browser and Netlify CDN derivative cache controls to `max-age=0, must-revalidate`; do not inherit the global year-long CDN rule and do not mark these URLs immutable. Verify actual deployed responses later. Current originals retain their existing URLs/headers.

Keep the fixed variant ladder for each source policy while that source exists, even if current markup no longer references that width. Emit the same stable width URL when a source becomes smaller, but record/advertise its actual decoded width (deduplicate equal actual widths in srcset). This supports old tabs after unrelated deploys and same-path artwork replacement without enlargement. An old tab may show current artwork. Source rename/deletion, policy-family removal, and a future URL-contract change are NOT retained. Do not promise arbitrary historic releases; no persistent deploy bundle, paid storage, network retrieval, or indefinite accumulation is needed. Test two release directories with unchanged and replaced sources, discard transform cache between builds, and request the old URLs from the new directory.

This deliberately replaces the plan's hashed-public-URL/retained-bundle proposal. Reason: finite current-source compatibility is sufficient here; unbounded release storage creates a separate operational project. Coordinator owns reconciliation into shared work/plan.

## 2. Source discovery and storage

Scan eligible local PNG/JPEG/WebP/GIF/AVIF files in static and Hugo page bundles before Vite/Hugo. Discover all files, including standalone-only references, rather than trusting a reference regex. Classify every discovered asset in the manifest: raster delivery, SVG passthrough, animated passthrough, icon/identity-only, or explicitly excluded working artifact. Existing `static/images/social/working-files` is authoring material. Social PNGs are identity assets but MUST also be processed when used visibly; Christmas demonstrates this. Simplicity option: prepare all non-icon rasters, including social PNGs, then measure the overhead. Do not accidentally exclude dual-use art by directory alone.

`static/foo` maps to `/foo`; bundle URLs must use the page permalink/resource mapping, not assume `/content/...` URLs. No bundles contain rasters on this base. Support the simple leaf-bundle case with a fixture; reject ambiguous slug/permalink mapping until explicitly registered. No silent miss. Registered build producers run first (currently recipe OG generation). No fetching external URLs. Reject path escape, symlinks escaping roots, malformed encoding, corrupt rasters and canonical-URL collisions.

Disposable `.cache/image-optimization/` contains encoded bytes keyed by content hash. `.generated/images/manifest.json` and staged derivative bytes live outside `assets/react` and `public`, because Vite/Hugo clean those directories. Ignore both intermediate directories in Git. Regenerate completely without cache; verify cached byte hashes before reuse. Bounded concurrency 2 is the initial setting; measure build time/memory/count/bytes before increasing. Never invoke source-mutating `optimize:images`.

## 3. Manifest and reusable API

Implement one Node ESM pipeline module, one browser-safe resolver, and thin CLIs. Suggested names are interfaces, not permission to split ownership:

- `prepareImages({root, generatedDir, cacheDir, config}) -> Manifest`: discovery, decode metadata, encoding, atomic manifest write.
- `resolveImage(manifest, sourceUrl, {documentUrl, profile, sizes, loading, fetchPriority}) -> ImageDescriptor`: pure shared URL/profile/descriptor rules; no filesystem or Node imports in browser code.
- `transformHtml({html, documentUrl, manifest, config}) -> {html, usages}`: parser-based transformation.
- `publishImages({manifest, generatedDir, publishDir})`: copies verified bytes after Hugo cleanup.
- `validateImages({publishDir, manifest, config}) -> report`: static output gate, does not build or launch browsers.
- Task03 wrapper `ResponsiveImage` and `setResponsiveImage` use the resolver; `openOriginal` removes responsive sources before setting the original on explicit interaction.

Manifest shape (version 1, sorted canonical URL keys):

```ts
type Variant = { url: string; width: number; height: number; bytes: number;
  format: 'webp'|'jpeg'|'png'; sha256: string; requestedWidth: number };
type Entry = { sourcePath: string; sourceUrl: string; sourceSha256: string;
  width: number; height: number; bytes: number; format: string;
  hasAlpha: boolean; animated: boolean;
  disposition: 'raster'|'svg'|'animated'|'identity';
  policy: 'photo'|'lossless'; variants: Variant[]; reason?: string };
type Manifest = { version: 1; policyVersion: string;
  encoder: { sharp: string; vips: string }; images: Record<string, Entry> };
type ImageDescriptor = { sourceUrl: string; width: number; height: number;
  src: string; srcSet?: string; webpSrcSet?: string; sizes: string;
  loading: 'eager'|'lazy'; fetchPriority?: 'high'|'auto'|'low';
  disposition: Entry['disposition'] };
```

Keep filesystem staging metadata out of the imported browser subset. Task02 exports schema/resolver fixtures before task03 starts. Hugo fallback and React need identical descriptor values, not two approximations: use a generated Hugo data file or final HTML transform with the same resolver; a Hugo partial can emit semantic profile attributes for finalization. Source/profile metadata belongs on img (`data-image-profile`) and must be consumed idempotently. Do not change anchors, social meta, JSON-LD, or original data attributes.

Resolution uses the output document URL and WHATWG URL semantics, with same-origin absolute URLs normalized locally. Decode segments once, validate containment, retain source query/hash for original identity, and map static query variants to the same bytes only when query has no transformation semantics; otherwise fail explicitly. Local `<base href>` is supported; remote base/local-looking paths require explicit external classification. Existing pictures/srcsets: parse and validate each candidate; preserve media/type/art direction, never nest pictures. Simple existing same-art srcsets can be regenerated; ambiguous art direction fails with file/selector rather than being flattened. Tiny/efficient/animated/SVG references may pass through with a reason. Data placeholders are allowed only as documented non-network placeholders.

## 4. Encodings and display profiles

Fixed raster ladder: 320, 480, 640, 800, 1200, 1600, 2400, clamped to oriented source width without enlargement. Micro assets use 64, 128, 256; portraits use 160, 320, 640. Prefer a fixed family assignment per SOURCE so URLs persist across use changes. Wide sources used as micro assets still need micro variants. Do not multiply every file by every profile; union the source's required families plus a normal content default for unknown new files. Keep generated family membership stable via config once published.

Generate WebP plus JPEG fallback for opaque photos, PNG fallback for alpha/lossless art. Auto-orient before dimensions/resizing. Preserve alpha; never flatten onto black/white. Start photo quality 85. Text/diagrams/screenshots use lossless WebP/PNG; known workshop screenshots, diagram PNGs, GUPPI/GuideForge screenshots, display-screen mockups and logos are lossless. Preserve approved art/crops; CSS object-fit remains in place. Choose smaller valid bytes only within the same dimensions/quality policy, never declare a larger source to be a tiny candidate. AVIF source decoding is supported; AVIF derivative generation deferred. Animated input must remain animated passthrough with recorded reason unless actual animation-preserving output is implemented/tested.

Profile sets presentation, not optimization eligibility:

| Use | sizes contract | Loading |
| --- | --- | --- |
| Christmas cover | `(max-width: 1180px) 100vw, 1180px` | eager/high, 1200×630 ratio |
| Christmas product | ≤650px `calc(100vw - 88px)`; ≤900px `calc((100vw - 208px) / 2)`; otherwise `calc((min(100vw, 1180px) - 244px) / 2)` | lazy |
| Christmas character/bath cards | compute separate grid slot from catalog CSS; do not reuse two-column product slot for three-column characters; initial conservative width cap 640 | lazy |
| Standard article body | `(max-width: 480px) calc(100vw - 32px), (max-width: 800px) calc(100vw - 48px), 752px`; explicit existing sizes override | preserve explicit eager/high, otherwise lazy |
| Half-width diagrams | half the article slot, retaining the existing inline 50% width | lazy unless explicit eager |
| About portrait | `(min-width: 768px) 252px, 192px` in current React inner frame; align fallback image slot/descriptor to this contract | eager |
| Testimonial avatars | `64px` | lazy |
| Rotating company logos | exact configured maximum width per logo, Parasail `126px` | eager for visible row, subsequent rotation uses same resolver |
| Homepage Workshop | `(max-width: 639px) calc(100vw - 74px), (max-width: 1328px) calc(100vw - 90px), 1238px` | lazy; same descriptor in fallback/React |
| Workshop hero | current grid slot (CSS max container 1200, 900px stack breakpoint); verify rendered slot before final values | eager |
| Tracker card photos | card grid slot, preserve 16:9 CSS crop; use maximum 640 CSS px until actual breakpoint measurements refine | lazy |
| Zoom dialogs | no fetching img src/srcset before opening; original URL assigned on click | interaction only |
| Signal logo | `120px` | eager, small original allowed |

Exact sizes marked for measurement must be finalized by task03 using existing CSS/runtime bounds; they do not block the generator API. Christmas cover expected candidates at 390/DPR1, 390/DPR2, 1440/DPR1, 1440/DPR2 are 480, 800, 1200, 1200 respectively, subject to browser candidate heuristics and no upscale. Assert allowed candidate range/currentSrc and bytes rather than an engine-independent exact pick.

Initial budgets: hero ≤800:150KB, ≤1600:300KB, >1600:600KB; thumbnail ≤640:100KB, ≤1200:250KB; normal photo ≤1600:400KB, >1600:800KB. Text/lossless candidates use ≤1600:1MB, >1600:2MB provisional ceilings. These are gates requiring measured calibration, not proof quality is acceptable. Exact source/usage exceptions require owner, reason and review date, no wildcard exemptions. Never reduce legibility to meet them. PNG fallback may need its own recorded budget instead of forcing WebP byte targets onto lossless PNG. Report encoding sizes separately from selected response budget.

## 5. Build and enforcement boundaries

Canonical sequence: OG generation → prepare manifest → source-policy gate → Vite → Hugo (`--cleanDestinationDir`) → final HTML transform → derivative copy → static image gate. `test:images` is a no-build leaf; `build` calls it. Blog/recipe bundles retain browser-free command contracts. `dev:optimized` later serves full transformed disk output with serialized add/change/delete rebuilds. Direct Hugo is a fast authoring mode only.

Use Sharp already declared ^0.35.5 and TypeScript already declared ^6.0.3 for AST parsing. Add a direct pinned-compatible HTML parser dependency (e.g. parse5) rather than depending on incidental transitive parser behavior. Initial checkout lacked node_modules and default shell Node was 22.12.0. Coordinator has since completed npm ci (537 packages) using Node24. Use PATH=/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH for every Node/npm check; package requires Node24/npm11.

Source policy scans src JS/TS/JSX/TSX, static first-party JS, inline scripts in layouts/static HTML/content, CSS URL uses, and executable HTML injection. Exclude generated Vite output/vendor/build/test fixtures by explicit purpose, not global allowlist of image-consuming files. Ban raw JSX img outside the single adapter; flag createElement('img'), new Image, image src/srcset assignments, setAttribute and img-containing innerHTML/template literals outside exact reviewed adapter nodes. Include computed-property and alias negatives within supported syntax. Template JS must be parsed after safely replacing Hugo expression tokens with inert values; unknown parse syntax fails with location. Inspect rendered inline JS as an additional gate, but do not pretend rendered routes cover unused templates. Known Turnstile `script.src` is a script-loader exception, not an image bypass. Keep exceptions to exact sites/symbols and test new forbidden assignments in an otherwise allowed file. General JS data-flow is out of scope: computed/eval-based image construction is unsupported and rejected/reviewed, not claimed exhaustively proven.

Static gate parses every published HTML document, CSS and image candidates; checks containment, actual dimensions, decodability, descriptors, missing late sources, alpha policy, high-priority/lazy conflict, no hidden originals, preserved metadata and noindex for Christmas derivatives. Runtime suite covers currentSrc/bytes, delayed React takeover, rotation and gallery open/close/swaps. CI must run it separately using dedicated headless Chromium only. Existing repo has scheduling/security/Hugo workflows, no required image runtime status proven. A green workflow is not evidence branch protection or Netlify deploy ordering blocks release; coordinator must verify enforcement or explicitly hold rollout readiness. No branch-protection claim from local files.

## 6. Required focused fixtures / handoff

Task02: standalone-only new source, relative/encoded/query/base URLs, root containment, same-basename extensions, corrupt/missing/cache-corrupt files, original byte hashes unchanged, transparency/orientation/tiny/animated/SVG, screenshots, existing picture art direction, idempotence, clean/cache equivalence, noindex derivatives, two-release stable URL tests, clean Hugo copy ordering. Task03: shared fallback/React descriptor equality, visible logos/avatars, original deferred until click, stale picture sources/srcset cleared on swaps. Task04: bypass negatives, parser failures, CSS/inline script coverage and one-browser network matrix. Task05: add/change/delete watcher, failed build state, cold cost measurement, appropriate full regression suite, seven-run before/after timing protocol from plan.

Browser harnesses currently call Playwright chromium.launch({headless:true}) without installed Chrome channel/executable. Exporter runtime test additionally guards those options. No browsers launched here. Reuse one dedicated headless process, finally-close browser/server on all exits, and check children after run. Build and source-only discovery do not need browsers. Run static gates and network tests before claiming production readiness; publication remains coordinator-owned.
