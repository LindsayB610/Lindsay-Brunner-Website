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

**📋 For complete thoughts guidelines, see [`docs/thoughts-template.md`](./docs/thoughts-template.md)**

The template includes:
- Complete front matter template with all required and optional fields
- Content structure guidelines (flexible, unlike recipes)
- Formatting rules (headers, links, emphasis, etc.)
- OG image workflow (manual creation)
- Scheduling instructions
- Complete examples

**Quick reference:**

**Required front matter fields:**
- `title` (string)
- `date` (YYYY-MM-DD format)
- `description` (string)
- `subtitle` (string)
- `draft` (true/false)

**Optional fields:**
- `slug` (string)
- `og_image` or `social_image` (path to image in `/images/social/`)

**Permalink pattern:** `/thoughts/:year-:month-:day/:slug/`

**File naming for drafts:**
- Prefix draft thoughts files with `draft-` for easy identification (e.g., `draft-my-post.md`)
- The `slug` field in front matter determines the URL, so "draft" won't appear in production URLs
- This naming convention only applies to thoughts posts, not recipes

**Example:**
```yaml
---
title: "My Thought Title"
date: 2025-01-15
description: "A compelling description"
subtitle: "Brief subtitle for homepage"
draft: false
slug: "my-thought-title"  # This determines the URL, not the filename
social_image: "/images/social/my-image.png"
---
```

### Recipe Posts

**📋 For complete recipe guidelines, see [`docs/recipe-template.md`](./docs/recipe-template.md)**

The template includes:
- Complete front matter template with all required and optional fields
- Content structure guidelines (snapshot, ingredients, method, notes)
- Formatting rules (temperatures, measurements, section separators)
- OG image workflow
- Scheduling instructions
- Complete examples

**Quick reference:**

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

**Permalink pattern:** `/recipes/:year-:month-:day/:slug/`

**File naming:** Use `recipe-` prefix (e.g., `recipe-bachan-pulled-pork.md`)

**Section separators:** Use `---` (three dashes) as horizontal rules to separate major sections within recipe content. Do not use `⸻` (triple em dash) or other separator characters.

**Temperature formatting:**
- Always use degree symbols: `°F` and `°C`
- Standard format: `200°F (93°C)` (Fahrenheit first, Celsius in parentheses)
- For ranges: `160–165°F (71–74°C)`
- Do not use slash format (`350°F / 175°C`) — use parentheses instead

**Volume and measurement formatting:**
- **Always capitalize abbreviations:** `Tbsp`, `Tsp`, `Cup`, `Cups` (not `tbsp`, `tsp`, `cup`, `cups`)
- **Acceptable abbreviations:**
  - `Tbsp` / `Tbsp` (tablespoon) — always abbreviate
  - `Tsp` / `Tsp` (teaspoon) — always abbreviate
  - `cup` / `cups` — can abbreviate in lists, spell out in narrative text
  - `oz` (ounce) — always abbreviate
  - `lb` (pound) — always abbreviate
  - `g` (gram) — always abbreviate
  - `ml` (milliliter) — always abbreviate
  - `in` (inch) — can abbreviate in measurements like `1½-inch chunks`
- **Always spell out:**
  - `minutes` / `minute` (not `min`)
  - `hours` / `hour` (not `hr`)
  - `seconds` / `second` (not `sec`)
- **Metric conversions:** Optional but helpful. Include when it adds clarity: `1 cup (240 ml)`, `2 Tbsp (30 g)`
- **Fractions:** Use Unicode fractions when available: `½`, `⅓`, `¼`, `¾`; otherwise use `1/2`, `1/3`, etc.

## Testing

**Always run tests after making changes:**

```bash
npm run build      # Build the site first
npm run test:content  # Run content validation tests
npm test           # Run all tests (HTML, links, content, spell check, OG images, scheduling, search JSON, recipe template)
```

**Available test commands:**
- `npm run test:content` - Content validation tests
- `npm run test:html` - HTML validation
- `npm run test:links` - Broken link detection (starts dev server, waits for ready, runs check, stops server)
- `npm run test:spell` - Spell check modified content files (git diff)
- `npm run test:spell:all` - Spell check all content files
- `npm run test:og-images` - OG image generation validation
- `npm run test:schedule` - Scheduled posts workflow validation
- `npm run test:search-json` - Recipe search JSON index validation
- `npm run test:recipe-template` - Recipe template structure validation
- `npm test` - Run all tests (includes pretest build step)

**Test coverage includes:**
- Front matter validation (thoughts & recipes)
- No duplicate recipe page content (identical body in multiple files)
- Social image existence
- Static asset checks (CSS, favicons, default images)
- RSS feed structure
- Sitemap validation
- Homepage content structure
- About page validation
- 404 page validation
- Permalink structure
- Spell checking (content files)
- OG image generation and structure
- Scheduled posts workflow
- Recipe search JSON index structure and validity
- Recipe template compliance
- Recipe print functionality (print buttons, stylesheet, email links)

## Configuration Details

**Key config settings (`config.toml`):**
- Site title: "LB"
- Base URL: `https://lindsaybrunner.com`
- Markup: `unsafe = true` (allows raw HTML in content)
- Default social image: `/images/social/default-og.png`
- Recent posts number: 4

**Permalink patterns:**
- Thoughts: `/thoughts/:year-:month-:day/:slug/`
- Recipes: `/recipes/:year-:month-:day/:slug/`

**Output formats:**
- HTML (default)
- RSS feed (`/index.xml`)
- RecipeSearch JSON (`/recipes/index.json`) - JSON index for recipe search functionality

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
   - For drafts, use `draft-` prefix: `draft-my-post.md` (helps with organization)
   - The `slug` field in front matter determines the URL, so "draft" won't appear in production URLs
2. Use the complete template from `docs/thoughts-template.md`
3. Add required front matter (see template for complete details)
4. Optionally create and add social image to `static/images/social/` (manual creation, unlike recipes)
5. Reference image in front matter: `social_image: "/images/social/my-image.png"`
6. **For diagram images in thoughts posts**: If adding PNG diagram images (e.g., flowcharts, system diagrams) to thoughts post content, place them in `static/images/` and ensure their backgrounds match the site's true black (#000000). Run `node scripts/fix-diagram-backgrounds.js` to automatically fix background colors. Add new diagram filenames to the `diagramFiles` array in the script before running. **Note**: This script is specifically for diagrams in thoughts posts, not for other types of images or other page types.
7. Run `npm run build && npm run test:content`

**To schedule for future publication:**
- Set `draft: true` and a future `date` in front matter
- The GitHub Actions workflow will automatically publish when the date arrives
- Test locally with `npm run schedule-posts` to see what would be published

### Adding a New Recipe

1. Create file `content/recipes/recipe-*.md`
2. Use the complete template from `docs/recipe-template.md`
3. Follow the content structure (description, snapshot, ingredients, method, notes)
4. Generate and review OG image: `npm run generate:og-images`
   - This generates SVG files in `static/images/social/working-files/` for editing
   - After editing the SVG, convert to PNG: `npm run generate:png -- static/images/social/working-files/recipe-xxx-og.svg`
   - The PNG will be saved in `static/images/social/` for use as the OG image
5. Add `social_image` to front matter: `social_image: "/images/social/recipe-xxx-og.png"`
6. Run `npm run build && npm run test:content`

**Print functionality:**
- Recipe pages automatically include print icon button (top-right) and print/email buttons (bottom)
- Print stylesheet is automatically applied via `@media print` rules in `static/css/custom.css`
- Print and email actions are tracked in Plausible Analytics
- No additional configuration needed - works out of the box for all recipes

**To schedule for future publication:**
- Set `draft: true` and a future `date` in front matter
- **Important**: Scheduled recipes must have `social_image` set before the publish date, or they will be skipped
- The GitHub Actions workflow will automatically publish when the date arrives
- Test locally with `npm run schedule-posts` to see what would be published

### Modifying Styles

- Main styles: `static/css/main.css`
- Custom overrides: `static/css/custom.css`
  - Includes print stylesheet (`@media print`) for recipe pages
  - Print styles hide navigation, use serif fonts, optimize for paper
- Use CSS custom properties from brand system
- Test responsive breakpoints: 768px, 480px

### Updating Homepage

- Edit `content/_index.md` for content
- Edit `layouts/index.html` for structure
- Recent Thoughts section shows 3 most recent (or placeholders if < 3)

## Important Notes

- **Drafts**: Set `draft: true` to hide from production
- **Draft file naming (thoughts only)**: Prefix draft thoughts files with `draft-` for easy identification (e.g., `draft-my-post.md`). The `slug` field in front matter determines the URL, so "draft" won't appear in production URLs.
- **Dates**: Use YYYY-MM-DD format (Hugo sorts by date)
- **Social Images**: Place in `static/images/social/`, reference with leading slash
- **Raw HTML**: Allowed in content (config has `unsafe = true`)
- **Build**: Always run `npm run build` before testing
- **Deployment**: Automatic via Netlify on push to master
- **Scheduled Posts**: Posts with `draft: true` and future dates will auto-publish via GitHub Actions (runs twice daily at 13:00 and 14:00 UTC to cover both PDT and PST). See README.md for details.
- **Recipe Search JSON**: A JSON index is automatically generated at `/recipes/index.json` for client-side recipe search functionality. The index includes recipe metadata and is validated by tests.
- **Recipe Print Functionality**: Recipe pages include print icon button (top-right) and print/email buttons (bottom). Print stylesheet automatically optimizes layout for printing. Print and email actions are tracked in Plausible Analytics. See README.md for details.
- **Spell Checking**: Use `npm run test:spell` to check modified content files, or `npm run test:spell:all` to check all content files. Add valid words to `cspell.json` if needed.
- **Hugo Version Checking**: Periodically check Hugo version and security status with `npm run check:hugo`. This checks for known CVEs and available updates. Recommended: check monthly or when security advisories are published.
- **Dependency Security Checking**: Run `npm run check:dependencies` to check all npm packages, Node.js version, and GitHub Actions for security vulnerabilities and updates. This runs automatically via GitHub Actions monthly and creates issues if problems are found.

## References

- **README.md**: Setup, scripts, content management guide, scheduling posts
- **docs/thoughts-template.md**: Complete thoughts template with front matter, structure, and formatting guidelines
- **docs/recipe-template.md**: Complete recipe template with front matter, structure, and formatting guidelines
- **docs/recipe-snapshot-template.md**: Snapshot section format and field definitions
- **BRAND.md**: Complete brand guidelines and protected elements
- **CONTENT_STYLE_GUIDE.md**: Writing principles, tone, voice, and style guidelines
- **config.toml**: Hugo configuration
- **tests/content-checks.js**: Main test orchestrator (modular structure in `tests/content-checks/` directory)
- **tests/spell-check.js**: Spell checking script for content files
- **tests/og-image-generation.test.js**: OG image generation validation
- **tests/schedule-posts.test.js**: Scheduled posts workflow validation
- **tests/recipe-search-json.test.js**: Recipe search JSON index validation
- **tests/recipe-template.test.js**: Recipe template structure validation
- **scripts/schedule-posts.js**: Auto-publish scheduled posts script
- **scripts/generate-og-images.js**: Generate OG images for recipes
- **scripts/generate-png-from-svg.js**: Convert SVG to PNG for social media compatibility
- **scripts/fix-diagram-backgrounds.js**: Fix diagram image background colors to match site black (#000000). Processes PNG files listed in the `diagramFiles` array, replacing dark pixels with pure black to ensure seamless integration with the dark theme. **Note**: Currently only relevant for diagrams placed in thoughts posts, not other types of images or other page types.
- **scripts/check-hugo-version.js**: Check Hugo version, security status, and available updates
- **scripts/check-dependencies.js**: Check all dependencies (npm packages, Node.js, GitHub Actions) for security issues and updates
- **.github/workflows/security-check.yml**: Monthly automated security and dependency check workflow
- **.github/workflows/schedule-posts.yml**: GitHub Actions workflow for scheduled publishing
- **layouts/recipes/list.json**: Template for recipe search JSON index
- **layouts/recipes/single.html**: Recipe page template with print functionality (print icon, print/email buttons)
- **static/css/custom.css**: Print stylesheet (`@media print`) for optimized recipe printing

## When in Doubt

1. Check existing content files for patterns
2. Run tests to verify changes
3. Check BRAND.md for design constraints
4. Check CONTENT_STYLE_GUIDE.md for writing style and voice guidelines
5. Preserve existing conventions unless explicitly asked to change them

