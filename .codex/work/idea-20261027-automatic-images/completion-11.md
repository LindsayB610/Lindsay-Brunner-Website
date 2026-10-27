# Completion 11: native presentation repair

Verdict: READY for independent core review, not release approval. Both review-core-final.md findings repaired. Canonical build slot released after the checks below. No commit, push, deploy, shared work.md edit, or other-chat messages.

## Changes

- scripts/images/pipeline.mjs: use the authored candidate's decoded intrinsic dimensions for plain img presentation. Reviewed aliases still select the canonical derivative family, but no longer substitute its larger dimensions for display dimensions.
- Existing picture and width-descriptor img markup retains its authored dimension attributes exactly. Absent dimensions remain absent; one-sided attributes remain one-sided so the selected source supplies the other axis. No fallback-derived width/height is injected over a picture's selected source.
- For existing width-descriptor sets, preserve authored sizes or the browser default 100vw. For a picture fallback with no authored srcset, generate a fixed intrinsic-width sizes value; its previously ineffective sizes attribute must not suddenly change its natural dimensions. Density candidates retain exact dimensions and descriptors.
- New data-image-native-dimensions completion metadata records none, width, height, or width-height. Both transform and output gate validate that exact attribute-presence shape and positive integer authored values. Removing a required dimension from an ordinary finalized img still fails. The marker does not skip candidate ownership, full-width-ladder, sizes, loading, priority, format, or budget checks.
- tests/image-pipeline-round2.test.mjs adds alias dimensions and native completion-shape tests, including gate rejection of malformed markers and removed authored dimensions.
- tests/image-presentation-runtime.test.mjs is a standalone real-browser regression. It derives this checkout's path from import.meta.url, creates unique temporary fixtures, intercepts fixture requests, and shares one bundled chromium_headless_shell process. It closes the browser in finally, verifies owned child PIDs exited, and removes fixtures even if cleanup assertions fail.

## Evidence

Explicit workdir for every command: /Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website. Node 24.21.0 PATH throughout. Scoped escalated execution was used for the authorized worktree writes and dedicated headless launch.

RED: initial expanded browser probe against the pre-repair implementation reported 11 geometry mismatches in 72 comparisons (DPR1, two viewports). Picture and standalone alias each changed from 320×192 to 640×384. Width-set markup without dimensions also changed from its native sizes-derived width to 640. /tmp/task11-red.log. The final fixture matrix removed redundant cases with duplicate authored attributes and added ignored-fallback-sizes coverage and DPR2.

GREEN:
- node tests/image-presentation-runtime.test.mjs: 128/128 geometry comparisons pass, tolerance at most 1 CSS pixel per axis for browser density/resize rounding. 390px and 1000px viewports, DPR1 and DPR2; plain alias, direct density, density picture, media selected/unselected branch, ignored fallback sizes, width sets with explicit sizes and default 100vw, picture width sets; absent, width-only, height-only and both explicit dimensions. Every output passes the actual static gate and idempotent retransformation. Owned headless process tree verified gone. /tmp/task11-browser.log.
- node --test tests/image-pipeline-round2.test.mjs tests/image-pipeline-review.test.mjs tests/image-pipeline.test.mjs: 25/25 pass. /tmp/task11-unit.log.
- npm run build: PASS. 127 finalized usages, 125 image elements, 3384 derivatives, 652 budgeted candidates. Source policy 150 files/0 violations; rendered policy 96 files/0 violations. /tmp/task11-build.log.
- node --test tests/image-consumers.test.mjs: 9/9 pass, including actual finalized Hugo/React parity. /tmp/task11-consumers.log.
- npm run test:content: PASS, including all 88 pages' OG checks and description lengths. /tmp/task11-content.log.
- Final idempotent npm run images:finalize and npm run test:images: PASS on the final implementation. /tmp/task11-finalize.log and /tmp/task11-output.log.
- git diff --check: PASS.

## Boundaries

No changes to task10 discovery/policy, resolver API, fixed ladder, hash-bound alias registry, source art, authored content, budgets or consumers. Native responsive completion metadata is a declared output contract, not a cryptographic record of authored markup; the gate validates its consistency just as it validates the other generated metadata.

Existing nonrepresentable density candidates, mixed/duplicate descriptors, invalid dimensions and unsupported ambiguous same-node art direction still fail explicitly. The repair does not claim arbitrary art-direction, arbitrary CSS, every browser engine, CLS elimination, or full release/runtime/network approval. Native picture/width-set markup without dimensions intentionally retains the original browser layout behavior rather than claiming fallback dimensions reserve every branch correctly.

The new browser command is deliberately separate from test:images:unit and browser-free canonical builds. Parent reports wiring it as test:images:presentation in test:images:release and image-runtime CI; parent owns that integration and full-suite/release review. This task's geometry checks are independent of task10's broader runtime matrix.
