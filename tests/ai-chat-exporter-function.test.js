const {
  assert,
  exists,
  loadTsModule,
  read,
  report,
} = require('./ai-chat-exporter-test-utils');

const failures = [];
const { AI_CHAT_EXPORTER_CONTRACT } = loadTsModule('src/lib/ai-chat-exporter.ts');

async function run() {
  console.log('λ Checking AI Chat Exporter function contract...');

  assert(AI_CHAT_EXPORTER_CONTRACT.apiPath === '/api/export-chat', 'API path contract should be stable', failures);
  assert(
    JSON.stringify(AI_CHAT_EXPORTER_CONTRACT.formats) === JSON.stringify(['markdown', 'pdf']),
    'function contract should support markdown and pdf',
    failures,
  );

  assert(exists('netlify/functions/export-chat.mts'), 'netlify/functions/export-chat.mts should exist for Netlify ESM config support', failures);
  if (!exists('netlify/functions/export-chat.mts')) {
    report(failures, '✅ AI Chat Exporter function contract passed.');
    return;
  }

  const source = read('netlify/functions/export-chat.mts');
  const netlifyConfig = read('netlify.toml');
  const functionModule = loadTsModule('netlify/functions/export-chat.mts');
  const adapterModule = loadTsModule('netlify/functions/_shared/exporter-adapter.ts');
  const handler = functionModule.default;
  const handleExportChatRequest = functionModule.handleExportChatRequest;
  const config = functionModule.config;
  const exportChatWithExporter = adapterModule.exportChatWithExporter;
  const buildExportFilename = adapterModule.buildExportFilename;
  const renderPdfWithServerlessChromium = adapterModule.renderPdfWithServerlessChromium;

  assert(source.includes('export default async'), 'Netlify function should use modern default export syntax', failures);
  assert(source.includes('export const config'), 'Netlify function should export config', failures);
  assert(source.includes('exportChatWithExporter'), 'Netlify function should use the real exporter adapter by default', failures);
  assert(!source.includes('PDF export is not available yet.'), 'Netlify function should not block PDF exports behind a disabled-runtime response', failures);
  assert(
    netlifyConfig.includes('from = "/api/export-chat"') &&
      netlifyConfig.includes('to = "/.netlify/functions/export-chat"'),
    'netlify.toml should rewrite /api/export-chat to the Netlify function for local and deploy parity',
    failures,
  );
  assert(
    read('netlify/functions/_shared/exporter-adapter.ts').includes('chatgpt-thread-exporter/pipeline'),
    'exporter adapter should import the package public pipeline export',
    failures,
  );
  assert(
    read('netlify/functions/_shared/exporter-adapter.ts').includes('@sparticuz/chromium') &&
      read('netlify/functions/_shared/exporter-adapter.ts').includes('playwright-core'),
    'serverless PDF renderer should use Lambda-compatible Chromium with Playwright Core',
    failures,
  );
  assert(
    read('netlify/functions/_shared/exporter-adapter.ts').includes('render-chatgpt-html.js') &&
      read('netlify/functions/_shared/exporter-adapter.ts').includes('page.pdf({'),
    'serverless PDF renderer should use the CLI HTML renderer and browser PDF path for visual parity',
    failures,
  );
  assert(
    read('netlify/functions/_shared/exporter-adapter.ts').includes('renderPdfWithServerlessChromium') &&
      !read('netlify/functions/_shared/exporter-adapter.ts').includes('renderPdfWithServerlessPdfKit') &&
      !read('netlify/functions/_shared/exporter-adapter.ts').includes('pdfkit'),
    'serverless PDF renderer should not use the PDFKit fallback when CLI visual parity is required',
    failures,
  );
  assert(
    netlifyConfig.includes('included_files = ["node_modules/chatgpt-thread-exporter/dist/pdf/**"]'),
    'netlify.toml should include the exporter PDF renderer files used by the dynamic serverless import',
    failures,
  );
  assert(config?.path === AI_CHAT_EXPORTER_CONTRACT.apiPath, 'Netlify function config should expose /api/export-chat', failures);
  assert(Array.isArray(config?.method) && config.method.includes('POST'), 'Netlify function config should allow POST', failures);
  assert(typeof handler === 'function', 'Netlify function default export should be callable', failures);
  assert(typeof handleExportChatRequest === 'function', 'Netlify function should expose an injectable request handler for tests', failures);
  assert(typeof exportChatWithExporter === 'function', 'exporter adapter should expose exportChatWithExporter', failures);
  assert(typeof buildExportFilename === 'function', 'exporter adapter should expose filename builder for tests', failures);
  assert(typeof renderPdfWithServerlessChromium === 'function', 'exporter adapter should expose the serverless Chromium PDF renderer for focused tests', failures);

  assert(buildExportFilename('My Excellent Thread!', 'md') === 'my-excellent-thread-export.md', 'export filename should use a slugged transcript title', failures);
  assert(buildExportFilename('', 'pdf') === 'chatgpt-thread-export.pdf', 'export filename should fall back for empty titles', failures);

  const getResponse = await handler(new Request('https://lindsaybrunner.com/api/export-chat', { method: 'GET' }), {});
  assert(getResponse.status === 405, 'GET /api/export-chat should return 405', failures);
  assert((await getResponse.json()).error === 'Method not allowed.', '405 response should use a safe JSON error', failures);

  const invalidJsonResponse = await handler(new Request('https://lindsaybrunner.com/api/export-chat', {
    body: '{nope',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  }), {});
  assert(invalidJsonResponse.status === 400, 'invalid JSON should return 400', failures);
  assert((await invalidJsonResponse.json()).error === 'Request body must be valid JSON.', 'invalid JSON response should be user-readable', failures);

  const missingUrlResponse = await postJson(handler, { format: 'markdown' });
  assert(missingUrlResponse.status === 400, 'missing URL should return 400', failures);
  assert((await missingUrlResponse.json()).error === 'Paste a public ChatGPT share URL.', 'missing URL response should be user-readable', failures);

  const nonStringUrlResponse = await postJson(handler, {
    sharedUrl: 123,
    format: 'markdown',
  });
  assert(nonStringUrlResponse.status === 400, 'non-string URL should return 400', failures);
  assert((await nonStringUrlResponse.json()).error === 'Paste a public ChatGPT share URL.', 'non-string URL response should be user-readable', failures);

  const invalidUrlResponse = await postJson(handler, {
    sharedUrl: 'https://example.com/share/nope',
    format: 'markdown',
  });
  assert(invalidUrlResponse.status === 400, 'invalid URL should return 400', failures);
  assert((await invalidUrlResponse.json()).error === 'Use a public ChatGPT share URL.', 'invalid URL response should reuse the shared validation message', failures);

  const unsupportedFormatResponse = await postJson(handler, {
    sharedUrl: 'https://chatgpt.com/share/mock-thread',
    format: 'docx',
  });
  assert(unsupportedFormatResponse.status === 400, 'unsupported format should return 400', failures);
  assert((await unsupportedFormatResponse.json()).error === 'Choose Markdown or PDF.', 'unsupported format response should reuse the shared validation message', failures);

  const markdownResponse = await postJson(handleExportChatRequest, {
    sharedUrl: 'https://chatgpt.com/share/mock-thread',
    format: 'markdown',
  }, {
    exportChat: async (request) => new Response(`# Mock export\n\n${request.sharedUrl}`, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': 'attachment; filename="mock-thread.md"',
        'Content-Type': 'text/markdown; charset=utf-8',
      },
      status: 200,
    }),
  });
  assert(markdownResponse.status === 200, 'mock Markdown export should return 200', failures);
  assert(markdownResponse.headers.get('Content-Type').includes('text/markdown'), 'mock Markdown export should set text/markdown content type', failures);
  assert(markdownResponse.headers.get('Content-Disposition').includes('.md'), 'mock Markdown export should set a Markdown disposition filename', failures);
  assert(markdownResponse.headers.get('Cache-Control') === 'no-store', 'mock Markdown export should prevent caching', failures);
  assert((await markdownResponse.text()).includes('https://chatgpt.com/share/mock-thread'), 'mock Markdown export should include source URL in body', failures);

  const pdfResponse = await postJson(handleExportChatRequest, {
    sharedUrl: 'https://chatgpt.com/share/mock-thread',
    format: 'pdf',
  }, {
    exportChat: async () => new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': 'attachment; filename="mock-thread.pdf"',
        'Content-Type': 'application/pdf',
      },
      status: 200,
    }),
  });
  assert(pdfResponse.status === 200, 'mock PDF export should return 200', failures);
  assert(pdfResponse.headers.get('Content-Type') === 'application/pdf', 'mock PDF export should set application/pdf content type', failures);
  assert(pdfResponse.headers.get('Content-Disposition').includes('.pdf'), 'mock PDF export should set a PDF disposition filename', failures);
  assert(pdfResponse.headers.get('Cache-Control') === 'no-store', 'mock PDF export should prevent caching', failures);
  assert((await pdfResponse.blob()).type === 'application/pdf', 'mock PDF export should return a PDF Blob', failures);

  let receivedPipelineOptions = null;
  const adapterMarkdownResponse = await exportChatWithExporter({
    sharedUrl: 'https://chatgpt.com/share/adapter-thread',
    format: 'markdown',
  }, async (options) => {
    receivedPipelineOptions = options;
    return {
      transcript: { title: 'Adapter Thread' },
      outputFormat: 'markdown',
      outputContent: '# Adapter Thread\n',
    };
  });

  assert(receivedPipelineOptions.url === 'https://chatgpt.com/share/adapter-thread', 'adapter should map sharedUrl to exporter url option', failures);
  assert(receivedPipelineOptions.format === 'markdown', 'adapter should map format to exporter format option', failures);
  assert(adapterMarkdownResponse.status === 200, 'adapter Markdown response should return 200', failures);
  assert(adapterMarkdownResponse.headers.get('Content-Type').includes('text/markdown'), 'adapter Markdown response should set Markdown content type', failures);
  assert(adapterMarkdownResponse.headers.get('Content-Disposition').includes('adapter-thread-export.md'), 'adapter Markdown response should use transcript title filename', failures);
  assert(await adapterMarkdownResponse.text() === '# Adapter Thread\n', 'adapter Markdown response should preserve output content', failures);

  const adapterPdfResponse = await exportChatWithExporter({
    sharedUrl: 'https://chatgpt.com/share/adapter-pdf',
    format: 'pdf',
  }, async () => ({
    transcript: { title: 'Adapter PDF' },
    outputFormat: 'pdf',
    outputContent: new Uint8Array([37, 80, 68, 70]),
  }));

  assert(adapterPdfResponse.status === 200, 'adapter PDF response should return 200', failures);
  assert(adapterPdfResponse.headers.get('Content-Type') === 'application/pdf', 'adapter PDF response should set PDF content type', failures);
  assert(adapterPdfResponse.headers.get('Content-Disposition').includes('adapter-pdf-export.pdf'), 'adapter PDF response should use transcript title filename', failures);
  assert((await adapterPdfResponse.arrayBuffer()).byteLength === 4, 'adapter PDF response should preserve binary output content', failures);

  const exporterFailureResponse = await handleExportChatRequest(new Request('https://lindsaybrunner.com/api/export-chat', {
    body: JSON.stringify({
      sharedUrl: 'https://chatgpt.com/share/mock-thread',
      format: 'markdown',
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  }), {
    exportChat: async () => {
      throw new Error('Sensitive internal failure details');
    },
  });
  assert(exporterFailureResponse.status === 500, 'unexpected exporter failure should return 500', failures);
  assert((await exporterFailureResponse.json()).error === 'The export failed. Please try again.', 'unexpected exporter failure should not leak internal errors', failures);

  report(failures, '✅ AI Chat Exporter function contract passed.');
}

function postJson(handler, payload, dependencies) {
  return handler(new Request('https://lindsaybrunner.com/api/export-chat', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  }), dependencies || {});
}

run().catch((error) => {
  failures.push(error?.stack || error?.message || String(error));
  report(failures, '✅ AI Chat Exporter function contract passed.');
});
