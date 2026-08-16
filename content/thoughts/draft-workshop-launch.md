---
title: "Meet Workshop, My App for Other Apps"
date: 2026-08-17
slug: "workshop-launch"
description: "Workshop is a macOS shell for small, local-first tools that need a useful home."
subtitle: "Or: What happens after you build the useful little thing."
draft: true
social_image: "/images/social/workshop-launch-og-1200x630.png"
---

Small everyday tools have a predictable lifecycle.

First, you build a tool, a script, a skill, something that solves one irritating problem. It lives in a terminal command, a generically named repo, a Google Doc, or a file somewhere on your local disk. You did a good job, so the tool becomes indispensable very quickly.

Then something changes. You go on vacation or whatever and you don't need that tool for a few days or weeks. So you forget it exists and end up frustrated one day, months later, when you half remember that some part of your workflow used to be easier. Where the heck did you save that dang script? Even Codex can't find the skill you're talking about... Did you actually set it up in Claude?

(Do other people do this in other domains? Are carpenters constantly building random little wooden widgets and then losing them eventually amongst all the other wood?)

If this sounds like the lived experience of your ADHD-blessed corporate bestie... Well. Hi. I'm the problem. It's me.

But hey, we live in the age of AI, so I built a thing for all my other things to live in! (This is not at all like what I do when I buy a new set of boxes at Container Store and expect them to change my life... I swear.)

## Meet Workshop

I built **Workshop**, a small macOS app that gives independent, local-first tools a shared home. It isn't trying to become an everything app. It's the layer that, for me, makes the small apps usable as a system, with a few extra bells and whistles because I wanted to. Workshop is one desktop frame with intentional installation, local preferences, and a clear line between public code and private data.

(Do the carpenters also do this? Is this how like, toolboxes were invented?!)

{{< workshop-screenshot src="/images/workshop/workshop-home.png" alt="Workshop home screen with Slate and Pulse available as ready tools." >}}

When I set out with the initial idea for Workshop I had two main goals: I wanted a desktop app that could live in my dock, instead of a webapp that would just be Chrome tab number 347. I also really didn't want to build a monolith. I wanted something I could half commit my local messy tools too just to see if they could survive the light of day. A design conversayion with Codex led me to Tauri, and the Workshop concept of a wrapper tool that functions only as a shell for other things. Every tool in Workshop has it's own repo, it's own docs. The messes, at the very least, are forced to remain in their own piles.


I also wanted to try building something another person could use, just to push myself to not fully half ass it, so I thought through privacy pretty much from day one. With the apps I've built  inside Workshop my personal data stays in deliberately selected local folders, not in the public repos. And thus, so does yours.

## Two small tools, two different jobs

Workshop currently includes two apps: Slate and Pulse.

**Slate** is a local reference desk. You explicitly choose the Markdown files it can read, then Slate gives them a more visually appealing home. It can handle a few different files types like standard docs, long pages with multiple subheads that become tabs, and tables.


{{< slate-gallery >}}

**Pulse** does a completely different job. It manages recurring reminders and follows up through an Android notification until I mark something done or snooze it. Because of the aforementioned ADHD, there are some reminders in my life that I just need to be supremly, reliably annoying in a very specific way, so l actually do the things. Pulse's runner, credentials, and reminder data stay behind a narrow local and secure-service boundary. Workshop gives Pulse a home and a constrained way to connect.

{{< workshop-screenshot src="/images/workshop/pulse-take-out-trash.png" alt="Pulse reminder dashboard showing an active Take out trash reminder, its next notification, and runner status." >}}

And Slate has already made [GUPPI](/thoughts/2025-06-12/meet-guppi/) , my AI personal assistant, more useful. GUPPI is still the conversational layer that helps me sort through the pile, but my running to-do list now has a local Markdown home he can read from. When I resurface after a week and ask what I was supposed to be doing, we have somewhere better to start than his memory.

## Try Workshop

Workshop is available for Apple Silicon. No account required. If you want to inspect the source, find it on [GitHub](https://github.com/LindsayB610/workshop) (and don't forget to leave a star!).

{{< workshop-download class="workshop-post-download-button" apple="true" label="Download for macOS" >}}
