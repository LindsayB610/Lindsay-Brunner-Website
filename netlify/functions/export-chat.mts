import {
  AI_CHAT_EXPORTER_CONTRACT,
  type AiChatExportRequest,
  buildExportRequest,
} from "../../src/lib/ai-chat-exporter";
import { exportChatWithExporter } from "./_shared/exporter-adapter";

type ExportRequestPayload = {
  sharedUrl?: unknown;
  format?: unknown;
  turnstileToken?: unknown;
};

type ExportChatDependencies = {
  exportChat: (request: AiChatExportRequest) => Promise<Response>;
  getTurnstileSecret: () => string | undefined;
  verifyTurnstileToken: (token: string, secret: string, req: Request) => Promise<boolean>;
};

export default async function exportChat(req: Request) {
  return handleExportChatRequest(req);
}

export function handleExportChatRequest(
  req: Request,
  dependencies: Partial<ExportChatDependencies> = {},
) {
  const resolvedDependencies: ExportChatDependencies = {
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

  if (typeof payload.sharedUrl !== "string" || !payload.sharedUrl.trim()) {
    return jsonError("Paste a public ChatGPT share URL.", 400);
  }

  if (typeof payload.format !== "string") {
    return jsonError("Choose Markdown or PDF.", 400);
  }

  try {
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

    const request = buildExportRequest(
      payload.sharedUrl,
      payload.format,
      typeof payload.turnstileToken === "string" ? payload.turnstileToken : undefined,
    );
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
