import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import {
  AI_CHAT_EXPORTER_CONTRACT,
  type AiChatExportRequest,
  buildExportRequest,
} from "../../src/lib/ai-chat-exporter";
import { exportChatWithExporter } from "./_shared/exporter-adapter";

type ExportRequestPayload = {
  provider?: unknown;
  mode?: unknown;
  sharedUrl?: unknown;
  snapshotJson?: unknown;
  sourceUrl?: unknown;
  format?: unknown;
  turnstileToken?: unknown;
};

type ExportChatDependencies = {
  exportChat: (request: AiChatExportRequest) => Promise<Response>;
  checkPdfRateLimit: (req: Request) => Promise<PdfRateLimitResult>;
  getTurnstileSecret: () => string | undefined;
  verifyTurnstileToken: (token: string, secret: string, req: Request) => Promise<boolean>;
};

type PdfRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

type PdfRateLimitBucket = {
  count: number;
  resetAt: string;
};

const PDF_RATE_LIMIT_PER_HOUR = 5;

export default async function exportChat(req: Request) {
  return handleExportChatRequest(req);
}

export function handleExportChatRequest(
  req: Request,
  dependencies: Partial<ExportChatDependencies> = {},
) {
  const resolvedDependencies: ExportChatDependencies = {
    checkPdfRateLimit,
    exportChat: exportChatWithExporter,
    getTurnstileSecret,
    verifyTurnstileToken,
    ...dependencies,
  };

  if (req.method !== "POST") {
    return jsonError("Method not allowed.", 405);
  }

  return handlePost(req, resolvedDependencies);
}

async function handlePost(
  req: Request,
  dependencies: ExportChatDependencies,
) {
  let payload: ExportRequestPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  if (typeof payload.format !== "string") {
    return jsonError("Choose Markdown or PDF.", 400);
  }

  try {
    const request = buildValidatedRequest(payload);

    const turnstileSecret = dependencies.getTurnstileSecret();
    if (turnstileSecret) {
      if (typeof payload.turnstileToken !== "string" || !payload.turnstileToken.trim()) {
        return jsonError("Please verify you are human and try again.", 403);
      }

      const isHuman = await dependencies.verifyTurnstileToken(
        payload.turnstileToken,
        turnstileSecret,
        req,
      );

      if (!isHuman) {
        return jsonError("Please verify you are human and try again.", 403);
      }
    }

    if (request.format === "pdf") {
      const rateLimit = await dependencies.checkPdfRateLimit(req);
      if (!rateLimit.allowed) {
        return jsonError(
          "PDF exports are temporarily limited. Please try again later.",
          429,
          {
            "Retry-After": String(rateLimit.retryAfterSeconds ?? 3600),
          },
        );
      }
    }

    return await dependencies.exportChat(request);
  } catch (error) {
    const message = getErrorMessage(error);
    const isValidationError =
      message === "Use a public ChatGPT share URL." ||
      message === "Paste a public ChatGPT share URL." ||
      message === "Use a public Claude share URL." ||
      message === "Paste valid Claude snapshot JSON." ||
      message === "Snapshot JSON must include Claude chat_messages." ||
      message === "ChatGPT exports use public share links." ||
      message === "Choose Markdown or PDF.";

    return jsonError(
      isValidationError ? message : "The export failed. Please try again.",
      isValidationError ? 400 : 500,
    );
  }
}

function buildValidatedRequest(payload: ExportRequestPayload) {
  const turnstileToken =
    typeof payload.turnstileToken === "string" ? payload.turnstileToken : undefined;

  if (payload.provider === "claude") {
    if (payload.mode === "snapshot-json") {
      if (typeof payload.snapshotJson !== "string" || !payload.snapshotJson.trim()) {
        throw new Error("Snapshot JSON must include Claude chat_messages.");
      }

      return buildExportRequest({
        provider: "claude",
        mode: "snapshot-json",
        snapshotJson: payload.snapshotJson,
        sourceUrl: typeof payload.sourceUrl === "string" ? payload.sourceUrl : undefined,
        format: payload.format as string,
        turnstileToken,
      });
    }

    if (payload.mode === "share-link") {
      if (typeof payload.sharedUrl !== "string" || !payload.sharedUrl.trim()) {
        throw new Error("Use a public Claude share URL.");
      }

      return buildExportRequest({
        provider: "claude",
        mode: "share-link",
        sharedUrl: payload.sharedUrl,
        format: payload.format as string,
        turnstileToken,
      });
    }

    throw new Error("Snapshot JSON must include Claude chat_messages.");
  }

  if (payload.mode && payload.mode !== "share-link") {
    throw new Error("ChatGPT exports use public share links.");
  }

  if (typeof payload.sharedUrl !== "string" || !payload.sharedUrl.trim()) {
    throw new Error("Paste a public ChatGPT share URL.");
  }

  return buildExportRequest(
    payload.sharedUrl,
    payload.format as string,
    turnstileToken,
  );
}

export const config = {
  path: AI_CHAT_EXPORTER_CONTRACT.apiPath,
  method: ["POST"],
};

function jsonError(
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
) {
  return Response.json(
    { error: message },
    {
      headers: {
        "Cache-Control": "no-store",
        ...extraHeaders,
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

function getTurnstileSecret() {
  return getEnvironmentVariable("TURNSTILE_SECRET_KEY");
}

function getEnvironmentVariable(name: string) {
  const netlifyEnv = (globalThis as typeof globalThis & {
    Netlify?: { env?: { get: (key: string) => string | undefined } };
  }).Netlify?.env?.get(name);
  return netlifyEnv || process.env[name];
}

async function verifyTurnstileToken(token: string, secret: string, req: Request) {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: getClientIp(req),
    }),
    method: "POST",
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result?.success === true;
}

function getClientIp(req: Request) {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  );
}

async function checkPdfRateLimit(req: Request): Promise<PdfRateLimitResult> {
  const clientKey = getPdfRateLimitClientKey(req);
  const bucketKey = `pdf/${clientKey}`;
  const now = new Date();
  const store = getStore({
    consistency: "strong",
    name: "ai-chat-exporter-rate-limits",
  });
  const existing = await store.get(bucketKey, { type: "json" }) as PdfRateLimitBucket | null;
  const resetAt = existing?.resetAt ? new Date(existing.resetAt) : new Date(0);

  if (!existing || Number.isNaN(resetAt.getTime()) || resetAt <= now) {
    await store.setJSON(bucketKey, {
      count: 1,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    } satisfies PdfRateLimitBucket);
    return { allowed: true };
  }

  if (existing.count >= PDF_RATE_LIMIT_PER_HOUR) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000)),
    };
  }

  await store.setJSON(bucketKey, {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  } satisfies PdfRateLimitBucket);

  return { allowed: true };
}

function getPdfRateLimitClientKey(req: Request) {
  const ip = getClientIp(req) || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return createHash("sha256")
    .update(`${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}
