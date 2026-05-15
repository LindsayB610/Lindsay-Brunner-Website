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
  return exporter.buildPipelineArtifacts(options);
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
