# Task 05: Development parity and integration

Experimental execution artifact. Read spec/work/task and contracts.md if present. Follow $implement-task for this one task (01 discovery only).
Goal: Implement production-equivalent disk-build watcher/static-server preview and add/change/delete dependency rebuilds. Document authoring, limits, retention and commands. Reconcile existing tests for intentional output changes without weakening coverage. Run full integrated validation; no push.
Dependencies: 03,04,08,09,10 (repair/review follow-ups).
Owned areas: optimized preview scripts; README/docs; package scripts; necessary existing regression-test contract changes; completion evidence.
Acceptance: Preview serves final transformed output without stale manifests; regression checks green; visual/network evidence; exact readiness report.
Validation: Cold build; watch edit lifecycle; focused/runtime tests; full npm test after browser harness inspection
Autonomy safety: safe scoped reversible work explicitly authorized 2026-10-27. No pushes/deploys/paid/external destructive actions by children. Resolve routine decisions with evidence; report blockers to coordinator, not absent user.
Commit expected: no; coordinator commits checkpoints. Never add -A. You are not alone; do not revert others or edit shared work.md. Coordinate overlapping build artifacts. Handoff completion-05.md with changed files, exact commands/results, criteria mapping and risks, then stop.

Integration follow-ups now known: completion03 has 45 valid-boolean/empty-attribute serializer style errors in HTML validation (async/crossorigin/hidden), requiring an explicit formatting-contract reconciliation without disabling functional HTML checks. Two missing-src tracker errors fixed in source via data placeholder, need final rebuild. Codex display tests may expect original built src; preserve source/alt/semantics while asserting actual derivative delivery. Nemesis single-column widths641–900 can exceed conservative640px sizes cap; measure and refine layouts as needed (task03 complete, ownership available). Parent independently reproduced preexisting whole-project tsc errors on b70a2b1; see baseline/typecheck.txt. Do not treat those as new or silently claim global tsc passes.
