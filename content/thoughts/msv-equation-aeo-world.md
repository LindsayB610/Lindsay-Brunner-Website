---
title: "The MSV Equation in an AEO World"
date: 2025-11-15
slug: "msv-equation-aeo-world"
description: "Why your 'big keyword' spreadsheet is quietly lying to you in an AI-driven search world, and how to fix your content strategy equation."
subtitle: "Or: Why your 'big keyword' spreadsheet is quietly lying to you"
draft: false
og_image: "/images/social/default-og.png"
---

The MSV Equation in an AEO World

Or: why your "big keyword" spreadsheet is quietly lying to you



I run content at Builder.io. Before that, I ran DevRel teams. I live in the overlap between "we need pipeline" and "developers hate marketing."



From that seat, here is the situation.



The classic "find a juicy keyword, write a post, win intent" playbook still looks great in your spreadsheet and quietly falls apart in reality.



Monthly search volume used to be a rough but workable proxy for opportunity. If ten thousand people typed something into Google every month and you could get onto page one, odds were decent you would see traffic, leads, some path to revenue you could wave around in a QBR.



Now you are in a search environment where Google often shows an AI written summary at the top, and users simply stop clicking the links underneath. When an AI summary appears, people click a normal result only about 8 percent of the time, compared to 15 percent when there is no summary, according to Pew Research Center. For informational queries that trigger AI Overviews, organic click through rates have fallen by roughly 60 percent, and paid click through is hit even harder, based on large scale analysis from Seer Interactive that was summarized by Search Engine Land.



So MSV has not really changed. The behavior sitting on top of that MSV has.



If you are responsible for content marketing in a devtool or B2B product led company, that hurts more than average. The content that actually moves the needle is the unglamorous stuff: long tail searches, edge case examples, "how do I get this to work in our cursed CI pipeline" guides. Developer focused PLG folks like Draft.dev and their piece on product led growth for developer tools companies have been saying this for a while. You can feel it in your own analytics.



The new twist is simple. The "high MSV, high intent, realistic to rank" overlap shrank. The math you are using to decide what to ship on your content calendar did not keep up.



Time to fix the equation.



How search broke, quietly



This did not show up as one dramatic "SEO is dead" moment. It showed up as a slow accumulation of annoying facts.



First, AI summaries started appearing more often in search results. Then AI Overviews rolled out and expanded. After that, traffic reports began to show the same pattern. When an AI summary appears on the page, users click through to a traditional result roughly half as often as they do on a normal page. Pew's browser based study puts it at 8 percent versus 15 percent.



Seer Interactive then looked at a lot of data and saw that, on informational queries where AI Overviews show, organic click through dropped around 60 percent and paid click through was down almost 70 percent. Search Engine Land and others dug into this and landed on a blunt conclusion: AI Overviews soak up attention that used to go to links.



News and media sites feel it most aggressively. Some publishers report traffic drops of 50 to 80 percent on queries now dominated by AI summaries, even when they still hold the top organic slot. The box at the top of the page simply intercepts users before they get to the links.



So when your keyword tool says "this keyword has 20,000 searches," what it really means is "this keyword has 20,000 interactions with a page that may or may not allow meaningful clicks any more."



MSV stayed the same. The funnel under it got squeezed.



What the old MSV equation assumed



Here is the mental model most content and SEO teams have been running, whether we wrote it down or not:



Opportunity ≈ MSV × intent × our chance to rank



MSV told you how many humans raised a hand in search.

Intent told you how close that hand was to revenue.

"Chance to rank" was the lever you could pull with content, links, distribution, and time.



If you are marketing to developers, this equation always had two layers.



On one side you had head terms like "feature flags", "api gateway", "kubernetes security best practices". Nice MSV, big competition, very mixed intent. Some people are researching. Some are bored. Some are vaguely shopping.



On the other side you had the long tail goblins.

"$YOUR_TOOL github actions example".

"Migrate from Jenkins to $YOUR_TOOL".

"Fix 429 throttling in $SPECIFIC_SDK with $YOUR_TOOL".



This second group almost never shows up as "interesting" in a keyword tool. Ten searches here. Fifty there. Enough to be real, not enough to impress your VP when you screenshot the MSV column.



And yet, if you actually look at which pages led to "user did something meaningful in the product," it is always this layer. Docs, integration guides, and gnarly "how to make this work in your real life setup" content are what turn curiosity into usage in a product led motion. That is the core of Draft.dev's argument in their PLG for devtools piece and most decent devtool case studies.



So even before AI summaries, the truly high intent side of the equation was already living in low MSV land.



Generative answers just made it impossible to pretend otherwise.



Why high MSV plus high intent got rare



The quadrant everybody built decks around was simple.



Big keyword.

Clear commercial intent.

Decent odds of ranking.



Two structural shifts undercut that.



First, the obvious head terms got eaten.



Generic instructional queries like "what is feature flagging", "api observability", or "what is vector search" are exactly the ones AI Overviews want to summarize. They are high volume, informational, and not owned by any one vendor. Perfect candidates for a neat AI box that explains the concept and sprinkles in a few sources.



Once the AI box shows up, your ranking is no longer the main event. You can hold position three forever and still watch traffic shrink, simply because fewer people scroll and click. The Seer data and the follow up from Search Engine Land make that pretty clear for AI Overview queries.



Second, developer intent was already skewed toward the long tail.



Your best users are usually not typing "feature flags" into Google. They are typing some nightmare sentence like "feature flags canary deploy with GitHub Actions monorepo" and then clicking from GitHub, Stack Overflow, docs, Reddit, or a Slack link someone dropped.



As a marketer, you see this when you look at multi touch attribution and actual user journeys. The glossy "what is X" post might get more top of funnel traffic, but the money tends to show up on the unsexy "how to do this exact thing in your stack" content.



Put those two together and the overlap between "high MSV" and "high intent" gets small and fragile. It is now mostly made of category level queries and review style searches where AI Overviews and generative engines choose a handful of default brands to recommend.



If you are not already one of the defaults in the model's head, building your whole content strategy around that overlap starts to look like denial.



The actual problem: MSV is only measuring human search



Here is the core mismatch for content marketers.



MSV counts the number of times humans type a query into classic search engines. That is all it knows. It does not count:



Questions typed into ChatGPT, Gemini, Claude, or Perplexity.

Questions routed through Google's AI Overview layer.

Prompts sent to Copilot inside an IDE.

Questions asked of internal AI assistants that index your docs and your changelog.



Those are all search behaviors. They just do not look like the old "three keywords in a box, ten blue links" pattern your tools were built around.



Work on generative engine optimization treats these engines as a separate retrieval layer. Same open web as raw material. Very different UX. Users phrase things like they are talking to a colleague. The model synthesizes an answer, then chooses a short list of brands and URLs to represent reality.



The a16z piece on GEO describes this as a shift from rankings to "model relevance." The HubSpot explainer on GEO talks about optimizing to be cited and synthesized by AI systems like ChatGPT, Perplexity, and Google AI Overviews, not just to show up in the standard result set.



MSV has no opinion on any of that.



It tells you how loud a problem is in traditional search logs. It does not tell you how often that problem shows up in AI prompts, or whether the models that answer those prompts have ever heard of your brand.



So when your keyword tool reports "zero to ten searches" and tells you not to bother, what it really means is "we saw very little traffic for this phrase in the old interface." It says nothing about AI behavior that could still drive people toward your docs, your repo, or your product.



That blind spot is what makes the old MSV equation feel wrong in your gut.



Rewriting the MSV equation



Here is the version that actually matches the world we are in now:



Content value ≈ (human demand + AI demand) × intent × model recall



Human demand is what you already know. That is MSV plus the traffic and conversions you can see in analytics and search console.



AI demand is the part you infer. It is the shape of questions you see in sales calls, customer emails, support tickets, community channels, and your own assistant logs. It is also what you see when you use AI tools like your prospects do and notice the kinds of prompts that naturally come up.



Intent is still intent. "What is feature flagging" is far colder than "$YOUR_TOOL vs $COMPETITOR" or "migrate from $COMPETITOR to $YOUR_TOOL", no matter how impressive the MSV on the first phrase looks.



Model recall is the new multiplier content marketers have to care about. It is the probability that, when someone asks a relevant question to an AI system, that system mentions your brand or cites your content.



GEO tools are starting to measure this as "share of answers" across engines like ChatGPT, Gemini, and Perplexity. AEO work looks at how often your content is used and cited in answer features like Google AI Overviews. The details will keep shifting, but the axis is real. Being remembered by the model is now a separate job from being ranked by the search engine interface.



In the old equation, we quietly treated model recall as a constant equal to one. We assumed the same basic discovery rules applied to everyone. In 2025, that is a nice fantasy, not a planning assumption.



The two bucket content portfolio



Once you accept that equation, your content plan stops being one long backlog and starts looking more like a portfolio. You are really managing two buckets of work that behave very differently in the funnel and in AI systems.



Bucket 1: high surface area, AEO friendly



Bucket one is all the content that teaches the category.



Think conceptual explainers, "what is X" posts, mental models, best practices, strategy pieces. The sort of thing a staff engineer, PM, or architect might paste into a team channel with "this is a decent overview" and a shrug.



This bucket usually targets higher level topics. It often sits early in the buyer journey. It is also the content that answer engines want to eat, because it cleanly explains "what is going on here" without being overly vendor specific.



Most AEO and GEO guides give the same practical advice for this tier. Make the page easy to parse. Put a direct answer somewhere near the top. Use clear headings and subquestions. Avoid fluff that pads word count but adds nothing. You are not trying to trick the model. You are trying not to make it work harder than necessary to quote you.



For a content marketer, the job of bucket one is not "drive 100 signups per post." It is "define the story of the category in a way that is technically correct, easy to reference, and strongly associated with our brand."



You want humans to actually learn something. You want other sites to link to it. You want AI systems to feel safe treating it as a reference when they explain the space.



This is less about landing pages. More about writing the script everyone else, including the models, will unconsciously borrow from.



Bucket 2: low MSV, high intent, product adjacent



Bucket two is where your adoption numbers live.



Docs. Integration guides. Migration notes. Deep dives that start from a realistic environment and end with "this is now working in production." "$YOUR_TOOL vs $COMPETITOR" pages that do not read like a parody of themselves.



In devtool PLG, these assets are not support content. They are sales and success wrapped into one. The Draft.dev essay on PLG for devtools and a lot of PLG case studies basically come down to this: the faster someone can go from pain to working solution inside your product, the more likely they are to stick and expand.



Bucket two content has three important traits for a marketer.



The queries attached to it look tiny in MSV tools.

The people who find it are often ridiculously qualified.

It is pure gold as training data for AI systems, both inside and outside your product.



Your own in product assistant will index it. Copilot style tools that sit over your docs and repo will lean on it. If your docs are public, external engines will crawl and reuse this content whenever someone asks "how do I do X with $YOUR_TOOL".



If bucket one defines the narrative of the category, bucket two defines what it feels like to live in your product day to day.



How you actually measure any of this



This is the part where marketing teams either freeze up or go hunting for a magic GEO dashboard.



You do not need perfect attribution. You need enough signal to avoid steering by vibes.



For bucket two, stay very close to product metrics.



Track how many signups, PQLs, opportunities, and expansions originate on docs, integration guides, and comparison pages. Look at how long it takes someone to hit a meaningful "this user did something real in the product" event after landing on those assets. Treat "this doc unblocked a real workflow" as a growth win, not as a cost of doing business.



Most product led growth stories are basically "we made it stupidly easy to get to value, and then good things happened." You are instrumenting that path.



For bucket one, shift from rank to recall.



Rankings and organic traffic still matter. They are just not the whole story.



Layer on some sanity checks. Use monitoring tools or just your own curiosity to see whether you show up when you ask AI systems the questions your users ask. Watch how often your brand appears when you or a tool query ChatGPT, Gemini, or Perplexity about your category. Keep an eye on whether that trend moves over time.



Also, pay attention to new referrers. Some publishers are already seeing small but real traffic coming directly from AI products as Google organic shrinks. It will not save anyone on its own. It is a hint that "search traffic" is changing shape rather than disappearing.



The point is not to build the perfect GEO reporting stack this quarter. The point is to stop pretending that "MSV times historical CTR equals opportunity," in a world where the interface absorbing that traffic is a constantly shifting answer box.



Where this might be wrong



A few caveats worth saying out loud so this does not turn into a religion.



There are still high MSV, high intent keywords that matter. Searches like "best feature flag tools" or "open source api gateway" are lively. If you can become one of the handful of brands that answer engines and review sites default to, it is absolutely worth investing in that.



Not every market is equally AI heavy yet. Some industries are slow adopters. Some regions are slower to get AI Overviews. Some personas are skeptical about assistants. In those pockets, MSV will remain more trustworthy for longer.



And there is a real risk in overfitting to the AI. If you start writing like you are optimizing for a parser instead of a person, you might see a temporary bump, but the floor under you will be made of sand. Most sensible AEO and GEO advice still comes back to one base rule: helpful, accurate, structured content that humans trust is the thing that survives ranking changes.



If the senior engineer, PM, or VP you care about reads your post and rolls their eyes, the model will eventually learn to roll its eyes too.



What to actually do with all of this



If you run content, demand gen, or DevRel at a devtool or product led company, here is the practical translation.



Treat MSV as one dial on the console, not the steering wheel. It tells you how loud something is in old style search. It does not tell you how valuable it is, and it does not tell you how visible you are inside generative answers.



Split your content portfolio into the two buckets on purpose. Bucket one is high surface, AEO friendly, category defining work that shapes how humans and models explain the space. Bucket two is low MSV, high intent, product adjacent work that actually gets people shipping.



Wire bucket two straight into product metrics and revenue. Wire bucket one into a mix of brand, links, and model recall, instead of pretending it will all show up as clean organic sessions in a dashboard.



The "big keyword" spreadsheet is not useless. It is just not a compass any more.



It is a rumor. Treat it like one.

