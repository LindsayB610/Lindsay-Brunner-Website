# Task16 independent Workshop contract review

Verdict: READY for the scoped test repair. No actionable regression or broad weakening found in `tests/workshop-page.test.js`. This is not whole-release approval; task17 owns About repair and the parent owns final release validation.

Reviewed AGENTS.md, spec.md, completion-16.md, the complete Workshop test and its diff against HEAD. No implementation, build, browser suite, generated output, or public file was changed.

## Contract evidence

- Lines 254–265 bind each expected raster's exact original source to exactly one img via data-image-source, then check its exact alt, delivered src membership in that source's full-manifest variants, multiple srcset candidates from the same source, public-file existence, optimized /_img/ delivery, and sizes on that same element. Original static and built source existence checks remain. The SVG mark remains an exact img src check. Full manifest use correctly includes static-only Pulse sources.
- Lines 268–276 require both actual workshop-github-link anchors to retain the repository destination, _blank target, separate noopener/noreferrer tokens, and GitHub label. Unrelated safe links cannot satisfy those checks.
- Lines 277–297 preserve two product download links, one launch-post link, site-wide tracking, the post-specific class, and macOS labels. Class checks use tokens on the actual destination anchors; both product anchors are checked individually and exactly two anchors carry the product event. Netlify destination/source-partial checks remain unchanged.
- Parsed attribute access removes serialization dependence without discarding semantics. The proof-list prohibition now detects its class token regardless of quoting or additional classes. Browser assertions and thresholds are unchanged.

## Independent validation

Node 24.21.0 with explicit PATH=/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH. Read-only VM harness `/tmp/review-workshop-contract.cjs` evaluates the actual source/rendered contract functions, omitting the run entry point and browser invocation. It substitutes parsed-and-reserialized Workshop markup only in memory; the baseline source/rendered checks pass with zero failures.

Twelve independent in-memory mutations each triggered the expected failure: wrong source provenance, wrong alt on the correct image, another image's derivative, missing responsive candidates, missing sizes, wrong GitHub destination, missing GitHub rel, missing GitHub target, wrong GitHub label, missing download tracking, wrong download destination, and wrong download label. Exit status 0 means baseline and all twelve expected rejections passed. Other links/images remain intact during each mutation, exercising same-element binding. `git diff --check -- tests/workshop-page.test.js` also passed.

Limits: no independent browser rerun or canonical rebuild, as assigned. Srcset descriptor validity, derivative byte identity and comprehensive responsive sizing belong to the image-pipeline contracts; this repair adds candidate/provenance checks and does not claim to replace those. Labels use includes/endsWith as visible-text contracts, preserving or strengthening prior substring/regex semantics rather than enforcing exact accessible-name equality. About regression is outside this review.
