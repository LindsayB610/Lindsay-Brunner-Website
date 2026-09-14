# AI Chat Exporter Smoke Test

Use this checklist for each exporter, dependency, or runtime change. A previous launch decision is not verification of the current package set.

## Local Automated Checks

- `npm run build`
- `npm run test:dependency-runtime`
- `npm run test:ai-exporter`

On a fresh machine, select Node 24, run `npm ci`, and install `chromium-headless-shell` with the project's Playwright CLI as described in [dependency maintenance](dependency-maintenance.md). `npm run test:ai-exporter:runtime` runs just the renderer check when diagnosing a failure.

The runtime test uses the real ChatGPT and Claude exporter packages with local fixtures. It verifies:

- the GitHub dependency exposes `chatgpt-thread-exporter/pipeline`
- Markdown output exactly matches the expected exporter-rendered transcript shape
- PDF output is a non-empty `Uint8Array`
- PDF output starts with the `%PDF` signature
- fixture exports finish within local smoke-test budgets
- Claude snapshot parsing and Markdown/HTML/PDF rendering
- headless-only rendering, blocked persistent profiles, and temporary-file cleanup

The dependency test exercises the actual request handler's rate-limit logic with the real Blobs SDK and in-memory HTTP responses. It covers rejection of the sixth PDF, expired/invalid window resets, and safe storage failures. It does not contact Netlify or test production credentials.

## Local Netlify Dev Smoke

With the Netlify CLI installed and the site linked, start Netlify dev:

```sh
netlify dev
```

Open:

```text
http://localhost:8888/ai-chat-exporter/
```

Test with one public ChatGPT share URL:

- invalid URL shows `Use a public ChatGPT share URL.`
- Markdown export downloads an `.md` file
- PDF export downloads a `.pdf` file
- clicking Export twice creates only one export
- after an error, the URL field, format controls, and export button are usable again

## Deploy Preview Smoke

On a Netlify deploy preview:

- confirm that the actual function runtime is Node 24; inspect any existing `AWS_LAMBDA_JS_RUNTIME` override separately from the build setting
- open `/ai-chat-exporter/` directly
- repeat the local Netlify dev smoke test
- test one Markdown export from a real public ChatGPT share URL
- confirm the downloaded Markdown matches the visible shared conversation
- test one PDF export from a real public ChatGPT share URL
- repeat Markdown and PDF downloads with a non-sensitive Claude snapshot JSON fixture
- open both PDFs and confirm their text and layout, not just the filename
- confirm the human-verification flow and shared PDF rate limiting work with the preview's configured services
- confirm invalid requests and service failures return readable errors without internal details

## Release decision

Markdown is ready for the current release when:

- deploy-preview Markdown export succeeds from a real public ChatGPT share URL
- the downloaded Markdown includes the expected thread text
- failure states stay user-readable
- no exporter code appears in client bundles

PDF is ready for the current release when:

- hosted PDF export succeeds for both a public ChatGPT share URL and a Claude snapshot JSON fixture
- downloaded PDF opens locally
- runtime coverage verifies non-empty PDF output with a `%PDF` signature
- failure states stay user-readable
- no exporter code appears in client bundles

PDF uses browser-rendered HTML/CSS with Lambda-compatible Chromium in Netlify/Lambda environments. Local packaging or a Mac headless test alone does not establish that this hosted path works after a runtime upgrade.
