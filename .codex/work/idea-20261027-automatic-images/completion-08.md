# Completion 08: runtime consumer repairs

Verdict: **READY for fresh independent integration review.** Shared consumer/build/runtime slot released after this report. No commit, push, deploy, paid call, GUI browser, package/pipeline/resolver/policy-exception edit, shared work.md edit, or other-author revert.

Workdir for every command: `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`. Node24 PATH `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH`. Initial work remained read-only until coordinator released core07 build and granted consumer edits/builds.

## Reproduced failures

1. Task04 durable `task04-runtime-initial.log`: delayed About createRoot takeover fetched the identical `/_img/images/avatar-color-trans.png/lossless/320.webp` twice, 44,214 bytes each, in fresh CDP cache-disabled/no-store context. Isolated bundled-headless reproduction independently proved replacement node = two transfers; retaining/reparenting loaded node = one. Cleanup found zero owned children.
2. Both tracker buttons had malformed `data-*-lightbox-data-image-profile="thumbnail" src="..."` instead of `data-*-lightbox-src`. Original six source-only groups passed despite this. New regression on actual generated button attributes failed before repair: `nemesis: missing original-source trigger`.
3. Added Nemesis rendered-slot check failed at viewport900: displayed width711.625px but selected derivative640px. Durable red log: `task08-runtime-slot-before.log`.

## Repairs and ownership

- `src/components/responsive-image.tsx`: add narrowly typed `RetainedResponsiveImage` (src/profile/alt/className/fallbackImage only). It verifies every source descriptor attribute against the shared resolver before adoption; absent/stale fallback uses the normal ResponsiveImage. Matching element moves into a `display:contents` React host during layout effect; only alt/class change, never src/srcset/sizes/loading/priority. Cleanup detaches only its own child and preserves the object for StrictMode effect replay. Original JSX adapter/AST exception unchanged.
- `src/react/about.tsx`: capture the server-rendered portrait before createRoot, pass it through AboutPage/AboutIntro, and use retained adapter. Existing frame/classes, eager loading, priority, accessible alt and content remain.
- `layouts/nemesis/list.html`, `layouts/fate-of-the-fellowship/list.html`: restore exact original-source trigger attributes. Original URLs remain interaction data, optimized thumbnail is the visible image.
- Nemesis only: explicit sizes for the measured641–900 single-column range accounts for container/frame/screen/card borders and padding plus clamped section padding. At900 the browser now selects800 for711.625 CSS pixels. Other ranges retain prior conservative settings; no crop/art changes.
- `tests/image-consumers.test.mjs`: actual generated button regression, retained matching/stale/absent descriptor regression, actual effect callback replay/ownership regression with source setters forbidden. Nine groups pass.
- `tests/image-runtime.test.mjs`: task04 supplied actual host readiness and original ElementHandle identity assertion; task08 kept these and all exact-one-request/descriptor/currentSrc/original-exclusion assertions. Added no-JS About390/1440, Nemesis640/800/900/1440 slot checks, and visible portrait frame/alt/eager/priority checks. `loaded()` now waits complete+naturalWidth before decode: lazy elements can become visible before fetching starts, and immediate decode produced transient EncodingError. Missing/broken images still fail; no retries conceal extra requests.

No source-policy exceptions were added. Core/policy/package changes in this checkout belong to other chats.

## Validation

- Canonical `npm run build`: **PASS**, final log `/tmp/task08-build-final.log`; image finalization127 usages; source policy150 files/0 violations; rendered policy96 files/0 violations. Final runtime ran only after build process exit0.
- `node --test tests/image-consumers.test.mjs`: **9/9 PASS**, `/tmp/task08-consumers-final.log`.
- Targeted strict adapter TypeScript: **PASS** (`npx tsc --ignoreConfig --noEmit --skipLibCheck --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --resolveJsonModule --allowSyntheticDefaultImports src/components/responsive-image.tsx src/lib/responsive-image.ts`). No claim full-repo typecheck passes.
- `npm run test:images:runtime`: **16/16 PASS**, no errors; durable `task08-runtime-final.log` and `task08-runtime-final.json`. Bundled Chromium headless shell only, no installed GUI binary, and final report confirms zero owned orphan processes. Browser contexts enforce cache disabled, service workers blocked, external requests blocked, and no-store server responses.
- `npm run test:content`: **PASS**, `/tmp/task08-content.log`.
- `node tests/homepage-react-island.test.js`: **PASS**.
- `node tests/style-boundaries.test.js`: **PASS**.
- `git diff --check`: **PASS**.

## Evidence limits and corrected test assumptions

The existing head.html deliberately hides the JS-enabled Hugo About fallback. Its before-takeover display width is0 although its eager image downloads. Thus geometry equality with that hidden node is invalid; final assertion checks the existing visible desktop React image slot250px (280px frame less30px border/padding). No-JS fallback separately verifies192px mobile/252px desktop, heading and contact link visibility, decoded optimized portrait and eager loading. The 252px descriptor remains conservative for the250px rendered React slot.

One first runtime invocation began during the read-only static-validation tail of an already-finalized build and hit a homepage lazy decode timing error. Expanded slot tests reproduced the same lazy-start timing, leading to the explicit successful-load wait described above. Final completed-build runs and their saved report are the readiness evidence. An added geometry equality assertion initially failed on the intentionally hidden fallback and was corrected against the owning head.html contract, not by changing page display behavior.

StrictMode replay is exercised by invoking the real retained component effect callback with hook/DOM mocks, with any source setter failing the test. Real-browser node identity/network behavior is separately proven by the delayed production takeover scenario. Full suite, broader visual review, optimized preview and independent hostile integration review remain task05/coordinator work; no production-readiness claim.
