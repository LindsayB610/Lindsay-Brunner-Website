# Independent policy and optimized-preview review

Verdict: **FIX** for preview lifecycle. The two policy findings from review-policy-round2.md are repaired. This is not integrated release approval.

Explicit checkout: `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`. Read AGENTS.md, spec.md, contracts.md, review-policy-round2.md, completion-12.md, policy implementation/exceptions/documentation, runtime-source fixtures, preview implementation/tests, package scripts, Netlify configuration, image-runtime CI and README. No core/presentation review or canonical build was performed; the concurrent owner retains that scope. Only this report was written in the checkout. No public, generated, cache, implementation or shared-work mutation; no browser or publication.

## P2: Edit then revert strands preview in building state

Location: scripts/preview-optimized.mjs:45–52 and 57.

When a source changes during a build, the code sets `last=before` and returns without publishing, leaving status building. If the source tree returns to that exact pre-build fingerprint before the next poll, `before!==last` is false forever. No further build or publication occurs, even though there is no active build. The same bookkeeping pattern exists after copying.

Isolated reproduction using the exported startPreview and a fake build:
1. Build source `one`, await ready.
2. Change source to `two`; second build writes output and changes source to `three` before returning.
3. Allow the post-build fingerprint to observe `three`, then restore source `two` before the next poll.
4. Wait more than two polling intervals and request the preview.

Observed: `{status:"building",builds:2,http:503}`. This persists until another different edit. This is a normal edit/revert sequence within the required edit-during-build boundary, not a simultaneous external output mutation.

Repair: track a pending rebuild independently of the last fingerprint, or invalidate the comparison sentinel when discarding a build/copy. Do not let a discarded build establish the fingerprint that suppresses the next build. Add an edit/revert fixture that reaches ready without requiring another edit.

## P2: Shutdown is not bounded and can start a build after cancellation

Location: scripts/preview-optimized.mjs:44–48 and 65–68.

Two isolated reproductions:
- Call `close()` immediately after `startPreview()` resolves, while its initial asynchronous fingerprint is pending. Observed `buildsStartedAfterClose:1`. close sees no child, then tick starts the build after cancellation and waits for it. A real build can continue writing output after the user stops the preview.
- Use a temporary executable named npm in an isolated PATH, with a Node child that registers a SIGTERM handler and remains alive. Await its ready PID, then close the preview. After 500 ms: `{close:"still waiting",childAlive:true}`. Inspection confirms there is no timeout/escalation: close awaits the unresolved build forever. The probe explicitly SIGKILLed its own process group afterward, awaited close, and verified `fixtureChildRemains:false`.

Repair: check stopped after asynchronous fingerprint work and before spawning; use bounded graceful termination with process-group escalation/reaping, and close the HTTP listener as part of shutdown rather than only after an unbounded build await. Add lifecycle tests with actual isolated child processes; the existing injected build callback cannot establish subprocess cleanup.

## Confirmed policy repairs and passing evidence

Node24: `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin` prepended to PATH.

- `node --test tests/image-policy.test.mjs tests/image-runtime-sources.test.mjs`: all 17 policy/runtime-source tests passed (executed together with the initially sandbox-blocked preview test).
- Direct mask, borderImage and vendor mask assignments now share the CSSOM property classifier; source and inline negatives pass, ordinary non-image operations remain accepted.
- Parenthesized Object/Reflect receivers are normalized for calls, member extraction and destructuring; exact exception file/symbol/code/occurrence constraints still pass.
- Automatic unrelated React raster membership, missing/unresolved source rejection, real-adapter server rendering and build-only-field exclusion pass in temporary fixtures/in-memory bundles.
- `node --test tests/optimized-preview.test.mjs`: 1/1 passes after scoped localhost permission. Its first attempt failed with listen EPERM from sandboxing, not application behavior.
- Existing preview fixture verifies serialized builds, addition/deletion/edit detection, edit-during-build handling for a non-reverting edit, 503 while building/failed, and recovery on a new edit. It does not cover the two findings above.
- Package/Netlify Dev use the full optimized build path; CI includes preview fixtures and installs only dedicated headless Chromium. README accurately discloses 503 behavior and unverified remote enforcement. No claim that CI is required or Netlify waits for it.

Reproduction scripts were outside the checkout at `/tmp/review-preview-probes.mjs` and `/tmp/review-preview-shutdown.mjs`; fixture roots/listeners/child groups were cleaned up. No GUI browser launched. No production, performance, full regression, remote CI or deploy verification is claimed.
