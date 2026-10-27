# Independent hostile core re-review, round 2

Verdict: **FIX**. Reviewed committed core changes `d37908a..4ecb7dd` against spec, contracts, task07, the original review, completion07, and implementation. No production/shared work edits. Only this report is owned by this review; parent retains work.md. The uncommitted runtime/policy integration is outside this verdict.

## MEDIUM: A valid marker still bypasses required responsive/profile output

Location: `scripts/images/pipeline.mjs:379–401` (also accepted by the output gate at `:604–606`).

Independent reproduction: prepare a 1000×600 `/a.png`; use its real 320px WebP derivative in:

```html
<img src="/_img/a.png/lossless/320.webp"
     data-image-source="/a.png" data-image-profile="christmas-cover">
```

Both transformation and `validateImages` succeed. Transformation leaves the element exactly this incomplete: no srcset, sizes, width, height, loading or fetchpriority. Gate reports one budgeted candidate. The marker now authenticates source membership, but still causes an early return without proving that responsive delivery or the declared profile was actually finalized. A pasted/stale marker can therefore turn a 1000px cover into a permanently 320px image and omit its priority/dimension contract. A full width-descriptor set without sizes is likewise not checked against the profile.

Smallest correction: on marked rasters, regenerate required presentation fields from the source/profile, or strictly validate a complete supported finalized shape (including responsive candidates, width-set sizes and required img metadata) and fail incomplete shapes. Keep authored density and picture semantics explicit rather than treating every source-owned derivative as completed output. Add negative fixtures for the singleton above and a width-srcset missing sizes. Membership checks should remain.

## MEDIUM: Density srcsets change both display dimensions and effective density

Location: `scripts/images/pipeline.mjs:420–429`, `:440–448`.

Independent reproduction: prepare matching 500×300 `/a-small.png` and 1000×600 `/a.png`, register the resize alias, then transform:

```html
<img src="/a-small.png" srcset="/a-small.png 1x, /a.png 2x">
```

Output includes:

```html
<img src="/_img/a.png/lossless/800.png"
     srcset="/_img/a.png/lossless/640.webp 1x, /_img/a.png/lossless/1200.webp 2x"
     width="1000" height="600" loading="lazy"
     data-image-source="/a.png" data-image-profile="body">
```

The `/1200.webp` stable URL actually decodes to 1000px, as intended by the clamping contract. The defects are the changed 1x pixel width (500 → 640) and forced 1000px element width: the authored density-corrected image is 500×300 CSS pixels, whereas the generated explicit dimensions are 1000×600 absent overriding CSS. The two candidates now also imply different density-corrected intrinsic widths, 640 and 500. The gate accepts this. This is supported static markup, not delayed React takeover. The existing test only checks that the strings `1x`/`2x` remain; it does not prove their semantics.

Smallest correction: preserve the density-corrected presentation dimensions and exact candidate pixel widths, or reject density sets that cannot be faithfully represented by the available ladder. A clearly rejected unsupported case meets the contract; silently rounding dimensions while retaining the density labels does not. Test a real resize pair whose 1x width is absent from the ladder, plus a ladder-aligned pair without explicit img dimensions.

## MEDIUM: Alias declarations survive artwork replacement without revalidation

Location: `scripts/images/pipeline.mjs:407–415`; registrations in `scripts/images/config.mjs:17–41`.

Independent reproduction: create a blue 500×300 `/a-small.png` and red 1000×600 `/a.png`; register `/a-small.png → /a.png`. Transforming even the standalone `<img src="/a-small.png">` replaces the blue artwork with the red target and passes the final gate (five budgeted candidates). Only dimensions/disposition are checked. Thus a registration reviewed as a resize pair remains authoritative after either file is replaced with unrelated same-aspect artwork. Same-path artwork replacement is explicitly part of this pipeline's supported lifecycle.

Smallest correction: bind each reviewed alias to source and target content hashes (manifest already records sourceSha256), and reject drift until the pair is re-reviewed. An equivalent reliable identity check is acceptable; do not infer equality from dimensions or a filename. A regression should first accept a genuine reviewed pair, then replace one side with different same-dimension artwork and require an explicit failure.

This is not a claim that today's eleven aliases contain wrong artwork. I independently compared all eleven current pairs at normalized 64×64 RGB: mean absolute differences ranged 0.445–0.716/255, with 800px sources and 1600px targets and consistent aspect ratios. That supports the current registrations; it does not make future bytes equivalent.

## Original findings: verified disposition

1. **Original/raw-source marker and srcset-only bypasses: repaired in their reproduced forms.** Missing/mismatched markers and raw raster candidates cannot pass as finalized. A srcset-only image now transforms to derivatives and has budgeted candidates; untransformed output is rejected. The broader completion-shape hole above remains.
2. **Existing picture/srcset exemption: repaired for tested width-descriptor markup.** Same-art img sets and typed picture sources now point to generated derivatives, preserve media/sizes/type, and remain idempotent. Distinct identities within a single set and unavailable formats fail explicitly. Source candidates receive budgets. Density semantics are the new adjacent regression above.
3. **Thumbnail budget: repaired.** The deterministic 640px noise fixture produces candidates above 100KB but below the body ceiling, and validation rejects them for the thumbnail profile, including a source-only large candidate and a selected JPEG candidate sharing its fallback URL. No quality reduction was used.
4. **Future bundle publication: repaired for tested supported mappings.** The isolated real-Hugo fixture with future publishDate and an expired leaf emits zero derivatives for both and validates the remaining site. Inherited cascade/publication mapping is explicitly rejected. This verifies bounded YAML leaf support, not every Hugo global date/timezone/config override.

## Execution evidence and limits

- Explicit workdir: `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`.
- Node24 PATH: `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH`.
- Ran `node --test tests/image-pipeline-review.test.mjs tests/image-pipeline.test.mjs`: **18/18 pass**, including negative cases and isolated Hugo execution. These green groups do not cover the three findings above.
- Additional independent script `/tmp/core-round2-probe.mjs` prepared and published only under a unique `/tmp/core-round2-*` fixture, then exercised transform and the actual output gate for incomplete markers, non-equivalent aliases and density sets. Each accepted output is reproduced above; the fixture was removed in `finally`. The script remains available for reproduction.
- Current alias comparisons read source files only. No source bytes changed.
- No canonical build, repository public/generated/cache writes, browser launch, push or deploy. Runtime task08 retained its build slot. Runtime consumer equality, HTML formatting effects, browser network behavior, deployed headers and full integration remain downstream checks, not asserted core defects here.
- Human decisions: none needed to reproduce these defects. Fresh repair should choose faithful density support versus an explicit unsupported-case failure and a durable alias-review mechanism. Parent should commission a fresh fix chat, then repeat review before declaring core READY.
