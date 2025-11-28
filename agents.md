# Agent Guidelines for Lindsay Brunner Website

This document provides context for AI assistants working on this Hugo static site project.

## Project Overview

This is a personal website built with **Hugo** (v0.149.2+), deployed on **Netlify**. The site showcases thought leadership content and recipes with a custom dark theme design.

## Critical Protected Elements ⚠️

**NEVER modify these without explicit user permission:**

1. **Hero H1 Gradient** (`layouts/index.html`):
   - Must use `background-size: 80% 100%` (not 100%)
   - Gradient: `linear-gradient(135deg, var(--color-red) 0%, var(--color-pink) 50%, var(--color-yellow) 100%)`
   - Changing this breaks the visual match with the header logo

2. **Typography**:
   - `h1` and `.site-logo` must use `font-family: 'Inter'` (not Space Grotesk)
   - Required for gradient rendering consistency

3. **Button Hover States**:
   - White text must be explicitly maintained for readability
   - Don't change hover text colors on gradient buttons

## Project Structure

```
content/
  ├── thoughts/          # Thought leadership posts
  │   ├── _index.md      # Section index
  │   └── *.md           # Individual posts
  ├── recipes/           # Recipe posts
  │   ├── _index.md      # Section index
  │   └── recipe-*.md    # Individual recipes
  ├── about/
  │   └── index.md       # About page
  └── _index.md          # Homepage content

layouts/
  ├── index.html         # Homepage template
  ├── 404.html          # Error page
  ├── _default/          # Default templates
  ├── thoughts/          # Thoughts section layouts
  ├── recipes/           # Recipes section layouts
  └── partials/          # Reusable components

static/
  ├── css/               # Stylesheets (main.css, custom.css)
  ├── favicons/          # All favicon files
  ├── images/
  │   └── social/        # Open Graph images
  ├── _headers           # Netlify headers
  └── _redirects         # Netlify redirects
```

## Writing Style and Voice

**IMPORTANT:** When creating or editing content, always follow the guidelines in `CONTENT_STYLE_GUIDE.md`. This document defines:

- Tone and voice (wry, plainspoken, pragmatic)
- Sentence structure and rhythm
- Style of argumentation
- Formatting rules (no em dashes, title case H1s, sentence case other headers)
- Content clarity principles
- How to write in Lindsay's voice

**Key rules:**
- ❌ Absolutely no em dashes (use parentheses, commas, or break sentences)
- Title case for H1s, sentence case for all other headers
- Avoid corporate/LinkedIn sludge
- Write for builders and practitioners as peers
- Lead with lived experience, not abstractions

## Content Creation Patterns

### Thoughts Posts

**Required front matter fields:**
- `title` (string)
- `date` (YYYY-MM-DD format)
- `description` (string)
- `subtitle` (string)
- `draft` (true/false)

**Optional fields:**
- `slug` (string)
- `og_image` or `social_image` (path to image in `/images/social/`)

**Permalink pattern:** `/thoughts/:year-:month-:day/:slug`

**Example:**
```yaml
---
title: "My Thought Title"
date: 2025-01-15
description: "A compelling description"
subtitle: "Brief subtitle for homepage"
draft: false
social_image: "/images/social/my-image.png"
---
```

### Recipe Posts

**Required front matter fields:**
- `title`, `date`, `description`, `subtitle`, `draft` (same as thoughts)
- `prepTime` (ISO 8601 duration, e.g., "PT30M")
- `cookTime` (ISO 8601 duration, e.g., "PT45M")
- `totalTime` (ISO 8601 duration, e.g., "PT75M")
- `recipeYield` (string, e.g., "6-8 servings")
- `recipeCategory` (string, e.g., "Main Course")
- `recipeCuisine` (string, e.g., "Japanese-American")
- `recipeIngredient` (array of strings)
- `recipeInstructions` (array of strings)

**Permalink pattern:** `/recipes/:year-:month-:day/:slug`

**File naming:** Use `recipe-` prefix (e.g., `recipe-bachan-pulled-pork.md`)

## Testing

**Always run tests after making changes:**

```bash
npm run build      # Build the site first
npm run test:content  # Run content validation tests
npm test           # Run all tests (HTML, links, content)
```

**Test coverage includes:**
- Front matter validation (thoughts & recipes)
- Social image existence
- Static asset checks (CSS, favicons, default images)
- RSS feed structure
- Sitemap validation
- Homepage content structure
- About page validation
- 404 page validation
- Permalink structure

## Configuration Details

**Key config settings (`config.toml`):**
- Site title: "LB"
- Base URL: `https://lindsaybrunner.com`
- Markup: `unsafe = true` (allows raw HTML in content)
- Default social image: `/images/social/default-og.png`
- Recent posts number: 4

**Permalink patterns:**
- Thoughts: `/thoughts/:year-:month-:day/:slug`
- Recipes: `/recipes/:year-:month-:day/:slug`

## Brand Guidelines

See `BRAND.md` for complete brand guidelines. Key points:

**Colors:**
- Gradient: Red (#ff0037) → Pink (#ff1b8d) → Yellow (#ffdd00)
- Primary brand: Pink (#ff1b8d)
- Dark theme: Black background (#000000) with dark surfaces (#0f0f0f)

**Typography:**
- Primary: Space Grotesk (body, navigation, headers h2-h6)
- Protected: Inter (h1 and logo only)
- Mono: SF Mono / system monospace

## Common Tasks

### Adding a New Thought Post

1. Create file in `content/thoughts/` (lowercase, hyphens)
2. Add required front matter (see above)
3. Optionally add social image to `static/images/social/`
4. Reference image in front matter: `social_image: "/images/social/my-image.png"`
5. Run `npm run build && npm run test:content`

**To schedule for future publication:**
- Set `draft: true` and a future `date` in front matter
- The GitHub Actions workflow will automatically publish when the date arrives
- Test locally with `npm run schedule-posts` to see what would be published

### Adding a New Recipe

1. Create file `content/recipes/recipe-*.md`
2. Add all required front matter fields (see above)
3. Use ISO 8601 duration format for times (PT30M = 30 minutes)
4. Arrays for ingredients/instructions must be YAML arrays
5. Run `npm run build && npm run test:content`

**To schedule for future publication:**
- Set `draft: true` and a future `date` in front matter
- **Important**: Scheduled recipes must have `social_image` set before the publish date, or they will be skipped
- The GitHub Actions workflow will automatically publish when the date arrives
- Test locally with `npm run schedule-posts` to see what would be published

### Modifying Styles

- Main styles: `static/css/main.css`
- Custom overrides: `static/css/custom.css`
- Use CSS custom properties from brand system
- Test responsive breakpoints: 768px, 480px

### Updating Homepage

- Edit `content/_index.md` for content
- Edit `layouts/index.html` for structure
- Recent Thoughts section shows 3 most recent (or placeholders if < 3)

## Important Notes

- **Drafts**: Set `draft: true` to hide from production
- **Dates**: Use YYYY-MM-DD format (Hugo sorts by date)
- **Social Images**: Place in `static/images/social/`, reference with leading slash
- **Raw HTML**: Allowed in content (config has `unsafe = true`)
- **Build**: Always run `npm run build` before testing
- **Deployment**: Automatic via Netlify on push to master
- **Scheduled Posts**: Posts with `draft: true` and future dates will auto-publish via GitHub Actions (runs hourly). See README.md for details.

## References

- **README.md**: Setup, scripts, content management guide, scheduling posts
- **BRAND.md**: Complete brand guidelines and protected elements
- **CONTENT_STYLE_GUIDE.md**: Writing principles, tone, voice, and style guidelines
- **config.toml**: Hugo configuration
- **tests/content-checks.js**: Test validation logic
- **scripts/schedule-posts.js**: Auto-publish scheduled posts script
- **.github/workflows/schedule-posts.yml**: GitHub Actions workflow for scheduled publishing

## When in Doubt

1. Check existing content files for patterns
2. Run tests to verify changes
3. Check BRAND.md for design constraints
4. Check CONTENT_STYLE_GUIDE.md for writing style and voice guidelines
5. Preserve existing conventions unless explicitly asked to change them

