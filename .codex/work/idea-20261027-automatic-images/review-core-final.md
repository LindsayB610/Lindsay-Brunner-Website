# Independent core review, pass 3

Verdict: **FIX**. Review scope: task09 changes since `4ecb7dd`, current pipeline/config and adjacent presentation behavior. Task10 runtime discovery/policy enforcement remains a separate review. Only this report is owned; shared work.md and implementation are unchanged.

## MEDIUM: Picture density dimensions never reach the presenting img

Location: `scripts/images/pipeline.mjs:474–477,519–522`.

Reproduction: prepare a 640×384 `/a.png` and genuine 320×192 `/small.png` resize with the reviewed hash-bound alias. Transform:

```html
<picture>
  <source type="image/png" srcset="/small.png 1x, /a.png 2x">
  <img src="/a.png">
</picture>
```

The source transforms faithfully to 320px/640px PNG candidates at 1x/2x, but the fallback img is finalized independently first and receives `width="640" height="384"`. Dedicated headless Chromium at DPR1 measured **320×192 before, 640×384 after**, with `naturalWidth` still 320 after selecting the source. The output gate accepts five budgeted candidates and a second transform returns the same incorrect output. Thus the supported, exactly representable density picture is enlarged and its 1x source becomes undersampled. This is not the deliberately rejected non-ladder case.

Smallest correction: handle presentation at picture scope before injecting fallback dimensions. Preserve the selected source's density-corrected dimensions, using source-specific presentation where necessary, or explicitly reject picture combinations whose presentation cannot be retained. Do not silently use fallback source dimensions for every selected branch. Add a regression with this real resize pair, no authored dimensions, and actual rendered before/after dimensions. Cover a media-selected branch as well; do not require general arbitrary art-direction support.

## MEDIUM: A standalone resize alias adopts the larger canonical source's display size

Location: `scripts/images/pipeline.mjs:461–477`.

Using the same genuine hash-bound pair, transform `<img src="/small.png">`. The canonical derivative family is correctly `/a.png`, but the injected dimensions are 640×384 rather than the authored source's 320×192. Dedicated headless Chromium measured **320×192 before, 640×384 after**. Validation accepts three budgeted candidates, and repeated transformation preserves the enlarged result. Hash identity protects artwork identity; it does not make the two files' intrinsic presentation dimensions interchangeable. CSS that explicitly fixes the image dimensions can mask this, but supported unstyled/static markup changes layout.

Smallest correction: retain the authored source's intrinsic dimensions for presentation when no density set or explicit dimensions supplies them; use the canonical alias target for delivery variants only. Add a standalone alias regression asserting width/height and rendered size. Existing explicit width/height overrides must remain intact.

## Previous three findings: verified disposition

1. Incomplete finalized markers: reproduced singleton, absent sizes, absent priority, and absent width are rejected by both transformation and the actual output gate. Complete finalized output remains idempotent. The prior completion-shape bypass is repaired for these cases.
2. Density srcsets: direct img 320/640 at 1x/2x retains exact candidate pixels and 320×192 dimensions; decoded derivatives and browser rendering agree. The non-ladder 500/1000 case fails explicitly, as permitted. Duplicate/mixed density descriptors and invalid dimensions fail closed. The picture variant above remains a separate presentation gap.
3. Alias artwork drift: current tests first accept registered genuine bytes, then replace either source or target with different same-size art and require hash-drift failures. Both hashes are checked before substitution; today's eleven registrations are explicit byte identities. The standalone presentation issue above does not dispute artwork identity.

Width-only and height-only direct img handling passed the regression tests. An independent height-only fixture retained 100×60 before/after; explicit 100×100 dimensions also remained unchanged. Existing width-picture media/type/sizes and idempotence cases pass. No support requested for rejected fractional/nonrepresentable density sets or general Hugo configuration.

## Execution evidence and limits

- Explicit workdir: `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`; Node24.21.0 PATH.
- Read spec, contracts, work manifest, task09, completion09, prior round2 review, current implementation and tests; inspected diff against `4ecb7dd`.
- `node --test tests/image-pipeline-round2.test.mjs tests/image-pipeline-review.test.mjs tests/image-pipeline.test.mjs`: **23/23 pass**. Harness inspected; only isolated temporary fixtures and the existing isolated Hugo fixture are built.
- Independent static/gate probe: `/tmp/core-pass3-probe.mjs`. Independent rendered probe: `/tmp/core-pass3-browser-probe.mjs`. Both create unique `/tmp/core-pass3-*` roots, publish only there, and remove fixtures in finally. Re-run with Node24 from this worktree. Scripts remain available for reproduction.
- Rendered probe uses one Playwright bundled `chromium_headless_shell` process, intercepted local fixture responses, no canonical server and no GUI browser. Initial sandbox launch failed at macOS MachPort registration; the scoped escalated retry passed. Owned headless process tree was captured and verified absent after browser.close; temporary fixtures removed.
- No canonical build, repository public/generated/cache mutation, artwork edits, implementation changes, push or deploy. Task10's shared build/runtime slot remains untouched. This report is not full integration/release approval.
- Human decisions: none required. Parent should route these findings to a fresh repair chat and repeat review.
