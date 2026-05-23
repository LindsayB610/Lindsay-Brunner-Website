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
  assert(source.includes('verifyTurnstileToken'), 'Netlify function should verify Turnstile tokens before export work', failures);
  assert(source.includes('TURNSTILE_SECRET_KEY'), 'Netlify function should read the Turnstile secret key from environment', failures);
  assert(source.includes('checkPdfRateLimit'), 'Netlify function should check a PDF-specific rate limit before export work', failures);
  assert(source.includes('@netlify/blobs'), 'Netlify function should use Netlify Blobs for shared PDF rate limit state', failures);
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
    read('netlify/functions/_shared/exporter-adapter.ts').includes('claude-thread-exporter'),
    'exporter adapter should import the Claude exporter package server-side',
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

  const claudeMalformedJsonResponse = await postJson(handler, {
    provider: 'claude',
    mode: 'snapshot-json',
    snapshotJson: '{bad json',
    format: 'markdown',
  });
  assert(claudeMalformedJsonResponse.status === 400, 'malformed Claude snapshot JSON should return 400', failures);
  assert((await claudeMalformedJsonResponse.json()).error === 'Paste valid Claude snapshot JSON.', 'malformed Claude snapshot JSON should be user-readable', failures);

  const claudeUnsupportedJsonResponse = await postJson(handler, {
    provider: 'claude',
    mode: 'snapshot-json',
    snapshotJson: JSON.stringify({ messages: [] }),
    format: 'markdown',
  });
  assert(claudeUnsupportedJsonResponse.status === 400, 'unsupported Claude snapshot JSON should return 400', failures);
  assert((await claudeUnsupportedJsonResponse.json()).error === 'Snapshot JSON must include Claude chat_messages.', 'unsupported Claude snapshot JSON should be user-readable', failures);

  let exporterCalledAfterInvalidClaudeWithTurnstile = false;
  const claudeMalformedWithTurnstileResponse = await postJson(handleExportChatRequest, {
    provider: 'claude',
    mode: 'snapshot-json',
    snapshotJson: '{bad json',
    format: 'markdown',
  }, {
    exportChat: async () => {
      exporterCalledAfterInvalidClaudeWithTurnstile = true;
      return new Response('should not export');
    },
    getTurnstileSecret: () => 'mock-secret',
    verifyTurnstileToken: async () => false,
  });
  assert(claudeMalformedWithTurnstileResponse.status === 400, 'invalid Claude snapshot JSON should return validation errors before Turnstile challenges', failures);
  assert((await claudeMalformedWithTurnstileResponse.json()).error === 'Paste valid Claude snapshot JSON.', 'invalid Claude snapshot JSON with Turnstile configured should still be user-readable', failures);
  assert(!exporterCalledAfterInvalidClaudeWithTurnstile, 'invalid Claude snapshot JSON should not invoke exporter work even when Turnstile is configured', failures);

  let exporterCalledForClaudePdf = false;
  const claudePdfResponse = await postJson(handleExportChatRequest, {
    provider: 'claude',
    mode: 'snapshot-json',
    snapshotJson: JSON.stringify({ chat_messages: [] }),
    format: 'pdf',
    turnstileToken: 'good-token',
  }, {
    checkPdfRateLimit: async () => ({ allowed: true }),
    exportChat: async () => {
      exporterCalledForClaudePdf = true;
      return new Response('should not export');
    },
    getTurnstileSecret: () => 'mock-secret',
    verifyTurnstileToken: async () => true,
  });
  assert(claudePdfResponse.status === 400, 'Claude snapshot PDF should be gated until Phase 4', failures);
  assert((await claudePdfResponse.json()).error === 'Claude snapshot PDF export is not available yet.', 'Claude snapshot PDF gate should be user-readable', failures);
  assert(!exporterCalledForClaudePdf, 'Claude snapshot PDF gate should not invoke exporter work', failures);

  let claudeMarkdownRequest = null;
  const claudeSnapshotJson = JSON.stringify({
    snapshot_name: 'Claude Adapter Thread',
    chat_messages: [
      { sender: 'human', text: 'Hello Claude' },
      { sender: 'assistant', text: 'Hello human' },
    ],
  });
  const claudeMarkdownResponse = await postJson(handleExportChatRequest, {
    provider: 'claude',
    mode: 'snapshot-json',
    snapshotJson: claudeSnapshotJson,
    sourceUrl: 'https://claude.ai/share/mock-thread',
    format: 'markdown',
  }, {
    exportChat: async (request) => {
      claudeMarkdownRequest = request;
      return new Response('# Claude Adapter Thread\n', {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition': 'attachment; filename="claude-adapter-thread-export.md"',
          'Content-Type': 'text/markdown; charset=utf-8',
        },
        status: 200,
      });
    },
  });
  assert(claudeMarkdownResponse.status === 200, 'mock Claude Markdown export should return 200', failures);
  assert(claudeMarkdownRequest.provider === 'claude', 'Claude Markdown export should pass provider to the adapter', failures);
  assert(claudeMarkdownRequest.mode === 'snapshot-json', 'Claude Markdown export should pass snapshot-json mode to the adapter', failures);
  assert(claudeMarkdownRequest.snapshotJson === claudeSnapshotJson, 'Claude Markdown export should pass snapshot JSON to the adapter', failures);
  assert(claudeMarkdownRequest.sourceUrl === 'https://claude.ai/share/mock-thread', 'Claude Markdown export should pass source URL to the adapter', failures);
  assert(claudeMarkdownResponse.headers.get('Content-Type').includes('text/markdown'), 'mock Claude Markdown export should set text/markdown content type', failures);
  assert(claudeMarkdownResponse.headers.get('Content-Disposition').includes('.md'), 'mock Claude Markdown export should set a Markdown filename', failures);
  assert(claudeMarkdownResponse.headers.get('Cache-Control') === 'no-store', 'mock Claude Markdown export should prevent caching', failures);

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
    checkPdfRateLimit: async () => ({ allowed: true }),
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

  let exporterCalledAfterMissingTurnstile = false;
  const missingTurnstileResponse = await postJson(handleExportChatRequest, {
    sharedUrl: 'https://chatgpt.com/share/mock-thread',
    format: 'markdown',
  }, {
    exportChat: async () => {
      exporterCalledAfterMissingTurnstile = true;
      return new Response('should not export');
    },
    getTurnstileSecret: () => 'mock-secret',
    verifyTurnstileToken: async () => true,
  });
  assert(missingTurnstileResponse.status === 403, 'missing Turnstile token should return 403 when Turnstile is configured', failures);
  assert((await missingTurnstileResponse.json()).error === 'Please verify you are human and try again.', 'missing Turnstile token should use a safe human-verification error', failures);
  assert(!exporterCalledAfterMissingTurnstile, 'missing Turnstile token should not invoke exporter work', failures);

  let exporterCalledAfterInvalidTurnstile = false;
  const invalidTurnstileResponse = await postJson(handleExportChatRequest, {
    sharedUrl: 'https://chatgpt.com/share/mock-thread',
    format: 'markdown',
    turnstileToken: 'bad-token',
  }, {
    exportChat: async () => {
      exporterCalledAfterInvalidTurnstile = true;
      return new Response('should not export');
    },
    getTurnstileSecret: () => 'mock-secret',
    verifyTurnstileToken: async () => false,
  });
  assert(invalidTurnstileResponse.status === 403, 'invalid Turnstile token should return 403', failures);
  assert((await invalidTurnstileResponse.json()).error === 'Please verify you are human and try again.', 'invalid Turnstile token should use a safe human-verification error', failures);
  assert(!exporterCalledAfterInvalidTurnstile, 'invalid Turnstile token should not invoke exporter work', failures);

  let exporterCalledAfterValidTurnstile = false;
  const validTurnstileResponse = await postJson(handleExportChatRequest, {
    sharedUrl: 'https://chatgpt.com/share/mock-thread',
    format: 'markdown',
    turnstileToken: 'good-token',
  }, {
    exportChat: async () => {
      exporterCalledAfterValidTurnstile = true;
      return new Response('# Human export', {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition': 'attachment; filename="human.md"',
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    },
    getTurnstileSecret: () => 'mock-secret',
    verifyTurnstileToken: async (token, secret) => token === 'good-token' && secret === 'mock-secret',
  });
  assert(validTurnstileResponse.status === 200, 'valid Turnstile token should allow export', failures);
  assert(exporterCalledAfterValidTurnstile, 'valid Turnstile token should invoke exporter work', failures);

  let exporterCalledAfterPdfRateLimit = false;
  const pdfRateLimitedResponse = await postJson(handleExportChatRequest, {
    sharedUrl: 'https://chatgpt.com/share/mock-thread',
    format: 'pdf',
    turnstileToken: 'good-token',
  }, {
    checkPdfRateLimit: async () => ({
      allowed: false,
      retryAfterSeconds: 1800,
    }),
    exportChat: async () => {
      exporterCalledAfterPdfRateLimit = true;
      return new Response('should not export');
    },
    getTurnstileSecret: () => 'mock-secret',
    verifyTurnstileToken: async () => true,
  });
  assert(pdfRateLimitedResponse.status === 429, 'PDF rate limit should return 429 before expensive export work', failures);
  assert(pdfRateLimitedResponse.headers.get('Retry-After') === '1800', 'PDF rate limit should include Retry-After', failures);
  assert((await pdfRateLimitedResponse.json()).error === 'PDF exports are temporarily limited. Please try again later.', 'PDF rate limit should use a safe user-readable error', failures);
  assert(!exporterCalledAfterPdfRateLimit, 'PDF rate limit should not invoke exporter work', failures);

  let markdownRateLimitChecked = false;
  let markdownExportCalledWithLimiter = false;
  const markdownWithPdfLimiterResponse = await postJson(handleExportChatRequest, {
    sharedUrl: 'https://chatgpt.com/share/mock-thread',
    format: 'markdown',
    turnstileToken: 'good-token',
  }, {
    checkPdfRateLimit: async () => {
      markdownRateLimitChecked = true;
      return { allowed: false, retryAfterSeconds: 1800 };
    },
    exportChat: async () => {
      markdownExportCalledWithLimiter = true;
      return new Response('# Markdown stays available', {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition': 'attachment; filename="human.md"',
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    },
    getTurnstileSecret: () => 'mock-secret',
    verifyTurnstileToken: async () => true,
  });
  assert(markdownWithPdfLimiterResponse.status === 200, 'PDF rate limit should not apply to Markdown exports', failures);
  assert(!markdownRateLimitChecked, 'PDF rate limit should not be checked for Markdown exports', failures);
  assert(markdownExportCalledWithLimiter, 'Markdown export should still run when PDF limiter exists', failures);

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

  const adapterClaudeMarkdownResponse = await exportChatWithExporter({
    provider: 'claude',
    mode: 'snapshot-json',
    snapshotJson: claudeSnapshotJson,
    sourceUrl: 'https://claude.ai/share/mock-thread',
    format: 'markdown',
  }, undefined, async () => ({
    parseSnapshotJson: (raw) => JSON.parse(raw),
    renderMarkdown: ({ snapshot, sourceUrl }) => [
      `# ${snapshot.snapshot_name}`,
      '',
      `Source: ${sourceUrl}`,
      '',
      '## Claude',
      '',
      snapshot.chat_messages[1].text,
      '',
    ].join('\n'),
  }));
  const adapterClaudeMarkdown = await adapterClaudeMarkdownResponse.text();
  assert(adapterClaudeMarkdownResponse.status === 200, 'adapter Claude Markdown response should return 200', failures);
  assert(adapterClaudeMarkdownResponse.headers.get('Content-Type').includes('text/markdown'), 'adapter Claude Markdown response should set Markdown content type', failures);
  assert(adapterClaudeMarkdownResponse.headers.get('Content-Disposition').includes('claude-adapter-thread-export.md'), 'adapter Claude Markdown response should use the snapshot title filename', failures);
  assert(adapterClaudeMarkdown.includes('# Claude Adapter Thread'), 'adapter Claude Markdown response should render the snapshot title', failures);
  assert(adapterClaudeMarkdown.includes('Source: https://claude.ai/share/mock-thread'), 'adapter Claude Markdown response should include source metadata', failures);
  assert(adapterClaudeMarkdown.includes('## Claude'), 'adapter Claude Markdown response should render Claude messages', failures);

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
