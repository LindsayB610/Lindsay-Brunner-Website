# Completion 02: automatic static and Christmas image delivery

Verdict: **READY for task02 handoff and independent review**, not production or comprehensive visual approval. Implemented only task02 in `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`. No commit, push, deployment, GUI browser, child chat, runtime-consumer edit, or shared work.md edit. Coordinator owns status and commits.

## Changed files

- `scripts/images/config.mjs`: stable ladders, conservative lossless classification inputs, presentation profiles, exact budget exception.
- `scripts/images/resolver.mjs`, `resolver.d.mts`: pure browser-safe URL/descriptor contract and TypeScript interface.
- `scripts/images/pipeline.mjs`: source discovery, encoding/cache, manifest, parsed finalization, verified publication, static output gate, lean browser selection.
- `scripts/images/cli.mjs`: prepare/finalize/validate leaf commands.
- `tests/image-pipeline.test.mjs`: seven focused fixture groups including positive/negative cases and build-command contracts.
- `package.json`, `package-lock.json`: direct pinned `parse5@8.0.0`, canonical build ordering and image test commands; full suite includes unit fixtures.
- `.gitignore`: disposable generated/cache directories.
- `static/_headers`: stable derivative browser/CDN revalidation and Christmas derivative noindex subtree.

## Exact handoff contract

Canonical sequence: `generate:og-images` → `images:prepare` → `build:react` → `hugo --gc --minify --cleanDestinationDir` → `images:finalize` → `test:images`. Task04 inserts its source-policy gate; it is deliberately not referenced before implementation. `test:images` is a browser-free no-build leaf. `test:images:unit` runs the focused fixtures.

Public derivative names are `/_img<canonical-source-path>/<photo|lossless>/<requested-width>.<webp|jpg|png>`. Original extensions remain in the path. Every fixed ladder URL remains emitted when the source shrinks, with actual decoded width recorded and equal-width candidates deduplicated. Cache identity hashes raw source bytes plus normalized encoder policy and Sharp/libvips versions; cached bytes require matching hashes. Cache writes are atomic and concurrent identical-source writes use unique temporary files. Failures drain workers before returning. Bounded source concurrency is two.

APIs exported from `scripts/images/pipeline.mjs`: `prepareImages`, `transformHtml`, `finalizeHtml`, `publishImages`, `validateImages`, `pickBrowserManifest`. Resolver exported from `scripts/images/resolver.mjs`: `resolveImage(manifest, sourceUrl, options)`, `canonicalImageUrl`, `parseSrcset`. Version-1 full manifest is `.generated/images/manifest.json`. `pickBrowserManifest(manifest, sourceUrls)` selects only runtime entries and removes filesystem/hash/byte data. `.generated/images/runtime-manifest.json` currently selects portrait, Workshop shelf, logos and testimonial avatars; it is **18947 bytes**, not the full inventory. Task03 can refine this exact source set.

For matching HTML/React output, assign `img.src = descriptor.src`, `img.srcset = descriptor.webpSrcSet`, and the same sizes/loading/fetchPriority/width/height. `srcSet` in the descriptor holds the original-format JPEG/PNG ladder; `webpSrcSet` holds WebP. HTML uses WebP srcset directly on img to avoid inserting wrappers that change CSS/runtime nodes. Compatibility bound: fallback src serves non-srcset browsers; this does not implement picture type negotiation for old srcset-capable browsers without WebP. Existing picture media/type/art direction and existing srcsets remain intact after candidate validation. All current target browsers support WebP; coordinator has been informed of this bound.

Finalizer retains original anchor/meta/JSON-LD/data URLs, existing styles and explicit loading choices; stamps `data-image-source` and `data-image-profile`; adds intrinsic dimensions when absent; is idempotent. Semantic profile attributes let task03 align Hugo and React. Christmas cover/product/character/bath sizes derive from existing CSS, including distinct three-column character slots and card/image padding. No source HTML or protected style/artwork was edited.

Simple YAML leaf bundles support the site's dated blog/recipe mapping, simple root bundles, or explicit slash-terminated URL. Ambiguous structures/URLs fail. Draft/future bundle sources are classified but produce no public derivatives and cannot be used by visible image candidates. This is intentionally bounded support, not a general Hugo resource/permalink engine. Unsupported remote images, transforming queries, malformed/traversing URLs, escaping or other source symlinks, corrupt sources, and missing candidates fail. Version-only queries (`v`, `ver`, `version`) and fragments retain original identity. Local base URLs and same-origin absolute URLs work. Only the documented one-pixel GIF dialog placeholder passes through as data.

PNG-path assets and known screenshots/diagrams/CAD/logo assets are lossless, including PNG-named files whose actual bytes are JPEG. That pathname assignment keeps the policy family stable on replacement. The approved Christmas cover uses photo q85. Alpha is preserved; an entirely opaque alpha channel may be removed by the encoder. Images auto-orient, never enlarge or crop. SVG, animation and identity icons pass through with reasons. Authoring SVGs are classified as excluded. Original assets and OG URLs remain untouched.

## Acceptance evidence

| Criterion | Evidence |
| --- | --- |
| Standalone-only automatic discovery | Fixture adds a raster with no Hugo reference; prepare discovers and encodes it. Real catalog's 33 visible images finalized automatically. |
| Decodable output and truthful descriptors | Gate fully decodes each unique encoded byte sequence, checks every published file hash/byte count/dimensions/required alpha, and validates each parsed width candidate. Corrupt and missing outputs fail. |
| Originals/art preserved | Gate verifies published originals against source SHA-256; fixture checks original bytes unchanged. Tracked art/content has no diff. Direct visual comparison of source and 800px Christmas cover found readable text, unchanged composition and no obvious artifacts; this is not broad visual approval. |
| Responsive Christmas byte improvement | Original 533071 bytes; WebP 480px=51390, 800px=116002, 1200px=225460 (about 90%, 78%, 58% reductions). Cover remains eager/high and 1200×630 ratio. |
| URLs/HTML/picture semantics | Relative/encoded/version-query/fragment/base/same-origin fixtures; metadata/anchor/style preservation; idempotence; existing picture media/type preserved; bad descriptors, missing paths, root escape and remote base rejected. |
| Cache/stable release safety | Fixture corrupts cache and repairs to identical manifest; prior-release URL list remains present after source shrink and empty cache. Final real cold/cache manifest checksum identical: `73cb0df2387557773f637c6aa2087d8de4eb31f0ecf10a3269f348fafd6f6908`. No historic source deletion/rename retention promised. |
| Build ordering and gate | Real cold and cached production builds pass after Hugo cleanup, derivative copy and mandatory output validation; focused command fixture proves order/no browser imports. |
| Edge cases/privacy | Tiny/alpha/oriented/animated/SVG/AVIF/same-basename/draft bundle fixtures; header gate requires browser AND CDN revalidation plus Christmas robots meta and derivative noindex. Live HTTP headers remain downstream verification. |

## Validation results

Every Node/npm command used `PATH=/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH`; explicit workdir above on every shell call. Scoped worktree escalation was used after ordinary write EPERM, as authorized.

- RED: focused test initially failed because the implementation module did not exist. Further tests caught a shared-temp-file race and failure cleanup race, both fixed; real output validation caught opaque-channel elision and the budget overrun below. Intermediate manifest comparison reflected an intentional classifier correction, not cache nondeterminism; final pair uses the same policy and passes.
- `npm run test:images:unit`: **7/7 groups pass**, latest output `/tmp/task02-unit-final.log`.
- Empty disposable transform cache, then `/usr/bin/time -l npm run build`: **PASS**, `123.80s` wall time; prepare `87504ms`; reported maximum RSS `982024192` bytes. Evidence `/tmp/task02-cold-final2.log`.
- `/usr/bin/time -l npm run build` with cache: **PASS**, `37.56s` wall time; prepare `1495ms`; reported maximum RSS `661159936` bytes. Evidence `/tmp/task02-warm-final2.log`.
- Exact SHA-256 comparison of cold/cached manifest files: **PASS**. Final inventory: `273` entries, `3384` derivatives, `277062298` encoded derivative bytes. Real HTML finalization reports 127 usages (125 network images plus two placeholders); gate passes.
- `npm run test:content`: **PASS**, 88 pages; `/tmp/task02-content.log`.
- `npm run test:commands`, `npm run test:netlify-build`, `npm run test:christmas-catalog`: **PASS**.
- `git diff --check` and explicit whitespace scan of new files: **PASS**.
- Full suite/browser/runtime/network/LCP testing not run here; task05/task04 own those checks. No browser launched, so no browser children were created.

One exact provisional budget exception is recorded in config and reported by the gate: `/images/pork-shoulder-two-pieces-new.jpg`, body profile, 1600px, `/recipes/2026-01-14/recipe-sous-vide-pulled-pork-arbys-bbq/`, q85=400438 bytes against 400000 provisional ceiling. Exact ceiling 401000; owner `task02 implementation (coordinator review)`; review date 2026-11-27. This preserves quality rather than reducing encoder quality for 438 bytes. Wildcard/missing/expired exception records fail. PNG fallback bytes are reported in manifest, not forced under WebP budgets. Coordinator should review this explicit exception.

## Remaining responsibilities and limits

- **Task03:** adopt resolver/runtime subset; align fallback/React initial descriptors and slots; logo/avatar policies; runtime swaps clear stale responsive attrs; defer zoom originals until explicit interaction. Current zoom shortcode remains untouched and is not certified as interaction-only. Finalize remaining Workshop/tracker slot measurements. Add selected runtime sources through the lean picker, never import full manifest into shipped JS.
- **Task04:** implement bounded AST/source policy, CSS and inline-script coverage, unknown/bypass failures, and dedicated-headless currentSrc/network tests. This task's output gate parses HTML image candidates, not arbitrary JavaScript or CSS image construction. It does not yet certify absence of hidden dialog fetches or registered runtime consumer coverage. Existing authored picture/srcset choices are preserved and validated rather than automatically re-encoded/replaced.
- **Task05/coordinator:** serialized optimized preview/watch behavior, full regression/integration suite, seven-run timing protocol, actual browser selection/quality review, deployment cache/noindex HTTP headers, CI/deploy enforcement and release ordering. The measured cold cost and approximately 264.2 MiB derivative payload are real overhead; assess them in integration. No arbitrary historic asset retention or production readiness claim.

No second task started. All requested task02 work is left uncommitted for coordinator review.
