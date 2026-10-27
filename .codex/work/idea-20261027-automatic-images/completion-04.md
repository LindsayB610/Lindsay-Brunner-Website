# Completion 04: bounded policy and runtime enforcement

Verdict: **NOT READY for integrated release.** Task04 implementation and evidence are handed off for hostile review; the runtime suite correctly fails three consumer scenarios. Fresh repair task08 owns those fixes. No consumer/pipeline/resolver changes, build, commit, push, deploy, remote protection change, GUI browser, sub-agent or new chat was performed here. Parent owns shared work.md and publication.

## Changed files

- `scripts/images/policy.mjs`: TypeScript AST source checker, Hugo-aware inline-script parsing, CSS inspection, source and rendered CLI modes.
- `scripts/images/policy-exceptions.mjs`: five exact reviewed AST sites; no whole-file exemption.
- `scripts/images/POLICY.md`: supported syntax boundary, exceptions, runtime protocol and honest release/CI limits.
- `tests/image-policy.test.mjs`: seven groups, including direct JSX, source aliases/computed writes, DOM construction, attribute writes, HTML/eval/reflective/CSS bypasses, parse failures, inline scripts, and real adapter-file mutation negatives.
- `tests/image-runtime.test.mjs`: one bundled dedicated headless process, Christmas viewport/DPR matrix, delayed React takeover, rotation/avatar network checks, tracker/shortcode originals, cleanup and JSON evidence. No build inside this leaf.
- `.github/workflows/image-runtime.yml`: Node24/Hugo canonical build, headless-shell-only installation, separate runtime step, artifact upload; read-only repository permission.
- `package.json`: source gate in canonical build; rendered policy in browser-free `test:images`; policy/consumer/runtime/release leaves; source fixtures in full test suite; coordinator-requested core review fixture added to `test:images:unit`.
- `task04-runtime-initial.log`: durable copy of the final current-output console log, including three failing assertions. The generated JSON report was read and showed cleanup.remaining=[] before releasing the runtime slot; core07’s subsequent prepare removed it before archival copying. Cleanup and selected-byte facts above were captured from that read, not inferred from the log.

## Criteria and evidence

| Criterion | Result |
| --- | --- |
| New raw JSX image or runtime src bypass fails | PASS: negative fixtures cover direct JSX, alias.src, computed literal/dynamic writes, setAttribute/namespace/alias/destructure, createElement/alias, new Image alias, injected markup, eval/Function, reflection and CSS sources. |
| Exact adapters, no file allowlist | PASS: matching file, symbol, kind, normalized exact node, one occurrence. Mutated/new sinks inside all three real adapter files fail. Turnstile script.src has one exact existing exception. |
| Inline scripts, CSS and parser errors | PASS: authored layouts/static/content plus modules scanned; Hugo actions masked; inline executable scripts and event attrs checked; JSON scripts excluded as data; rendered gate wired. Real source scan: 150 files, zero violations. |
| Canonical build browser-free | PASS: source gate precedes Vite; rendered gate follows finalization. Task03's canonical build included these gates and passed. This chat did not rebuild shared output. |
| Christmas selected sources/bytes/noindex | PASS all four combinations. 390/DPR1: 480.webp, 51,390 bytes; 390/DPR2: 800.webp, 116,002 bytes; 1440/DPR1 and DPR2: 1200.webp, 225,460 bytes. Original 533,071 bytes. One selected derivative request, no original request, ratio/eager/high/noindex assertions pass. |
| React takeover and no duplicate download | Homepage PASS: equal descriptor and one 1600.webp request. About FAIL: equal descriptor/currentSrc but two 320.webp requests at 44,214 bytes each. Strict assertion retained. |
| Rotation/avatars | PASS: rotating Parasail selects 128.webp with 126px sizes; visible Steve Sewell avatar selects 64.webp with 64px sizes; originals absent from requests. |
| Deferred originals and swap behavior | Real zoom shortcode virtual route PASS: no original initially, original on click, no stale srcset/sizes, close clears src, reopen works. Nemesis and Fate FAIL before interaction because both pages have zero matching gallery triggers due corrupted button data attributes. |
| Dedicated headless and cleanup | PASS: actual child process identity confirms bundled chromium_headless_shell, no /Applications process, one browser reused, finally/signal cleanup, zero recorded owned PIDs remaining in every completed attempt. |
| CI/local release enforcement | Implemented; workflow YAML parses. Runtime separate from canonical build. Local `test:images:release` required before push. No claim CI is required by branch protection or blocks Netlify; no remote settings changed. |

## Preserved defects for task08

1. About portrait: `createRoot` replacement refetches `/_img/images/avatar-color-trans.png/lossless/320.webp` after the hidden eager fallback already loaded it. The harness holds nested Vite JS, waits for fallback decode, then releases JS; same descriptor/currentSrc, two actual localhost requests. Fresh context, CDP cache disabled, no-store server. Do not weaken this assertion to ignore duplicates.
2. `layouts/nemesis/list.html` button contains `data-nemesis-lightbox-data-image-profile="thumbnail" src="{{ . }}"` instead of `data-nemesis-lightbox-src`. Runtime selector finds zero triggers.
3. `layouts/fate-of-the-fellowship/list.html` has the equivalent corrupted `data-fate-lightbox-src` attribute. Runtime selector finds zero triggers.

Evidence sent to coordinator and fresh task08. Task03 was already archived; no original implementer was reactivated. Parent granted runtime access only after task03 released its build slot, and this chat released it before core07's build.

## Exact checks and feedback loop

All Node/npm commands used `PATH=/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH`; every shell command explicitly targeted `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`. Scoped worktree writes/headless execution used escalation after initial normal write EPERM; no approval rejection occurred.

- RED: initial `node --test tests/image-policy.test.mjs` failed because policy module did not exist.
- GREEN: `npm run test:images:policy`: **7/7 pass** after implementation and final extra sink negatives.
- `npm run images:policy`: **150 files, 0 violations**, after final checker changes.
- `npm run test:commands`: **PASS**.
- `node --check scripts/images/policy.mjs`, `node --check tests/image-runtime.test.mjs`: **PASS**.
- `js-yaml.load` on `.github/workflows/image-runtime.yml`: **PASS**.
- Scoped `git diff --check`: **PASS**.
- `npm run test:images:runtime`: **FAIL intentionally retained**, 7 scenarios pass / 3 consumer failures, latest log `/tmp/task04-runtime-final-current.log`, durable console log `task04-runtime-initial.log`.
- Initial harness iterations corrected nested Vite route interception, hidden-fallback waiting (existing js-enabled CSS), and root URL server containment. Those harness failures were resolved before the final report above. The final real failures were not suppressed.

## Limits and next checks

Current public output predates task03's small dialog-placeholder markup fix (documented one-pixel data GIF). Harness accepts either no src or that exact non-network placeholder initially; fresh integrated build/rerun required. Core07 pipeline repairs are concurrent and were not certified by this earlier report. Task08 must repair consumers; task05 owns integrated rebuild/full suite, remaining slot measurements, seven-run timing comparison and release evidence. No broad visual/production/CDN approval is implied.

The checker is bounded syntax enforcement, not arbitrary JavaScript proof. New metaprogramming/import patterns require review; exact assignment approval does not validate arbitrary surrounding adapter logic. CI workflow has not been run remotely. Do not release until the final local runtime check is green on the actual final build.

## Scoped follow-up: retained portrait readiness

Coordinator requested one test adjustment for task08's real fallback-image retention repair. Coordinated exact host selector with task08: `[data-image-react-host="retained"] img[data-image-source="/images/avatar-color-trans.png"]`. The runtime test now waits for that mounted host, holds an ElementHandle to the original fallback image, and asserts strict DOM node identity for the portrait. Homepage readiness uses its existing React-only `#homepage-root > div` host. Neither path relies on a test marker disappearing. All descriptor/currentSrc, original exclusion and exactly-one-derivative-request assertions remain unchanged. `node --check tests/image-runtime.test.mjs` passes. No runtime/public read or rebuild was run during core07's build slot; fresh integrated task08 execution must prove green behavior. Task08 reports no new raw image JSX or source assignments, so no new policy exception was granted.
