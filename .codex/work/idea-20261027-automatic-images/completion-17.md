# Completion 17: About portrait geometry repair

Ready for fresh independent review. Canonical build/runtime slot released. No commit, push, deployment, threshold relaxation, protected typography/gradient change, or shared adapter behavior change.

## Confirmed cause and repair

Frozen baseline `/tmp/website-image-baseline-20261027/public` uses a plain React portrait without HTML width/height. Optimized delivery adds intrinsic 3072×3072 attributes. Existing CSS set width and aspect-ratio but left height definite at3072. The earlier runtime test checked width only and missed the distortion.

Task16 independently measured frozen/current mobile output; task17 inspected those metrics and frozen bundle before editing. At390, baseline190×190/timeline2269.8125 versus broken190×3072/timeline5151.8125. At360, baseline190×190/timeline2365.03125 versus broken190×3072/timeline5247.03125. Task16 disposable height:auto restored baseline exactly. Task17 ran the same diagnostic harness after final build:190×190 and timeline2269.8125/2365.03125 respectively, exact baseline positions.

Owned changes:
- `src/react/about.tsx`: only add `h-auto` to the existing retained portrait class list.
- `static/css/custom.css`: only add `height: auto` to `.about-devpro-fallback__image` (parent explicitly expanded ownership for same no-JS defect). Existing192/252 widths belong to earlier implementation and remain unchanged.
- `src/components/responsive-image.tsx`: explanatory doc comment only: proportional CSS width needs automatic height; explicit height/crop remains caller-owned. No generic h-auto injection, which could conflict with intentional h-full/object-cover usage.
- `tests/image-runtime.test.mjs`: no-JS360/390/1440 width+height/square regression; retained takeover360/390/1440 width+height/aspect and mobile timeline thresholds unchanged at2550/2450. Original DOM identity, unchanged descriptors/currentSrc, eager/priority, exactly-one-transfer, and no-original checks remain. Reports include rendered dimensions and timeline position.

## Red/green evidence

All commands used worktree `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website` with explicit Node24 PATH `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH`. Browser commands ran only after slot release and final runtime after completed final build exit0. Dedicated Playwright bundled headless shell only.

- RED against pre-repair public: six geometry failures, all height3072 (three no-JS plus three retained); remaining13 groups pass. `task17-runtime-red.log/json`.
- Final `npm run build`: PASS,127 image usages,96 rendered files/0 policy violations. `task17-build-final.log`.
- Final `npm run test:images:runtime`:19/19 PASS, no-JS192×192 mobile/252×252 desktop, retained190×190 mobile/250×250 desktop, one request each. `task17-runtime-final.log/json`. Report confirms zero owned orphan processes.
- `npm run test:mobile:render`: PASS with original360/390 thresholds, dedicated headless launch inspected before execution. `task17-mobile-final.log`.
- `npm run test:content`: PASS. `task17-content.log`.
- Syntax check and `git diff --check`: PASS.
- Same-harness final baseline comparisons: `task17-about-390-metrics.json`, `task17-about-360-metrics.json`; final screenshots remain `/tmp/task16-about-task17-final{390,360}-before.png`. Post-mobile/diagnostic process scan found no headless shell processes. Shell combined diagnostic command exits1 solely because final rg correctly found no matching process; both diagnostic artifacts completed successfully.

The network-isolated runtime suite uses different viewport/font conditions from the baseline diagnostic, so its timeline numbers2213.8125/2253.03125 are not claimed as identical baseline measurements. Same-harness comparisons above establish exact restoration.

Full-suite rerun and hostile review remain parent-owned. This repair establishes About geometry and supported authoring guidance, not arbitrary CSS equivalence for future image consumers.
