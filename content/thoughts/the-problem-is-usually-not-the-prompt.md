---
title: "The Problem Is Usually Not the Prompt"
date: 2026-04-21
slug: "the-problem-is-usually-not-the-prompt"
description: "Why messy AI output is often a workflow problem, not a prompting one. Split steps, turn taste into rules, and narrow assignments for better results."
subtitle: "Or: Why messy AI output is often a workflow problem, not a wording problem"
draft: false
social_image: "/images/social/the-problem-is-usually-not-the-prompt-og.png"
---

Spent any time on LinkedIn lately? My ENTIRE feed has been taken over by AI: predictions about the market, advice for using it better, moaning about human review and job stealing, etc. From what I've been exposed to, the advice is always some form of "prompt better," in one of these disguises:
- Choose the right phrases.
- Learn my secret perfect wording.
- Add more context.
- Add less context.
- Tell it to act like a senior engineer, a strategist, a copy chief, a therapist, a war criminal, whatever.
- Just keep fiddling with the prompt until the machine gives you something usable.

Some of that probably works, sometimes.

More often, it doesn't, and you get the same less than ideal or less than useful result. Never spectacularly bad or wrong, which would be more fun, and make it easier to move on to different advice, just like, not as good as you wanted it to be. The kind of not good enough that's going to end up taking more of your time than if you'd just done the job yourself.

For me (important caveat there) what was actually happening so often was that I tried to fix AI output at the prompt layer when the real problem was a step before that, in conceptual land. When the core assignment you've given an AI agent is overloaded or too broad, AI fills in the gaps. It does this confidently. Sometimes elegantly. Also badly.

The biggest improvement I’ve seen in my own work has come from a much less glamorous move: stop asking the model to “do better” and start structuring the work so it has fewer ways to drift.

## Split the step that's doing too much

This is the first thing I look for now.

If a model keeps confusing one thing for another, or just completely missing some of what I asked it to do, I used to react with an all caps "ACTUALLY DO THE THING," or, let's be honest, I cursed. Now, I certainly still do the cursing thing, but I stop myself from repeating the broken input and instead ask myself, "am I pretending this is one job when it's actually two or three?"

This is everywhere once you start looking for it.

You ask AI to "review this and tell me what to do next," which sounds tidy but is actually several jobs stapled together. You ask it to "write a LinkedIn post on X," when what you really need is a thesis, a structure, and two paragraphs that don't sound embalmed. (And maybe some voice guidelines so you stand out from everyone else? Cough cough, you know who you are.) You ask it to "clean this up," when some parts need editing, some parts need decisions or direction, and some parts need to be deleted with extreme prejudice.

One of the clearest versions of this in my own work shows up when I'm building state packets for novel chapters. That's my term for an extremely detailed pre-draft chapter document. They sound like one deliverable, but they're really a bundle: character pressure, world logic, institutional pressure, structural beats, voice guardrails, and the chapter outline itself. Related? Yes. One job? Absolutely not.

When I treated packet-building like one giant assignment, the results ended up muddy at best. The model would flatten distinctions, miss pressure from one lane while overdeveloping another, or give me something that looked complete but wasn't actually drafting-ready because it missed or glossed over whole sections. So instead of asking one agent to hold all of the required story context in its silicon head at once, I now split the work. I use focused subagents to gather different parts of the problem separately, then bring that back together in the final packet.

That's the part that mattered. Not the novelty of subagents. The separation of focus.

Character logic, world logic, structure, and voice are different kinds of thinking. Once I stopped collapsing them into one pass, the outputs got sharper because each part of the system had a narrower job.

You can translate this fix into some generic guidance that I now apply to so many tasks:
- Name the stages.
- Give each stage one job.
- Define what changes at each stage.
- Stop implying that step one automatically settles what belongs to step two.

The thing no one says enough is that AI often benefits from the same kind of product thinking, content design, and systems design that helps humans. If a workflow is conceptually muddy, the model can't rescue you with raw intelligence. It usually just hides the mess under smoother language.

## Turn taste into rules

This is the second big one, and honestly the one I found most useful as a writer.

A lot of people working with AI are carrying around real, valid editorial instincts that are completely unusable in their current form. They know when something feels off. Flat. Repetitive. Generic. A little dead behind the eyes.

That instinct is valuable.

But "make this less flat" isn't actually an instruction. It's a diagnosis at best, a complaint at worst.

The model can't do much with either, so you end up in an exhausting loop where you keep re-editing the same category of problem and calling it collaboration. And cursing. Did I mention that I do a lot of cursing at the agents?

The move that actually helps is translating taste into procedure.

Not:
- make it stronger
- make it sharper
- make it sound more "like me" / "human" / "natural"

But:
- if the writing feels repetitive, check whether the verb is weak before changing the whole sentence shape
- if the description feels bland, make sure the detail is concrete and informative
- if the output feels generic, ask whether it's naming an idea without showing how it behaves in real life

If you keep telling the model to "make this more insightful," that isn't guidance. That's you standing over its shoulder making a vague disappointed face. Better guidance is something like: cut the summary, name the tradeoff, and add one concrete example that proves the point.

I learned this most clearly while building out drafting and line-edit workflows for fiction. "Write this better" is useless. "Make it sing" is useless. "Less flat" is slightly more honest, but still useless. Things only started getting reliably better when I turned the feedback I kept giving into explicit rules the agent could actually follow.

That meant getting specific about failure modes. If the prose started sounding repetitive, check whether the verbs were weak before trying fancy sentence variation. If the scene felt dead, look for missing action chains, not just prettier language. If a chapter kept drifting into summary, force the draft back through dialogue, blocking, and concrete movement. If continuity kept breaking, make the agent reread the live manuscript segment before drafting the next one.

The model knowing a lot isn't the same as the model having operational instructions. There's a big difference between "here are all the relevant docs" and "before you draft, run this check; while you draft, use these heuristics; after you draft, verify against these failure patterns." One gives the model information. The other gives it a job.

That shift is huge.

Once you turn a fuzzy standard into a repeatable rule, you stop solving the same problem from scratch every time.

This is also the part that makes me laugh a little when people say non-technical folks are bad at using AI. A lot of non-technical people are actually very good at this once they realize what they're doing. They already know how to sense quality. They just need to externalize that judgment in a way the system can follow.

That's not "learning to code." That's operationalizing taste.

Very different skill. Still incredibly useful.

## Narrow the assignment until success is obvious

This one is less sexy than AI discourse would prefer. When AI output disappoints us, the instinct is often to give it more room. More context. More freedom. More space to think. More opportunity to be creative.

Broad assignments invite three things that make the output less useful:
- filler
- fake coherence
- work that technically relates to the task while quietly avoiding its main job

So now, when something keeps coming back mushy, I shrink the assignment. Not just because smaller is cleaner, but because it's easier to judge.

Is this draft supposed to explain a concept? Name a distinction? Make a case? Produce something usable? Give me language I can react to?

Questions like these have saved me from a lot of fake progress.

Because "write the chapter" isn't a real unit of work. Neither is "build the system." Neither is "figure out the strategy." Those are umbrella tasks. They sound specific because they're grammatically complete. They're not specific because they hide all the decisions inside.

This is also why I started moving some drafting and review work into chunks of around fifty lines at a time. Fifty isn't some sacred number. It's just the chunk size I figured out the AI could reliably handle through a lot of trial, error, and cursing. At that size, it can complete a specific prose job, and I can review and line edit without getting dragged into a massive back-and-forth about what it was trying to do.

When I let an agent draft a huge section, like a whole chapter, in one shot, there was a lot of room for drift. It would change tone, flatten pacing, lose continuity entirely, start repeating itself, or make one bad assumption and build a whole neat little paragraph city on top of it. And because the prose sometimes still read smoothly, I didn't always catch the problem right away. I'd just know something had gone off the rails.

Fifty-ish lines changed the game. I can review the chunk, reorient the agent, correct the assumption, tighten the tone, and move on before the drift has time to become expensive. It turned the process from one-shot generation into steering.

Once that became my standard workflow, the output improved materially.

If your current workflow is "write the post," "draft the strategy," or "build the system," that may be the problem right there.

That's not prompting, that's thoughts and prayers.

## What this adds up to

If you want one simple rule to try this week, here it is: When AI gives you a messy answer, don't immediately rewrite the prompt.

Pause and ask:
1. Is this task trying to do too many things at once?
2. Am I giving feedback as taste when I need to give it as a rule?
3. Is the assignment too broad to succeed cleanly?

If the answer to any of those is yes, redesign the job first, then prompt again.

What all of this adds up to, at least for me, is that the highest-value work usually isn't writing one magical prompt. It's building an environment where the model has better odds of succeeding.

That can mean clearer definitions, named stages, explicit rules, narrower tasks, examples that reveal what good looks like, and stop points where a human has to make the next call.

None of this is especially flashy. It just works.

And the nice part is that it's available to a much broader set of people than the AI discourse sometimes suggests. You don't need to become a full-time engineer to get dramatically better results from AI. You do need to notice where ambiguity is costing you time. You do need to stop being impressed by motion. And you probably need to get a little less romantic about prompting.

That's the thing I keep coming back to. The better I get at shaping the work, the less I need the AI to be brilliant. I just need it to stop freelancing on the parts I never meant to hand over in the first place.
