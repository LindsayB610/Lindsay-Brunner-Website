# Task 04 hostile enforcement review

Verdict: **FIX**. Fresh review, 2026-10-27. Three actionable findings. No human decision required.

Scope: completed task04 enforcement, source exceptions, browser-manifest membership, runtime assertions and CI wiring. Read spec.md, contracts.md, task-04.md, completion-04.md, work.md, policy implementation/tests, adapters, runtime suite and workflow. Task08 portrait/gallery repairs and core round2 pipeline findings are intentionally excluded. Only this report was written; no code/work.md/public changes, canonical build, browser launch or publication.

## HIGH: Supported React images compile but fail at render because membership is hard-coded

Location: `scripts/images/pipeline.mjs:310–321`; missing check at `scripts/images/policy.mjs:37`; actual failure at `src/components/responsive-image.tsx:13`.

Reproduction: author `<ResponsiveImage src="/images/workshop/slate-library.png" alt="New ordinary image" />` in an ordinary React module. This existing local raster is processed in the full manifest, but excluded from runtime-manifest.json by the two exact paths / two directory prefixes. `inspectScript` returns zero violations. A virtual Vite entry importing the real ResponsiveImage with this src compiles successfully with `build({configFile:false, publicDir:false, build:{write:false,...}})`. Rendering the actual transpiled component with React renderToStaticMarkup throws `Missing image in manifest: /images/workshop/slate-library.png`. `resolveImage(fullManifest, src)` succeeds and returns the 800px PNG fallback; `resolveImage(runtimeManifest, src)` throws.

Impact: an ordinary supported component usage outside the original logo/testimonial/portrait/shelf inventory can ship a client render exception after a successful compile. Static output validation cannot see client-only markup, and current consumer/runtime tests enumerate existing consumers. The new source need not be exotic or dynamically computed. A new file in another images subdirectory has the same outcome. The canonical build was not rerun or mutated in this review: the source gate, compiler and actual render were exercised independently, and no build stage executes arbitrary new React consumers.

Minimum correction: automatically collect statically resolvable supported React src references into the lean manifest, and fail build with file/location for unresolved runtime sources outside an explicitly supported bounded registration mechanism. Preserve the current supported logo arrays. Add a regression that adds a new ordinary raster outside existing selected prefixes and renders it through the actual component, plus a missing/unsupported source negative. Requiring every ordinary static image author to edit the optimizer's hard-coded path list restores the manual optimization chore and does not meet the automatic-delivery acceptance criterion. General JavaScript data-flow inference is not required.

## MEDIUM: Ordinary CSS image mutation paths bypass both source and rendered policy

Location: `scripts/images/policy.mjs:38` and `46–54`; missing negative coverage in `tests/image-policy.test.mjs`.

Reproductions, each returns `[]` from inspectScript:

```js
const backgroundImage = element.dataset.background;
const view = <div style={{backgroundImage}} />;
element.style.setProperty("background-image", next);
```

The shorthand member is a ShorthandPropertyAssignment, while the checker only handles PropertyAssignment. The direct CSSOM setter is not checked at all. `inspectHtml('<script>element.style.setProperty("background-image", next);</script>', 'layouts/a.html')` also returns `[]`. A VM execution of the second statement with a recording style object confirms the background-image write is made. Values can be ordinary runtime data such as a data attribute containing a URL, so scanning literal `url(...)` strings in the script is insufficient.

Impact: unregistered original/network backgrounds are permitted through supported TSX and inline JavaScript without review or responsive delivery; static markup checks cannot inspect the resulting DOM/CSSOM. This contradicts the claimed rejection of dynamic CSS image properties.

Minimum correction: reject/review shorthand image-bearing style members and direct CSSOM setProperty calls for image-bearing (or unresolved) property names. Apply the same bounded alias/extraction rule already used for DOM mutation capabilities, and add TSX plus inline negatives. Non-image CSS properties should stay usable. No general data-flow analysis is needed.

## MEDIUM: Literal bracket notation bypasses explicit reflective-write bans

Location: `scripts/images/policy.mjs:52–57`.

Reproductions:

```js
Reflect["set"](image, "src", next);
Object["assign"](image, { src: next });
```

Both return zero violations even when inspected under the allowed adapter filename `src/lib/responsive-image.ts`. Running each in a Node VM changes `image.src` to `/images/unregistered.png`. Their dot-notation equivalents are explicitly rejected. The check compares raw expression text to `Reflect.set` / `Object.assign`; the generic computed-call rejection only rejects nonliteral keys. `const make = Reflect["set"]; make(image, "src", next);` likewise passes capability extraction.

Impact: a straightforward alternate spelling of a specifically forbidden sink silently bypasses enforcement, including inside registered adapter files/functions. This is within the contract's computed-property and alias negatives, rather than an arbitrary-program-proof demand.

Minimum correction: match these explicit reflective APIs using their AST receiver and normalized literal member name, and reject extraction of those same capabilities (including destructuring) using the existing bounded capability rule. Add direct literal-bracket and extraction negatives for the currently prohibited APIs.

## Evidence and limits

- Node24 PATH used: `/Users/lindsaybrunner/.nvm/versions/node/v24.21.0/bin`.
- `npm run test:images:policy`: **7/7 pass**, despite the reproductions above.
- Direct `inspectScript` / `inspectHtml` probes: CSS and reflective bypasses **0 violations**.
- Actual manifest resolver comparison + real component rendering: missing runtime member reproduced.
- In-memory Vite virtual-entry build: succeeds, `write:false`, no public/build output mutated.
- Exact existing adapter-node mutations/duplicate exceptions in the current suite passed. No actionable exact-exception finding beyond the unrecognized sink forms above.
- Runtime suite and CI were read, not rerun: no new claim about the current task08 runtime result. Existing assertions check Christmas selected response bytes, delayed takeover descriptor identity/request counts, a rotated-in logo, deferred originals and reopening. They do not establish generic newly authored React source coverage. CI explicitly runs the separate headless suite; local files do not establish required branch protection or deploy ordering, as already documented.

Disposition: fix these bounded enforcement gaps, then run the new negatives/ordinary-image regression and fresh integrated release checks. No redesign requested.
