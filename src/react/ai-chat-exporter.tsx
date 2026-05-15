import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import {
  AI_CHAT_EXPORTER_CONTRACT,
  buildExportRequest,
  exportSharedChat,
  triggerFileDownload,
  type AiChatExportFormat,
} from "@/lib/ai-chat-exporter";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { StatefulButton } from "@/components/ui/stateful-button";
import "./styles.css";

function AiChatExporterPage() {
  const [sharedUrl, setSharedUrl] = useState("");
  const [format, setFormat] = useState<AiChatExportFormat>("markdown");
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const isExportingRef = useRef(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runExport();
  }

  async function runExport() {
    if (isExportingRef.current) {
      return false;
    }

    try {
      const request = buildExportRequest(sharedUrl, format);
      isExportingRef.current = true;
      setIsExporting(true);
      setStatusMessage("Creating your export.");
      const exported = await exportSharedChat(request);
      triggerFileDownload(exported.blob, exported.filename);
      setStatusMessage(`Downloaded ${exported.filename}.`);
      return true;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Check the URL and try again.");
      return false;
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }

  return (
    <BackgroundBeamsWithCollision className="ai-exporter-page">
      <div className="ai-exporter-shell">
        <h1 id="ai-exporter-title">AI Chat Exporter</h1>
        <p className="ai-exporter-copy">
          Paste a public ChatGPT share URL and export a clean Markdown or PDF
          copy of the thread.
        </p>

        <form className="ai-exporter-form" onSubmit={handleSubmit}>
          <label className="ai-exporter-field" htmlFor="ai-exporter-url">
            <span className="sr-only">Shared ChatGPT URL</span>
            <input
              id="ai-exporter-url"
              disabled={isExporting}
              name="sharedUrl"
              onChange={(event) => setSharedUrl(event.target.value)}
              placeholder="https://chatgpt.com/share/..."
              type="url"
              value={sharedUrl}
            />
          </label>

          <fieldset className="ai-exporter-format">
            <legend className="sr-only">Export format</legend>
            {AI_CHAT_EXPORTER_CONTRACT.formats.map((option) => {
              const isEnabled = AI_CHAT_EXPORTER_CONTRACT.enabledFormats.includes(
                option as (typeof AI_CHAT_EXPORTER_CONTRACT.enabledFormats)[number],
              );

              return (
              <label key={option} aria-disabled={!isEnabled}>
                <input
                  checked={format === option}
                  disabled={isExporting || !isEnabled}
                  name="format"
                  onChange={() => setFormat(option)}
                  type="radio"
                  value={option}
                />
                <span>{option === "markdown" ? "Markdown" : "PDF"}</span>
              </label>
              );
            })}
          </fieldset>

          <StatefulButton
            aria-busy={isExporting}
            className="ai-exporter-button"
            disabled={isExporting}
            onClick={runExport}
            type="button"
          >
            Export
          </StatefulButton>
        </form>

        <p className="ai-exporter-status" role="status">
          {statusMessage}
        </p>
      </div>
    </BackgroundBeamsWithCollision>
  );
}

const root = document.getElementById(AI_CHAT_EXPORTER_CONTRACT.rootId);

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <MotionConfig reducedMotion="user">
        <AiChatExporterPage />
      </MotionConfig>
    </React.StrictMode>,
  );
}
