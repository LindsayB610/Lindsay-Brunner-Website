# Task 04: Enforcement and runtime validation

Experimental execution artifact. Read spec/work/task and contracts.md if present. Follow $implement-task for this one task (01 discovery only).
Goal: Implement bounded AST policy across actual consumers and inline scripts, exact exceptions, negative fixtures for new raw React img and unregistered runtime src assignments. Add dedicated-headless network tests of selected sources, bytes, no double fetching, Christmas mobile/desktop DPR1/2. Own policy and runtime test files/CI; coordinate package wiring after task03.
Dependencies: 02.
Owned areas: scripts image policy; tests/image-policy* and image-runtime*; image CI workflow; package command/gate wiring; no runtime consumer edits.
Acceptance: New bypasses fail build; legitimate consumers pass with precise exceptions; meaningful runtime assertions; no GUI launches; noindex retained.
Validation: Bypass fixtures and real source gate; dedicated-headless runtime tests with cleanup
Autonomy safety: safe scoped reversible work explicitly authorized 2026-10-27. No pushes/deploys/paid/external destructive actions by children. Resolve routine decisions with evidence; report blockers to coordinator, not absent user.
Commit expected: no; coordinator commits checkpoints. Never add -A. You are not alone; do not revert others or edit shared work.md. Coordinate overlapping build artifacts. Handoff completion-04.md with changed files, exact commands/results, criteria mapping and risks, then stop.
