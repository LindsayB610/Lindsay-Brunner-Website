# About portrait geometry review

Verdict: READY for this scoped repair. No actionable findings. Parent owns full-suite acceptance and publication; this is not release approval for unrelated changes.

## Scope and source review

Independent reviewer read AGENTS.md, spec.md, work.md, completion-16.md, completion-17.md, actual About/template/CSS/adapter diff and runtime test source. No implementation, canonical build, source fixture mutation, commit, push, or new chat. Only this report written. Parent retains work.md ownership, overriding the review skill's normal manifest-update step.

- src/react/about.tsx:237 adds h-auto at the affected portrait, preserving aspect-square/w-full/object-contain and the retained image adapter.
- static/css/custom.css:79 adds height:auto only to the About fallback selector. It does not alter explicit crop/height consumers or protected styles.
- src/components/responsive-image.tsx:10–13 documents the caller's CSS sizing responsibility. Adapter behavior and source attribute/DOM retention logic remain unchanged. The existing testimonial h-full/object-cover contract is untouched.
- tests/image-runtime.test.mjs:89–100 checks no-JS width and square height at360/390/1440; lines130–144 assert React width, height, aspect and mobile timeline bounds while preserving descriptor/currentSrc equality, retained DOM identity, exactly one derivative request and zero original fetches. These assertions catch the diagnosed height3072 failure. Existing mobile thresholds were not relaxed.

## Independent runtime evidence

After parent explicitly signaled stable output, copied current public to /tmp/review-about-geometry-frozen/public and compared it with frozen /tmp/website-image-baseline-20261027/public. A preceding run during possible regeneration was discarded as non-authoritative. The authoritative run used explicit Node24 PATH, dedicated Playwright chromium_headless_shell, one browser, isolated contexts, blocked external requests and finally cleanup. Initial sandbox localhost EPERM was resolved by normal scoped escalation; no approval rejection or bypass.

Probe: /tmp/review-about-geometry.cjs. Output: /tmp/review-about-geometry-results.json and /tmp/review-about-geometry.log. Forty measurements cover both outputs, JS on/off, viewport360/390/768/900/1440, DPR1/2. Independent comparison assertions passed. This table embeds the durable result; DPR2 matched DPR1 exactly.

| Viewport | Baseline/current JS portrait | Baseline/current JS timeline top | Current no-JS portrait |
| --- | --- | --- | --- |
|360|190×190|2253.03125|192×192|
|390|190×190|2213.8125|192×192|
|768|250×250|2229.5|252×252|
|900|250×250|1978.15625|252×252|
|1440|250×250|1542.15625|252×252|

All JS width/height/timeline values matched the frozen baseline exactly under the same network/font conditions. No-JS dimensions are intentionally NOT the original baseline dimensions: baseline was260×260 at360–900 and320×320 at1440. The prior task03 slot alignment established current192/252 widths; task17 restores square height at those existing widths. Parent confirmed this distinction.

Hostile disposable DOM probe at390/DPR1 removed only h-auto: portrait reverted from190×190 to190×3072 and timeline from2213.8125 to5095.8125. This independently reproduces the cause and demonstrates the new height/timeline assertions would reject it. No source or frozen output was mutated.

Cleanup: browser/server closed; recorded owned headless PID intersection with final process inventory was empty. Runtime probe exit0. Static git diff --check for About/CSS passed.

Task17's durable runtime record separately reports19 passing groups, retained identity/one-request checks and zero owned orphans; inspected its assertions and report. This reviewer independently measured geometry, not a second complete network-contract run. Full suite remains parent-owned. No human decision required for this scoped repair.
