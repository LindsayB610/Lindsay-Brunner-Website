# AI Chat Exporter Claude Tabs Plan

## Goal

Evolve the launched `/ai-chat-exporter/` page from a ChatGPT-only exporter into a three-tab AI chat export tool:

- `ChatGPT`
- `Claude Link`
- `Claude JSON`

The page should stay recognizably part of `lindsaybrunner.com`: focused, useful, a little editorial, and honest about rough edges. The ChatGPT flow should remain stable. Claude support should make the reliable path obvious while still documenting the experimental share-link path.

## Branch And Launch Posture

- Work branch: `claude-exporter-tabs`
- Target repo: `/Users/lindsaybrunner/Documents/Lindsay-Brunner-Website`
- Local-first rule: all webapp work should be completed and reviewed locally before launch.
- No production deploy, merge, or launch copy should happen until explicitly approved.
- Existing ChatGPT behavior is the regression baseline.

## Current Reality

The current website implementation already has a mature ChatGPT exporter:

- Hugo route at `/ai-chat-exporter/`
- React island in `src/react/ai-chat-exporter.tsx`
- shared client helpers in `src/lib/ai-chat-exporter.ts`
- Netlify function at `/api/export-chat`
- server adapter importing `chatgpt-thread-exporter`
- Turnstile protection
- PDF rate limiting
- client, page, interaction, function, runtime, visual, and boundary tests

Claude has a different technical shape:

- `claude-thread-exporter --claude-url` is the Claude share link path.
- The Claude share link path is experimental because Claude/Cloudflare browser verification can loop in Playwright Chromium.
- Hosted Netlify functions cannot reuse the user’s local authenticated Playwright Chromium profile.
- `claude-thread-exporter --snapshot-json` is the reliable Claude snapshot JSON path.

That means the webapp should not pretend Claude share links are as reliable as ChatGPT links.

## Product Shape

### Tab 1: ChatGPT

Status: already launched.

Keep the current behavior:

- paste a public ChatGPT share URL
- choose Markdown or PDF
- verify with Turnstile when required
- download the rendered file

The tab label should be `ChatGPT`.

### Tab 2: Claude Link

Status: experimental / warning-first.

Target behavior:

- accept a Claude shared link in the UI
- clearly explain that this path is flaky and may not work from a hosted webapp
- offer a CLI command for local capture/export
- avoid implying that the hosted backend can solve Claude browser verification

Initial implementation should be conservative. This tab may be informational plus CLI-oriented until we prove a hosted endpoint has a trustworthy path.

### Tab 3: Claude JSON

Status: reliable webapp path.

Target behavior:

- accept pasted Claude snapshot JSON, and later optional `.json` file upload
- accept an optional Claude source share link for export metadata
- choose Markdown or PDF
- render through server-side `claude-thread-exporter` code
- download the rendered file

This should become the primary Claude webapp utility.

## UX Principles

- The tabbed UI should feel calm and native to the existing page, not like three different apps bolted together.
- The default tab stays `ChatGPT` unless there is a strong reason to change it later.
- Claude warning copy should be honest but not dramatic.
- The reliable Claude JSON path should be easy to understand without knowing exporter internals.
- Any “What is snapshot JSON?” help should be a tooltip/popover or compact helper block, not a wall of text.
- The page should not expose raw stack traces or implementation detail in user-facing errors.

Suggested Claude Link copy:

> Claude share-link export is experimental. Claude may ask for browser verification, and that verification can loop. If this path stalls, use the Claude JSON tab or the local CLI and try again later.

Suggested Claude JSON helper copy:

> Claude snapshot JSON is the captured conversation payload. The reliable way to get it is with the CLI:
>
> `claude-thread-exporter --claude-url "https://claude.ai/share/..." --save-snapshot "./thread.snapshot.json"`

## Architecture

The browser should remain thin. The React island collects input and calls API endpoints. Exporter packages stay server-side.

Current endpoint:

- `/api/export-chat`

Possible endpoint choices:

1. Keep one endpoint and add a `provider` / `mode` field.
2. Add provider-specific endpoints such as `/api/export-chatgpt` and `/api/export-claude`.

Recommendation for this branch:

- keep the existing `/api/export-chat` endpoint for backward compatibility
- add request fields for provider/mode only when tests first require them
- keep adapter code provider-specific internally so ChatGPT and Claude behaviors do not blur

Proposed shared request shape:

```ts
type AiChatExportProvider = "chatgpt" | "claude";
type AiChatExportMode = "share-link" | "snapshot-json";

type AiChatExportRequest = {
  provider: AiChatExportProvider;
  mode: AiChatExportMode;
  sharedUrl?: string;
  snapshotJson?: string;
  format: "markdown" | "pdf";
  turnstileToken?: string;
};
```

Compatibility note:

- Existing ChatGPT requests may continue to omit `provider` and `mode` during a transition, defaulting to `chatgpt` + `share-link`.

## Test Strategy

Keep the existing custom Node/Playwright test style.

Favor TDD:

1. Add or update the narrow test first.
2. Confirm it fails for the expected reason when practical.
3. Implement the smallest behavior.
4. Run the narrow test.
5. Run broader build/render/regression gates at phase review points.

Key risk surfaces:

- preserving current ChatGPT behavior
- tab state and keyboard accessibility
- provider/mode request construction
- Claude JSON parsing and renderer fidelity
- binary PDF responses
- Turnstile gating before expensive server work
- keeping exporter packages out of client bundles
- serverless PDF behavior for both exporters

## Phase Dashboard

| Phase | Focus | Status |
| --- | --- | --- |
| 0 | Branch, plan, contracts | Complete |
| 1 | Tabbed UI shell | Not started |
| 2 | Client contract and helper refactor | Not started |
| 3 | Claude JSON Markdown path | Not started |
| 4 | Claude JSON PDF path | Not started |
| 5 | Claude Link tab and warning behavior | Not started |
| 6 | Server adapter and dependency integration | Not started |
| 7 | Abuse controls and runtime guardrails | Not started |
| 8 | Full local regression and polish | Not started |
| 9 | Launch decision package | Not started |

## Phase 0: Branch, Plan, Contracts

Status: complete.

Scope:

- create feature branch
- document product reality and phase plan
- decide the tab names and canonical input paths
- confirm no launch/deploy work happens in this phase

Implementation:

- Add this plan document.
- Confirm branch is `claude-exporter-tabs`.
- Keep existing ChatGPT plan as historical/completed reference.

Review gate:

- Plan captures the three-tab direction.
- Plan names the Claude share link path as experimental.
- Plan names Claude snapshot JSON as the reliable path.
- No production behavior changes yet.

Tests:

- No functional tests required for plan-only work.

## Phase 1: Tabbed UI Shell

Status: not started.

Scope:

- turn the current ChatGPT-only island into a tabbed interface
- keep ChatGPT selected by default
- keep existing ChatGPT form behavior unchanged
- add non-functional Claude tab shells with accurate copy

Test first:

- update page/client/interaction tests to assert three tab labels exist
- assert `ChatGPT` is selected by default
- assert tab switching changes visible panel content
- assert keyboard/tab accessibility for the tablist
- assert existing ChatGPT form labels and button still exist when ChatGPT is active

Implementation:

- Add tab state to `src/react/ai-chat-exporter.tsx`.
- Render tablist and panels.
- Move existing ChatGPT UI into the ChatGPT panel.
- Add placeholder Claude Link and Claude JSON panels.
- Keep current visual treatment and button component.

Review gate:

- ChatGPT flow still looks and behaves like the launched version.
- Tabs are visually clear on desktop and mobile.
- No exporter backend changes yet.

Tests:

- `npm run build`
- `npm run test:ai-exporter:client`
- `npm run test:ai-exporter:interaction`
- `npm run test:ai-exporter:visual`
- `npm run test:accessibility`
- `npm run test:mobile:render`

## Phase 2: Client Contract And Helper Refactor

Status: not started.

Scope:

- make the client helper layer provider/mode aware
- preserve existing ChatGPT request compatibility
- add Claude URL and snapshot JSON validation helpers

Test first:

- existing ChatGPT request construction remains unchanged or backwards compatible
- `isClaudeShareUrl()` accepts `https://claude.ai/share/...`
- `isClaudeShareUrl()` rejects non-Claude hosts and non-share paths
- `buildExportRequest()` supports `provider: "claude"` and `mode: "snapshot-json"`
- invalid Claude JSON input produces a user-readable error before network work
- optional Claude source URL is trimmed and included only when valid/present

Implementation:

- Extend `AI_CHAT_EXPORTER_CONTRACT` with providers and modes.
- Add `isClaudeShareUrl`, `isClaudeSnapshotJson`, and provider-aware request helpers.
- Keep `triggerFileDownload`, filename parsing, and timeout behavior shared.
- Update tests without moving server work yet.

Review gate:

- Client helper API can represent all three tabs.
- ChatGPT behavior remains covered and stable.
- No exporter packages enter client bundles.

Tests:

- `npm run test:ai-exporter:client`
- `npm run test:ai-exporter:boundary`

## Phase 3: Claude JSON Markdown Path

Status: not started.

Scope:

- implement reliable Claude snapshot JSON to Markdown through the webapp
- server-side only

Test first:

- function accepts Claude snapshot JSON request for Markdown
- function rejects malformed JSON with safe user-readable copy
- function rejects unsupported snapshot shape with safe user-readable copy
- adapter preserves `claude-thread-exporter` Markdown output exactly for a fixture
- response headers use `text/markdown`, `no-store`, and a safe `.md` filename
- expensive export work still happens only after Turnstile when the secret is configured

Implementation:

- Add `claude-thread-exporter` as a server-side dependency or local package dependency strategy.
- Add Claude adapter module under `netlify/functions/_shared/`.
- Use the exporter library renderer/parser directly rather than shelling out.
- Add one committed safe Claude fixture for web runtime tests if needed, or import from the CLI package if packaged fixtures become available.
- Wire the Claude JSON tab to call the API and download Markdown.

Review gate:

- Claude JSON Markdown works locally.
- ChatGPT Markdown still works.
- Error copy is clear and non-leaky.

Tests:

- `npm run test:ai-exporter:function`
- `npm run test:ai-exporter:runtime`
- `npm run test:ai-exporter:client`
- `npm run test:ai-exporter:interaction`

## Phase 4: Claude JSON PDF Path

Status: not started.

Scope:

- render Claude snapshot JSON to PDF through the webapp
- validate local/serverless PDF assumptions before launch

Test first:

- mocked PDF response for Claude JSON sets `application/pdf`
- filename ends in `.pdf`
- PDF export uses server-compatible Chromium strategy
- PDF rate limiting applies to Claude PDF as well as ChatGPT PDF
- Markdown export is not blocked by PDF rate limit

Implementation:

- Reuse the existing serverless Chromium pattern where possible.
- Add any `included_files` needed by `netlify.toml`.
- Ensure Claude PDF renderer can run in the same Netlify function environment.
- Keep PDF path behind local verification until deploy-preview proof exists.

Review gate:

- Local PDF smoke passes.
- If serverless PDF is too risky, Markdown can still remain viable.

Tests:

- `npm run test:ai-exporter:function`
- `npm run test:ai-exporter:runtime`
- local PDF artifact sanity check

## Phase 5: Claude Link Tab And Warning Behavior

Status: not started.

Scope:

- make the Claude Link tab useful without overpromising
- decide whether it is informational/CLI-directed or calls an experimental endpoint

Recommended initial behavior:

- accept/paste a Claude share link
- show CLI command for local capture
- offer “copy command” behavior if useful
- direct users to Claude JSON for reliable web export
- do not run hosted live capture unless a later spike proves it can work responsibly

Test first:

- Claude Link tab displays experimental warning
- valid Claude link produces a CLI command containing `--claude-url`
- invalid Claude link shows user-readable validation
- the tab does not call the export endpoint unless explicitly enabled by a future test

Implementation:

- Add Claude Link panel UI and helper text.
- Add copyable CLI command.
- Add optional source link handoff affordance for Claude JSON if useful.

Review gate:

- The warning is clear but not alarming.
- Users can understand what to do next.
- Hosted app does not pretend to solve local browser verification.

Tests:

- `npm run test:ai-exporter:client`
- `npm run test:ai-exporter:interaction`
- `npm run test:ai-exporter:visual`

## Phase 6: Server Adapter And Dependency Integration

Status: not started.

Scope:

- harden provider-specific adapters
- protect client bundle boundaries
- verify package dependency shape

Test first:

- `chatgpt-thread-exporter` and `claude-thread-exporter` are imported only by server/function code
- built client assets do not contain exporter package names
- provider/mode routes to the right adapter
- adapter errors are normalized to safe user-facing messages

Implementation:

- Factor adapter code so ChatGPT and Claude stay separate internally.
- Add `claude-thread-exporter` package dependency once needed.
- Keep dynamic imports server-side.
- Update `netlify.toml` included files for PDF renderer assets if needed.

Review gate:

- Boundary tests pass.
- The function contract is easy to reason about.

Tests:

- `npm run test:ai-exporter:boundary`
- `npm run test:ai-exporter:function`
- `npm run build`

## Phase 7: Abuse Controls And Runtime Guardrails

Status: not started.

Scope:

- ensure Claude additions inherit or extend existing production safety controls

Test first:

- Turnstile blocks ChatGPT and Claude work when configured and missing/invalid
- PDF rate limit applies across providers
- large snapshot JSON payloads are rejected with safe copy if needed
- malformed input fails before exporter work

Implementation:

- Reuse existing Turnstile flow.
- Reuse or generalize PDF rate limit.
- Add payload-size guardrails if Netlify/request behavior requires them.
- Keep `Cache-Control: no-store`.

Review gate:

- No expensive export path runs before guardrails.
- Errors stay useful and non-leaky.

Tests:

- `npm run test:ai-exporter:function`
- `npm run test:ai-exporter:runtime`

## Phase 8: Full Local Regression And Polish

Status: not started.

Scope:

- complete local validation before any launch decision
- polish copy, responsive behavior, accessibility, and visual consistency

Checklist:

- ChatGPT Markdown works locally.
- ChatGPT PDF works locally.
- Claude JSON Markdown works locally.
- Claude JSON PDF works locally or is intentionally gated.
- Claude Link tab warning/copy-command behavior works.
- Tab UI works on mobile.
- Tooltip/popover/help for snapshot JSON is understandable.
- No horizontal overflow.
- No clipped text.
- Full site build passes.

Tests:

- `npm run build`
- `npm run test:ai-exporter`
- `npm run test:accessibility`
- `npm run test:mobile`
- relevant content/page tests

Review gate:

- Local branch is ready for human review.
- Known launch blockers are documented.
- No launch yet.

## Phase 9: Launch Decision Package

Status: not started.

Scope:

- prepare for merge/deploy only after local acceptance

Deliverables:

- short launch notes
- smoke-test checklist
- deploy-preview checklist
- rollback notes
- final copy review

Launch gate:

- User explicitly approves push/merge/deploy.
- Deploy preview passes the webapp smoke tests.
- Production launch remains a separate explicit step.

## Open Questions

- Should the Claude Link tab ever attempt hosted live capture, or should it remain CLI-directed?
- Should Claude JSON accept paste-only first, or paste plus file upload in the first implementation?
- Should the existing page title remain `AI Chat Exporter`, or become more specific once tabs land?
- Should the optional Claude source URL live inside Claude JSON from day one?
- Should the website depend on the published GitHub package, a local tarball during development, or a workspace-style local path before launch?
