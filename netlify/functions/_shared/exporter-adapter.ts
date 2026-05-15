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

export async function exportChatWithExporter(
  request: AiChatExportRequest,
  buildPipelineArtifacts: BuildPipelineArtifacts = loadRealBuildPipelineArtifacts,
) {
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

export function buildExportFilename(title: string | undefined, extension: "md" | "pdf") {
  const slug = slugify(title || "");
  return `${slug ? `${slug}-export` : "chatgpt-thread-export"}.${extension}`;
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
