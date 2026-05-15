import {
  AI_CHAT_EXPORTER_CONTRACT,
  type AiChatExportRequest,
  buildExportRequest,
} from "../../src/lib/ai-chat-exporter";
import { exportChatWithExporter } from "./_shared/exporter-adapter";

type ExportRequestPayload = {
  sharedUrl?: unknown;
  format?: unknown;
};

export default async function exportChat(req: Request) {
  return handleExportChatRequest(req);
}

export function handleExportChatRequest(
  req: Request,
  dependencies: {
    exportChat: (request: AiChatExportRequest) => Promise<Response>;
  } = {
    exportChat: exportChatWithExporter,
  },
) {
  if (req.method !== "POST") {
    return jsonError("Method not allowed.", 405);
  }

  return handlePost(req, dependencies);
}

async function handlePost(
  req: Request,
  dependencies: {
    exportChat: (request: AiChatExportRequest) => Promise<Response>;
  },
) {
  let payload: ExportRequestPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (typeof payload.sharedUrl !== "string" || !payload.sharedUrl.trim()) {
    return jsonError("Paste a public ChatGPT share URL.", 400);
  }

  if (typeof payload.format !== "string") {
    return jsonError("Choose Markdown or PDF.", 400);
  }

  try {
    const request = buildExportRequest(payload.sharedUrl, payload.format);
    return await dependencies.exportChat(request);
  } catch (error) {
    const message = getErrorMessage(error);
    const isValidationError =
      message === "Use a public ChatGPT share URL." ||
      message === "Choose Markdown or PDF.";

    return jsonError(
      isValidationError ? message : "The export failed. Please try again.",
      isValidationError ? 400 : 500,
    );
  }
}

export const config = {
  path: AI_CHAT_EXPORTER_CONTRACT.apiPath,
  method: ["POST"],
};

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status,
    },
  );
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "The export failed. Please try again.";
}
