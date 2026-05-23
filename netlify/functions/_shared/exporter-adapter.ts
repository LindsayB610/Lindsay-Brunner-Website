import path from "node:path";
import { pathToFileURL } from "node:url";
import type { AiChatExportRequest } from "../../../src/lib/ai-chat-exporter";

type PipelineArtifacts = {
  transcript?: {
    title?: string;
  };
  outputFormat: "markdown" | "pdf";
  outputContent: string | Uint8Array;
};

type BuildPipelineArtifacts = (options: {
  url: string;
  format: "markdown" | "pdf";
}) => Promise<PipelineArtifacts>;

type ClaudeExporter = {
  parseSnapshotJson: (raw: string) => any;
  renderMarkdown: (input: { snapshot: any; sourceUrl?: string }) => string;
  renderClaudeHtml: (input: { snapshot: any; sourceUrl?: string }) => string;
};

type RenderClaudePdf = (html: string) => Promise<Uint8Array>;

export async function exportChatWithExporter(
  request: AiChatExportRequest,
  buildPipelineArtifacts: BuildPipelineArtifacts = loadRealBuildPipelineArtifacts,
  loadClaudeExporter: () => Promise<ClaudeExporter> = loadRealClaudeExporter,
  renderClaudePdf: RenderClaudePdf = renderClaudePdfWithServerlessChromium,
) {
  if (request.provider === "claude") {
    return exportClaudeWithExporter(request, loadClaudeExporter, renderClaudePdf);
  }

  if (!request.sharedUrl) {
    throw new Error("Paste a public ChatGPT share URL.");
  }

  const artifacts = await buildPipelineArtifacts({
    url: request.sharedUrl,
    format: request.format,
  });
  const extension = artifacts.outputFormat === "pdf" ? "pdf" : "md";
  const contentType =
    artifacts.outputFormat === "pdf"
      ? "application/pdf"
      : "text/markdown; charset=utf-8";
  const filename = buildExportFilename(artifacts.transcript?.title, extension);

  return new Response(artifacts.outputContent, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": contentType,
    },
    status: 200,
  });
}

async function exportClaudeWithExporter(
  request: AiChatExportRequest,
  loadClaudeExporter: () => Promise<ClaudeExporter>,
  renderClaudePdf: RenderClaudePdf,
) {
  if (request.provider !== "claude" || request.mode !== "snapshot-json") {
    throw new Error("The export failed. Please try again.");
  }

  const { parseSnapshotJson, renderMarkdown, renderClaudeHtml } = await loadClaudeExporter();
  const snapshot = parseSnapshotJson(request.snapshotJson);
  const input = { snapshot, sourceUrl: request.sourceUrl };
  const extension = request.format === "pdf" ? "pdf" : "md";
  const outputContent =
    request.format === "pdf"
      ? await renderClaudePdf(renderClaudeHtml(input))
      : renderMarkdown(input);
  const filename = buildExportFilename(
    typeof snapshot.snapshot_name === "string" ? snapshot.snapshot_name : undefined,
    extension,
    "claude-thread-export",
  );

  return new Response(outputContent, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": request.format === "pdf"
        ? "application/pdf"
        : "text/markdown; charset=utf-8",
    },
    status: 200,
  });
}

export async function loadRealBuildPipelineArtifacts(options: {
  url: string;
  format: "markdown" | "pdf";
}) {
  const exporter = await import("chatgpt-thread-exporter/pipeline");

  if (options.format !== "pdf" || !shouldUseServerlessPdfRenderer()) {
    return exporter.buildPipelineArtifacts(options);
  }

  return exporter.buildPipelineArtifacts(options, {
    ...exporter.defaultPipelineDependencies,
    renderPdf: renderPdfWithServerlessChromium,
  });
}

export function buildExportFilename(
  title: string | undefined,
  extension: "md" | "pdf",
  fallbackBase = "chatgpt-thread-export",
) {
  const slug = slugify(title || "");
  return `${slug ? `${slug}-export` : fallbackBase}.${extension}`;
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60)
    .replace(/-+$/g, "");

  return slug;
}

function shouldUseServerlessPdfRenderer() {
  return Boolean(
    process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

export async function renderPdfWithServerlessChromium(transcript: any) {
  const [{ chromium: playwrightChromium }, chromiumPackage, renderChatGptHtml] =
    await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium"),
      loadCliHtmlRenderer(),
    ]);
  const chromium = chromiumPackage.default;
  const browser = await playwrightChromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(renderChatGptHtml(transcript), { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    return await page.pdf({
      displayHeaderFooter: true,
      footerTemplate: pdfFooterTemplate(),
      format: "Letter",
      headerTemplate: "<div></div>",
      margin: {
        bottom: "20mm",
        left: "14mm",
        right: "14mm",
        top: "16mm",
      },
      preferCSSPageSize: true,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

export async function renderClaudePdfWithServerlessChromium(html: string) {
  if (!shouldUseServerlessPdfRenderer()) {
    return renderClaudePdfWithLocalChromium(html);
  }

  const [{ chromium: playwrightChromium }, chromiumPackage] =
    await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium"),
    ]);
  const chromium = chromiumPackage.default;
  const browser = await playwrightChromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    return await page.pdf({
      displayHeaderFooter: true,
      footerTemplate: claudePdfFooterTemplate(),
      format: "Letter",
      headerTemplate: "<div></div>",
      margin: {
        bottom: "18mm",
        left: "10mm",
        right: "10mm",
        top: "14mm",
      },
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

async function renderClaudePdfWithLocalChromium(html: string) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    return await page.pdf({
      displayHeaderFooter: true,
      footerTemplate: claudePdfFooterTemplate(),
      format: "Letter",
      headerTemplate: "<div></div>",
      margin: {
        bottom: "18mm",
        left: "10mm",
        right: "10mm",
        top: "14mm",
      },
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

async function loadCliHtmlRenderer(): Promise<(transcript: any) => string> {
  const rendererPath = path.join(
    process.cwd(),
    "node_modules",
    "chatgpt-thread-exporter",
    "dist",
    "pdf",
    "render-chatgpt-html.js",
  );
  const renderer = await import(pathToFileURL(rendererPath).href);
  return renderer.renderChatGptHtml;
}

function pdfFooterTemplate() {
  return `
    <div style="width:100%; padding:0 14mm; font-family:Arial, sans-serif; font-size:10px; color:#6b7280; text-align:center;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
  `.trim();
}

function claudePdfFooterTemplate() {
  return `
    <div style="width:100%; padding:0 10mm; font-family:Arial, sans-serif; font-size:9px; color:#8a8580; text-align:center;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
  `.trim();
}

async function loadRealClaudeExporter(): Promise<ClaudeExporter> {
  return import("claude-thread-exporter");
}
