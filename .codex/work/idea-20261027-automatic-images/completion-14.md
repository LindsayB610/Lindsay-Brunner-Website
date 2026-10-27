# Task14 completion: finalized-output link checks

Ready for independent review; not an integrated release approval.

Checkout: /Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website

## Changes

- scripts/check-links.js now serves existing public bytes with an owned loopback HTTP server. It never invokes Hugo, regenerates output, searches for other processes, or clears an occupied port. Directory index redirects, GET/HEAD, MIME types, realpath containment and missing-file responses are supported.
- The installed linkinator CLI runs directly under process.execPath (no npx wrapper). Existing recursion, RSS/external URL skips, exact Netlify external redirect skips, request timeout and 60-second overall bound remain. Timeout/signals terminate only the owned crawler, escalate after one second, await its close, and close all owned server connections.
- tests/codex-display-article.test.js preserves the parent's provenance/order/alt/loading assertions, validates static source paths separately from generated public /_img paths, permits intentional /images/*.svg passthrough, and checks all gallery/picture srcset candidate files.
- tests/check-links.test.js adds four focused regressions: finalized byte preservation and missing derivative failure, occupied-port isolation/directory serving/path containment, bounded timeout with port reuse, and exact redirect skips.

## Evidence

Runtime: PATH=/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH.

- node --test tests/check-links.test.js: 4/4 pass. Intentional missing derivative yields crawler exit 1. Timeout fixture yields exit 1 and successfully rebinds the same port.
- node scripts/check-links.js against current public: 725 links successfully scanned in 0.2 seconds. Full log /tmp/task14-link-check.log.
- node --test tests/codex-display-article.test.js: 4/4 pass. Initial overly strict generated-only path assertion exposed the gallery's intentional SVG passthrough; corrected narrowly to allow SVG source paths and reran successfully.
- git diff --check -- scripts/check-links.js tests/codex-display-article.test.js: pass.

No canonical build, browser, core/policy/preview/package edits, commit, push, or deployment. Only the two owned files, focused regression file, and this completion document changed. Parent confirmed its canonical build passed and owns frozen-snapshot performance measurement plus the full suite. Add the standalone harness regression to an appropriate suite command if desired; package ownership remains with parent.
