const {
  assert,
  loadTsModule,
  report,
} = require('./ai-chat-exporter-test-utils');

const failures = [];
const {
  AI_CHAT_EXPORTER_CONTRACT,
  buildClaudeSnapshotCommand,
  buildExportRequest,
  exportSharedChat,
  fetchExportSharedChat,
  isChatGptShareUrl,
  isClaudeShareUrl,
  isClaudeSnapshotJson,
  mockExportSharedChat,
  parseClaudeSnapshotJson,
  parseDownloadFilename,
  triggerFileDownload,
  withExportTimeout,
} = loadTsModule('src/lib/ai-chat-exporter.ts');

async function run() {
  console.log('🧪 Checking AI Chat Exporter client contracts...');

  assert(AI_CHAT_EXPORTER_CONTRACT.route === '/ai-chat-exporter/', 'route contract should be /ai-chat-exporter/', failures);
  assert(AI_CHAT_EXPORTER_CONTRACT.rootId === 'ai-chat-exporter-root', 'root id contract should be ai-chat-exporter-root', failures);
  assert(AI_CHAT_EXPORTER_CONTRACT.apiPath === '/api/export-chat', 'API path contract should be /api/export-chat', failures);
  assert(AI_CHAT_EXPORTER_CONTRACT.exportTimeoutMs <= 65000, 'export timeout should stay below or near the Netlify function timeout', failures);
  assert(
    AI_CHAT_EXPORTER_CONTRACT.maxClaudeSnapshotJsonBytes > 0 &&
      AI_CHAT_EXPORTER_CONTRACT.maxClaudeSnapshotJsonBytes <= 2_000_000,
    'Claude snapshot JSON payload limit should be explicit and conservative for the web exporter',
    failures,
  );
  assert(
    JSON.stringify(AI_CHAT_EXPORTER_CONTRACT.formats) === JSON.stringify(['markdown', 'pdf']),
    'supported format contract should be markdown and pdf',
    failures,
  );
  assert(
    JSON.stringify(AI_CHAT_EXPORTER_CONTRACT.enabledFormats) === JSON.stringify(['markdown', 'pdf']),
    'public launch should enable Markdown and PDF exports',
    failures,
  );
  assert(
    JSON.stringify(AI_CHAT_EXPORTER_CONTRACT.tabs) === JSON.stringify(['ChatGPT', 'Claude JSON', 'Claude Link']),
    'tab contract should be ChatGPT, Claude JSON, Claude Link',
    failures,
  );
  assert(
    JSON.stringify(AI_CHAT_EXPORTER_CONTRACT.providers) === JSON.stringify(['chatgpt', 'claude']),
    'provider contract should be chatgpt and claude',
    failures,
  );
  assert(
    JSON.stringify(AI_CHAT_EXPORTER_CONTRACT.modes) === JSON.stringify(['share-link', 'snapshot-json']),
    'mode contract should be share-link and snapshot-json',
    failures,
  );
  assert(
    AI_CHAT_EXPORTER_CONTRACT.fallbackFilenames.chatgpt.markdown === 'chatgpt-thread-export.md',
    'ChatGPT Markdown fallback filename should remain stable',
    failures,
  );
  assert(
    AI_CHAT_EXPORTER_CONTRACT.fallbackFilenames.claude.pdf === 'claude-thread-export.pdf',
    'Claude PDF fallback filename should be provider-specific',
    failures,
  );

  [
    'https://chatgpt.com/share/abc123',
    'https://chatgpt.com/share/abc123?utm_source=test',
    'https://chat.openai.com/share/abc123',
    ' https://chatgpt.com/share/abc123 ',
  ].forEach((url) => assert(isChatGptShareUrl(url), `${url} should be accepted as a ChatGPT share URL`, failures));

  [
    '',
    'not a url',
    'https://example.com/share/abc123',
    'https://chatgpt.com/c/abc123',
    'https://evil.chatgpt.com/share/abc123',
    'https://chat.openai.com/shared/abc123',
  ].forEach((url) => assert(!isChatGptShareUrl(url), `${url || '(empty)'} should be rejected as a ChatGPT share URL`, failures));

  [
    'https://claude.ai/share/7b2442ee-2ffb-4f82-8852-291840cf5ca0',
    'https://claude.ai/share/abc123?utm_source=test',
    ' https://claude.ai/share/abc123 ',
  ].forEach((url) => assert(isClaudeShareUrl(url), `${url} should be accepted as a Claude share URL`, failures));

  [
    '',
    'not a url',
    'https://example.com/share/abc123',
    'https://claude.ai/chat/abc123',
    'https://evil.claude.ai/share/abc123',
    'https://claude.ai/shared/abc123',
  ].forEach((url) => assert(!isClaudeShareUrl(url), `${url || '(empty)'} should be rejected as a Claude share URL`, failures));

  const claudeSnapshotCommand = buildClaudeSnapshotCommand(' https://claude.ai/share/abc123 ');
  assert(
    claudeSnapshotCommand === 'claude-thread-exporter --claude-url "https://claude.ai/share/abc123" --save-snapshot "./claude-thread.snapshot.json"',
    'buildClaudeSnapshotCommand should generate the local snapshot command with the default output path',
    failures,
  );
  assert(
    buildClaudeSnapshotCommand('https://claude.ai/share/abc123', './exports/my thread.json').includes('--save-snapshot "./exports/my thread.json"'),
    'buildClaudeSnapshotCommand should quote custom output paths',
    failures,
  );
  assert(
    buildClaudeSnapshotCommand('https://claude.ai/share/abc123?note=$draft', './exports/"quoted".json').includes('--save-snapshot "./exports/\\"quoted\\".json"'),
    'buildClaudeSnapshotCommand should escape shell-sensitive output paths',
    failures,
  );

  try {
    buildClaudeSnapshotCommand('https://example.com/share/nope');
    failures.push('buildClaudeSnapshotCommand should throw for invalid Claude share links');
  } catch (error) {
    assert(error.message === 'Use a public Claude share URL.', 'invalid Claude command URL error should be user-readable', failures);
  }

  const claudeSnapshotJson = JSON.stringify({
    snapshot: {
      uuid: 'snapshot-abc',
      snapshot_name: 'Claude fixture',
      chat_messages: [
        {
          sender: 'human',
          text: 'Hello',
        },
      ],
    },
  });
  assert(isClaudeSnapshotJson(claudeSnapshotJson), 'Claude snapshot JSON with chat_messages should be accepted', failures);
  assert(isClaudeSnapshotJson(JSON.stringify({ data: JSON.parse(claudeSnapshotJson) })), 'nested Claude snapshot JSON should be accepted', failures);
  assert(!isClaudeSnapshotJson('{bad json'), 'malformed Claude snapshot JSON should be rejected', failures);
  assert(!isClaudeSnapshotJson(JSON.stringify({ messages: [] })), 'JSON without chat_messages should be rejected as a Claude snapshot', failures);
  assert(parseClaudeSnapshotJson(claudeSnapshotJson).snapshot_name === 'Claude fixture', 'parseClaudeSnapshotJson should return the nested Claude snapshot payload', failures);

  try {
    parseClaudeSnapshotJson('{bad json');
    failures.push('parseClaudeSnapshotJson should throw for malformed JSON');
  } catch (error) {
    assert(error.message === 'Paste valid Claude snapshot JSON.', 'malformed Claude JSON error should be user-readable', failures);
  }

  try {
    parseClaudeSnapshotJson(JSON.stringify({ messages: [] }));
    failures.push('parseClaudeSnapshotJson should throw for unsupported snapshot JSON');
  } catch (error) {
    assert(error.message === 'Snapshot JSON must include Claude chat_messages.', 'unsupported Claude JSON error should be user-readable', failures);
  }

  const oversizedClaudeSnapshotJson = JSON.stringify({
    chat_messages: [
      {
        sender: 'human',
        text: 'x'.repeat(AI_CHAT_EXPORTER_CONTRACT.maxClaudeSnapshotJsonBytes),
      },
    ],
  });
  assert(!isClaudeSnapshotJson(oversizedClaudeSnapshotJson), 'oversized Claude snapshot JSON should be rejected before parsing', failures);
  try {
    parseClaudeSnapshotJson(oversizedClaudeSnapshotJson);
    failures.push('parseClaudeSnapshotJson should throw for oversized Claude JSON');
  } catch (error) {
    assert(error.message === 'Claude snapshot JSON is too large for the web exporter. Use the local CLI for this export.', 'oversized Claude JSON error should be user-readable', failures);
  }

  const request = buildExportRequest(' https://chatgpt.com/share/abc123 ', 'markdown');
  assert(request.sharedUrl === 'https://chatgpt.com/share/abc123', 'buildExportRequest should trim sharedUrl', failures);
  assert(request.format === 'markdown', 'buildExportRequest should preserve a valid format', failures);

  const requestWithTurnstile = buildExportRequest(
    'https://chatgpt.com/share/abc123',
    'pdf',
    'mock-turnstile-token',
  );
  assert(requestWithTurnstile.turnstileToken === 'mock-turnstile-token', 'buildExportRequest should include a Turnstile token when one is provided', failures);

  try {
    buildExportRequest('https://example.com/share/abc123', 'markdown');
    failures.push('buildExportRequest should throw for an invalid URL');
  } catch (error) {
    assert(error.message === 'Use a public ChatGPT share URL.', 'invalid URL error should be user-readable', failures);
  }

  try {
    buildExportRequest('https://chatgpt.com/share/abc123', 'docx');
    failures.push('buildExportRequest should throw for an invalid format');
  } catch (error) {
    assert(error.message === 'Choose Markdown or PDF.', 'invalid format error should be user-readable', failures);
  }

  const claudeRequest = buildExportRequest({
    format: 'pdf',
    provider: 'claude',
    mode: 'snapshot-json',
    snapshotJson: ` ${claudeSnapshotJson} `,
    sourceUrl: ' https://claude.ai/share/7b2442ee-2ffb-4f82-8852-291840cf5ca0 ',
    turnstileToken: ' mock-turnstile-token ',
  });
  assert(claudeRequest.provider === 'claude', 'Claude snapshot request should include provider claude', failures);
  assert(claudeRequest.mode === 'snapshot-json', 'Claude snapshot request should include mode snapshot-json', failures);
  assert(claudeRequest.format === 'pdf', 'Claude snapshot request should preserve the selected format', failures);
  assert(claudeRequest.snapshotJson === claudeSnapshotJson, 'Claude snapshot request should trim snapshotJson', failures);
  assert(claudeRequest.sourceUrl === 'https://claude.ai/share/7b2442ee-2ffb-4f82-8852-291840cf5ca0', 'Claude snapshot request should trim a valid source URL', failures);
  assert(claudeRequest.turnstileToken === 'mock-turnstile-token', 'Claude snapshot request should trim a Turnstile token', failures);

  const claudeRequestWithoutSource = buildExportRequest({
    format: 'markdown',
    provider: 'claude',
    mode: 'snapshot-json',
    snapshotJson: claudeSnapshotJson,
    sourceUrl: '   ',
  });
  assert(!('sourceUrl' in claudeRequestWithoutSource), 'empty Claude source URL should be omitted', failures);

  try {
    buildExportRequest({
      format: 'markdown',
      provider: 'claude',
      mode: 'snapshot-json',
      snapshotJson: '{bad json',
    });
    failures.push('buildExportRequest should throw before network work for malformed Claude JSON');
  } catch (error) {
    assert(error.message === 'Paste valid Claude snapshot JSON.', 'Claude request malformed JSON error should be user-readable', failures);
  }

  try {
    buildExportRequest({
      format: 'markdown',
      provider: 'claude',
      mode: 'snapshot-json',
      snapshotJson: oversizedClaudeSnapshotJson,
    });
    failures.push('buildExportRequest should throw before network work for oversized Claude JSON');
  } catch (error) {
    assert(error.message === 'Claude snapshot JSON is too large for the web exporter. Use the local CLI for this export.', 'Claude request oversized JSON error should be user-readable', failures);
  }

  try {
    buildExportRequest({
      format: 'markdown',
      provider: 'claude',
      mode: 'snapshot-json',
      snapshotJson: claudeSnapshotJson,
      sourceUrl: 'https://example.com/share/not-claude',
    });
    failures.push('buildExportRequest should throw for invalid Claude source URL');
  } catch (error) {
    assert(error.message === 'Use a public Claude share URL.', 'invalid Claude source URL error should be user-readable', failures);
  }

  try {
    buildExportRequest({
      format: 'markdown',
      provider: 'claude',
      mode: 'share-link',
      sharedUrl: 'https://example.com/share/not-claude',
    });
    failures.push('buildExportRequest should throw for invalid Claude share link');
  } catch (error) {
    assert(error.message === 'Use a public Claude share URL.', 'invalid Claude share link error should be user-readable', failures);
  }

  try {
    buildExportRequest({
      format: 'markdown',
      provider: 'chatgpt',
      mode: 'snapshot-json',
      sharedUrl: 'https://chatgpt.com/share/abc123',
    });
    failures.push('buildExportRequest should throw for unsupported ChatGPT modes');
  } catch (error) {
    assert(error.message === 'ChatGPT exports use public share links.', 'unsupported ChatGPT mode error should be user-readable', failures);
  }

  assert(
    parseDownloadFilename('attachment; filename="thread-export.md"', 'fallback.md') === 'thread-export.md',
    'parseDownloadFilename should parse quoted filenames',
    failures,
  );
  assert(
    parseDownloadFilename('attachment; filename=thread-export.pdf', 'fallback.pdf') === 'thread-export.pdf',
    'parseDownloadFilename should parse unquoted filenames',
    failures,
  );
  assert(
    parseDownloadFilename("attachment; filename*=UTF-8''thread%20export.md", 'fallback.md') === 'thread export.md',
    'parseDownloadFilename should parse encoded UTF-8 filenames',
    failures,
  );
  assert(
    parseDownloadFilename(null, 'fallback.md') === 'fallback.md',
    'parseDownloadFilename should use fallback when no header exists',
    failures,
  );
  assert(
    parseDownloadFilename('attachment; filename="../bad:name.md"', 'fallback.md') === '-bad-name.md',
    'parseDownloadFilename should sanitize unsafe filename characters and leading dots',
    failures,
  );
  assert(
    parseDownloadFilename("attachment; filename*=UTF-8''bad%ZZname.md", 'fallback.md') === 'fallback.md',
    'parseDownloadFilename should fall back when encoded filenames are malformed',
    failures,
  );

  const markdownResponse = await mockExportSharedChat(request);
  assert(markdownResponse.ok, 'mockExportSharedChat should return ok for Markdown', failures);
  assert(markdownResponse.headers.get('Content-Type').includes('text/markdown'), 'mock Markdown response should set text/markdown content type', failures);
  assert(markdownResponse.headers.get('Content-Disposition').includes('.md'), 'mock Markdown response should set a Markdown filename', failures);
  assert((await markdownResponse.text()).includes('https://chatgpt.com/share/abc123'), 'mock Markdown body should include the source URL', failures);

  const claudeMockMarkdownResponse = await mockExportSharedChat({
    ...claudeRequest,
    format: 'markdown',
  });
  const claudeMockMarkdown = await claudeMockMarkdownResponse.text();
  assert(claudeMockMarkdown.includes('# Claude Thread Export'), 'mock Claude Markdown body should use a Claude title', failures);
  assert(claudeMockMarkdown.includes('https://claude.ai/share/7b2442ee-2ffb-4f82-8852-291840cf5ca0'), 'mock Claude Markdown body should include the optional source URL', failures);

  const claudeMockSnapshotOnlyResponse = await mockExportSharedChat({
    ...claudeRequest,
    format: 'markdown',
    sourceUrl: undefined,
  });
  assert((await claudeMockSnapshotOnlyResponse.text()).includes('Source: Claude snapshot JSON'), 'mock Claude Markdown body should not print undefined when no source URL is available', failures);

  const pdfResponse = await mockExportSharedChat({
    sharedUrl: 'https://chatgpt.com/share/abc123',
    format: 'pdf',
  });
  assert(pdfResponse.ok, 'mockExportSharedChat should return ok for PDF', failures);
  assert(pdfResponse.headers.get('Content-Type') === 'application/pdf', 'mock PDF response should set application/pdf content type', failures);
  assert(pdfResponse.headers.get('Content-Disposition').includes('.pdf'), 'mock PDF response should set a PDF filename', failures);

  let fetchInput = '';
  let fetchInit = null;
  const fetchResponse = await fetchExportSharedChat(request, async (input, init) => {
    fetchInput = input;
    fetchInit = init;
    return new Response('api markdown', {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  });

  assert(fetchInput === AI_CHAT_EXPORTER_CONTRACT.apiPath, 'fetchExportSharedChat should call the API contract path', failures);
  assert(fetchInit.method === 'POST', 'fetchExportSharedChat should POST to the API', failures);
  assert(fetchInit.headers['Content-Type'] === 'application/json', 'fetchExportSharedChat should send JSON content type', failures);
  assert(JSON.parse(fetchInit.body).sharedUrl === request.sharedUrl, 'fetchExportSharedChat should include sharedUrl in the JSON body', failures);
  assert(JSON.parse(fetchInit.body).format === request.format, 'fetchExportSharedChat should include format in the JSON body', failures);
  assert(await fetchResponse.text() === 'api markdown', 'fetchExportSharedChat should return the fetch response', failures);

  let claudeFetchInit = null;
  await fetchExportSharedChat(claudeRequest, async (_input, init) => {
    claudeFetchInit = init;
    return new Response('api claude pdf', {
      headers: { 'Content-Type': 'application/pdf' },
    });
  });
  const claudeFetchPayload = JSON.parse(claudeFetchInit.body);
  assert(claudeFetchPayload.provider === 'claude', 'fetchExportSharedChat should send Claude provider in the JSON body', failures);
  assert(claudeFetchPayload.mode === 'snapshot-json', 'fetchExportSharedChat should send Claude mode in the JSON body', failures);
  assert(claudeFetchPayload.snapshotJson === claudeSnapshotJson, 'fetchExportSharedChat should send Claude snapshot JSON in the JSON body', failures);
  assert(!('sharedUrl' in claudeFetchPayload), 'Claude snapshot JSON requests should not send sharedUrl', failures);

  let turnstileFetchInit = null;
  await fetchExportSharedChat(requestWithTurnstile, async (_input, init) => {
    turnstileFetchInit = init;
    return new Response('api pdf', {
      headers: { 'Content-Type': 'application/pdf' },
    });
  });
  assert(JSON.parse(turnstileFetchInit.body).turnstileToken === 'mock-turnstile-token', 'fetchExportSharedChat should send the Turnstile token to the API', failures);

  let receivedRequest = null;
  const exported = await exportSharedChat(request, async (payload) => {
    receivedRequest = payload;
    return new Response('downloaded markdown', {
      headers: {
        'Content-Disposition': 'attachment; filename="custom-export.md"',
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });
  });

  assert(receivedRequest.sharedUrl === request.sharedUrl, 'exportSharedChat should pass the exact sharedUrl to the API client', failures);
  assert(receivedRequest.format === request.format, 'exportSharedChat should pass the exact format to the API client', failures);
  assert(exported.filename === 'custom-export.md', 'exportSharedChat should parse the response filename', failures);
  assert(exported.blob.type.includes('text/markdown'), 'exportSharedChat should preserve the response Blob content type', failures);
  assert(await exported.blob.text() === 'downloaded markdown', 'exportSharedChat should preserve the response body', failures);

  const fallbackExported = await exportSharedChat(request, async () => new Response('fallback markdown', {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  }));
  assert(fallbackExported.filename === 'chatgpt-thread-export.md', 'exportSharedChat should use the format fallback filename when no header exists', failures);

  const claudeFallbackExported = await exportSharedChat(claudeRequest, async () => new Response('fallback pdf', {
    headers: { 'Content-Type': 'application/pdf' },
  }));
  assert(claudeFallbackExported.filename === 'claude-thread-export.pdf', 'exportSharedChat should use the Claude fallback filename for Claude responses without a filename header', failures);

  try {
    await exportSharedChat(request, async () => new Response(JSON.stringify({ error: 'Mock export failed.' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    }));
    failures.push('exportSharedChat should throw for non-ok responses');
  } catch (error) {
    assert(error.message === 'Mock export failed.', 'exportSharedChat should surface API error messages', failures);
  }

  const startedAt = Date.now();
  try {
    await exportSharedChat(request, () => new Promise(() => {}), 25);
    failures.push('exportSharedChat should time out if the API never responds');
  } catch (error) {
    assert(error.message === 'The export took too long. Please try again.', 'exportSharedChat should surface a user-readable timeout message', failures);
    assert(Date.now() - startedAt < 1000, 'exportSharedChat timeout should release the UI promptly when configured low in tests', failures);
  }

  const noTimeoutValue = await withExportTimeout(Promise.resolve('finished'), 0);
  assert(noTimeoutValue === 'finished', 'withExportTimeout should allow disabling timeout for direct smoke tests', failures);

  let createdUrl = '';
  let revokedUrl = '';
  let clicked = false;
  let appended = false;
  let removed = false;
  const anchor = {
    download: '',
    href: '',
    rel: '',
    style: {},
    click() {
      clicked = true;
    },
    remove() {
      removed = true;
    },
  };

  triggerFileDownload(new Blob(['hello'], { type: 'text/markdown' }), 'thread.md', {
    documentRef: {
      body: {
        append(element) {
          appended = element === anchor;
        },
      },
      createElement(tagName) {
        assert(tagName === 'a', 'triggerFileDownload should create an anchor', failures);
        return anchor;
      },
    },
    urlApi: {
      createObjectURL() {
        createdUrl = 'blob:mock-url';
        return createdUrl;
      },
      revokeObjectURL(url) {
        revokedUrl = url;
      },
    },
  });

  assert(anchor.href === 'blob:mock-url', 'triggerFileDownload should assign the object URL to href', failures);
  assert(anchor.download === 'thread.md', 'triggerFileDownload should assign the requested filename', failures);
  assert(anchor.rel === 'noopener', 'triggerFileDownload should set noopener on the temporary anchor', failures);
  assert(appended, 'triggerFileDownload should append the temporary anchor', failures);
  assert(clicked, 'triggerFileDownload should click the temporary anchor', failures);
  assert(removed, 'triggerFileDownload should remove the temporary anchor', failures);
  assert(revokedUrl === createdUrl, 'triggerFileDownload should revoke the object URL', failures);

  report(failures, '✅ AI Chat Exporter client contracts passed.');
}

run().catch((error) => {
  failures.push(error?.stack || error?.message || String(error));
  report(failures, '✅ AI Chat Exporter client contracts passed.');
});
