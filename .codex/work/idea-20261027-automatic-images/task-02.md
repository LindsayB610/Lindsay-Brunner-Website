# Task 02: Automatic static and Christmas delivery

Experimental execution artifact. Read spec/work/task and contracts.md if present. Follow $implement-task for this one task (01 discovery only).
Goal: Implement generator/manifest, parsed HTML transformation and mandatory browser-free build/output gate per task01. Cover Christmas and ordinary Hugo/static images automatically while preserving source art, OG URLs/noindex, layout, explicit loading and picture semantics. Own shared pipeline and tests.
Dependencies: 01.
Owned areas: scripts image pipeline; image config; package.json/lock; .gitignore; static/_headers; tests/image-pipeline* and relevant build contracts.
Acceptance: New standalone-only raster works; output variants decode and match descriptors; originals unchanged; Christmas responsive bytes improve; no URL/HTML corruption.
Validation: Focused positive/negative fixtures; cold/cache npm run build; content and build contracts
Autonomy safety: safe scoped reversible work explicitly authorized 2026-10-27. No pushes/deploys/paid/external destructive actions by children. Resolve routine decisions with evidence; report blockers to coordinator, not absent user.
Commit expected: no; coordinator commits checkpoints. Never add -A. You are not alone; do not revert others or edit shared work.md. Coordinate overlapping build artifacts. Handoff completion-02.md with changed files, exact commands/results, criteria mapping and risks, then stop.
