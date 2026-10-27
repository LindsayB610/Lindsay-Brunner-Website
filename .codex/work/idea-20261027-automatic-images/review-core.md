# Independent hostile review: task02 static pipeline

Verdict: **FIX**. Reviewed checkpoint `d37908a` against spec, contracts, task02 and actual implementation. Task03/04 runtime consumers and source-policy work are excluded. Only this report was written; no code or work.md edits.

## HIGH: Completion markers and srcset-only images bypass the static gate

Locations: `scripts/images/pipeline.mjs:359-369`, `:529-542`, `:574-580`.

Reproduction: prepare a 1000×600 `/a.png`, copy its original and publish derivatives, then transform/validate either `<img src="/a.png" data-image-source="/nonexistent.png">` or `<img srcset="/a.png 1000w">`. Both pass, retain the original fetch and report `budgetedCandidates: 0`. Any nonempty marker triggers the idempotence shortcut; the marker source is never validated. Srcset-only img is skipped by the transformer and by the unfinalized-image check despite being a valid network image.

Impact: copied/new static markup can silently escape automatic optimization and budgets. These are task02 HTML failures, not unfinished task04 JS coverage.

Smallest correction: process candidate sets regardless of src; validate marker identity and candidate membership, then recompute or strictly verify expected descriptors. Add both negative fixtures and a mismatched marker on otherwise valid derivatives.

## HIGH: Existing pictures/srcsets are blanket-exempt from automatic delivery

Locations: `scripts/images/pipeline.mjs:380-400`; existing-picture fixture in `tests/image-pipeline.test.mjs`.

Reproduction: `<picture><source type="image/png" srcset="/a.png 1000w"><img src="/a.png"></picture>` with the source above. Transformation adds metadata/loading/dimensions but leaves both candidates on the original. Gate passes with zero budgeted candidates. Plain authored img srcsets are similarly untouched. The existing test checks media/type preservation without asserting optimized delivery.

Impact: authors who already supply responsive markup escape both optimization and budgets. This simple same-art picture is unambiguous. The completion record acknowledges the behavior but does not amend the accepted contract.

Smallest correction: regenerate same-art candidate sets while preserving sizes/media and compatible format semantics. Transform each registered art-direction source independently, or fail with document/selector for unsupported cases. Validate budgets on actual source-element candidates as well as img candidates. Do not silently certify unsupported pictures.

## MEDIUM: Thumbnail budget is absent

Location: `scripts/images/pipeline.mjs:543-557`.

Reproduction: generate a 640×640 RGB noise JPEG at quality 95, prepare it, transform `<img src="/noisy.jpg" data-image-profile="thumbnail">`, validate. Observed WebP: 320px/53,690 bytes, 480px/140,354 bytes, 640px/286,026 bytes. Gate passes with three budgeted candidates and no exception. Contract ceiling for thumbnails ≤640 is 100,000 bytes; code uses the 400,000-byte body-photo ceiling for every non-cover photo.

Impact: explicit thumbnail candidates exceed the accepted limit by nearly 3× undetected.

Smallest correction: implement profile-to-budget rules including thumbnail ≤640/≤1200 ceilings and apply them to all actual selected candidates. Test an image above the thumbnail limit but below the body limit. Preserve quality and use exact reviewed exceptions when necessary.

## MEDIUM: Leaf bundles ignore publishDate and break valid scheduled builds

Location: `scripts/images/pipeline.mjs:98-125`.

Reproduction: isolated real Hugo site using the repository blog permalink, `content/blog/future/index.md` with `date: 2026-01-01`, `publishDate: 2099-01-01`, and adjacent `private.png`. Prepare classifies it as raster and generates 14 variants. Hugo omits the future bundle. Publish copies its derivatives; validate then fails ENOENT on `/blog/2026-01-01/future/private.png`.

Impact: a valid scheduled leaf bundle breaks the canonical build and unnecessarily stages unpublished derivatives. The final gate blocks successful publication, so this is not a claim of a deployed privacy leak. The draft-only fixture misses this condition.

Smallest correction: match Hugo effective publish-date semantics for supported bundles; explicitly reject unsupported inherited publication/build mapping rather than guessing. Add a real-Hugo fixture asserting no unpublished derivatives and successful remaining-site validation.

## Evidence and limits

- Node24 `node --test tests/image-pipeline.test.mjs`: 7/7 pass. Independent fixtures reproduce every finding above. Temporary roots were removed in finally blocks. Hugo ran only in an isolated fixture; no repository public build or GUI browser.
- Independently counted current generated manifest: 273 entries, 3,384 variants, **277,062,298 bytes (264.2 MiB)**, 2,774 distinct byte hashes. This exceeds the request's approximate 248 MB. Duplicate clamped-width paths partly implement accepted old-URL compatibility; do not remove them casually. No accepted hard build-size ceiling exists, so cost alone is not a defect.
- Completion's cold 123.80s/~982MB RSS and warm 37.56s/~661MB RSS were not remeasured. Task05 must assess cost independently; network savings are not total cost savings.
- Ordinary cache corruption/reuse and original-byte/alpha/orientation/animation fixtures pass. Unique cache temporary names address the obvious worker race. Whole prepare calls still clear shared generatedDir; serialized orchestration remains task05's responsibility.
- Header gate checks literal strings, not effective deployed responses. Inspected `_headers` and consulted https://docs.netlify.com/manage/routing/headers/ . No deployed response tested. Task05 must verify overlapping global/extension/derivative cache behavior for WebP and fallback PNG/JPEG plus Christmas noindex. No unproven header-precedence defect asserted.
- Exact 438-byte body-photo exception is narrow, but its owner says `task02 implementation (coordinator review)`. Coordinator review remains outstanding; do not lower quality to remove 438 bytes.

Human decisions: coordinator acceptance of the exact provisional body-photo exception and measured build/storage overhead. Fresh fixes should address the four findings, followed by repeat independent review and integration evidence. No push/deployment performed.
