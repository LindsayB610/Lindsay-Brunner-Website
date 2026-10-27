# Task 13: Preview lifecycle repair

Authorized implementation slice, safe for autonomous implementation. Dependencies: parent task05 preview implementation and review-policy-preview.md are present. Own scripts/preview-optimized.mjs, tests/optimized-preview.test.mjs, task-13.md and completion-13.md only. Parent owns work.md and full build slot.

Repair both review findings: discarded edit/revert builds must retry without further edits; cancellation during fingerprint must not spawn builds; shutdown must close HTTP promptly and terminate/reap TERM-resistant process groups within a bounded grace period. Isolated temporary fixtures only, including real subprocess cleanup. Preserve other contributors' changes. No canonical build/public/cache/generated mutation, commit, push or deploy. Hand off for fresh independent review.

Status: repair complete; focused verification READY; fresh independent review and parent integration checks pending. See completion-13.md.
