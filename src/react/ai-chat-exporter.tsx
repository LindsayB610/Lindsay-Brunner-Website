import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import {
  AI_CHAT_EXPORTER_CONTRACT,
  buildClaudeSnapshotCommand,
  buildExportRequest,
  exportSharedChat,
  triggerFileDownload,
  type AiChatExportFormat,
} from "@/lib/ai-chat-exporter";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { StatefulButton } from "@/components/ui/stateful-button";
import "./styles.css";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          callback: (token: string) => void;
          "error-callback": () => void;
          "expired-callback": () => void;
          sitekey: string;
          theme: "dark";
        },
      ) => string;
      remove?: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const turnstileSiteKey = "0x4AAAAAADPhTg-gZ2PoA0S9";
const turnstileScriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js";
type AiChatExporterTab = (typeof AI_CHAT_EXPORTER_CONTRACT.tabs)[number];

function AiChatExporterPage() {
  const [activeTab, setActiveTab] = useState<AiChatExporterTab>("ChatGPT");
  const [sharedUrl, setSharedUrl] = useState("");
  const [claudeSnapshotJson, setClaudeSnapshotJson] = useState("");
  const [claudeSourceUrl, setClaudeSourceUrl] = useState("");
  const [claudeLinkUrl, setClaudeLinkUrl] = useState("");
  const [claudeLinkCommand, setClaudeLinkCommand] = useState("");
  const [claudeLinkStatus, setClaudeLinkStatus] = useState("");
  const [format, setFormat] = useState<AiChatExportFormat>("markdown");
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const isExportingRef = useRef(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef("");

  useEffect(() => {
    let isMounted = true;

    function renderTurnstile() {
      if (
        !isMounted ||
        activeTab === "Claude Link" ||
        !window.turnstile ||
        !turnstileContainerRef.current ||
        turnstileWidgetIdRef.current
      ) {
        return;
      }

      turnstileWidgetIdRef.current = window.turnstile.render(
        turnstileContainerRef.current,
        {
          "error-callback": () => setTurnstileToken(""),
          "expired-callback": () => setTurnstileToken(""),
          callback: (token) => setTurnstileToken(token),
          sitekey: turnstileSiteKey,
          theme: "dark",
        },
      );
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${turnstileScriptUrl}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", renderTurnstile, { once: true });
      renderTurnstile();
    } else {
      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = turnstileScriptUrl;
      script.addEventListener("load", renderTurnstile, { once: true });
      document.head.append(script);
    }

    return () => {
      isMounted = false;
      if (turnstileWidgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
      } else if (turnstileContainerRef.current) {
        turnstileContainerRef.current.innerHTML = "";
      }
      turnstileWidgetIdRef.current = "";
      setTurnstileToken("");
    };
  }, [activeTab]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runExport();
  }

  function handleClaudeLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setClaudeLinkCommand(buildClaudeSnapshotCommand(claudeLinkUrl));
      setClaudeLinkStatus("Command ready. Run it locally, then paste the saved JSON in the Claude JSON tab.");
    } catch (error) {
      setClaudeLinkCommand("");
      setClaudeLinkStatus(error instanceof Error ? error.message : "Use a public Claude share URL.");
    }
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentTab: AiChatExporterTab,
  ) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();
    const tabs = AI_CHAT_EXPORTER_CONTRACT.tabs;
    const currentIndex = tabs.indexOf(currentTab);
    const nextTab =
      event.key === "Home"
        ? tabs[0]
        : event.key === "End"
          ? tabs[tabs.length - 1]
          : tabs[
              (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length
            ];
    selectTab(nextTab);
    window.requestAnimationFrame(() => {
      document.getElementById(tabId(nextTab))?.focus();
    });
  }

  function selectTab(tab: AiChatExporterTab) {
    setActiveTab(tab);
    setStatusMessage("");
  }

  async function copyClaudeLinkCommand() {
    if (!claudeLinkCommand) {
      return;
    }

    try {
      await navigator.clipboard.writeText(claudeLinkCommand);
      setClaudeLinkStatus("Command copied.");
    } catch {
      setClaudeLinkStatus("Copy failed. Select the command text and copy it manually.");
    }
  }

  function useClaudeLinkAsSource() {
    try {
      buildClaudeSnapshotCommand(claudeLinkUrl);
      setClaudeSourceUrl(claudeLinkUrl.trim());
      setActiveTab("Claude JSON");
      setStatusMessage("");
    } catch (error) {
      setClaudeLinkStatus(error instanceof Error ? error.message : "Use a public Claude share URL.");
    }
  }

  async function runExport() {
    if (isExportingRef.current) {
      return false;
    }

    try {
      const request =
        activeTab === "Claude JSON"
          ? buildExportRequest({
              provider: "claude",
              mode: "snapshot-json",
              snapshotJson: claudeSnapshotJson,
              sourceUrl: claudeSourceUrl,
              format,
              turnstileToken,
            })
          : buildExportRequest(sharedUrl, format, turnstileToken);
      isExportingRef.current = true;
      setIsExporting(true);
      setStatusMessage("Creating your export.");
      const exported = await exportSharedChat(request);
      triggerFileDownload(exported.blob, exported.filename);
      setStatusMessage(`Downloaded ${exported.filename}.`);
      resetTurnstile();
      return true;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Check the URL and try again.");
      resetTurnstile();
      return false;
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }

  function resetTurnstile() {
    setTurnstileToken("");
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  }

  return (
    <BackgroundBeamsWithCollision className="ai-exporter-page">
      <div className="ai-exporter-shell">
        <h1 id="ai-exporter-title">AI Chat Exporter</h1>
        <p className="ai-exporter-copy">
          Paste a public ChatGPT share URL, or choose a Claude path that matches
          what you have available.
        </p>
        <p className="ai-exporter-docs-link">
          <a href="/ai-chat-exporter/docs/">How this works</a>
        </p>

        <div
          aria-label="Exporter type"
          className="ai-exporter-tabs"
          role="tablist"
        >
          {AI_CHAT_EXPORTER_CONTRACT.tabs.map((tab) => (
            <button
              aria-controls={panelId(tab)}
              aria-selected={activeTab === tab}
              className="ai-exporter-tab"
              id={tabId(tab)}
              key={tab}
              onClick={() => selectTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              role="tab"
              tabIndex={activeTab === tab ? 0 : -1}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <section
          aria-labelledby={tabId("ChatGPT")}
          hidden={activeTab !== "ChatGPT"}
          id={panelId("ChatGPT")}
          role="tabpanel"
        >
          <p className="ai-exporter-panel-copy">
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

          {activeTab === "ChatGPT" ? (
            <div
              ref={turnstileContainerRef}
              aria-label="Human verification"
              className="ai-exporter-turnstile"
            />
          ) : null}

          <p className="ai-exporter-status" role="status">
            {activeTab === "ChatGPT" ? statusMessage : ""}
          </p>
        </section>

        <section
          aria-labelledby={tabId("Claude JSON")}
          className="ai-exporter-panel"
          hidden={activeTab !== "Claude JSON"}
          id={panelId("Claude JSON")}
          role="tabpanel"
        >
          <h2>Claude JSON: reliable path</h2>
          <p>
            Save a snapshot locally with the CLI, then paste the JSON here. The
            website can turn that saved conversation into Markdown or PDF.
          </p>

          <form className="ai-exporter-form" onSubmit={handleSubmit}>
            <label className="ai-exporter-field" htmlFor="ai-exporter-claude-snapshot">
              <span className="sr-only">Claude snapshot JSON</span>
              <textarea
                id="ai-exporter-claude-snapshot"
                disabled={isExporting}
                name="claudeSnapshotJson"
                onChange={(event) => setClaudeSnapshotJson(event.target.value)}
                placeholder='{"snapshot_name":"...","chat_messages":[...]}'
                rows={8}
                value={claudeSnapshotJson}
              />
            </label>

            <label className="ai-exporter-field" htmlFor="ai-exporter-claude-source">
              <span className="sr-only">Claude source share URL</span>
              <input
                id="ai-exporter-claude-source"
                disabled={isExporting}
                name="claudeSourceUrl"
                onChange={(event) => setClaudeSourceUrl(event.target.value)}
                placeholder="Optional source: https://claude.ai/share/..."
                type="url"
                value={claudeSourceUrl}
              />
            </label>

            <fieldset className="ai-exporter-format">
              <legend className="sr-only">Claude export format</legend>
              {AI_CHAT_EXPORTER_CONTRACT.formats.map((option) => {
                const isEnabled = AI_CHAT_EXPORTER_CONTRACT.enabledFormats.includes(
                  option as (typeof AI_CHAT_EXPORTER_CONTRACT.enabledFormats)[number],
                );

                return (
                  <label key={option} aria-disabled={!isEnabled}>
                    <input
                      checked={format === option}
                      disabled={isExporting || !isEnabled}
                      name="claudeFormat"
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
              Export Claude
            </StatefulButton>
          </form>

          {activeTab === "Claude JSON" ? (
            <div
              ref={turnstileContainerRef}
              aria-label="Human verification"
              className="ai-exporter-turnstile"
            />
          ) : null}

          <p className="ai-exporter-status" role="status">
            {activeTab === "Claude JSON" ? statusMessage : ""}
          </p>
        </section>

        <section
          aria-labelledby={tabId("Claude Link")}
          className="ai-exporter-panel"
          hidden={activeTab !== "Claude Link"}
          id={panelId("Claude Link")}
          role="tabpanel"
        >
          <h2>Claude Link: local capture path</h2>
          <p>
            Paste a Claude share link to generate a local CLI command. The
            website cannot reliably fetch Claude shares because verification has
            to happen in a real browser you control.
          </p>

          <form className="ai-exporter-form" onSubmit={handleClaudeLinkSubmit}>
            <label className="ai-exporter-field" htmlFor="ai-exporter-claude-link">
              <span className="sr-only">Claude share URL</span>
              <input
                id="ai-exporter-claude-link"
                name="claudeLinkUrl"
                onChange={(event) => {
                  setClaudeLinkUrl(event.target.value);
                  setClaudeLinkStatus("");
                }}
                placeholder="https://claude.ai/share/..."
                type="url"
                value={claudeLinkUrl}
              />
            </label>

            <button className="ai-exporter-button" type="submit">
              Generate CLI command
            </button>
          </form>

          {claudeLinkCommand ? (
            <div className="ai-exporter-command-panel">
              <label htmlFor="ai-exporter-claude-command">Local snapshot command</label>
              <textarea
                id="ai-exporter-claude-command"
                readOnly
                rows={4}
                value={claudeLinkCommand}
              />
              <div className="ai-exporter-command-actions">
                <button
                  className="ai-exporter-secondary-button"
                  onClick={copyClaudeLinkCommand}
                  type="button"
                >
                  Copy command
                </button>
                <button
                  className="ai-exporter-secondary-button"
                  onClick={useClaudeLinkAsSource}
                  type="button"
                >
                  Use link in JSON tab
                </button>
              </div>
            </div>
          ) : null}

          <p className="ai-exporter-status" role="status">
            {activeTab === "Claude Link" ? claudeLinkStatus : ""}
          </p>
        </section>

      </div>
    </BackgroundBeamsWithCollision>
  );
}

function tabId(tab: AiChatExporterTab): string {
  return `ai-exporter-tab-${tab.toLowerCase().replaceAll(" ", "-")}`;
}

function panelId(tab: AiChatExporterTab): string {
  return `ai-exporter-panel-${tab.toLowerCase().replaceAll(" ", "-")}`;
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
