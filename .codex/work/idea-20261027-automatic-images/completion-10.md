# Task10 completion: enforcement repair

Verdict: READY for fresh independent review. No commit, push, deploy, GUI browser or shared work.md edit. Parent owns independent review and final publication. Task09 released pipeline/build slot explicitly before integration; its changes were preserved. Task05 owns full repository suite and performance comparison.

## Changes and acceptance

- New build-only `scripts/images/runtime-sources.mjs`: scans src modules for literal ResponsiveImage/RetainedResponsiveImage sources, including named import aliases; selects sources automatically into the existing lean projection. Missing/unresolved/unsupported source forms fail with file:line:column. Current dynamic logos/testimonials use explicit bounded file/component/expression/data-array registrations; array fields are literal-validated, not directory prefixes. Exact retained-image internal forwarding is preserved.
- `scripts/images/pipeline.mjs`: only task10 edits are the helper import and replacing the hard-coded runtimeSources filter with awaited discovery. Core changes belong to09. Also split the public origin scalar in config.mjs and imported that scalar in resolver.mjs, so browser tree shaking excludes task09 build-only alias hashes.
- `scripts/images/policy.mjs`: dynamic shorthand image style members, image-bearing/unresolved CSSOM setProperty calls, CSSOM capability extraction/destructuring, and normalized Object/Reflect dot/literal-bracket calls/extractions/destructuring now fail. Includes computed literal binding names. Ordinary non-image CSS operations remain allowed.
- `tests/image-runtime-sources.test.mjs`: isolated new raster in unrelated directory plus new authored React component; actual prepare writes automatic lean membership, actual transpiled adapter/component renders it. Prepare itself rejects missing and unresolved sources. Static expression strings/templates, named aliases, invalid URLs/spreads, namespace/default imports, corrupted dynamic registrations have fixtures.
- `tests/image-policy.test.mjs`: reviewed CSS and reflective repros, including inline scripts and same adapter filename, fail. Existing precise exceptions remain tested.
- `scripts/images/POLICY.md`: documents supported grammar, dynamic registration bounds and tests. `package.json`: adds source-discovery test to policy leaf and task09 round2 test to core leaf.

## RED and GREEN

Initial added CSS shorthand negative failed against unchanged policy: `const view = <div style={{backgroundImage}} />;` produced no violation (7 existing tests passed, new eighth failed). Review-policy.md independently records all original repros, including successful compile followed by actual component render failure for missing lean membership. New regression uses a genuinely new temporary raster/component, not the pre-existing curated source inventory.

All commands use Node24 PATH `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH`, explicit workdir `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`.

- `npm run test:images:policy`: 14/14 pass.
- `npm run test:images:unit`: 23/23 pass (includes task09 round2).
- `npm run images:policy`: 150 source files, 0 violations.
- `npm run build`: pass. 127 finalized usages, 652 budgeted candidates, existing narrow pork exception unchanged; rendered policy 96 files, 0 violations. `task10-build.log` preserves output.
- `npm run test:images:consumers`: 9/9 pass.
- `npm run test:content`: pass.
- `npm run test:images:runtime`: 16 checks, 0 errors; dedicated bundled headless Chromium148.0.7778.96; cleanup remaining=[] (no orphan owned processes). Evidence `task10-runtime.log`, `task10-runtime.json`. Harness inspected before use: headless-only default launch, explicit dedicated-shell/GUI-path assertions, contexts/browser/server cleaned in finally; no installed-browser channel/executable override.
- Initial browser bundle scan caught task09 alias hashes retained through resolver importing imageConfig for origin. Split exported imageOrigin scalar and changed resolver import to permit removal of build config. Final rebuild passes; actual browser bundles contain no helper markers, sourcePath, sourceSha256 or authoredSourceAliases. An in-memory Vite bundle regression verifies this boundary; lean manifest 18,947 bytes.
- `node tests/test-command-contracts.test.js`: pass.
- `git diff --check`: pass.

## Bounds and remaining work

This is a bounded syntax policy, not whole-program JavaScript analysis. Static source support is root-relative local literal values; computed runtime sources require reviewed registration. Current dynamic registration validates literal inventories and exact forwarding expression sites; it does not prove arbitrary surrounding data flow or mutations. New wrapper/re-export/metaprogramming patterns require review. No broad manual visual approval or performance claim is made. Full repository suite/performance work remains task05; fresh independent enforcement review remains parent-coordinated.
