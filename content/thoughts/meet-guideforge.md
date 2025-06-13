---
title: "Building Docs with an Arc-Reactor (and a Bit of AI)"
date: 2025-06-13
slug: "meet-guideforge"
description: "How I turned years of tech-writing muscle memory into two AI-powered playbooks—and a lightweight assistant named GuideForge."
draft: false
---

<!-- Start writing your post below this line --> 
# Building Docs with an Arc-Reactor (and a Bit of AI)
_Or: How I distilled years of tech-writing muscle memory into two reusable playbooks — and turned them into an assistant called **GuideForge**_

I adore the smell of fresh Markdown in the morning, but there's a **hard limit to how many times a human can type "Step 1: obtain an API key" before questioning their life choices**. Somewhere around iteration #73 I realised I wasn't writing — just copy-pasting tribal knowledge and hoping I hadn't missed the GDPR footnote.

So I asked the obvious question: *could silicon handle the mechanical bits while humans keep the nuance?* The experiment became **GuideForge** — a slim web tool that marries two playbooks (Author + Review) with ChatGPT o3. Think of it as a co-pilot that shows up with coffee and a checklist instead of platitudes.

## The itch
I wanted three things:  

1. **Repeatability** — a checklist that junior writers (and my 2 a.m. self) could follow without pinging me.  
2. **Quality gates** — automatic guardrails that flag missing rate-limit notes *before* an unhappy developer does.  
3. **Velocity** — drafts that start at 60 mph instead of staring at a blank file.

The solution: two focused playbooks—one for **authoring** from scratch, one for **reviewing** existing drafts—plus a lightweight UI wrapped around ChatGPT o3. The sandbox is called **GuideForge** (don't worry, the only thing it "forges" is momentum).

## The ingredients — at a polite distance
* **A field-tested rubric** distilled from a decade of debating what *done* means.  
* **Severity tags** `[BLOCK]`, `[NICE]`, `[TONE]`, `[VALUE]` that double as GitHub labels.  
* **Five intake questions** to force stakeholders to reveal SDK lists and compliance quirks *before* we type a word.  
* **A dash of generative AI** to handle boilerplate—code snippets, link stubs, SEO meta—so humans can focus on metaphors.

Everything else is CSS, serverless glue code, and enough cold brew to keep a small lunar colony awake.

![Screenshot of GuideForge home](/images/guideforge_home.png)

## Author Mode: the blank-page eliminator
Hit **Start New Project**, answer five questions (product name, docs URL, SDKs, style guide, compliance), and GuideForge hands you:

* A tidy outline — Overview → Prereqs → Steps → Test & Verify → Troubleshoot → Next Steps  
* Starter code blocks for every SDK you said you support  
* TODO flags for screenshots or proprietary details  

It's like opening VS Code and finding the unit tests half-written.

## Review Mode: your grumpy senior tech writer on demand
Drop in a suspicious draft from "Bob in Product," click **Review**, and GuideForge:

1. Scores the doc against ten criteria (audience clarity, security call-outs, etc.)  
2. Injects inline comments with those severity tags  
3. Generates a punch list you can paste straight into Jira  

The AI isn't rewriting your voice; it's a linter for words.

## Lessons learned (skip my bruises)

| Bruise | Fix |
|--------|-----|
| Hallucinated links | Nightly sitemap validation before suggestions |
| Over-helpful AI ("Here's 700 words on REST verbs...") | Default to bullet points unless asked otherwise |
| Writers ignoring `[BLOCK]` tags | Paint them fire-engine red — peer pressure works |
| Scope creep ("Could it also generate release notes?") | Politely no: new playbook, new sprint |

## Thinking of rolling your own?
Start by turning your scars into specs. Every line of GuideForge's rubric traces back to a real wart:

* **Audience and Scope** — user tests showed half our readers bailed if they couldn't tell whether a guide applied to iOS or backend devs.  
* **Prerequisites** — 30% of support tickets came from missing API-key scopes; listing them cut those tickets in half.  
* **Step-by-Step + Copy-Paste Blocks** — eye-tracking proved devs skim until they hit monospace, so we write to that F-pattern.  
* **Payload and Responses** — QA bugs were often just 4xx errors; showing a 200 and a 400 teaches pattern recognition.  
* **Verification / Testing** — spawned after a "working" webhook failed in prod; now every guide ends with a prove-it moment.  
* **Troubleshooting Table** — we mined chat logs for top errors and pre-answered them—live-chat volume dropped.  
* **Security and Compliance** — audits are the worst time to discover misplaced PII; the rubric forces an explicit note every time.  
* **Next Steps & Metadata** — unglamorous, but keeps docs discoverable and trustworthy.

Once you define and codify your own non-negotiables, feed them to the AI as system instructions—then review its output like you would a junior writer. Machines lint; humans craft the jokes.

## Why share if it's proprietary?
The gold isn't the checklist itself; it's how tightly that checklist meshes with *my* workflow. Sharing the meta-process helps the community level up—and honestly, it's fun to show what you can build on a long weekend and a gallon of cold brew.

## Tips if you roll your own
1. **Codify "good."** If you can't explain it in a table, neither can AI.  
2. **Use loud placeholders.** `{{ALL_CAPS}}` survives every editor.  
3. **Iterate small.** Generate → tweak → regenerate one section at a time.  
4. **Automate linting, not creativity.** Humans write jokes; robots remind us we forgot GDPR.

## What's next?
A CLI for repo-wide linting? A playbook marketplace? Maybe. For now, GuideForge turns blank-page terror and nit-pick reviews into two clicks and a coffee refill.

**Heads-up:** GuideForge isn't public yet—I'm refining the beta and building a public version using [Builder.io](https://www.builder.io/). Keep an eye on this blog (and my socials) for progress updates.

<!-- To add an image, place it in static/images/ and use: ![Alt text](/images/your-image.png) -->
