# Task16: Workshop contract repair and remaining-suite validation

Scoped test repair complete; release remains BLOCKED by the confirmed About portrait geometry regression, assigned to fresh task17. No product, layout, package, core, policy, threshold, fixture-source, commit, push, deploy, or new-chat changes. Only tests/workshop-page.test.js and this completion record were edited by task16.

## Repair

Replaced brittle rendered HTML serialization matching with parse5 DOM checks. Preserved original static/built asset existence, SVG mark URL, exact image alt text, navigation/CTA destinations, external rel/target, download counts, Plausible class tokens, and macOS labels. Every expected raster is now located exactly once by data-image-source, and its delivered src and multiple responsive candidates must exist and belong to that exact source in the full generated manifest. GitHub safety attributes and labels are checked on both actual GitHub CTA elements. No functional assertion was dropped.

## Validation

All commands explicitly used the assigned worktree /Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website and Node24 PATH=/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH. Scoped worktree writes and headless launches used normal escalation after sandbox EPERM; no reviewer rejection. No canonical rebuild or direct raw Hugo command was run. Core unit tests retain their existing isolated Hugo fixture test.

- Workshop built: PASS, including desktop/mobile browser layouts. Final log /tmp/automatic-images-task16-workshop-final.log.
- Christmas catalog, Netlify build contract, dependency runtime, recipe template, dietary, mobile static: PASS.
- Mobile render: FAIL only About timeline position at 390px (5152 vs limit2450) and360px (5247 vs limit2550). Thresholds untouched. Log /tmp/automatic-images-task16-remainder.log.
- AI exporter: all8 leaves PASS (client/page/interaction/visual/function/boundary/runtime/docs).
- Image core unit:25/25 PASS; policy/runtime-source:17/17 PASS; consumers:9/9 PASS; preview:6/6 PASS; link harness:4/4 PASS.
- Tail log /tmp/automatic-images-task16-tail.log records these passes. Its appended intermediate Workshop attempt failed because the compact runtime manifest excludes static-only Pulse sources; the test was corrected to use the full manifest and the final dedicated Workshop run passed.
- git diff --check for Workshop: PASS.
- Inspected browser harnesses and exporter rendering dependencies before execution: Playwright headless true, no GUI channel/executable override, finally cleanup. Runtime guard rejects persistent profiles. Observed binary was bundled chromium_headless_shell-1223. Final process inventory /tmp/automatic-images-task16-browser-cleanup.log contains no remaining headless browser processes.

## About regression evidence for task17

Isolated read-only static servers compared canonical public to frozen /tmp/website-image-baseline-20261027/public, without replacing either. Temporary script /tmp/task16-about-diagnostic.cjs changes height:auto only in disposable browser DOM after recording original geometry; no source/build output changes.

| Viewport | Baseline portrait | Current portrait | Baseline timeline top | Current timeline top | Current with DOM height:auto |
| --- | --- | --- | --- | --- | --- |
|390px|190×190|190×3072|2269.8125|5151.8125|190×190; timeline2269.8125|
|360px|190×190|190×3072|2365.03125|5247.03125|190×190; timeline2365.03125|

Current retained portrait has width=3072 and height=3072 attributes, aspect-square/w-full/object-contain classes, computed width190px/height3072px. Baseline lacks intrinsic dimension attributes and renders square. This isolates the introduced height interaction; fresh product repair owns the fix and regression coverage.

Evidence: /tmp/task16-about-current-metrics.json, /tmp/task16-about-baseline-metrics.json, /tmp/task16-about-current360-metrics.json, /tmp/task16-about-baseline360-metrics.json. Screenshots use the corresponding /tmp/task16-about-{current,baseline,current360,baseline360}-{before,height-auto}.png paths. Parent and task17 received measurements and paths.

Canonical build/runtime slot RELEASED after final cleanup. Parent retains independent review and final full-suite responsibility.
