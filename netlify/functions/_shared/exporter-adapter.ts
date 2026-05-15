import type { AiChatExportRequest } from "../../../src/lib/ai-chat-exporter";
import path from "node:path";
import { pathToFileURL } from "node:url";

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

  if (options.format !== "pdf" || !shouldUseServerlessChromium()) {
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

function shouldUseServerlessChromium() {
  return Boolean(
    process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );
}

async function renderPdfWithServerlessChromium(transcript: unknown) {
  const [puppeteer, serverlessChromium, { renderChatGptHtml }] =
    await Promise.all([
      import("puppeteer-core"),
      import("@sparticuz/chromium"),
      loadExporterPdfHtmlRenderer(),
    ]);

  const html = renderChatGptHtml(transcript);
  const chromium = serverlessChromium.default;
  const browser = await puppeteer.default.launch({
    args: chromium.args,
    defaultViewport: {
      height: 1080,
      width: 1920,
    },
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });

    return page.pdf({
      displayHeaderFooter: true,
      footerTemplate: pdfFooterTemplate(),
      format: "Letter",
      headerTemplate: "<div></div>",
      margin: {
        top: "16mm",
        right: "14mm",
        bottom: "20mm",
        left: "14mm",
      },
      preferCSSPageSize: true,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

async function loadExporterPdfHtmlRenderer() {
  const rendererPath = path.join(
    process.cwd(),
    "node_modules",
    "chatgpt-thread-exporter",
    "dist",
    "pdf",
    "render-chatgpt-html.js",
  );

  return import(pathToFileURL(rendererPath).href) as Promise<{
    renderChatGptHtml: (transcript: unknown) => string;
  }>;
}

function pdfFooterTemplate() {
  return `
    <div style="width:100%; padding:0 14mm; font-family:Arial, sans-serif; font-size:10px; color:#6b7280; text-align:center;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
  `.trim();
}
