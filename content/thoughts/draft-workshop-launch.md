---
title: "I Built a Home for My Small Tools"
date: 2026-08-21
slug: "workshop-launch"
description: "Workshop is a macOS shell for small, local-first tools that need a useful home without becoming one giant app."
subtitle: "Or: What happens after you build the useful little thing."
draft: true
---
Small tools have a predictable lifecycle.

First, they solve one irritating problem. Then they become indispensable. Then they live in a terminal command, a half-remembered repository, a browser tab, and a private folder with a name like `final-final-actually-use-this`.

The tool is fine. The surrounding situation is feral.

I kept building useful little things for myself: a local reference desk for Markdown files, a reminder system that keeps tapping my shoulder until I do the thing, a few narrowly scoped helpers that do not need a venture round or a dashboard with forty-seven charts. What I did not have was a sane place for them to live.

So I built one.

**Workshop** is a small macOS app that gives independent, local-first tools a shared home. It is not trying to become an everything app. It is the layer that makes the small apps usable as a system: one desktop frame, intentional installation, local preferences, and a clear line between public code and private data.

I build technical content for products with the same basic problem. The underlying system is usually more complicated than the message wants to admit. Good work starts by naming the boundary, the tradeoff, and the job the thing actually does. Workshop is a small product, but it is also a live specimen of that practice.

![Workshop home screen with Slate and Pulse available as ready tools.](/images/thoughts/workshop-home.png)

## The annoying problem was never just the tool

Building a focused internal tool is easier than it used to be. Keeping one healthy is a different job.

It needs a place to launch. It needs a way to keep its private inputs local. It needs an update path. It needs enough structure that Future You can tell what it is, where its code lives, and whether it is safe to touch before coffee.

The usual answer is to keep adding things to one large application. That is how a small, clear utility slowly becomes an archaeological site. Every new tool inherits every old assumption. A visual change for one workflow can break another. Private data boundaries get fuzzy because the codebase has forgotten where one product stops and the next begins.

Workshop takes the other route. The shell owns the macOS frame, tool shelf, preferences, update behavior, and shared theme tokens. Each app owns its own repository, UI, tests, and release history. Personal data stays in deliberately selected local folders, never in a public repository or a convenient mystery cache.

Tools can inherit the shell's theme when they are ready, while retaining their own standalone defaults when they are not.

That last point matters more than it sounds. A plugin system that requires every tool to change in lockstep is not really independent. It is a monorepo wearing a fake moustache.

## Two small tools, two different jobs

Workshop currently includes Slate and Pulse.

**Slate** is a local reference desk. You explicitly choose the Markdown files it can read, then Slate turns them into useful reference views: clean documents, tabs, sortable tables, or tabbed tables. It does not search your drive for “helpful” files. It does not make a cloud copy. The boundary is boring on purpose.

![Slate's local reference library, showing explicitly configured reference documents and view types.](/images/thoughts/slate-library.png)

That constraint is the product. If a tool is meant to make private material easier to use, quietly broadening what it can see is not a feature. It is a trust problem.

Slate also makes a decent demonstration of the Workshop model. It has its own presentation, its own configuration management, and its own fallback theme. When it runs inside Workshop, it picks up the shared palette through semantic CSS tokens. When it runs by itself, it still looks like Slate.

![Slate rendering a tabbed, sortable Markdown table.](/images/thoughts/slate-tabbed-table.png)

**Pulse** does a completely different job. It manages recurring reminders and follows up through an Android notification until I mark something done or snooze it. Its runner, credentials, and reminder data stay behind a narrow local and secure-service boundary. Workshop gives Pulse a home and a constrained way to connect. It does not absorb Pulse's reminder logic just because it happens to have a window.

I will write separately about both tools, because each has enough interesting decisions to earn its own post. The short version is that Workshop lets them remain different without making them lonely.

## A product boundary is also a content boundary

Workshop is a small product, but it is built from the same instincts. Name the job. Show the boundary. Be honest about what the thing does today. Make the setup legible. Keep the private parts private. Give people a way to verify the claims instead of asking them to admire the vocabulary.

That is product work. It is also technical marketing.

The launch story is not “look, I made an app.” Plenty of people can make an app. The useful question is whether you can take a messy, real constraint and turn it into a system that is coherent enough to explain, test, document, and evolve without turning into a garbage fire.

Workshop is my answer to that question, in code.

## Try Workshop

Workshop is available from source today. If you keep building small tools that deserve more than a forgotten folder and less than an empire, [try Workshop on GitHub](https://github.com/LindsayB610/workshop).

The deeper technical write-up is coming next: the plugin boundary, local data model, narrow native capabilities, release work, and the tests that keep this whole tiny circus from wandering into traffic.
