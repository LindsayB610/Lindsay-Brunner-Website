# Completion 07: repair four hostile core findings

Verdict: **READY for independent core re-review**, not production approval.

Scope: pipeline/config/core regression tests only. Fresh implement-task context; verify skill applied. Parent owns work.md, commits, publication and the next hostile review. No package, consumer, source-policy or shared manifest edits.

## Changes and criteria evidence

- `scripts/images/pipeline.mjs`: srcset-only images enter optimization; completion markers require a known source, valid profile, candidate membership in that exact source family and truthful width descriptors. Raster originals cannot pass as finalized candidates. Placeholder data URLs remain supported but cannot carry hidden network srcsets.
- Authored same-art candidate sets now use generated derivatives. Picture source elements are processed independently, preserving media, sizes and compatible explicit format. Eleven existing Codex-display 800px/full-size pairs have exact `authoredSourceAliases` registrations in config. Their normalized 64×64 RGB mean absolute differences measured 0.56–0.79 of 255; the larger source supplies generated candidates. Alias targets must exist, be raster, not be smaller and retain aspect ratio within one source pixel. No filename inference is used. Distinct art across source elements remains supported; mixed identities within one candidate set fail with document/element context. Density descriptors retain their values and decoded candidate width. Unsupported derivative formats fail explicitly.
- Output validation gates actual source-element and img srcset candidates, plus standalone src candidates. Thumbnail photo ceilings are 100000 bytes through 640px and 250000 through 1200px; larger candidates retain normal-photo limits. Lossless art retains lossless limits. Non-WebP img fallback src accompanying srcset retains its separate-format exemption, but the same URL in the selected srcset does not inherit it. No encoding-quality reduction.
- Bundle fields are case-normalized. Effective publishDate/pubdate/date and expiryDate determine exclusion; excluded sources produce no derivatives and cannot be used in visible markup. Leaf build/resource mappings and inherited cascade/publication settings fail explicitly rather than guessing. This remains bounded YAML leaf-bundle support, not a general Hugo configuration interpreter.
- `scripts/images/config.mjs`: accepted exact pork-image exception retains source/route/profile/1600px/401000-byte ceiling and 2026-11-27 review date; owner is Website maintenance, reviewedOn 2026-10-27.
- `tests/image-pipeline-review.test.mjs`: eleven new focused groups cover bypasses, picture/source handling, density preservation, thumbnail limits, placeholder safety, and isolated real-Hugo publication/expiry behavior.
- `tests/image-pipeline.test.mjs`: one narrow command expectation now checks the first test:images command remains the output validator, accommodating task04's appended rendered-policy gate. Existing ordering/browser-free assertions remain.

## RED and GREEN evidence

All commands used explicit workdir `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website` and Node24 PATH `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH`.

- RED: six original new groups all failed against pre-repair source (missing rejection, unoptimized originals, missing thumbnail gate, 14 future derivatives instead of zero, missing inherited-mapping rejection). `/tmp/task07-red.log`.
- Additional RED: selected JPEG candidate with the same URL as fallback src escaped its budget; focused fixture failed with missing rejection before the fallback-role fix.
- GREEN: `node --test tests/image-pipeline-review.test.mjs tests/image-pipeline.test.mjs`: **18/18 pass**. `/tmp/task07-green.log`.
- The real Hugo fixture builds an isolated valid site with a future publishDate leaf and expired leaf. Both have zero derivatives; Hugo omits those resources; the remaining published site passes image validation. Temporary roots are removed in test cleanup.
- Canonical `npm run build`: **PASS**, `/tmp/task07-build.log`. Parent explicitly granted the shared build slot, which was released after success. Gate: 125 images, 3384 derivatives, 652 budgeted candidates, only the approved exact pork exception. Rendered source policy: 96 files, 0 violations.
- First canonical attempt correctly rejected the existing separately saved Codex-display resize pairs as unregistered mixed identities. Exact registrations plus a fixture resolved this without changing content. The retry passed.
- `npm run test:content`: **PASS**, 88 pages, `/tmp/task07-content.log`.
- `git diff --check`: PASS.

No GUI or headless browser was launched by this task. Isolated fixtures do not modify canonical public/generated/cache directories; only the parent-granted canonical build did so. Source art and protected styles were untouched. No commit/push/deploy; no commit hash.

## Remaining integration boundaries

Fresh independent hostile review and parent integration remain required. Existing runtime duplicate portrait-fetch behavior belongs to the separate runtime repair. Global Hugo configuration overrides, unsupported bundle layouts and derivative formats are outside the supported mapping. Full suite/runtime/deployment/header evidence belongs to integration; this completion does not claim production readiness.
