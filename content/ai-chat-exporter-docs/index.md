---
title: "AI Chat Exporter docs"
description: "How the ChatGPT and Claude AI chat exporter paths work."
type: "page"
url: "/ai-chat-exporter/docs/"
social_image: "/images/social/ai-chat-exporter-og.png"
---

[Back to the exporter](/ai-chat-exporter/)

AI Chat Exporter turns useful AI conversations into clean Markdown or PDF files. The tool supports ChatGPT and Claude, but the two services expose shared conversations differently.

## ChatGPT share URL

Use the ChatGPT tab when you have a public ChatGPT share URL like `https://chatgpt.com/share/...`.

Paste the link, choose Markdown or PDF, complete the browser check if it appears, and export. The website fetches the public shared thread on the backend and returns the file.

For the CLI version, see [chatgpt-thread-exporter](https://github.com/LindsayB610/chatgpt-thread-exporter).

## Claude snapshot JSON

Use the Claude JSON tab when you have saved Claude snapshot JSON.

This is the reliable Claude path. The local CLI opens the Claude share link in Chromium and saves the captured conversation data. Then the website can render that saved JSON as Markdown or PDF.

Example local command:

```sh
claude-thread-exporter --claude-url "https://claude.ai/share/..." --save-snapshot "./claude-thread.snapshot.json"
```

Then paste the saved JSON into the Claude JSON tab.

For the CLI version, see [claude-thread-exporter](https://github.com/LindsayB610/claude-thread-exporter).

## Claude share link

Use the Claude Link tab when you only have a Claude share link and need a local command.

Claude share pages can ask for browser verification, and that check may loop in hosted or headless browser environments. The website cannot reliably complete that verification for you because it needs to happen in a real browser you control.

That is why the web tool does not directly fetch Claude share links. It generates the local CLI command instead.

## Privacy

The browser sends your pasted URL or snapshot JSON to the export endpoint only when you press an export button. The endpoint returns a Markdown or PDF file and uses `no-store` response headers. The site does not provide account login, long-term storage, or a conversation library.

For Claude share capture, use the local CLI if you want the browser verification and snapshot step to stay on your machine.

## Troubleshooting

If ChatGPT export fails, confirm the link is a public share URL.

If Claude Link capture stalls or loops on verification, try again later or use a browser/profile where Claude already verifies cleanly.

If Claude JSON export fails, confirm the pasted JSON includes `chat_messages` and is not too large for the web exporter.
