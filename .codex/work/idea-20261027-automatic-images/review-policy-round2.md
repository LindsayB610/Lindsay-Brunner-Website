# Task10 independent hostile enforcement review

Verdict: **FIX**. Fresh review, 2026-10-27. Two bounded-syntax findings remain. The original three reproductions are repaired; automatic React membership is verified.

Read AGENTS.md, spec/contracts, review-policy.md, completion-10.md, current policy/exceptions, runtime discovery, pipeline projection, resolver, real React adapter and focused tests. Explicit workdir: `/Users/lindsaybrunner/.codex/worktrees/automatic-image-optimization/Lindsay-Brunner-Website`. Only this report was written in the checkout. No implementation/shared-work edits, canonical build, public/.generated/.cache writes, browser launch or publication. Test fixtures used isolated temporary roots with suite cleanup.

## MEDIUM: Direct CSS image assignments escape the CSSOM rule

Location: `scripts/images/policy.mjs:44–48`, compared with imageStyle at line 16 and setProperty handling at line 56.

Each returns zero failures from inspectScript under `src/lib/responsive-image.ts` and inspectHtml in a script under `layouts/a.html`:

```js
element.style.mask = next;
element.style.borderImage = next;
element.style.webkitMaskImage = next;
```

The assignment list catches backgroundImage and maskImage but omits these other image-bearing properties. The equivalent setProperty('mask', next) is rejected. Node VM probes with a recording style object confirm the supplied `url(/images/unregistered.png)` value is assigned. No browser network claim is made from that probe. A runtime value from a data attribute evades literal URL scanning.

Impact: ordinary direct CSSOM mutation can install an unregistered original/network image after static validation. This is the same assignment syntax already checked for backgroundImage, not arbitrary data-flow inference.

Repair: use consistent image-property classification for direct assignments and CSSOM calls, including supported camel-case vendor names. Preserve ordinary non-image assignments. Add source and inline negatives.

## MEDIUM: Parenthesized receivers bypass reflective API checks

Location: `scripts/images/policy.mjs:18,64`; receiver and destructuring initializer are matched using raw getText.

```js
(Reflect).set(image, "src", next);
(Object)["assign"](image, {src: next});
const mutate = (Reflect)["set"]; mutate(image, "src", next);
const {set: mutate} = (Reflect); mutate(image, "src", next);
```

Each returns zero source and inline failures, including under the registered adapter filename. Executed each independently in Node VM with image={} and next='/images/unregistered.png'; every result sets image.src to that path. Transparent parentheses around the exact forbidden global evade receiver recognition; destructuring has the same initializer gap.

Impact: explicitly prohibited reflective source writes remain usable in authored and rendered-inline code without review. This requires no inferred aliases or whole-program analysis.

Repair: unwrap transparent grouping expressions before recognizing the known global receiver and destructuring initializer, retaining normalized literal member checks. Add direct-call, extraction and destructuring negatives.

## Confirmed repairs and evidence

- Node24 PATH: `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin:$PATH`.
- Ran `node --test tests/image-policy.test.mjs tests/image-runtime-sources.test.mjs`: **14/14 pass**.
- Isolated preparation creates a new raster outside curated paths, discovers the literal, projects lean membership, transpiles the real ResponsiveImage adapter and successfully server-renders responsive markup. Missing/unresolved sources fail actual prepareImages with file/location. Named aliases and literal/expression/template forms pass.
- Original shorthand/setProperty and unparenthesized literal-bracket reflective calls/extractions/destructuring now fail.
- Exact-exception tests pass: added sinks in real adapters, duplicated exact sinks and altered expressions fail. No further exception finding.
- In-memory Vite resolver bundle regression passes: build paths/hashes, alias metadata, runtime-sources and build config markers excluded. Reviewed lean projection strips build fields. No claim based on concurrently rebuilt canonical output.
- Focused build-contract test passes: preparation/source gate precede Vite, rendered policy remains in static gate, runtime is separate and CI uses dedicated headless shell.

Limits: no canonical integration build or browser runtime rerun, per ownership constraint. Dynamic registrations remain bounded literal inventories and forwarding sites, not proof of surrounding mutations. Findings require no wrapper/re-export or whole-program inference. No deployment, required CI, visual or performance claim. Parent should use a fresh repair agent and repeat focused review plus integrated release checks.
