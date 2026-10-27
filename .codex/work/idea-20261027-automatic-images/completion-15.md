# Task 15: isolate Fate tracker fixtures and load their runtime

Changed only `tests/fate-of-the-fellowship-tracker.test.js` plus this completion record. No production runtime/layout/policy changes.

- All raw Hugo fixture builds now target a unique OS temporary directory; they cannot overwrite canonical optimized `public`. Removed fixture `--gc` to avoid garbage-collecting shared production resources.
- Browser validation navigates to a routed fixture origin and serves real generated files, including `/js/image-dialog.js`. External requests are aborted. Previously `setContent` on about:blank could not resolve the shared runtime, so the opening click failed.
- Existing desktop/mobile opening, alt text, closing, backdrop, layout and screenshot assertions remain. Close assertions now verify the shared runtime's actual contract (cleared src and srcset), rather than the retired placeholder reset. Added explicit shared-runtime availability and uncaught-page-error assertions.
- Bundled Playwright Chromium remains headless and closes in finally. Temporary build output is removed in an outer finally; failures use exitCode so cleanup runs. Existing source session and fixture-image bytes are retained and restored.

Validation (Node 24.21.0 explicitly on PATH):
- `node tests/fate-of-the-fellowship-tracker.test.js`: passed all 10 checks, including both browser viewports. Log: `/tmp/task15-fate.log`.
- SHA-256/file-set comparison of all 420 files under public, data/fate-of-the-fellowship, and static/images/fate-of-the-fellowship: unchanged after both the intermediate assertion-failing run and final passing run. Baseline: `/tmp/task15-before.json`.
- `git diff --check`: passed.
- Post-run process inspection: no chrome-headless-shell or headless Chromium processes remained.

Build/fixture slot released to parent. No commit, push, deploy, new chat or production build performed.
