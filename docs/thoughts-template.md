# Thoughts Template and Guidelines

This document provides a complete template and guidelines for creating thought leadership content files.

## File Naming

- **Format for drafts:** `draft-{name}.md`
- **Format for published:** `{name}.md` (no `draft-` prefix)
- **Location:** `content/thoughts/`
- **Examples:** 
  - Draft: `draft-practical-way-to-think-about-aeo.md`
  - Published: `convo_vs_broadcast.md` or `category-creation-calling-shot.md`
- **Rules:**
  - Use `draft-` prefix only for draft thoughts posts (not recipes)
  - Use lowercase letters, hyphens, or underscores
  - Be descriptive but concise
  - The `slug` field in front matter determines the URL, so "draft" won't appear in production URLs

## Front Matter Template

```yaml
---
title: "Your Thought Title"
date: YYYY-MM-DD
slug: "your-thought-slug"
description: "A compelling description for SEO and listings"
subtitle: "Or: Brief subtitle or alternative description"
draft: false
social_image: "/images/social/your-thought-og.png"
---
```

## Front Matter Field Definitions

### Required Fields

- **`title`** (string): The main post title
  - Use title case
  - Be descriptive and specific
  
- **`date`** (string): Publication date in `YYYY-MM-DD` format
  - Used for sorting and permalink generation
  - Use future dates with `draft: true` for scheduling

- **`slug`** (string): URL-friendly identifier
  - Format: `"your-thought-slug"` (no `draft-` prefix)
  - Should match desired URL (filename prefix doesn't affect URL)
  - Examples: `"practical-way-to-think-about-aeo"`, `"developer-content-conversation-not-broadcast"`

- **`subtitle`** (string): Brief subtitle or description
  - Often uses "Or: ..." format for alternative description
  - Appears on homepage and in listings

- **`description`** (string): SEO and listing description
  - Compelling, descriptive summary
  - Used in meta tags and RSS feeds

- **`draft`** (boolean): Publication status
  - `true`: Hidden from production, visible in dev mode
  - `false`: Published and visible
  - Set to `true` with future dates for scheduling

### Optional Fields

- **`social_image`** or **`og_image`** (string): Path to Open Graph image
  - Format: `"/images/social/your-thought-og.png"`
  - **Recommended for published posts** (for better social sharing)
  - Created manually (unlike recipes, which have automated generation)
  - Place image file in `static/images/social/` directory
  - Reference with leading slash: `"/images/social/..."`

## Content Structure

After the front matter, thoughts posts follow a flexible structure:

```markdown
---
[front matter]
---

[Opening paragraph(s) - introduces the topic and main idea]

## First Major Section

[Section content - use headers to organize your thoughts]

### Subsection (if needed)

[More detailed content under subsections]

## Second Major Section

[Continue building your argument or narrative]

## Conclusion Section (optional)

[Wrap up with key takeaways or calls to action]
```

**Key principles:**
- No rigid structure required (unlike recipes)
- Use headers (##, ###) to organize content logically
- Lead with value - get to the point quickly
- Structure should serve the argument, not constrain it

## Content Guidelines

### Opening

- Start strong - capture attention immediately
- Avoid lengthy preamble - developers (and readers) have zero patience
- Sometimes repeat or echo the subtitle for emphasis
- Set up the core problem or insight right away

### Sections and Headers

- Use H2 (`##`) for major sections
- Use H3 (`###`) for subsections within major sections
- Headers should be scannable and descriptive
- Each section should advance the argument or narrative

### Writing Style

**Follow guidelines in [`CONTENT_STYLE_GUIDE.md`](../CONTENT_STYLE_GUIDE.md):**

- **Tone:** Wry, plainspoken, pragmatic
- **Voice:** Write for builders and practitioners as peers
- **Lead with lived experience,** not abstractions
- **Avoid corporate/LinkedIn sludge**

**Formatting rules:**
- ❌ **Absolutely no em dashes** (use parentheses, commas, or break sentences)
- ✅ **Title case for H1s** (handled by front matter `title`)
- ✅ **Sentence case for all other headers** (H2, H3, etc.)
- ✅ Use bullet points when listing items
- ✅ Use blockquotes for emphasis or key quotes
- ✅ Use links naturally in context

### Header Formatting

- **H1:** Title case (handled by front matter `title`)
- **H2:** Sentence case (`## First major section`)
- **H3:** Sentence case (`### Subsection details`)

## Formatting Rules

### Links

- Use descriptive link text, not "click here"
- Links should read naturally in context
- Example: `Tools like [Ahrefs](https://ahrefs.com/) or even plain SERP analysis...`

### Emphasis

- Use `*italics*` for emphasis or to distinguish concepts
- Use `**bold**` sparingly (usually in headers or step titles)
- Use blockquotes (`>`) for key insights or memorable quotes

### Lists

- Use dash bullets (`-`) for unordered lists
- Use numbered lists (`1.`) when order matters or for steps
- Keep list items parallel in structure
- Can use sub-bullets with indentation if needed

### Code and Technical Content

- Use inline code with backticks: `` `code` ``
- Use code blocks (triple backticks) for multi-line examples
- Specify language for syntax highlighting if needed

## Permalink Structure

Thoughts posts use the pattern: `/thoughts/:year-:month-:day/:slug/`

Example: `draft-practical-way-to-think-about-aeo.md` with slug `"practical-way-to-think-about-aeo"` and date `2025-01-15` becomes:
`/thoughts/2025-01-15/practical-way-to-think-about-aeo/`

**Important:** The `slug` field determines the URL, not the filename. Using `draft-` prefix in filename won't appear in production URLs.

## OG Image Workflow

**OG images for thoughts posts are created manually** (unlike recipes which have automated generation):

1. Create OG image using your preferred design tool
   - Standard OG image size: 2400×1260px
   - Match brand colors and styling from `BRAND.md`
   - Place in `static/images/social/` directory

2. Name the file descriptively:
   - Example: `practical-way-to-think-about-aeo-og.png`
   - Or match existing patterns like `convo-vs-broadcast-og.png`

3. Add to front matter:
   ```yaml
   social_image: "/images/social/practical-way-to-think-about-aeo-og.png"
   ```

4. Use leading slash in path (`/images/social/...`)

**Why manual?** Thoughts posts often need custom, conceptual imagery that reflects the specific content, unlike recipes which follow a consistent visual template.

## Scheduling Thoughts Posts

To schedule a thought post for future publication:

1. Set `draft: true` and a future `date` in front matter
2. GitHub Actions workflow runs twice daily (at 13:00 and 14:00 UTC) to cover both PDT and PST timezones
3. When a post's date arrives (or has passed), it automatically sets `draft: false` and commits the change
4. Netlify rebuilds the site on commit, and your post goes live
5. Test locally: `npm run schedule-posts` to see what would be published

**Note:** OG images are optional for thoughts posts, but recommended for better social sharing.

## Complete Examples

### Example 1: Structured Thought Piece

```markdown
---
title: "A Practical Way to Think About AEO"
slug: "practical-way-to-think-about-aeo"
description: "Stop writing for keywords. Start writing for confused humans. A practical framework for AEO that focuses on judgment over mechanics."
subtitle: "Or: Stop Writing for Keywords. Start Writing for Confused Humans."
draft: true
---

AEO is having a moment, which means two things are now true. It matters, and we are about to drown in content that confidently explains it while quietly missing the point.

Most explanations start with mechanics. Answer engines do this. Search is changing. Optimize for answers, not keywords. Then they hand you a checklist and call it strategy.

Here's the actual problem. Search told us what people typed. Answer engines try to infer what people *mean*. Most content teams are still writing for the first thing while telling themselves they are doing the second.

## The Mental Model I Keep Coming Back To

I think about AEO as three stacked layers, but the important part is what *changes* as you move up them.

At the bottom is explicit demand. This is what people know how to ask for. Keywords, volumes, SERP structure, FAQs, the visible shape of curiosity.

## Start by Defining What You Actually Care About

Before you think about posts, define a small number of topic buckets that reflect how you think about your work.

Not SEO categories. Not funnel stages. Not the shape of your website navigation.

## The Thing No One Likes Hearing

AEO is not about writing in a way that AI can summarize.

AEO is about being the person whose answers deserve to be summarized.
```

### Example 2: With Subtitle Echo

```markdown
---
title: "Good Developer Content is a Conversation, Not a Broadcast"
date: 2025-06-14
slug: "developer-content-conversation-not-broadcast"
description: "Why truly great developer content talks with developers, not at them, and how to get it right."
subtitle: "Or: Why developer content that listens is way better than content that just talks"
draft: false
social_image: "/images/social/convo-vs-broadcast-og.png"
---

<!-- Start writing your post below this line --> 
_Or: Why developer content that listens is way better than content that just talks_

I've been doing developer marketing for almost a decade now, and one of the very first things I learned, which still proves itself true every day, is that developers are incredibly smart, and incredibly impatient.

## The Broadcast Trap

So much dev content I read feels like yelling random JavaScript functions into the void and hoping for applause. Spoiler: the void doesn't clap.

Here's why broadcasts tank:

- **They don't read the room:** They're too busy telling you the thing they want to say to notice whether their audience is even paying attention.
- **They're generic:** "Insert your problem here" won't resonate with devs who are knee-deep in actual, messy code.
- **They're time thieves:** Devs have zero patience for preamble. Give 'em the goods immediately.

## How to Make Your Content Actually Conversational

Here's my cheat sheet for conversations that land:

### 1. Start with Actual Problems

Instead of guessing, dive directly into real developer forums, GitHub issues, and Stack Overflow questions to uncover genuine frustrations.

### 2. Keep Context Alive

Maintain continuity by referencing previous articles, clearly indicating what's coming next, or providing follow-up resources.

## Time to Ditch the Megaphone

Treat developers as the smart, skeptical humans they are. Ditch the megaphone, start the conversation, and maybe they'll stop muting your brand.
```

## Testing

After creating or editing a thoughts post:

```bash
npm run build          # Build the site first
npm run test:content   # Run content validation tests
npm run test:spell     # Run spell check (for modified files)
```

Tests validate:
- Front matter structure and required fields
- Date format (YYYY-MM-DD)
- Permalink structure
- Social image existence (for published posts with `social_image` set)

## References

- **`CONTENT_STYLE_GUIDE.md`**: Writing style, tone, and voice guidelines (required reading)
- **`BRAND.md`**: Brand guidelines and design system
- **`README.md`**: Setup, scripts, and general content management
- **`agents.md`**: AI assistant guidelines and project context
