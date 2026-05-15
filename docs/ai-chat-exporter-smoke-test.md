# AI Chat Exporter Smoke Test

Use this checklist for Phase 6 runtime validation and deploy-preview review.

## Local Automated Checks

- `npm run build`
- `npm run test:ai-exporter`
- `npm run test:ai-exporter:runtime`

The runtime test uses the real `chatgpt-thread-exporter` package with a local fixture. It verifies:

- the GitHub dependency exposes `chatgpt-thread-exporter/pipeline`
- Markdown output exactly matches the expected exporter-rendered transcript shape
- PDF output is a non-empty `Uint8Array`
- PDF output starts with the `%PDF` signature
- fixture exports finish within local smoke-test budgets

## Local Netlify Dev Smoke

Start Netlify dev:

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

- open `/ai-chat-exporter/` directly
- repeat the local Netlify dev smoke test
- test one Markdown export from a real public ChatGPT share URL
- for the README Artemis share URL, confirm the downloaded Markdown matches the checked-in CLI example
- test one PDF export from a real public ChatGPT share URL

## Ship Decision

Markdown can ship in v1 if:

- deploy-preview Markdown export succeeds from a real public ChatGPT share URL
- the downloaded Markdown includes the expected thread text
- failure states stay user-readable
- no exporter code appears in client bundles

PDF can ship in v1 because:

- production PDF export succeeds from a real public ChatGPT share URL
- downloaded PDF opens locally
- runtime coverage verifies non-empty PDF output with a `%PDF` signature
- failure states stay user-readable
- no exporter code appears in client bundles

Current Phase 6 decision: ship Markdown and PDF. PDF uses a serverless PDFKit renderer in Netlify/Lambda environments instead of the exporter package's browser-backed PDF path.
