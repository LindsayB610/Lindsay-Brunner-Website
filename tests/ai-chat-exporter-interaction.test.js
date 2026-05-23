const fs = require('fs');
const http = require('http');
const path = require('path');
const { assert, report, root } = require('./ai-chat-exporter-test-utils');

const failures = [];
const publicDir = path.join(root, 'public');

const contentTypeByExtension = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function resolvePublicPath(requestUrl) {
  const url = new URL(requestUrl, 'http://localhost');
  const decodedPath = decodeURIComponent(url.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(publicDir, normalizedPath);

  if (decodedPath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!filePath.startsWith(publicDir)) {
    return null;
  }

  return filePath;
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const filePath = resolvePublicPath(request.url);

    if (!filePath || !fs.existsSync(filePath)) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'content-type': contentTypeByExtension[extension] || 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        origin: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function waitForSelectedTab(page, tabName) {
  await page.waitForFunction(
    (name) => {
      const selectedTab = document.querySelector('[role="tab"][aria-selected="true"]');
      return selectedTab?.textContent === name;
    },
    tabName,
  );
}

async function run() {
  console.log('🖱️  Checking AI Chat Exporter browser interaction...');

  assert(fs.existsSync(path.join(publicDir, 'ai-chat-exporter', 'index.html')), 'public/ai-chat-exporter/index.html should exist. Run npm run build first.', failures);

  const { chromium } = await import('playwright');
  const { server, origin } = await startStaticServer();

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    await page.addInitScript(() => {
      window.__aiExporterDownloads = [];
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function patchedClick() {
        window.__aiExporterDownloads.push({
          download: this.download,
          href: this.href,
        });
        return originalClick.call(this);
      };
    });

    let apiRequestCount = 0;
    const apiPayloads = [];
    await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js', async (route) => {
      await route.fulfill({
        body: `
          window.turnstile = {
            render: function (_container, options) {
              setTimeout(function () { options.callback('mock-turnstile-token'); }, 0);
              return 'mock-turnstile-widget';
            },
            reset: function () {}
          };
        `,
        contentType: 'text/javascript; charset=utf-8',
        status: 200,
      });
    });

    await page.route('**/api/export-chat', async (route) => {
      apiRequestCount += 1;
      const payload = route.request().postDataJSON();
      apiPayloads.push(payload);
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (payload.provider === 'claude') {
        await route.fulfill({
          body: `# Claude Mock Export\n\nSource: ${payload.sourceUrl || 'snapshot'}\n`,
          contentType: 'text/markdown; charset=utf-8',
          headers: {
            'Cache-Control': 'no-store',
            'Content-Disposition': 'attachment; filename="claude-thread-export.md"',
          },
          status: 200,
        });
        return;
      }

      if (payload.sharedUrl.includes('server-error')) {
        await route.fulfill({
          body: JSON.stringify({ error: 'The export failed. Please try again.' }),
          contentType: 'application/json',
          status: 500,
        });
        return;
      }

      if (payload.format === 'pdf') {
        await route.fulfill({
          body: 'mock pdf',
          contentType: 'application/pdf',
          headers: {
            'Cache-Control': 'no-store',
            'Content-Disposition': 'attachment; filename="chatgpt-thread-export.pdf"',
          },
          status: 200,
        });
        return;
      }

      await route.fulfill({
        body: `# Mock export\n\nSource: ${payload.sharedUrl}\n`,
        contentType: 'text/markdown; charset=utf-8',
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition': 'attachment; filename="chatgpt-thread-export.md"',
        },
        status: 200,
      });
    });

    await page.goto(`${origin}/ai-chat-exporter/`, { waitUntil: 'domcontentloaded' });

    const tabs = page.getByRole('tab');
    assert(await tabs.count() === 3, 'AI Chat Exporter should render three tabs', failures);
    assert(await tabs.nth(0).textContent() === 'ChatGPT', 'first tab should be ChatGPT', failures);
    assert(await tabs.nth(1).textContent() === 'Claude JSON', 'second tab should be Claude JSON', failures);
    assert(await tabs.nth(2).textContent() === 'Claude Link', 'third tab should be Claude Link', failures);
    assert(await page.getByRole('tab', { name: 'ChatGPT' }).getAttribute('aria-selected') === 'true', 'ChatGPT tab should be selected by default', failures);

    await page.getByRole('tab', { name: 'ChatGPT' }).press('ArrowRight');
    await waitForSelectedTab(page, 'Claude JSON');
    assert(await page.getByRole('tab', { name: 'Claude JSON' }).getAttribute('aria-selected') === 'true', 'ArrowRight should move from ChatGPT to Claude JSON', failures);
    await page.getByRole('tab', { name: 'Claude JSON' }).press('End');
    await waitForSelectedTab(page, 'Claude Link');
    assert(await page.getByRole('tab', { name: 'Claude Link' }).getAttribute('aria-selected') === 'true', 'End should move to Claude Link', failures);
    await page.getByRole('tab', { name: 'Claude Link' }).press('Home');
    await waitForSelectedTab(page, 'ChatGPT');
    assert(await page.getByRole('tab', { name: 'ChatGPT' }).getAttribute('aria-selected') === 'true', 'Home should move to ChatGPT', failures);
    await page.getByRole('tab', { name: 'ChatGPT' }).press('ArrowLeft');
    await waitForSelectedTab(page, 'Claude Link');
    assert(await page.getByRole('tab', { name: 'Claude Link' }).getAttribute('aria-selected') === 'true', 'ArrowLeft should wrap from ChatGPT to Claude Link', failures);
    await page.getByRole('tab', { name: 'Claude Link' }).press('ArrowRight');
    await waitForSelectedTab(page, 'ChatGPT');
    assert(await page.getByRole('tab', { name: 'ChatGPT' }).getAttribute('aria-selected') === 'true', 'ArrowRight should wrap from Claude Link to ChatGPT', failures);

    await page.getByRole('tab', { name: 'Claude JSON' }).click();
    await page.getByText('Paste saved Claude snapshot JSON').waitFor();
    assert(await page.getByRole('tab', { name: 'Claude JSON' }).getAttribute('aria-selected') === 'true', 'Claude JSON tab should become selected after click', failures);
    assert(!(await page.getByLabel('Shared ChatGPT URL').isVisible()), 'ChatGPT URL input should be hidden outside the ChatGPT tab', failures);
    assert(await page.getByLabel('Claude snapshot JSON').isVisible(), 'Claude JSON tab should show a snapshot JSON textarea', failures);
    assert(await page.getByLabel('Human verification').isVisible(), 'Claude JSON tab should keep human verification visible', failures);
    assert(await page.getByRole('button', { name: 'Export Claude Markdown' }).isVisible(), 'Claude JSON tab should expose a Markdown export button', failures);

    await page.getByRole('tab', { name: 'Claude Link' }).click();
    await page.getByText('Claude share-link export is experimental.').waitFor();
    assert(await page.getByRole('tab', { name: 'Claude Link' }).getAttribute('aria-selected') === 'true', 'Claude Link tab should become selected after click', failures);

    await page.getByRole('tab', { name: 'ChatGPT' }).click();
    await page.getByText('Paste a public ChatGPT share URL and export a clean Markdown or PDF copy of the thread.').waitFor();

    const urlInput = page.getByLabel('Shared ChatGPT URL');
    const exportButton = page.getByRole('button', { name: 'Export' });
    const status = page.getByRole('status');
    const markdownOption = page.getByRole('radio', { name: 'Markdown' });
    const pdfOption = page.getByRole('radio', { name: 'PDF' });

    assert(await markdownOption.isEnabled(), 'Markdown option should be enabled', failures);
    assert(await pdfOption.isEnabled(), 'PDF option should be enabled', failures);

    await urlInput.fill('https://example.com/share/not-chatgpt');
    await exportButton.click();
    await page.getByText('Use a public ChatGPT share URL.').waitFor();
    assert(await status.textContent() === 'Use a public ChatGPT share URL.', 'invalid URL should show validation status', failures);
    assert((await page.evaluate(() => window.__aiExporterDownloads)).length === 0, 'invalid URL should not trigger a download', failures);
    assert(apiRequestCount === 0, 'invalid URL should not call the export API', failures);
    await page.getByRole('tab', { name: 'Claude JSON' }).click();
    await waitForSelectedTab(page, 'Claude JSON');
    assert(!(await page.getByText('Use a public ChatGPT share URL.').isVisible()), 'ChatGPT validation status should be hidden outside the ChatGPT tab', failures);
    await page.getByRole('tab', { name: 'ChatGPT' }).click();

    await urlInput.fill('https://chatgpt.com/share/mock-thread');
    await exportButton.click();
    await page.getByText('Creating your export.').waitFor();
    await page.getByText('Downloaded chatgpt-thread-export.md.').waitFor();
    let downloads = await page.evaluate(() => window.__aiExporterDownloads);
    assert(downloads.length === 1, 'valid Markdown export should trigger one download', failures);
    assert(downloads[0].download === 'chatgpt-thread-export.md', 'Markdown export should download the Markdown fallback filename', failures);
    assert(apiRequestCount === 1, 'valid Markdown export should call the export API once', failures);
    await page.waitForTimeout(3500);

    await urlInput.fill('https://chatgpt.com/share/keyboard-submit');
    await urlInput.press('Enter');
    await page.getByText('Downloaded chatgpt-thread-export.md.').waitFor();
    downloads = await page.evaluate(() => window.__aiExporterDownloads);
    assert(downloads.length === 2, 'pressing Enter in the URL field should submit through the same export path', failures);
    assert(downloads[1].download === 'chatgpt-thread-export.md', 'keyboard submit should download the Markdown fallback filename', failures);
    assert(apiRequestCount === 2, 'keyboard submit should call the export API once', failures);

    await pdfOption.check();
    await exportButton.click();
    await page.getByText('Downloaded chatgpt-thread-export.pdf.').waitFor();
    downloads = await page.evaluate(() => window.__aiExporterDownloads);
    assert(downloads.length === 3, 'valid PDF export should trigger one additional download', failures);
    assert(downloads[2].download === 'chatgpt-thread-export.pdf', 'PDF export should download the PDF fallback filename', failures);
    assert(apiRequestCount === 3, 'valid PDF export should call the export API once', failures);
    await markdownOption.check();
    await page.waitForTimeout(3500);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.__aiExporterDownloads = [];
    });
    apiRequestCount = 0;

    await urlInput.fill('https://chatgpt.com/share/double-click');
    const firstExportClick = exportButton.click();
    await page.waitForTimeout(50);
    await exportButton.click({ force: true });
    await firstExportClick;
    await page.getByText('Downloaded chatgpt-thread-export.md.').waitFor();
    downloads = await page.evaluate(() => window.__aiExporterDownloads);
    assert(downloads.length === 1, `double-clicking Export should still trigger only one download (saw ${downloads.length})`, failures);
    assert(apiRequestCount === 1, `double-clicking Export should still call the export API only once (saw ${apiRequestCount})`, failures);
    await page.waitForTimeout(3500);

    await urlInput.fill('https://chatgpt.com/share/server-error');
    await exportButton.click();
    await page.getByText('The export failed. Please try again.').waitFor();
    assert(await urlInput.isEnabled(), 'URL input should recover after an API error', failures);
    assert(await page.getByLabel('Markdown').isEnabled(), 'Markdown format control should recover after an API error', failures);
    assert(await page.getByLabel('PDF').isEnabled(), 'PDF format control should recover after an API error', failures);
    assert(await exportButton.isEnabled(), 'export button should recover after an API error', failures);
    downloads = await page.evaluate(() => window.__aiExporterDownloads);
    assert(downloads.length === 1, 'API errors should not trigger an extra download', failures);
    assert(apiRequestCount === 2, 'API error path should still make exactly one request', failures);

    await page.getByRole('tab', { name: 'Claude JSON' }).click();
    await page.getByLabel('Claude snapshot JSON').fill('{bad json');
    await page.getByRole('button', { name: 'Export Claude Markdown' }).click();
    await page.getByText('Paste valid Claude snapshot JSON.').waitFor();
    assert(apiRequestCount === 2, 'invalid Claude snapshot JSON should not call the export API', failures);

    const claudeSnapshotJson = JSON.stringify({
      snapshot_name: 'Claude browser fixture',
      chat_messages: [
        {
          sender: 'human',
          content: [{ type: 'text', text: 'Hello Claude' }],
        },
      ],
    });
    await page.getByLabel('Claude snapshot JSON').fill(claudeSnapshotJson);
    await page.getByLabel('Claude source share URL').fill('https://claude.ai/share/browser-fixture');
    await page.getByRole('button', { name: 'Export Claude Markdown' }).click();
    await page.getByText('Downloaded claude-thread-export.md.').waitFor();
    downloads = await page.evaluate(() => window.__aiExporterDownloads);
    assert(downloads.length === 2, 'valid Claude Markdown export should trigger one additional download', failures);
    assert(downloads[1].download === 'claude-thread-export.md', 'Claude Markdown export should download the Claude fallback filename', failures);
    assert(apiRequestCount === 3, 'valid Claude Markdown export should call the export API once', failures);
    const claudePayload = apiPayloads[apiPayloads.length - 1];
    assert(claudePayload.provider === 'claude', 'Claude browser export should send provider claude', failures);
    assert(claudePayload.mode === 'snapshot-json', 'Claude browser export should send snapshot-json mode', failures);
    assert(claudePayload.snapshotJson === claudeSnapshotJson, 'Claude browser export should send pasted snapshot JSON', failures);
    assert(claudePayload.sourceUrl === 'https://claude.ai/share/browser-fixture', 'Claude browser export should send optional source URL', failures);
    assert(claudePayload.format === 'markdown', 'Claude browser export should request Markdown in Phase 3', failures);

    await page.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  report(failures, '✅ AI Chat Exporter browser interaction passed.');
}

run().catch((error) => {
  failures.push(error?.stack || error?.message || String(error));
  report(failures, '✅ AI Chat Exporter browser interaction passed.');
});
