# Core review round 4: task 11

Verdict: READY for the scoped core/native-presentation change. No actionable findings. This is not production or full integration approval.

## Scope and inspected evidence

Fresh independent review of AGENTS.md, spec.md, contracts.md, work.md, task-11.md, completion-11.md, review-core-final.md, the current pipeline/resolver and core/presentation tests, and the pipeline diff. Explicit workdir throughout: `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`. Node 24.21.0 via the requested PATH.

## Previous findings verified repaired

- Standalone resize alias: `pipeline.mjs:473,491-496` obtains presentation dimensions from the authored candidate, while the canonical owner supplies delivery variants. The genuine 320×192 alias of a 640×384 source keeps its original rendered size. Width-only, height-only and explicit two-axis dimensions remain covered.
- Density picture: `pipeline.mjs:475-493` preserves the authored dimension-attribute shape instead of injecting the fallback source dimensions. The selected 1x/2x source therefore retains its native 320×192 presentation. Media-selected and unselected branches pass at both viewports and DPRs.
- Nearby width-set behavior: authored sizes remain effective; absent sizes retain the browser's 100vw default. A picture fallback without an authored set uses its own intrinsic-width slot, so formerly ineffective fallback sizes do not acquire new layout effects. Existing picture source width/height attributes remain effective.

## Independent execution

1. `node --test tests/image-pipeline-round2.test.mjs tests/image-pipeline-review.test.mjs tests/image-pipeline.test.mjs`: 25/25 pass. Inspected harnesses first; their writes/builds are confined to temporary fixture roots, including the small Hugo fixture.
2. `/tmp/core-round4-expanded.mjs`: 224/224 before/after browser geometry comparisons pass, with the existing 1 CSS pixel rounding tolerance. This is a temporary copy of the current presentation harness extended independently with an alias picture fallback, two media-selected source branches, authored source dimensions, srcset-only width and density images, reversed density order, and an implicit 1x fallback. It includes all 128 original comparisons. Viewports 390 and 1000; DPR 1 and 2; absent, width-only, height-only and both dimensions. Each transformed output passes actual validateImages and byte-for-byte idempotent retransformation before geometry measurement.
3. `/tmp/core-round4-gate.mjs`: eight independent malformed native-picture output cases fail BOTH transformHtml and validateImages: inconsistent dimension shape, removed authored width, zero width, missing loading, missing source sizes, incomplete source ladder, original source substituted for derivative, and invalid profile. Untampered native output passes with 28 derivatives and six budgeted candidates and remains idempotent.

The native marker records the permitted dimension-attribute shape; it is not provenance authentication. It does not short-circuit candidate ownership, format, descriptor/ladder, sizes, priority, or byte-budget checks. Existing unit tests also exercise source-element budgets, missing priority on ordinary images, alias hash drift on either side, and explicitly rejected non-ladder/mixed/duplicate density cases. These checks remain meaningful after the repair.

## Isolation and cleanup

The initial sandboxed browser launches failed at macOS MachPort registration; those attempts performed no geometry checks. Playwright reported both launched PIDs exited and temporary profiles were cleaned. The normal scoped escalated retry of the expanded harness succeeded using only the bundled `chromium_headless_shell` binary. One browser process served its entire matrix. Its finally block closed the browser, checked the captured owned process tree was absent, and removed the temporary fixture root. Successful output explicitly reported `owned headless processes closed`. The separate static probe also removes its fixture in finally. Temporary reproduction scripts remain at the paths above.

No implementation changes, canonical build, full suite, canonical public/generated/cache writes, push, deploy, or other-chat messages. Only this report is owned. Shared work.md is left to the parent as instructed. No arbitrary art-direction, arbitrary CSS, cross-engine, CLS, runtime-network or release claims are made. Human decisions required: none for this scoped review.
