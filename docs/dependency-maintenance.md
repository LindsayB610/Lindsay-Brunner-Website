# Dependency Maintenance

Use Node.js 24 LTS and npm 11. `.nvmrc`, `package.json`, Netlify, and the GitHub workflows describe the same tested runtime. After pulling a runtime change, run `nvm install` and `nvm use` before installing packages. With another Node manager, select Node 24 explicitly.

## Install and verify

```sh
npm ci
npx --no-install playwright install chromium-headless-shell
npm run test:dependency-runtime
npm test
npm audit
npm audit --omit=dev
```

`npm ci` uses the committed lockfile and replaces the local dependency installation. It should not change either package file. The headless browser is needed for local rendered-page and PDF tests, not for the static site build. Do not substitute an installed Chrome, Edge, or Safari profile. Linux machines also need Playwright's system libraries.

The full suite builds the site and covers HTML, links, content, publishing schedules, recipes, mobile layouts, accessibility, game trackers, Workshop, and the chat exporter. The focused dependency test adds:

- Ordinary YAML dates, lists, Unicode, and aliases, plus a small regression for empty-merge work limits.
- SVG-to-PNG dimensions and colors; JPEG, WebP, and AVIF encoding/decoding; invalid-image rejection.
- Real Blobs SDK reads and writes using an in-memory transport, with no cloud access.
- The real export request handler's five-PDF limit, reset behavior, uncached storage selection, and safe failure when storage rejects a write.

The exporter runtime test uses real renderer packages with saved fixtures. It blocks headed browsers, custom browser executables, and persistent profiles, and removes temporary PDF files before reporting results. Those local checks do not replace a hosted Chromium test.

## Make targeted upgrades

Review each advisory's actual dependency path and usage before changing packages. An outdated package is not automatically vulnerable. Prefer compatible security fixes and check the resolved tree with `npm ls --all`; avoid forcing peer conflicts or replacing the whole dependency set to silence an audit.

Keep ShadCN installed for component authoring. `npx --no-install shadcn info --json` checks its project configuration and reads the public component registry. Adding a component is a separate authoring change and needs its own diff review.

Keep both exporter dependencies pinned to reviewed Git revisions. Change their manifest references and lock entries together only when deliberately upgrading the exporter. A maintenance install must not silently fetch a newer exporter implementation.

If Node changes, update `.nvmrc`, the package engine requirements, `netlify.toml`, and every `actions/setup-node` step together. Do not assume changing build settings overrides a separately configured Netlify function runtime.

## Before publication

Use the [exporter smoke test](ai-chat-exporter-smoke-test.md) for the hosted checks. Local function packaging can establish that the imports, HTML renderer, and Chromium payload are included. Installing Linux dependencies on a Mac establishes package availability, not successful execution of the Linux browser.

On the hosted preview, verify the actual Node runtime, Blobs access, human verification, and real Markdown/PDF outputs for both providers. Do not infer that those passed from a local build or an earlier release's launch decision.

For recovery, restore a known-good dependency change as a unit: manifest, lockfile, runtime configuration, and related tests. Review the previous runtime's support and security status before using it as anything beyond a temporary recovery step. Preserve content and unrelated work.
