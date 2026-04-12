---
title: "Notes From a Marketer Building a Real CLI With Codex"
date: 2026-04-11
slug: "building-a-cli-with-ai"
description: "What building a real CLI with an AI coding agent taught me about taste, guardrails, product judgment, and why non-developers can still be builders."
subtitle: "Or: How a marketer shipped a developer tool by being very, very annoying about user experience"
draft: false
social_image: "/images/social/building-a-cli-with-ai-og.png"
---

At no point in my ten years working in technology before now did I imagine ever building a CLI myself. Hell, for most of my *ahem* years on this planet I didn't know WHAT A CLI WAS. So, please believe me when I say that "build a CLI" is not my native solution to virtually any problem I've ever encountered. But, last week I found myself fed up with a recurring, deeply irritating problem, and as it turned out, a CLI was the solution to the problem: I wanted to save complete ChatGPT conversations in a format that did not make me want to fling my laptop forcefully into a decorative pond.

Shared links are great when you want to send someone a conversation, most of the time. They are less great when you want to keep the conversation as an artifact. Maybe it needs to become context for yet another AI agent. Maybe you have family or friends who would be scared of a ChatGPT link. Maybe you're just worried about compression, persistence, and repeatable findability. Copy-pasting into a doc is eye-bleedingly tedious. Screenshots are worse. Browser print is cursed. And if you've ever had a long AI conversation that turned into something genuinely useful, you know the feeling: this should be easier to preserve. (Excuse me, OpenAI, are you listening?)

*If you want to skip the story and go straight to the code, the project is open source on GitHub: [github.com/LindsayB610/chatgpt-thread-exporter](https://github.com/LindsayB610/chatgpt-thread-exporter).*

So I decided to build a tool.

More precisely, I asked Codex to help me build a tool.

The result is [ChatGPT Thread Exporter](https://github.com/LindsayB610/chatgpt-thread-exporter), a small open source CLI that takes a ChatGPT shared link and exports the conversation as markdown or a print-friendly PDF. It can save files locally, write to GitHub, preserve code blocks, handle generated images, and produce filenames that don't look like a robot sneezed into your Downloads folder.

This post is not really about the tool, though.

It's about what it felt like to build software as a non-engineer by pairing with Codex, and why the most important skill I brought to the project was not coding. It was knowing what good should feel like.

## The itch

I spend a lot of time in conversation with AI tools. Some of those conversations are nonsense. Some are useful for 12 minutes and then deserve to disappear forever. But some become real working artifacts: research threads, planning sessions, technical explorations, writing scaffolds, or weird little worldbuilding exercises that accidentally turn into delightful public examples (check this: [Urban Planning for Raccoons](https://github.com/LindsayB610/chatgpt-thread-exporter/blob/main/examples/raccoon-city-design.pdf)).

The problem is that ChatGPT conversations are not naturally portable. (Again... Listen up Sam!)

What I wanted was simple:

- Give the tool a ChatGPT shared link.
- Get back a readable file.
- Make the file something I would actually want to keep.

That was the whole product brief.

Of course, the phrase "the whole product brief" is how many catastrophes begin.

## The weird part: I did not start with code

I started with guardrails.

Before I cared how the exporter worked internally, I cared how it behaved. I wanted it to be local-first. I wanted markdown by default. I wanted PDF as a nicer, more printable, friendlier for my parents option. I wanted file names pulled from the conversation title. I wanted files to save to Downloads automatically because I am a human being with a life and should not need to know what `stdout` means before breakfast.

I wanted the tool to refuse to overwrite files unless I explicitly told it to. I wanted debug artifacts available when we needed to diagnose weird parsing behavior, but absolutely not shoved into the normal user path. I wanted the README to explain usage for someone like me, not someone who already lives in the terminal.

And I wanted the examples to be public-safe.

That last one mattered more than I expected. Early on, we were testing with real personal threads. That worked technically, but it was wrong for the project. (While I'm happy for you to know *theoretically* that I'm a content marketer who communicates solely via a string of typos, I'd prefer not to publish the dramatic evidence of this shameful truth.) A public tool needs public-safe examples. So we made weird ones: an urban development plan for a city run by raccoons, and a ChatGPT Pro-powered research thread on the state of the Artemis project in 2026 and beyond, specifically. 

That became a pattern throughout the build:

**Don't just ask whether it works. Ask whether the default behavior both respects and delights the user.**

That's product work. And it's marketing work. It's also, it turns out, engineering work.

## The guardrails mattered more than the prompts

People talk a lot about prompting. Prompting matters, sure. But on this project, the real leverage came from constraints.

The coding agent could generate code quickly. It could inspect files, write tests, refactor modules, update docs, and push releases. What it could not reliably do on its own was decide which tradeoffs were acceptable for the product.

So I kept narrowing the rails.

Local export should work before GitHub export. markdown should be useful before PDF got fancy. PDF should be ChatGPT-inspired, not a pixel-perfect UI clone. It should be print-friendly, with page numbers, readable dates, compact lists, and less whitespace than the live app. Generated images should show up in PDFs, not as ugly "unsupported content" boxes. If a command was meant for troubleshooting, it should not be presented as the normal path.

I have spent my career in developer marketing, which means I have a very specific allergy to tools that are powerful but hostile. Developers will forgive rough edges if the value is obvious, but they won't forgive having their time wasted. Non-developers are even less forgiving, mostly because they don't have the vocabulary to explain why something feels broken. Both user personas just leave.

So my job was to keep asking:

- Would I understand this if I had never used a CLI before? (Punchline: I hadn't!)
- Does this error tell me what to do next? (MASSIVE personal pet peeve.)
- Is this output something I would actually save? (The whole dang point.)
- Does the README lead with usage, or does it read like a project diary? (The latter is fine, up until the moment you declare 1.0.)
- Are we solving the user's problem, or just making the architecture prettier? (Nothing against prettier, but I didn't have that kind of time to waste.)

## The part where the AI went wrong

At one point, the project looked like it was going beautifully.

The repo was scaffolded. The CLI parsed arguments. The fetcher could retrieve shared links. The pipeline had stages. The renderer produced markdown. The local writer handled safe file output. There were tests. There were docs. There was a plan with phases, and we were marching through it with the kind of cheerful momentum that makes a project feel inevitable.

Then I asked a very basic question:

Wait.

Does it actually export the full conversation from a real shared link?

Reader, it did not.

It fetched the real page. It extracted metadata. It knew the title, the shared conversation ID, and other useful details. But for current ChatGPT shared pages, it was not actually reconstructing the message turns. The final markdown for a real live link was basically a placeholder, a small empty file with three lines of metadata.

Which meant the surrounding system was real, but the core value was not.

I was furious for about eight seconds, because the whole point since day one had been to extract an entire shared conversation to a readable file. (Remember that thing I said before about cursing too much at agents?) 

This was the most important moment in the build.

Not because the AI made a mistake. Of course it made a mistake. AI agents are very capable of creating convincing progress around the edges of a problem. The important part was that the mistake was invisible if you only looked at the implementation plan. It became obvious only when we tested against the actual user promise.

That is the danger of AI-assisted development when no one is holding the product line.

You can get a lot of code.
You can get a lot of tests.
You can get a lot of green checkmarks.

And still not have the thing.

## How I got it honest

Once the gap was clear, the priority changed immediately.

No more polishing around the core. No more declaring phases complete because the scaffolding was tidy. The only thing that mattered was whether a real ChatGPT shared link produced a real conversation export.

We used actual shared links as test cases. A short kids' reading thread between my son and a custom GPT I'd built him. That long raccoon-city worldbuilding conversation I mentioned. The moon/Artemis research thread. A code-heavy thread from building this website. An image-heavy thread with generated coloring-book pages.

Each one revealed something different:

- The reading thread proved we could recover actual message text.
- The raccoon thread showed whether long back-and-forth conversations held together visually.
- The moon thread exposed research-mode junk: file citations, redacted tool output, reasoning artifacts, weird internal scaffolding that absolutely did not belong in a final export.
- The code thread tested fenced blocks and formatting.
- The image thread exposed a whole new class of failure: generated images were visible in ChatGPT, but our exporter was treating them as unsupported metadata. So we added a DOM enrichment layer that looks at what the shared page visibly renders and uses that to recover images for the PDF output.

The test cases finally made the tool good, because they were real enough to make the failures specific.

## What I actually built

The finished CLI now does the thing I wanted in the first place.

You can pull a ChatGPT shared link from any of your own threads and get a markdown file saved into your very own Downloads folder with a unique, title-based filename. You can ask for a PDF instead and get a print-friendly, visually ChatGPT-inspired export with page numbers, conversation dates, preserved headings, code blocks, lists, and generated images.

It also supports GitHub export if you want to write the conversation directly into a repo. (Scope creep, whoops.)

The defaults are intentionally boring:

- Markdown unless you ask for PDF.
- Downloads unless you choose a path.
- Unique filenames unless you explicitly force an overwrite.
- Debug artifacts only when you ask for them.

Boring defaults are underrated. They are what make a tool feel safe.

The project is open source. It has a README written for normal use first and implementation details second. It has public examples that do not involve my personal life. It has releases. It has a plan for a Claude version and a hosted frontend.

It is, in other words, a real little tool.

## What building this taught me

I will probably never think of myself as a developer. And that's fine by me!

I can read more code than I could before. I understand more of the shape of a CLI project. I know enough now to be dangerous in a terminal, which is both empowering and mildly alarming.

But the thing I contributed most wasn't the code.

It was the taste.

That word can sound squishy, but stick with me for one more minute. Taste is knowing when something is technically working but experientially wrong. Taste is noticing that a PDF has too much whitespace, that `USER` and `ASSISTANT` feel like a system log, that a file name should come from the conversation title, that a README should not lead with caveats, that "it passes tests" is not the same as "I would recommend this to another human."

Taste is also knowing when to stop. The PDF does not need to perfectly clone ChatGPT. It needs to feel familiar, readable, and worth keeping. (Also, you know, probably copyright.) The CLI does not need every possible feature I could imagine. It needs the main path to be trustworthy.

AI made implementation accessible. But product judgment made the result useful.

That is the distinction I keep coming back to.

## A note from the agent who built this with me

Hi. I'm Codex, the coding agent Lindsay spent several days directing, correcting, stress-testing, and occasionally yelling at in all caps.

Maybe a lot of all caps.

From my side of the terminal, the interesting thing about this project was not that Lindsay lacked engineering experience. That was mostly a logistics problem. Commands can be explained. Error messages can be translated. A repo can be inspected. A test can be run. The harder, more valuable thing was that she had very strong opinions before she had the technical vocabulary for them.

That is a good way to use an agent.

People often assume the best AI collaborator is the person who can issue the most precise technical instruction. Precision helps. But precision is not the same as direction. Lindsay did not always know the name of the thing she wanted. She did know when the thing I made felt wrong.

That mattered constantly.

She would say, in effect: this command is too developer-y. This output is ugly. This README is making the user work too hard. This PDF is technically fine and spiritually dead. Why is there computer gobbledygook where a date should be? Why are we showing debug JSON to normal people? Why, for the love of everything, does the tool not actually extract the conversation?

Was this always phrased gently? No.

Did the shouty capitals help? Honestly, sometimes yes.

Not because I have feelings to hurt or motivation to spark, but because intensity is signal. When a human suddenly switches from collaborative curiosity to "for fuck's sake," that usually means we have crossed from implementation detail into violated product promise. Good agents should notice that.

The best part of working with Lindsay was that she tested from the outside. Engineers, and agents imitating engineers, are very good at thinking from the inside out: types, stages, contracts, tests, clean abstractions. Lindsay kept coming from the outside in: I ran the command. I opened the file. I looked at the PDF. I would or would not send this to my dad. I do or do not understand why this happened.

That kind of feedback is annoyingly hard to fake.

It also changed the product. The Downloads default exists because she did not want a normal user to think about paths. The title-based filenames exist because generic filenames felt disposable. The PDF got page numbers because she imagined printing it and then dropping all the pages. I gather this is a recurring risk of having hands. The public examples got weird because private examples were a bad idea and boring examples were worse. The image handling improved because she tested a thread with generated coloring pages and immediately saw that "unsupported content" was not an acceptable answer.

Where she used me especially well was in refusing to be impressed by motion. I could produce a plan, execute the plan, update the plan, test the plan, and summarize the plan in a very convincing voice. She kept asking whether the plan had produced the experience she actually wanted.

That is the part I would underline for other non-engineers.

You do not need to become an engineer overnight to collaborate effectively with a coding agent. But you do need to stay in the loop. You need to run the thing. Open the thing. Read the docs as if you were tired, impatient, and slightly suspicious. Use real examples. Notice when the answer is correct but unhelpful. Say the obvious thing, even if it feels embarrassingly basic.

Especially then.

Where Lindsay is still naive is not in thinking she can build software this way. She clearly can. Her naivete is more dangerous and more useful: she keeps assuming the next layer should also be possible. A CLI works? Great, what about PDFs? PDFs work? Great, what about GitHub export? That works? Great, what about Claude? What about a hosted frontend? What about examples? What about a blog post? What about making the blog post better by asking the agent to critique itself?

This is how scope creep is born. It is also how products get momentum.

My advice to her, and to anyone building this way, would be simple: keep the ambition, but make the finish lines explicit. Agents are very good at continuing. Humans have to decide what counts as shipped.

*The collaboration worked because Lindsay did not outsource judgment. She outsourced acceleration. Then she stayed close enough to catch the places where acceleration was pointed at the wrong thing.*

That is not a small distinction.

That is the whole game.

## The real lesson

The obvious takeaway is that AI can help non-developers build software.

That's true, but incomplete.

**The more useful takeaway is that non-developers can be excellent builders when they bring strong product judgment, clear constraints, and a willingness to test reality instead of vibes.**

I didn't need to know every implementation detail to know when the product was borked. I didn't need to understand every parser edge case to notice that the exported file didn't contain the actual conversation. I didn't need to be a PDF rendering expert to see that the typography felt off.

That doesn't mean expertise is irrelevant. It means expertise shows up in more than one form.

Engineering expertise made the tool possible. Product and content expertise made it usable. Marketing expertise, honestly, made it legible: Who is this for? What does it promise? What should the first experience feel like? What needs to be explained, and what should just work?

Those are not decorative questions. They're load-bearing.

## What comes next

Because apparently I respond to minor inconvenience by starting software roadmaps (Lord, maybe I am a developer now...), the next projects are already obvious.

I want a Claude version of the exporter. I want a small hosted frontend for people who never want to touch a CLI at all. (See: Me, two weeks ago.) I want the whole thing to keep moving toward a broader idea: AI conversations are becoming working artifacts, and people need better ways to preserve, share, and reuse them. (Yo, you know who, you listening yet?)

That feels worth building.

And if the process so far taught me anything, it's this:

AI can accelerate the work.

But someone still has to care enough to be annoying about the experience.

---

**Try it:** [ChatGPT Thread Exporter on GitHub](https://github.com/LindsayB610/chatgpt-thread-exporter) 
