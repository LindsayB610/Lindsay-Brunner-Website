# Recipe Search Implementation Plan

## Recommendation
Start with **section-scoped search limited to recipes**. The site already has structured front matter for recipes, and traffic is likely concentrated on that section. A scoped search is faster to ship, lighter to load, and avoids indexing non-recipe content (thoughts, about). If it proves useful, you can expand to global search later by reusing the same pipeline with a broader index.

## Goals
- Help visitors find recipes quickly by title, tags, ingredients, or instructions.
- Keep the page weight low (good for Core Web Vitals on Netlify).
- Avoid server dependencies; keep search static and client-side.

## High-level approach
1. **Generate a lightweight JSON index at build time** using Hugo. Include recipe metadata and select content fields.
2. **Add client-side search** on the `/recipes` section page using Fuse.js (fuzzy, small bundle) or MiniSearch (full-text, still light).
3. **Progressively enhance**: render the recipes list as usual, then filter it client-side when JavaScript runs. No JS? Show the unfiltered list.

## Data model for the search index
- Fields to include per recipe:
  - `title`
  - `description`
  - `subtitle`
  - `date`
  - `recipeCategory`
  - `recipeCuisine`
  - `recipeIngredient` (flattened array)
  - `recipeInstructions` (optional; include first N steps to keep index small)
  - `url` (permalink)
  - `social_image` (optional, for result card visuals)
- File: `static/search/recipes.json`
- Size target: <100-150 KB for ~50 recipes (trim instructions, avoid full HTML content).

## Hugo build tasks
- Create a Hugo template to emit the JSON index:
  - Location: `layouts/recipes/list.json.json` (or `layouts/_default/list.json.json` filtered to recipes).
  - Use `where .Site.RegularPages "Section" "recipes"` to gather recipes.
  - Normalize arrays (ingredients) with `delimit` and deduplicate if needed.
  - Strip Markdown from instructions with `plainify` and truncate: `trunc 200`.
  - Ensure content respects front matter fields already enforced by tests.
- Add an output format for JSON (if not present): update `config.toml` with a custom `outputFormats` entry (e.g., `RecipeSearch`) and set the recipes section to emit both HTML and JSON via `outputs = ["HTML", "RecipeSearch"]` in `_index.md` front matter or section config.
- Netlify deploy picks up the generated asset automatically under `/recipes/index.json` (or `/search/recipes.json` if emitted to `static`).

## Client-side UI on /recipes
- Insert a search box and results counter above the recipe grid/list in `layouts/recipes/list.html`.
- Add a small script (inline or bundled in `static/js/recipes-search.js`) that:
  - Fetches the JSON index on page load (`/recipes/index.json` or `/search/recipes.json`).
  - Initializes Fuse.js with fields and weights (e.g., title: 3, description: 2, ingredients: 1, instructions: 0.5).
  - Listens to `input` events to run queries with debouncing (150-200 ms).
  - Filters the existing DOM list by matching URLs, or re-renders a result list template.
  - Updates a results count and shows an “empty state” message when nothing matches.
- Accessibility: label the input, ensure focus styles, and keep a visible reset/clear button.

## Styling
- Use existing form styles from `static/css/main.css` if available; otherwise add minimal scoped styles in `static/css/custom.css` under a `.recipe-search` block (avoid altering global typography, gradients, or button hover rules noted in `agents.md`).
- Keep the input contrast high and align with the dark theme (use CSS variables already defined in the theme).

## Performance considerations
- Lazy-load Fuse.js only on the recipes page: either inline a small bundle (~6 KB gz) or use dynamic import with a fallback message if it fails.
- Cache the JSON index in `sessionStorage` after the first fetch to avoid re-fetching on navigation.
- Keep the index small by truncating instructions and omitting HTML.

## Optional extensions (future)
- Add **global search** by expanding the index template to include thoughts and pages with a `type` discriminator. Render results in a dedicated `/search` page, reusing the same JS but with filters.
- Add **URL-driven queries**: read/write `?q=` so searches can be shared.
- Add **keyboard navigation** for results and `/` focus shortcut.
- Add **pinning or favoriting** via `localStorage` to highlight frequently viewed recipes.

## Testing and validation
- Add a unit test for the JSON template (Hugo render test or snapshot) to ensure required fields emit correctly.
- Run existing site checks after integration: `npm run build`, `npm run test:content`, `npm test`.
- Manually verify that disabling JavaScript still shows the full recipe list.
