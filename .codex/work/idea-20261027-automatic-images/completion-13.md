# Task 13 completion: optimized-preview lifecycle

Verdict: **READY for fresh independent review**, not integrated release approval.

## Scope and changes

- scripts/preview-optimized.mjs: discarded builds and discarded snapshot copies invalidate the comparison sentinel, so an edit/revert cannot suppress the pending rebuild. Cancellation is checked after asynchronous fingerprint and snapshot operations before subsequent work. Shutdown is idempotent, closes the HTTP listener/connections immediately, sends TERM to the active build process group, escalates to KILL after a default 1000 ms grace period, and awaits the build child exit and listener closure. The captured group ID survives leader exit so TERM-resistant descendants are still killed. Spawn errors clear the child reference.
- tests/optimized-preview.test.mjs: retain the original serialization/addition/deletion/failure/recovery test; add deterministic edit/revert at both post-build and post-copy checks; cancellation while initial fingerprint is suspended; two real process-group cleanup cases (leader ignores TERM, or leader exits while its descendant ignores TERM). Fingerprint and shutdown-grace options permit deterministic isolated tests.
- task-13.md and this completion record only. Parent retains work.md ownership and the canonical build slot.

## Acceptance and evidence

RED: with the fingerprint seam installed but original lifecycle behavior retained, the edit/revert fixture timed out, initial-fingerprint close failed its immediate listener-closure assertion, and the real subprocess fixture failed its immediate closure assertion. Original regression still passed: 1/4. Test cleanup force-killed the fixture process group after the failed assertion.

GREEN under Node 24.21.0:

- `node --test tests/optimized-preview.test.mjs`: 6/6 passed.
- `node --test tests/optimized-preview.test.mjs tests/image-policy.test.mjs tests/image-runtime-sources.test.mjs`: 23/23 passed, 0 skips, approximately 2.9 seconds.
- `node --check scripts/preview-optimized.mjs` and `node --check tests/optimized-preview.test.mjs`: passed.
- `git diff --check`: passed for the shared tracked diff. Owned implementation/test files are new/untracked in the parent integration tree.
- Real subprocess tests use a temporary npm executable and temporary root; they assert shutdown within two seconds with a 100 ms test grace, and assert both leader and descendant PIDs no longer exist. Fixtures/listeners are removed in finally blocks. An additional scoped process scan after the combined run returned no matching fixture processes. Initial sandbox ps denial was resolved by the normal scoped approval mechanism; no automatic review rejection occurred.

No canonical build, public/cache/generated mutation, GUI/headless browser, commit, push, deployment, or other-chat messaging. Related policy/runtime-source tests used temporary/in-memory fixtures. Shared existing edits were preserved. Full build/content/full-suite evidence remains owned by the parent and is not claimed here.

## Remaining limits

Fresh independent review is required by the parent workflow. Process-group cleanup was verified on macOS/POSIX; Windows direct-child signaling remains unverified (process-group fixtures explicitly skip Windows). Arbitrary injected build/fingerprint callbacks are expected to settle; process escalation applies to subprocesses spawned by the default build runner. No new production or remote CI claim.
