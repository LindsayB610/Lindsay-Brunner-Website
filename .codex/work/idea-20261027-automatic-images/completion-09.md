# Completion 09: second core review repairs

Verdict: **READY for independent core re-review**, not publication approval. Task09 scoped repairs complete; no commit, push, deploy or browser launch. Parent owns shared work.md and review/archival. Dependency baseline: core commit `4ecb7dd`, review-core-round2.md. Explicit workdir for every shell command: `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`; Node24 via `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin`.

## Owned changes

- `scripts/images/pipeline.mjs`: validate complete finalized raster presentation in both transform and output gate; exact density candidates and density-corrected default dimensions; preserve one authored dimension while deriving the other from aspect ratio; require reviewed alias source and target SHA256 matches.
- `scripts/images/config.mjs`: migrated all eleven independently reviewed real resize-pair registrations to `{target, sourceSha256, targetSha256}`. Hashes read from current source bytes, with prior review's artwork-equivalence evidence. No new alias inferred from filenames or dimensions.
- `tests/image-pipeline-round2.test.mjs`: five regression groups cover incomplete genuine markers, missing sizes/priority/dimensions, ladder-aligned 320/640 density pairs, exact decoded pixels, non-ladder 500/1000 rejection, genuine alias acceptance followed by same-size different-art replacement on either side, and width-only/height-only markup with and without density sets.
- `tests/image-pipeline-review.test.mjs`: narrow fixture migration to hash-bound alias registration and complete marked markup. Budget tests still require actual budget errors (not a generic failure). The old inconsistent same-source 1x/2x fixture now explicitly asserts rejection; valid density support is tested with real resize pairs in round2.

## RED / GREEN evidence

Before core edits, ran all five new groups against the prior implementation. The initial new-schema run exposed unsupported object registrations, so repeated with the existing string registration shape to isolate behavior rather than schema failures. All five then failed for the intended reasons: incomplete marker accepted; default density width640 instead of320; non-ladder density accepted; replaced alias artwork accepted; authored width200 received height384 instead of120. Restored new-schema fixtures for implementation.

After repairs, `node --test tests/image-pipeline-round2.test.mjs tests/image-pipeline-review.test.mjs tests/image-pipeline.test.mjs`: **23/23 pass**. Test fixtures generate/publish only under unique temporary directories and remove them afterward. Gate assertions exercise the actual validator; density assertions also decode emitted candidates with Sharp.

`node --test tests/image-consumers.test.mjs`: **9/9 pass**, including actual React/finalized-Hugo descriptor equality, swaps, deferred dialogs and retained adapter behavior.

Parent granted core editing after task08 released it. Canonical build began only after parent requested task10's policy/package freeze and task10 confirmed it. `npm run build`: **PASS**; 127 finalized usages, 125 image elements checked, 3384 derivatives, 652 budgeted candidates; rendered policy96 files/0 violations. Source-policy stage passed as part of build. Existing exact pork-image budget exception unchanged. Log: `/tmp/task09-build.log`.

`npm run test:content`: **PASS**, including 88 pages' OG images and description lengths. Log: `/tmp/task09-content.log`.

`git diff --check`: **PASS**. Reviewed owned diff against every task09 criterion. No source artwork, OG image, content, consumer, resolver API, policy/helper, package, or shared work.md changes by this task. Concurrent existing `static/css/custom.css` changes belong to task08, not this repair.

## Supported limits and deliberate rejection

- A marked raster must use source-owned derivative candidates and a recognized profile. It must have a nonempty srcset. Width sets must include every distinct decoded width for their selected format and nonempty sizes; partial/stale width sets fail rather than silently claiming completion. Authored sizes remain valid overrides.
- Marked img elements additionally require src, positive integer width/height, loading, valid loading/priority values and the profile's default priority when it was not explicitly overridden. Existing supported explicit loading/priority overrides remain supported. Sources retain media/type semantics and do not require img-only metadata.
- Density descriptors retain the parser's positive integer `x` support. Every candidate must imply the same integer CSS width AND height; duplicate/mixed descriptors, fractional or inconsistent intrinsic dimensions fail explicitly. The canonical source ladder must contain the candidate's exact decoded width AND height in the requested format; no rounding or upscale. Thus 320/640 at1x/2x works; 500/1000 fails with the normal ladder. Clamped stable URLs are assessed by actual decoded dimensions, not filename widths. The fixed ladder and resolver API did not change.
- If neither img dimension was authored, density-corrected intrinsic dimensions are emitted. If one dimension was authored, derive the other proportionally, rounded to the nearest positive integer. Both authored dimensions remain intact (intentional explicit presentation is not overridden). Invalid dimension syntax fails.
- Alias declarations are reviewed byte identities. Replacing either source or target requires a fresh artwork review and explicit new hash registration. Do not automatically refresh hashes after a failed build. Aspect/size checks remain in addition to hash checks, not as an identity substitute.

## Handoff and remaining boundaries

Pipeline and canonical build slot explicitly released to task10 after the passing build. Task10 alone owns its later runtime-manifest helper integration; it is not part of this task09 verdict and must preserve these core edits. Parent/task10 will add round2 tests to package unit wiring (requested, not changed here). Only this completion file was written after release.

Full npm suite and dedicated-headless runtime matrix remain integration/release responsibilities, not claimed from these static/core repairs. Task08's earlier runtime result is separate evidence; task09 launched no browser. Fresh hostile review is still required by the parent workflow before calling the overall implementation ready. No human decision needed for this scoped repair.
