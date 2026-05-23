export const AI_CHAT_EXPORTER_CONTRACT = {
  route: "/ai-chat-exporter/",
  rootId: "ai-chat-exporter-root",
  apiPath: "/api/export-chat",
  tabs: ["ChatGPT", "Claude JSON", "Claude Link"] as const,
  providers: ["chatgpt", "claude"] as const,
  modes: ["share-link", "snapshot-json"] as const,
  formats: ["markdown", "pdf"] as const,
  enabledFormats: ["markdown", "pdf"] as const,
  validHosts: ["chatgpt.com", "chat.openai.com"] as const,
  validClaudeHosts: ["claude.ai"] as const,
  exportTimeoutMs: 65_000,
  fallbackFilenames: {
    chatgpt: {
      markdown: "chatgpt-thread-export.md",
      pdf: "chatgpt-thread-export.pdf",
    },
    claude: {
      markdown: "claude-thread-export.md",
      pdf: "claude-thread-export.pdf",
    },
  },
} as const;

export type AiChatExportFormat = (typeof AI_CHAT_EXPORTER_CONTRACT.formats)[number];
export type AiChatExportProvider = (typeof AI_CHAT_EXPORTER_CONTRACT.providers)[number];
export type AiChatExportMode = (typeof AI_CHAT_EXPORTER_CONTRACT.modes)[number];

type AiChatExportBaseRequest = {
  format: AiChatExportFormat;
  turnstileToken?: string;
};

export type ChatGptExportRequest = AiChatExportBaseRequest & {
  provider?: "chatgpt";
  mode?: "share-link";
  sharedUrl: string;
};

export type ClaudeSnapshotExportRequest = AiChatExportBaseRequest & {
  provider: "claude";
  mode: "snapshot-json";
  snapshotJson: string;
  sourceUrl?: string;
};

export type ClaudeShareLinkExportRequest = AiChatExportBaseRequest & {
  provider: "claude";
  mode: "share-link";
  sharedUrl: string;
};

export type AiChatExportRequest =
  | ChatGptExportRequest
  | ClaudeSnapshotExportRequest
  | ClaudeShareLinkExportRequest;

type BuildChatGptExportRequestInput = {
  provider?: "chatgpt";
  mode?: AiChatExportMode;
  sharedUrl: string;
  format: string;
  turnstileToken?: string;
};

type BuildClaudeSnapshotExportRequestInput = {
  provider: "claude";
  mode: "snapshot-json";
  snapshotJson: string;
  sourceUrl?: string;
  format: string;
  turnstileToken?: string;
};

type BuildClaudeShareLinkExportRequestInput = {
  provider: "claude";
  mode: "share-link";
  sharedUrl: string;
  format: string;
  turnstileToken?: string;
};

type BuildExportRequestInput =
  | BuildChatGptExportRequestInput
  | BuildClaudeSnapshotExportRequestInput
  | BuildClaudeShareLinkExportRequestInput;

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
  return isShareUrlForHosts(value, AI_CHAT_EXPORTER_CONTRACT.validHosts);
}

export function isClaudeShareUrl(value: string) {
  return isShareUrlForHosts(value, AI_CHAT_EXPORTER_CONTRACT.validClaudeHosts);
}

export function isClaudeSnapshotJson(value: string) {
  try {
    parseClaudeSnapshotJson(value);
    return true;
  } catch {
    return false;
  }
}

export function isAiChatExportFormat(value: string): value is AiChatExportFormat {
  return AI_CHAT_EXPORTER_CONTRACT.formats.includes(value as AiChatExportFormat);
}

export function buildClaudeSnapshotCommand(
  claudeUrl: string,
  outPath = "./claude-thread.snapshot.json",
) {
  const trimmedUrl = claudeUrl.trim();
  const trimmedOutPath = outPath.trim() || "./claude-thread.snapshot.json";

  if (!isClaudeShareUrl(trimmedUrl)) {
    throw new Error("Use a public Claude share URL.");
  }

  return [
    ["claude", "thread", "exporter"].join("-"),
    "--claude-url",
    shellQuote(trimmedUrl),
    "--save-snapshot",
    shellQuote(trimmedOutPath),
  ].join(" ");
}

export function parseClaudeSnapshotJson(raw: string): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    throw new Error("Paste valid Claude snapshot JSON.");
  }

  const snapshot = findClaudeSnapshotPayload(parsed);
  if (!snapshot) {
    throw new Error("Snapshot JSON must include Claude chat_messages.");
  }

  return snapshot;
}

export function buildExportRequest(input: BuildExportRequestInput): AiChatExportRequest;
export function buildExportRequest(
  sharedUrl: string,
  format: string,
  turnstileToken?: string,
): AiChatExportRequest;
export function buildExportRequest(
  inputOrSharedUrl: BuildExportRequestInput | string,
  format?: string,
  turnstileToken?: string,
): AiChatExportRequest {
  if (typeof inputOrSharedUrl === "string") {
    return buildChatGptShareLinkRequest({
      format: format ?? "",
      sharedUrl: inputOrSharedUrl,
      turnstileToken,
    });
  }

  if (inputOrSharedUrl.provider === "claude") {
    return buildClaudeExportRequest(inputOrSharedUrl);
  }

  return buildChatGptShareLinkRequest(inputOrSharedUrl);
}

function buildChatGptShareLinkRequest(input: BuildChatGptExportRequestInput): AiChatExportRequest {
  const trimmedUrl = input.sharedUrl.trim();
  if (input.mode && input.mode !== "share-link") {
    throw new Error("ChatGPT exports use public share links.");
  }

  if (!isChatGptShareUrl(trimmedUrl)) {
    throw new Error("Use a public ChatGPT share URL.");
  }

  if (!isAiChatExportFormat(input.format)) {
    throw new Error("Choose Markdown or PDF.");
  }

  const request: AiChatExportRequest = {
    sharedUrl: trimmedUrl,
    format: input.format,
  };

  addTurnstileToken(request, input.turnstileToken);
  return request;
}

function buildClaudeExportRequest(
  input: BuildClaudeSnapshotExportRequestInput | BuildClaudeShareLinkExportRequestInput,
): AiChatExportRequest {
  if (!isAiChatExportFormat(input.format)) {
    throw new Error("Choose Markdown or PDF.");
  }

  if (input.mode === "share-link") {
    const trimmedUrl = input.sharedUrl.trim();
    if (!isClaudeShareUrl(trimmedUrl)) {
      throw new Error("Use a public Claude share URL.");
    }

    const request: AiChatExportRequest = {
      provider: "claude",
      mode: "share-link",
      sharedUrl: trimmedUrl,
      format: input.format,
    };
    addTurnstileToken(request, input.turnstileToken);
    return request;
  }

  const snapshotJson = input.snapshotJson.trim();
  parseClaudeSnapshotJson(snapshotJson);

  const request: AiChatExportRequest = {
    provider: "claude",
    mode: "snapshot-json",
    snapshotJson,
    format: input.format,
  };

  const sourceUrl = input.sourceUrl?.trim();
  if (sourceUrl) {
    if (!isClaudeShareUrl(sourceUrl)) {
      throw new Error("Use a public Claude share URL.");
    }
    request.sourceUrl = sourceUrl;
  }

  addTurnstileToken(request, input.turnstileToken);
  return request;
}

function addTurnstileToken(request: AiChatExportRequest, turnstileToken: string | undefined) {
  if (turnstileToken?.trim()) {
    request.turnstileToken = turnstileToken.trim();
  }
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
      getFallbackFilename(request),
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

  const filename = getFallbackFilename(request);
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });

  if (request.format === "pdf") {
    headers.set("Content-Type", "application/pdf");
    return new Response(buildMockPdf(request), {
      headers,
      status: 200,
    });
  }

  headers.set("Content-Type", "text/markdown; charset=utf-8");
  return new Response(buildMockMarkdown(request), {
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

function getFallbackFilename(request: AiChatExportRequest) {
  const provider = request.provider ?? "chatgpt";
  return AI_CHAT_EXPORTER_CONTRACT.fallbackFilenames[provider][request.format];
}

function isShareUrlForHosts<const Hosts extends readonly string[]>(value: string, hosts: Hosts) {
  try {
    const url = new URL(value.trim());
    const isValidHost = hosts.includes(url.hostname as Hosts[number]);
    const hasShareSegment = url.pathname
      .split("/")
      .filter(Boolean)
      .includes("share");

    return isValidHost && hasShareSegment;
  } catch {
    return false;
  }
}

function findClaudeSnapshotPayload(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (isClaudeSnapshotPayload(value)) {
    return value as Record<string, unknown>;
  }

  if ("snapshot" in value) {
    const snapshot = findClaudeSnapshotPayload((value as { snapshot?: unknown }).snapshot);
    if (snapshot) {
      return snapshot;
    }
  }

  if ("data" in value) {
    const snapshot = findClaudeSnapshotPayload((value as { data?: unknown }).data);
    if (snapshot) {
      return snapshot;
    }
  }

  return null;
}

function isClaudeSnapshotPayload(value: object) {
  return "chat_messages" in value && Array.isArray((value as { chat_messages?: unknown }).chat_messages);
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

function getMockSource(request: AiChatExportRequest) {
  if ("sharedUrl" in request) {
    return request.sharedUrl;
  }

  return request.sourceUrl || "Claude snapshot JSON";
}

function shellQuote(value: string) {
  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

function buildMockMarkdown(request: AiChatExportRequest) {
  return [
    `# ${(request.provider ?? "chatgpt") === "claude" ? "Claude" : "ChatGPT"} Thread Export`,
    "",
    `Source: ${getMockSource(request)}`,
    "",
    "This mock export proves the browser download flow before the server exporter is connected.",
    "",
  ].join("\n");
}

function buildMockPdf(request: AiChatExportRequest) {
  const providerLabel = (request.provider ?? "chatgpt") === "claude" ? "Claude" : "ChatGPT";
  const body = `Mock ${providerLabel} Thread Export\nSource: ${getMockSource(request)}\n`;
  return new Blob([body], { type: "application/pdf" });
}

function wait(durationMs: number) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, durationMs);
  });
}
