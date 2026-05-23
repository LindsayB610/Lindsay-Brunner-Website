const fs = require('fs');
const path = require('path');
const { assert, report, root } = require('./ai-chat-exporter-test-utils');

const failures = [];

async function run() {
  console.log('🔥 Checking AI Chat Exporter real exporter runtime...');

  const fixtureHtml = fs.readFileSync(
    path.join(root, 'tests/fixtures/ai-chat-exporter/plain-text-thread.fixture.html'),
    'utf8',
  );
  const exporter = await import('chatgpt-thread-exporter/pipeline');
  const claudeExporter = await import('claude-thread-exporter');

  assert(typeof exporter.buildPipelineArtifacts === 'function', 'GitHub exporter package should expose buildPipelineArtifacts', failures);
  assert(typeof claudeExporter.parseSnapshotJson === 'function', 'Claude exporter package should expose parseSnapshotJson', failures);
  assert(typeof claudeExporter.renderMarkdown === 'function', 'Claude exporter package should expose renderMarkdown', failures);

  const dependencies = {
    ...exporter.defaultPipelineDependencies,
    fetchSharedLink: async (url) => ({
      sourceUrl: url,
      finalUrl: url,
      status: 200,
      html: fixtureHtml,
    }),
    resolveRenderedShareArtifacts: async () => ({
      imagesByTurnId: {},
      renderedTextByTurnId: {},
    }),
  };

  const markdownStartedAt = Date.now();
  const markdownArtifacts = await exporter.buildPipelineArtifacts({
    url: 'https://chatgpt.com/share/fixture-thread',
    format: 'markdown',
  }, dependencies);
  const markdownDurationMs = Date.now() - markdownStartedAt;

  assert(markdownArtifacts.outputFormat === 'markdown', 'real exporter fixture should produce Markdown artifacts', failures);
  assert(typeof markdownArtifacts.outputContent === 'string', 'Markdown fixture output should be a string', failures);
  assert(
    markdownArtifacts.outputContent === expectedFixtureMarkdown(),
    'Markdown fixture output should exactly match the exporter-rendered transcript shape',
    failures,
  );
  assert(markdownDurationMs < 5000, 'Markdown fixture export should stay comfortably fast', failures);

  const pdfStartedAt = Date.now();
  const pdfArtifacts = await exporter.buildPipelineArtifacts({
    url: 'https://chatgpt.com/share/fixture-thread',
    format: 'pdf',
  }, dependencies);
  const pdfDurationMs = Date.now() - pdfStartedAt;

  assert(pdfArtifacts.outputFormat === 'pdf', 'real exporter fixture should produce PDF artifacts', failures);
  assert(pdfArtifacts.outputContent instanceof Uint8Array, 'PDF fixture output should be binary Uint8Array content', failures);
  assert(pdfArtifacts.outputContent.byteLength > 1000, 'PDF fixture output should contain a non-empty PDF body', failures);
  assert(Buffer.from(pdfArtifacts.outputContent.slice(0, 4)).toString('utf8') === '%PDF', 'PDF fixture output should start with a PDF signature', failures);
  assert(pdfDurationMs < 15000, 'PDF fixture export should stay within a local smoke-test budget', failures);

  const claudeSnapshot = claudeExporter.parseSnapshotJson(JSON.stringify({
    snapshot_name: 'Claude runtime fixture',
    chat_messages: [
      { sender: 'human', content: [{ type: 'text', text: 'Can you summarize kelp forests?' }] },
      { sender: 'assistant', content: [{ type: 'text', text: 'Kelp forests are underwater ecosystems anchored by large brown algae.' }] },
    ],
  }));
  const claudeMarkdown = claudeExporter.renderMarkdown({
    snapshot: claudeSnapshot,
    sourceUrl: 'https://claude.ai/share/runtime-fixture',
  });

  assert(
    claudeMarkdown === expectedClaudeFixtureMarkdown(),
    'Claude Markdown fixture output should match the exporter-rendered snapshot shape',
    failures,
  );

  report(failures, '✅ AI Chat Exporter real exporter runtime passed.');
}

run().catch((error) => {
  failures.push(error?.stack || error?.message || String(error));
  report(failures, '✅ AI Chat Exporter real exporter runtime passed.');
});

function expectedFixtureMarkdown() {
  return [
    '# Planning a neighborhood potluck',
    '',
    'Source: https://chatgpt.com/share/fixture-thread',
    `Exported: ${formatToday()}`,
    '',
    '## You',
    '',
    'Can you help me plan a neighborhood potluck for twelve people?',
    '',
    '',
    '## ChatGPT',
    '',
    'Start with a simple sign-up sheet, a main dish plan, and one fallback dessert.',
    '',
  ].join('\n');
}

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function expectedClaudeFixtureMarkdown() {
  return [
    '# Claude runtime fixture',
    '',
    'Source: https://claude.ai/share/runtime-fixture',
    'Messages: 2',
    '',
    '## You',
    '',
    'Can you summarize kelp forests?',
    '',
    '## Claude',
    '',
    'Kelp forests are underwater ecosystems anchored by large brown algae.',
    '',
  ].join('\n');
}
