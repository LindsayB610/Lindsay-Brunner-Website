# Recipe Search Implementation Plan

## Recommendation
Start with **section-scoped search limited to recipes**. The site already has structured front matter for recipes, and traffic is likely concentrated on that section. A scoped search is faster to ship, lighter to load, and avoids indexing non-recipe content (thoughts, about). If it proves useful, you can expand to global search later by reusing the same pipeline with a broader index.

## Goals
- Help visitors find recipes quickly by title, description, ingredients, or category.
- Keep the page weight low (good for Core Web Vitals on Netlify).
- Avoid server dependencies; keep search static and client-side.
- Maintain progressive enhancement (works without JavaScript).

## High-level approach
1. **Generate a lightweight JSON index at build time** using Hugo. Include recipe metadata and select content fields.
2. **Add client-side search** on the `/recipes` section page using **Fuse.js** (fuzzy search, ~6KB gzipped bundle).
3. **Progressively enhance**: render the recipes list as usual, then filter it client-side when JavaScript runs. No JS? Show the unfiltered list.

## Data model for the search index
- Fields to include per recipe:
  - `title` (string)
  - `description` (string)
  - `subtitle` (string, optional)
  - `date` (ISO 8601 string, e.g., "2025-12-30T00:00:00Z")
  - `slug` (string, for identification/matching)
  - `recipeCategory` (string, e.g., "Main Course")
  - `recipeCuisine` (string, e.g., "Italian-American")
  - `recipeIngredient` (array of strings, flattened for search)
  - `recipeInstructions` (array of strings, plainified and joined)
  - `permalink` (string, relative URL using `RelPermalink`)
  - `social_image` (string, optional, for result card visuals)
- **File location**: Generated at `/recipes/index.json` via Hugo output format
- **Size target**: With 19 current recipes, expect ~10-20KB JSON. Total bundle (JSON + Fuse.js) ~16-26KB gzipped. Plan for future growth to ~50 recipes (still well under 100KB total).

## Hugo build tasks

### 1. Create JSON output format
- Update `config.toml` to add a JSON output format:
  ```toml
  [outputFormats]
    [outputFormats.RSS]
      mediatype = "application/rss+xml"
      baseName = "index"
      isPlainText = true
      notAlternative = true
    [outputFormats.RecipeSearch]
      mediatype = "application/json"
      baseName = "index"
      isPlainText = true
      notAlternative = true
  ```
- Update `[outputs]` section to include JSON for recipes section:
  ```toml
  [outputs]
    section = ["HTML", "RSS", "RecipeSearch"]
  ```
- Alternatively, add section-specific config in `content/recipes/_index.md` if only recipes need JSON:
  ```yaml
  outputs: ["HTML", "RSS", "RecipeSearch"]
  ```

### 2. Create JSON template
- **Location**: `layouts/recipes/list.json` (Hugo automatically handles the `.json` extension)
- **Template structure**:
  - Filter recipes: `where .Site.RegularPages "Section" "recipes"` and exclude drafts: `where . "Draft" false`
  - Sort by date (reverse, to match list.html): `.ByDate.Reverse`
  - Emit JSON array with recipe objects
  - Use Hugo functions:
    - `jsonify` for safe JSON encoding
    - `plainify` to strip Markdown from instructions
    - `delimit` to join arrays into searchable strings
    - `.RelPermalink` for relative URLs
    - `.Date.Format "RFC3339"` for ISO 8601 dates
  - Include all instruction steps (with 19 recipes, full instructions should be well under size target)
  - Example structure:
    ```json
    [
      {
        "title": "Recipe Title",
        "description": "Recipe description",
        "subtitle": "Subtitle",
        "date": "2025-12-30T00:00:00Z",
        "slug": "recipe-slug",
        "recipeCategory": "Main Course",
        "recipeCuisine": "Italian-American",
        "recipeIngredient": ["1 lb ingredient", "2 Tbsp ingredient"],
        "recipeInstructions": "Step one. Step two. Step three.",
        "permalink": "/recipes/2025-12-30/recipe-slug/",
        "social_image": "/images/social/recipe-slug-og.png"
      }
    ]
    ```

### 3. Deployment
- Netlify will automatically pick up the generated JSON file at `/recipes/index.json`
- No additional build steps needed (Hugo generates it during build)

## Client-side UI on /recipes

### 1. Search interface
- Insert search box above the recipe list in `layouts/recipes/list.html`
- Include:
  - Search input with proper label and ARIA attributes
  - Results counter (e.g., "X recipes found")
  - Clear/reset button (visible when search is active)
  - Empty state message when no results match

### 2. JavaScript implementation
- **File**: `static/js/recipes-search.js` (or inline in template)
- **Library**: Use **Fuse.js** (recommended over MiniSearch for smaller bundle size and simpler API)
- **Functionality**:
  - Fetch JSON index on page load: `fetch('/recipes/index.json')`
  - Cache in `sessionStorage` after first fetch (key: `recipes-search-index`)
  - Initialize Fuse.js with weighted fields:
    - `title`: weight 3 (highest priority)
    - `description`: weight 2
    - `subtitle`: weight 2
    - `recipeCategory`: weight 1.5
    - `recipeCuisine`: weight 1.5
    - `recipeIngredient`: weight 1 (joined string)
    - `recipeInstructions`: weight 0.5 (joined string)
  - Configure Fuse.js options:
    - `threshold: 0.4` (0.0 = exact match, 1.0 = match anything)
    - `ignoreLocation: true` (match anywhere in text)
    - `minMatchCharLength: 2` (minimum characters to match)
  - Listen to input events with debouncing (150-200ms)
  - **Re-render results** using a template function (preferred over DOM filtering):
    - Hide/show recipe items based on search results
    - Update results counter
    - Show empty state when no matches
  - Preserve original list order when search is cleared

### 3. Accessibility
- Proper `<label>` for search input
- ARIA labels and descriptions
- Visible focus styles (existing focus styles in CSS should work)
- Keyboard support: clear button accessible via Tab
- Screen reader announcements for results count changes

## Styling

### CSS requirements
- **Note**: `main.css` only has basic `font: inherit` for inputs — no actual form styles exist
- **Action**: Create new input styles in `static/css/custom.css` under `.recipe-search` block
- **Design guidelines**:
  - Use existing CSS variables from theme:
    - Background: `var(--dark-surface)` or `var(--dark-surface-lighter)`
    - Text: `var(--dark-text)`
    - Border: `var(--dark-border)`
    - Focus: `var(--color-pink)` (existing focus styles use this)
    - Border radius: `var(--radius-md)` or `var(--radius-lg)`
    - Spacing: use `--space-*` variables
  - High contrast for accessibility
  - Align with dark theme aesthetic
  - Match existing component styles (e.g., `.read-more-link` for buttons)
  - **Avoid**: Altering global typography, gradients, or button hover rules (see `agents.md`)

### Suggested structure
```css
.recipe-search {
  margin-bottom: var(--space-xl);
}

.recipe-search-input {
  /* Input field styles */
}

.recipe-search-results-count {
  /* Counter text styles */
}

.recipe-search-clear {
  /* Clear button styles */
}

.recipe-search-empty {
  /* Empty state message styles */
}
```

## Performance considerations
- **Bundle size**: 
  - Fuse.js: ~6KB gzipped
  - JSON index: ~10-20KB (19 recipes), ~50KB (50 recipes estimated)
  - Total: ~16-26KB (current), ~56KB (at 50 recipes)
- **Loading strategy**: 
  - Load Fuse.js via CDN or bundle (consider dynamic import for code splitting)
  - Fetch JSON index on page load (cached in sessionStorage)
- **Debouncing**: 150-200ms delay on input events
- **Caching**: Use `sessionStorage` for JSON index (key: `recipes-search-index`)

## Implementation phases

### Phase 1: MVP (Core functionality)
- [ ] Add JSON output format to `config.toml`
- [ ] Create `layouts/recipes/list.json` template
- [ ] Include core fields: title, description, subtitle, ingredients, category, cuisine, date, permalink
- [ ] Add search input UI to `layouts/recipes/list.html`
- [ ] Implement basic Fuse.js search in `static/js/recipes-search.js`
- [ ] Add CSS styles for search interface
- [ ] Test with current 19 recipes

### Phase 2: Enhancements (if needed)
- [ ] Add recipeInstructions to index (if search quality needs improvement)
- [ ] Add URL query parameter support (`?q=search-term`)
- [ ] Add keyboard shortcuts (`/` to focus search input)
- [ ] Improve empty state messaging
- [ ] Add loading state during JSON fetch

## Optional extensions (future)
- Add **global search** by expanding the index template to include thoughts and pages with a `type` discriminator. Render results in a dedicated `/search` page, reusing the same JS but with filters.
- Add **advanced filtering**: filter by category, cuisine, prep time, etc.
- Add **pinning or favoriting** via `localStorage` to highlight frequently viewed recipes.
- Add **search history** in localStorage.

## Testing and validation

### Automated tests
- Add unit test for JSON template structure:
  - Verify all required fields are present
  - Verify drafts are excluded
  - Verify date format is ISO 8601
  - Verify JSON is valid and parseable
  - Test edge cases: 0 recipes, 1 recipe, current count (19)
- Run existing site checks after integration:
  - `npm run build` (verify JSON generates correctly)
  - `npm run test:content` (verify no content validation breaks)
  - `npm test` (run full test suite)

### Manual testing
- Verify search works with various queries (title, ingredient, category)
- Test fuzzy matching (typos, partial words)
- Verify JavaScript-less fallback shows full recipe list
- Test accessibility with keyboard navigation and screen reader
- Test on mobile devices (responsive design)
- Verify performance (check bundle size, load time)

### Browser compatibility
- Test in modern browsers (Chrome, Firefox, Safari, Edge)
- Ensure sessionStorage is available (graceful degradation if not)
