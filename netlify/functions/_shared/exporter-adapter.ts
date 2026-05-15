import type { AiChatExportRequest } from "../../../src/lib/ai-chat-exporter";

type PipelineArtifacts = {
  transcript?: {
    exportedAt?: string;
    sourceUrl?: string;
    title?: string;
    turns?: Array<{
      timestamp?: string;
    }>;
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
    renderPdf: renderPdfWithServerlessPdfKit,
  });
}

export function buildExportFilename(title: string | undefined, extension: "md" | "pdf") {
  const slug = slugify(title || "");
  return `${slug ? `${slug}-export` : "chatgpt-thread-export"}.${extension}`;
}

export function buildPdfMetaLine(transcript: {
  exportedAt?: string;
  turns?: Array<{ timestamp?: string }>;
}) {
  const conversationRange = formatConversationRange(
    (transcript.turns || []).map((turn) => turn.timestamp),
  );

  if (conversationRange) {
    return `Conversation: ${conversationRange}`;
  }

  return `Exported: ${formatDateOnly(transcript.exportedAt || new Date().toISOString())}`;
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

async function renderPdfWithServerlessPdfKit(transcript: any) {
  const pdfKit = await import("pdfkit");
  const PDFDocument = pdfKit.default;
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({
    bufferPages: true,
    info: {
      Title: transcript.title || "ChatGPT Export",
    },
    margins: {
      top: 45,
      right: 40,
      bottom: 58,
      left: 40,
    },
    size: "LETTER",
  });
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fillColor("#202123").font("Helvetica-Bold").fontSize(22);
  doc.text(transcript.title || "ChatGPT Export", { lineGap: 2 });
  doc.moveDown(0.45);
  doc.fillColor("#6b7280").font("Helvetica").fontSize(9);
  doc.text("ChatGPT Export", { continued: false });
  doc.text(`Source: ${transcript.sourceUrl || ""}`);
  doc.text(buildPdfMetaLine(transcript));
  doc.moveDown(1.1);

  for (const turn of transcript.turns || []) {
    renderPdfTurn(doc, turn);
  }

  addPdfPageNumbers(doc);
  doc.end();

  return finished;
}

function renderPdfTurn(doc: any, turn: any) {
  const label = labelForRole(turn.role);
  const isUser = turn.role === "user";

  doc.fillColor(isUser ? "#111827" : "#202123").font("Helvetica-Bold").fontSize(11);
  doc.text(label);
  doc.moveDown(0.25);
  doc.fillColor("#202123").font(isUser ? "Helvetica" : "Helvetica").fontSize(10.5);

  for (const block of turn.blocks || []) {
    renderPdfBlock(doc, block);
  }

  doc.moveDown(0.9);
}

function renderPdfBlock(doc: any, block: any) {
  switch (block.kind) {
    case "code":
      doc.font("Courier").fontSize(9.2).fillColor("#111827");
      doc.text(block.language ? `${block.language}\n${block.text}` : block.text, {
        lineGap: 1.5,
      });
      doc.font("Helvetica").fontSize(10.5).fillColor("#202123");
      doc.moveDown(0.45);
      break;
    case "list":
      for (const item of block.items || []) {
        doc.text(`- ${item}`, { lineGap: 1.5 });
      }
      doc.moveDown(0.35);
      break;
    case "image":
      doc.fillColor("#6b7280").text(`[Image: ${block.alt || block.url || "Generated image"}]`);
      doc.fillColor("#202123").moveDown(0.35);
      break;
    case "quote":
      doc.fillColor("#4b5563").text(`"${block.text}"`, { lineGap: 1.5 });
      doc.fillColor("#202123").moveDown(0.35);
      break;
    case "unknown":
      doc.fillColor("#6b7280").text(block.summary || "Unsupported content");
      doc.fillColor("#202123").moveDown(0.35);
      break;
    case "text":
    default:
      doc.text(block.text || "", { lineGap: 1.5 });
      doc.moveDown(0.35);
      break;
  }
}

function addPdfPageNumbers(doc: any) {
  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.fillColor("#6b7280").font("Helvetica").fontSize(8);
    doc.text(`${index + 1} / ${range.count}`, 40, doc.page.height - 36, {
      align: "center",
      width: doc.page.width - 80,
    });
  }
}

function labelForRole(role: string) {
  if (role === "user") return "You";
  if (role === "assistant") return "ChatGPT";
  if (role === "system") return "System";
  if (role === "tool") return "Tool";
  return role || "Message";
}

function formatConversationRange(timestamps: Array<string | undefined>) {
  const dates = timestamps
    .filter((value): value is string => typeof value === "string")
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) {
    return null;
  }

  const start = dates[0];
  const end = dates[dates.length - 1];

  if (isSameDay(start, end)) {
    return formatDateOnly(start.toISOString());
  }

  return `${formatDateOnly(start.toISOString())} to ${formatDateOnly(end.toISOString())}`;
}

function formatDateOnly(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
