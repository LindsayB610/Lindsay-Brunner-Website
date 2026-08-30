---
title: "Building Docs with an Arc-Reactor (and a Bit of AI)"
date: 2025-06-13
subtitle: "Or: How I distilled years of tech-writing muscle memory into two reusable playbooks — and turned them into an assistant called GuideForge"
slug: "meet-guideforge"
description: "How I turned years of tech-writing muscle memory into two AI-powered playbooks—and a lightweight assistant named GuideForge."
draft: false
social_image: "/images/social/meet-guideforge-og.png"
---

<!-- Start writing your post below this line --> 
_Or: How I distilled years of tech-writing muscle memory into two reusable playbooks — and turned them into an assistant called **GuideForge**_

I adore the smell of fresh Markdown in the morning, but there's a **hard limit to how many times a human can type "Step 1: Obtain an API key" before questioning their life choices**. Somewhere around iteration #73 I realised I wasn't writing, just copy-pasting tribal knowledge and hoping I hadn't missed the GDPR footnote.

So I asked the obvious question: *could silicon handle the mechanical bits while humans keep the nuance?* The experiment became **GuideForge** — a slim web tool that marries two playbooks (Author + Review) with ChatGPT o3. 

## The itch
I wanted three things:  

1. **Repeatability** — A checklist that junior writers (and my 2 a.m. self) could follow without needing me.  
2. **Quality gates** — Automatic guardrails that flag missing rate-limit notes *before* an unhappy developer does.  
3. **Velocity** — To never ever ever stare at a blank page ever again.

The solution: Two focused playbooks, one for **authoring** from scratch, one for **reviewing** existing drafts, plus a lightweight UI wrapped around ChatGPT o3. The sandbox is called **GuideForge**.

## The ingredients
* **A field-tested rubric** distilled from a decade of debating what *done* means.  
* **Severity tags** `[BLOCK]`, `[NICE]`, `[TONE]`, `[VALUE]` that double as GitHub labels.  
* **Intake questions** to force stakeholders to reveal SDK lists and compliance quirks *before* we type a word.  
* **A dash of generative AI** to handle boilerplate (think: code snippets, link stubs, and SEO meta) so humans can focus on being useful and engaging.

Everything else is CSS, serverless glue, and enough iced oat milk lattes to keep a small lunar colony awake.

![Screenshot of GuideForge home](/images/guideforge_home.png)

## Author Mode: The blank-page eliminator
When you hit **Start New Project**, GuideForge prompts you to answer five questions (product name, docs URL, SDKs available, style guide params, and compliance info). The AI then hands you:

* A tidy outline — Overview → Prereqs → Steps → Test + Verify → Troubleshoot → Next Steps  
* Starter code blocks for every SDK you said you support  
* TODO flags for screenshots or proprietary details  

It's like opening VS Code and finding the unit tests half-written.

## Review Mode: Your grumpy senior tech writer on demand
Drop in a suspicious draft from "Bob in Product," click **Review**, and GuideForge:

1. Scores the doc against ten battle-tested criteria (audience clarity, security call-outs, etc.)  
2. Injects inline comments with those severity tags  
3. Generates a punch list you can paste straight into Jira, GDocs, or whatever your team uses to get started with updates. 

_The AI isn't rewriting your voice; it's a linter for words._

## Lessons learned (skip my bruises)

| Bruise | Fix |
|--------|-----|
| Hallucinated links | Nightly sitemap validation before suggestions |
| Over-helpful AI ("Here's 700 words on REST verbs...") | Default to bullet points unless asked otherwise |
| Writers ignoring `[BLOCK]` tags | Paint them fire-engine red — peer pressure works |
| Scope creep ("Could it also generate release notes?") | Politely no: new playbook, new sprint |

## Thinking of rolling your own?
Start by turning your scars into specs. Every line of GuideForge's rubric traces back to a real wart:

* **Audience and Scope** — User tests showed half our readers bailed if they couldn't tell whether a guide applied to iOS or backend devs.  
* **Prerequisites** — 30% of support tickets came from missing API-key scopes; listing them cut those tickets in half.  
* **Step-by-Step + Copy-Paste Blocks** — Eye-tracking tends to prove that devs skim until they hit monospace, so we write to that F-pattern.  
* **Payload and Responses** — QA bugs were often just 4xx errors; showing a 200 and a 400 teaches pattern recognition.  
* **Verification / Testing** — Spawned after a "working" webhook failed in prod; now we enforce that every guide ends with a prove-it moment.  
* **Troubleshooting Table** — We mined chat logs for top errors and pre-answered them.  
* **Security and Compliance** — Audits are the worst time to discover misplaced PII; the rubric forces an explicit note every time.  
* **Next Steps and Metadata** — Unglamorous, but keeps docs discoverable and trustworthy.

Once you define and codify your own non-negotiables, feed them to the AI as system instructions, then review its output like you would a junior writer. Machines lint; humans craft the jokes.

## Tips if you roll your own
1. **Codify "good."** If you can't explain it in a table, neither can AI.  
2. **Use loud placeholders.** `{{ALL_CAPS}}` survives every editor.  
3. **Iterate small.** Generate → tweak → regenerate one section at a time.  
4. **Automate linting, not creativity.** Humans write jokes; robots remind us we forgot GDPR.

## What's next?
Well, let's be clear, "finish building GuideForge" is what's next. The playbooks have been built and honed over the last decade, but I'm pretty new to actual development. I'm vibe coding my way to success here with the help of a dev husband, a bunch of dev friends who for some reason really seem to like working with me, and [Builder.io](https://www.builder.io/). When I get GuideForge working to a point that I can use it in my day-to-day, I'll share it with some select friends who are already interested, and then open up invites for real beta testing. Keep an eye on this blog (and my socials) for progress updates.

<!-- To add an image, place it in static/images/ and use: ![Alt text](/images/your-image.png) -->