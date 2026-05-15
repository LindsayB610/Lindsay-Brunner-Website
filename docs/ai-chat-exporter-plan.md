# AI Chat Exporter Implementation Plan

## Goal

Build a single-page web app at `/ai-chat-exporter/` on `lindsaybrunner.com` that lets a user paste a public ChatGPT share URL, choose Markdown or PDF, and download the exported file.

The page should feel simple and focused:

- one share URL field
- Markdown/PDF format choice
- one export button
- brief instructions
- clear loading/success/error state
- automatic file download when export completes

The implementation should use a React island in the existing Hugo site, with an Aceternity visual background treatment and Aceternity `Stateful Button` for export progress.

## Completion Status

Completed and launched.

- `/ai-chat-exporter/` builds and renders as a dedicated Hugo page with a React island.
- The page accepts public `chatgpt.com/share/...` and `chat.openai.com/share/...` URLs.
- Markdown and PDF exports are both enabled.
- Exports run through a Netlify Function at `/api/export-chat`.
- The server-side adapter imports the GitHub `chatgpt-thread-exporter` dependency and keeps exporter code out of client bundles.
- PDF export uses the exporter CLI's browser-rendered HTML/CSS path with Lambda-compatible Chromium when running in Netlify/Lambda environments.
- The visual treatment uses the Aceternity `Background Beams With Collision` pattern, adapted to the site.
- The export button uses the Aceternity-style `Stateful Button`.
- The page is listed in the More dropdown as `AI Chat Exporter`, and the More menu is guarded to remain alphabetical.
- Automated coverage exists for client helpers, page wiring, interaction behavior, visual contract, Netlify Function behavior, client/server bundle boundaries, and real exporter runtime fixtures.

## Phase Outline

- **Phase 0: Test Harness And Contracts** - establish shared contracts, helper tests, boundary checks, and narrow npm scripts.
- **Phase 1: Static Page And React Island Shell** - create `/ai-chat-exporter/`, mount the island, and prove the route/build wiring.
- **Phase 2: Aceternity Visual Components** - add the Aceternity visual treatment and Stateful Button with accessibility and mobile render checks.
- **Phase 3: Frontend Export Flow With Mock API** - validate inputs, call an API-shaped helper, mock downloads, and test browser behavior.
- **Phase 4: Netlify Function Contract** - add `/api/export-chat` with mocked exporter internals and robust request/response tests.
- **Phase 5: GitHub Exporter Dependency Integration** - import the real exporter server-side and protect client bundle boundaries.
- **Phase 6: PDF Runtime Hardening** - verify PDF export locally and in deploy previews, then decide whether PDF ships in v1.
- **Phase 7: Full Site Regression And Launch Prep** - finalize metadata, copy, regression tests, and direct-link launch readiness.

## Repositories

- Website target: `/Users/lindsaybrunner/Documents/Lindsay-Brunner-Website`
- Exporter source: `https://github.com/LindsayB610/chatgpt-thread-exporter`
- Local exporter checkout for reference: `/Users/lindsaybrunner/Documents/chatgpt thread exporter`

## Architecture

The browser should not run the exporter directly. The frontend should collect the URL and format, then call a Netlify Function.

The Netlify Function should import the `chatgpt-thread-exporter` library API from the GitHub dependency, run the export server-side, and return the generated file.

This keeps the homepage and other site pages light. The exporter code should not be bundled into the homepage or general client-side site JavaScript.

## Test Strategy

This project currently uses custom Node and Playwright test scripts rather than a large browser-test framework. Keep that style unless a small dedicated test dependency clearly earns its keep.

Favor TDD for this feature:

- Add or update the test first.
- Confirm the new test fails for the expected reason when practical.
- Implement the smallest slice that makes the test pass.
- Run the narrow test before moving to the next behavior.
- Run broader build/render tests at each review gate.

The highest-risk surfaces are the API contract, file download handling, binary PDF responses, and keeping exporter code out of client bundles. Those should be tested before the UI is polished.

The web app should not reinterpret exporter output. The server adapter must preserve the library output exactly, and runtime coverage should include at least one exact Markdown fixture comparison so formatting drift is caught before deploy.

### Proposed Test Files

- `tests/ai-chat-exporter-page.test.js`
  - built Hugo route
  - React island manifest entry
  - page fallback HTML
  - script and CSS asset wiring
  - no accidental navigation exposure until intentionally added
- `tests/ai-chat-exporter-client.test.js`
  - URL validation
  - request payload construction
  - response filename parsing
  - response Blob handling
  - download trigger behavior through a mocked DOM
- `tests/ai-chat-exporter-function.test.js`
  - Netlify Function request validation
  - mocked exporter success paths
  - mocked exporter failure paths
  - adapter preserves exporter response bodies exactly
  - response headers and body shape for Markdown and PDF
- `tests/ai-chat-exporter-runtime.test.js`
  - real GitHub exporter package import
  - exact Markdown fixture output comparison
  - local PDF artifact sanity check while PDF remains gated from production
- `tests/ai-chat-exporter-boundary.test.js`
  - exporter package is imported only by server/function code
  - client entries do not import `chatgpt-thread-exporter`
  - built client assets do not contain obvious exporter module names
- Existing render tests should be expanded to include `/ai-chat-exporter/`:
  - `tests/react-accessibility-render.test.js`
  - `tests/react-mobile-render.test.js`

### Required New Package Scripts

Add narrow scripts so each phase can be tested without running the full suite every time:

- `test:ai-exporter:page`
- `test:ai-exporter:client`
- `test:ai-exporter:interaction`
- `test:ai-exporter:function`
- `test:ai-exporter:boundary`
- `test:ai-exporter`

The full `npm test` should include the AI exporter checks once the page is part of the site.

## Phase 0: Test Harness And Contracts

### Scope

Create the test scaffolding and lock down the expected contracts before implementing the page.

### Implementation

- Add placeholder test files for page, client, function, and boundary coverage.
- Add package scripts for narrow AI exporter test runs.
- Define shared expected values in tests where useful:
  - route: `/ai-chat-exporter/`
  - root id: `ai-chat-exporter-root`
  - API path: `/api/export-chat`
  - supported formats: `markdown`, `pdf`
  - valid hosts: `chatgpt.com`, `chat.openai.com`
- Create tiny helper functions in source only when tests need stable units:
  - `isChatGptShareUrl`
  - `parseDownloadFilename`
  - `buildExportRequest`
  - `triggerFileDownload`

### Review Gate

- Test scripts exist and run.
- Tests fail or skip only because implementation does not exist yet.
- Expected API and UI contracts are explicit before build work starts.

### Tests

- Run each new narrow test script.
- Confirm the initial failures are about missing route/source/function behavior, not syntax or test harness errors.

## Phase 1: Static Page And React Island Shell

### Scope

Create the `/ai-chat-exporter/` route and mount a dedicated React island, without wiring the real exporter yet.

### Test First

- Add failing assertions to `tests/ai-chat-exporter-page.test.js` for:
  - `public/ai-chat-exporter/index.html` exists after build
  - page includes `id="ai-chat-exporter-root"`
  - page includes useful static fallback copy
  - Vite manifest includes `src/react/ai-chat-exporter.tsx`
  - built page loads the exporter entry script
- Add `/ai-chat-exporter/` to render-route lists in accessibility and mobile tests, but mark any route-specific expectations clearly.

### Implementation

- Add Hugo content/page support for `/ai-chat-exporter/`.
- Add a page layout or template with a root element for the React island.
- Add `src/react/ai-chat-exporter.tsx`.
- Add the new React entry to `vite.config.ts`.
- Include the built React assets from the Hugo page using the existing manifest pattern.
- Build the initial UI shell:
  - page heading
  - brief instructions
  - share URL input
  - Markdown/PDF radio controls
  - export button placeholder
  - compact status area

### Review Gate

- Page exists at `/ai-chat-exporter/`.
- The island mounts only on that page.
- Existing homepage/about islands still work.
- The UI is usable on desktop and mobile.

### Tests

- `npm run build`
- `npm run test:ai-exporter:page`
- Add or update a page/island render test proving the exporter island mounts.
- Add a static route/content check proving `/ai-chat-exporter/` is generated.
- Run existing homepage React island test to catch regressions.

## Phase 2: Aceternity Visual Components

### Scope

Add the visual treatment and button behavior before backend work begins.

### Test First

- Add source-level assertions that the exporter island uses the local Aceternity background treatment and Stateful Button components.
- Add accessibility render assertions for:
  - exactly one visible `h1`
  - named input
  - named radio controls
  - named export button
  - status text exposed through an appropriate live/status region
- Add mobile render expectations for:
  - no horizontal overflow
  - no clipped text
  - no touch targets smaller than 44px

### Implementation

- Add/adapt an Aceternity background treatment.
- Add/adapt Aceternity `Stateful Button`.
- Keep Aceternity code local to the existing component structure, likely under `src/components/ui/`.
- Use the selected Aceternity background as the page backdrop.
- Use `Stateful Button` as the primary export action.
- Ensure reduced-motion behavior is acceptable.
- Keep the design consistent with the existing site palette and React styling.

### Review Gate

- The page feels like part of `lindsaybrunner.com`.
- The exporter remains the first-screen focus.
- The button clearly communicates idle, loading, success, and failure states.
- No separate progress bar is needed unless testing shows the button state is insufficient.

### Tests

- `npm run build`
- `npm run test:ai-exporter:page`
- React render test for button states.
- Accessibility test for labels, radio group behavior, focus state, and status messaging.
- Mobile render test for layout overlap and text fit.

## Phase 3: Frontend Export Flow With Mock API

### Scope

Wire the island to an API-shaped function call using a mock response, so the full browser UX can be reviewed before the real exporter is connected.

### Test First

- Add failing unit tests for client helpers before wiring UI:
  - accepts `https://chatgpt.com/share/...`
  - accepts `https://chat.openai.com/share/...`
  - rejects non-ChatGPT hosts
  - rejects ChatGPT URLs without `/share/`
  - rejects malformed URLs
  - builds the exact JSON payload expected by the API
  - parses quoted and unquoted `Content-Disposition` filenames
  - falls back to a safe filename when no filename header exists
- Add mocked DOM/download tests before implementation:
  - Markdown response downloads `.md`
  - PDF response downloads `.pdf`
  - object URLs are revoked
- Add interaction tests, using Playwright or the existing render harness, for:
  - invalid input shows an error without calling the API
  - valid input disables controls while exporting
  - repeated clicks do not create duplicate export requests

### Implementation

- Add client-side validation:
  - required URL
  - must be a `chatgpt.com/share/...` or `chat.openai.com/share/...` URL
  - format must be `markdown` or `pdf`
- Add a frontend API helper for `POST /api/export-chat`.
- Mock the API helper or function response during tests.
- On export:
  - disable URL input, format controls, and button while running
  - call the API helper
  - convert the response to a Blob
  - infer filename from response headers when available
  - automatically trigger download
  - show success or error status

### Review Gate

- Empty and invalid URLs produce useful errors.
- Valid mock Markdown and PDF responses download correctly.
- Double-clicking cannot start duplicate exports.
- The page recovers cleanly after an error.

### Tests

- `npm run test:ai-exporter:client`
- `npm run test:ai-exporter:interaction`
- Unit tests for URL validation.
- Unit tests for filename parsing from `Content-Disposition`.
- React tests for:
  - initial state
  - invalid URL state
  - Markdown/PDF selection
  - loading disabled state
  - success state
  - API error state
- Mock download behavior enough to prove the correct filename and Blob type are used.

## Phase 4: Netlify Function Contract

### Scope

Add the real API endpoint shape, still with mocked exporter internals.

### Test First

- Add failing function contract tests before writing the function:
  - `GET /api/export-chat` returns `405`
  - invalid JSON returns `400`
  - missing URL returns `400`
  - invalid URL returns `400`
  - unsupported format returns `400`
  - mocked Markdown export returns `200`, `text/markdown`, and `.md` disposition
  - mocked PDF export returns `200`, `application/pdf`, and `.pdf` disposition
  - mocked exporter failure returns a safe `502` or `500` without leaking stack traces
  - all success responses include no-store/cache prevention headers

### Implementation

- Add `netlify/functions/export-chat.mts` so Netlify treats the function and `config` export as ESM.
- Use modern Netlify Function syntax: default export plus `config`.
- Expose the function at `/api/export-chat`.
- Accept only `POST`.
- Parse JSON payload:
  - `sharedUrl`
  - `format`
- Return typed errors for:
  - wrong method
  - invalid JSON
  - missing URL
  - invalid URL
  - unsupported format
  - exporter failure
- Return file content with:
  - `Content-Type`
  - `Content-Disposition`
  - cache prevention headers

### Review Gate

- Frontend can call the function locally through Netlify dev.
- Function responses are predictable and easy for the frontend to display.
- Function code is covered without real network calls.

### Tests

- `npm run test:ai-exporter:function`
- Function unit tests with mocked exporter output.
- Tests for every validation branch.
- Tests for Markdown response headers and body.
- Tests for PDF response headers and binary body shape.
- Test that non-POST requests return `405`.

## Phase 5: GitHub Exporter Dependency Integration

### Scope

Replace mocked exporter internals with the real `chatgpt-thread-exporter` package from GitHub.

### Test First

- Add boundary tests before adding the dependency:
  - no file under `src/react/` imports `chatgpt-thread-exporter`
  - no client entry in `vite.config.ts` references exporter modules
  - built client assets do not include `chatgpt-thread-exporter`
- Keep function tests mocked so they stay deterministic after the dependency is added.
- Add one explicit test that the function adapter maps the exporter artifact shape into HTTP responses correctly.

### Implementation

- Add the GitHub dependency to `package.json`.
- Import the library API rather than spawning the CLI.
- Prefer `buildPipelineArtifacts()` from the exporter package.
- Ensure the exporter package exposes a GitHub-installable server API:
  - `prepare` builds `dist/` during GitHub install
  - `exports` exposes `chatgpt-thread-exporter/pipeline`
  - package tarball includes `dist/pipeline.js` and types
- Map website request format to exporter options.
- Convert exporter output to a proper HTTP response:
  - Markdown string to UTF-8 text
  - PDF `Uint8Array` to binary response
- Generate download filenames from exporter transcript metadata when available, with a safe fallback.
- Keep exporter imports server-side only.

### Review Gate

- `npm run build` succeeds with the GitHub dependency.
- The client bundle does not include the exporter package.
- Markdown export works with a real public ChatGPT share URL.
- PDF export is tested early because it is the highest-risk runtime path.

### Tests

- `npm run test:ai-exporter:boundary`
- `npm run test:ai-exporter:function`
- Exporter package verification:
  - `npm run build`
  - `npm test`
  - `npm pack --dry-run --cache /private/tmp/npm-cache-chatgpt-exporter`
- Function tests still mock the exporter package for deterministic coverage.
- Add one integration-style test using exporter fixtures if practical.
- Add a bundle/build check or import boundary test so exporter code does not leak into client entries.
- Run existing site tests to catch broad regressions.

## Phase 6: PDF Runtime Hardening

### Scope

Validate whether PDF export works reliably inside Netlify Functions.

### Test First

- Add a manual smoke-test checklist before runtime testing so the result is repeatable. See `docs/ai-chat-exporter-smoke-test.md`.
- Add a fixture-backed test if the exporter package exposes enough fixture or dependency injection support.
- Add timeout/error assertions around the frontend so slow PDF export does not leave controls permanently disabled.

### Implementation

- Test PDF export locally through `netlify dev`.
- Test PDF export in a Netlify deploy preview.
- Measure practical runtime behavior:
  - cold start
  - export duration
  - memory pressure
  - function timeout risk
  - bundle size issues
- If standard Netlify Functions handle PDF well, keep the simple architecture.
- If PDF is too heavy, evaluate a contained adjustment:
  - longer-running background function with polling
  - Markdown-only launch with PDF marked unavailable
  - separate PDF runtime strategy

### Review Gate

- Clear yes/no decision on PDF support for initial launch.
- If PDF ships, it is reliable enough for public use.
- If PDF does not ship immediately, the UI handles that truth honestly.

### Phase 6 Result

- Markdown deploy-preview smoke succeeded with the README Artemis share URL.
- Exporter title parsing was corrected upstream so the README Artemis share URL matches `examples/artemis-program-explained.md` exactly from the CLI; the website dependency now points at that fix.
- PDF initially failed on the standard Netlify Function runtime when using the exporter package's browser-backed PDF path.
- The PDF runtime strategy was changed to use the exporter CLI's HTML renderer and Playwright PDF settings with Lambda-compatible Chromium inside the website adapter.
- V1 ships both Markdown and PDF export.
- Runtime fixture coverage verifies Markdown exact output and PDF binary sanity.

### Tests

- `npm run test:ai-exporter`
- `npm run test:ai-exporter:runtime`
- Manual smoke test with at least one real public ChatGPT share URL.
- Deploy preview smoke test for Markdown and PDF.
- Error-path test for a share URL that cannot be fetched or parsed.

## Phase 7: Full Site Regression And Launch Prep

### Scope

Run the complete verification pass and prepare for launch.

### Test First

- Add final content/regression assertions before launch polish:
  - page has expected title and description
  - page is generated at the expected route
  - page is not in navigation until the navigation task happens
  - page copy mentions public ChatGPT share links without overexplaining internals

### Implementation

- Confirm `/ai-chat-exporter/` page metadata:
  - title
  - description
  - canonical URL if site convention requires it
  - Open Graph defaults if applicable
- Confirm page does not appear in navigation yet.
- Confirm it can later be added as `AI Chat Exporter` in the More dropdown.
- Check privacy and copy:
  - explain that the tool uses public ChatGPT share links
  - avoid overexplaining implementation details
  - keep instructions minimal

### Review Gate

- Page is ready to share directly by URL.
- Navigation has been added to the More dropdown as `AI Chat Exporter`.
- No unrelated visual or content regressions across the site.

### Phase 7 Result

- Page metadata, route generation, React asset wiring, visual behavior, interaction states, and API contract are covered.
- The More dropdown includes `AI Chat Exporter`.
- The More dropdown now displays links alphabetically and `npm run test:content` guards that order.
- Production smoke testing confirmed page load, navigation exposure, Markdown export, and PDF export.

### Tests

- `npm run build`
- `npm run test:ai-exporter`
- Existing full test suite where practical.
- `npm run test:homepage`
- `npm run test:accessibility`
- `npm run test:mobile`
- Link/content tests if route changes affect generated HTML.
- Manual desktop and mobile review.

## Launch Checklist

- `/ai-chat-exporter/` builds and renders.
- React island mounts on the exporter page only.
- Background Beams With Collision renders behind the form without overpowering it.
- Stateful Button handles loading and completion clearly.
- Markdown export works.
- PDF export works through the CLI-equivalent browser renderer in the website adapter.
- Invalid input and exporter failures are handled gracefully.
- Downloads use correct file extensions.
- Exporter package stays out of client bundles.
- Netlify deploy preview is smoke tested.
- Page is listed in the More dropdown as `AI Chat Exporter`.

## Remaining Considerations

- Rate limiting or bot protection may be worth adding if the endpoint attracts public abuse.
