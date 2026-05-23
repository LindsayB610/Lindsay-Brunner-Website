export const AI_CHAT_EXPORTER_CONTRACT = {
  route: "/ai-chat-exporter/",
  rootId: "ai-chat-exporter-root",
  apiPath: "/api/export-chat",
  tabs: ["ChatGPT", "Claude JSON", "Claude Link"] as const,
  formats: ["markdown", "pdf"] as const,
  enabledFormats: ["markdown", "pdf"] as const,
  validHosts: ["chatgpt.com", "chat.openai.com"] as const,
  exportTimeoutMs: 65_000,
  fallbackFilenames: {
    markdown: "chatgpt-thread-export.md",
    pdf: "chatgpt-thread-export.pdf",
  },
} as const;

export type AiChatExportFormat = (typeof AI_CHAT_EXPORTER_CONTRACT.formats)[number];

export type AiChatExportRequest = {
  sharedUrl: string;
  format: AiChatExportFormat;
  turnstileToken?: string;
};

export type AiChatExportFile = {
  blob: Blob;
  filename: string;
};

export type AiChatExportApiClient = (
  request: AiChatExportRequest,
) => Promise<Response>;

type Fetcher = (
  input: string,
  init: {
    body: string;
    headers: Record<string, string>;
    method: "POST";
  },
) => Promise<Response>;

type DownloadEnvironment = {
  documentRef?: Document;
  urlApi?: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
};

export function isChatGptShareUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const isValidHost = AI_CHAT_EXPORTER_CONTRACT.validHosts.includes(
      url.hostname as (typeof AI_CHAT_EXPORTER_CONTRACT.validHosts)[number],
    );
    const hasShareSegment = url.pathname
      .split("/")
      .filter(Boolean)
      .includes("share");

    return isValidHost && hasShareSegment;
  } catch {
    return false;
  }
}

export function isAiChatExportFormat(value: string): value is AiChatExportFormat {
  return AI_CHAT_EXPORTER_CONTRACT.formats.includes(value as AiChatExportFormat);
}

export function buildExportRequest(
  sharedUrl: string,
  format: string,
  turnstileToken?: string,
): AiChatExportRequest {
  const trimmedUrl = sharedUrl.trim();

  if (!isChatGptShareUrl(trimmedUrl)) {
    throw new Error("Use a public ChatGPT share URL.");
  }

  if (!isAiChatExportFormat(format)) {
    throw new Error("Choose Markdown or PDF.");
  }

  const request: AiChatExportRequest = {
    sharedUrl: trimmedUrl,
    format,
  };

  if (turnstileToken?.trim()) {
    request.turnstileToken = turnstileToken.trim();
  }

  return request;
}

export async function exportSharedChat(
  request: AiChatExportRequest,
  apiClient: AiChatExportApiClient = fetchExportSharedChat,
  timeoutMs = AI_CHAT_EXPORTER_CONTRACT.exportTimeoutMs,
): Promise<AiChatExportFile> {
  const response = await withExportTimeout(apiClient(request), timeoutMs);

  if (!response.ok) {
    throw new Error(await getExportErrorMessage(response));
  }

  return {
    blob: await response.blob(),
    filename: parseDownloadFilename(
      response.headers.get("Content-Disposition"),
      AI_CHAT_EXPORTER_CONTRACT.fallbackFilenames[request.format],
    ),
  };
}

export function withExportTimeout<T>(
  promise: Promise<T>,
  timeoutMs = AI_CHAT_EXPORTER_CONTRACT.exportTimeoutMs,
) {
  if (timeoutMs <= 0) {
    return promise;
  }

  let timeoutId: ReturnType<typeof globalThis.setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(new Error("The export took too long. Please try again."));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    globalThis.clearTimeout(timeoutId);
  });
}

export async function fetchExportSharedChat(
  request: AiChatExportRequest,
  fetcher: Fetcher = fetch,
): Promise<Response> {
  return fetcher(AI_CHAT_EXPORTER_CONTRACT.apiPath, {
    body: JSON.stringify(request),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export async function mockExportSharedChat(
  request: AiChatExportRequest,
): Promise<Response> {
  await wait(700);

  const filename = AI_CHAT_EXPORTER_CONTRACT.fallbackFilenames[request.format];
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });

  if (request.format === "pdf") {
    headers.set("Content-Type", "application/pdf");
    return new Response(buildMockPdf(request.sharedUrl), {
      headers,
      status: 200,
    });
  }

  headers.set("Content-Type", "text/markdown; charset=utf-8");
  return new Response(buildMockMarkdown(request.sharedUrl), {
    headers,
    status: 200,
  });
}

export function parseDownloadFilename(
  contentDisposition: string | null | undefined,
  fallbackFilename: string,
) {
  if (!contentDisposition) {
    return fallbackFilename;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return sanitizeFilename(decodeURIComponent(utf8Match[1].trim()));
    } catch {
      return fallbackFilename;
    }
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return sanitizeFilename(quotedMatch[1].trim());
  }

  const unquotedMatch = contentDisposition.match(/filename=([^;]+)/i);
  if (unquotedMatch?.[1]) {
    return sanitizeFilename(unquotedMatch[1].trim());
  }

  return fallbackFilename;
}

export function triggerFileDownload(
  blob: Blob,
  filename: string,
  environment: DownloadEnvironment = {},
) {
  const documentRef = environment.documentRef ?? document;
  const urlApi = environment.urlApi ?? URL;
  const objectUrl = urlApi.createObjectURL(blob);
  const anchor = documentRef.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";

  documentRef.body.append(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    urlApi.revokeObjectURL(objectUrl);
  }
}

function sanitizeFilename(filename: string) {
  const sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/^\.+/, "")
    .trim();

  return sanitized || "chatgpt-thread-export";
}

async function getExportErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Fall through to the generic message.
  }

  return "The export failed. Please try again.";
}

function buildMockMarkdown(sharedUrl: string) {
  return [
    "# ChatGPT Thread Export",
    "",
    `Source: ${sharedUrl}`,
    "",
    "This mock export proves the browser download flow before the server exporter is connected.",
    "",
  ].join("\n");
}

function buildMockPdf(sharedUrl: string) {
  const body = `Mock ChatGPT Thread Export\nSource: ${sharedUrl}\n`;
  return new Blob([body], { type: "application/pdf" });
}

function wait(durationMs: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, durationMs);
  });
}
