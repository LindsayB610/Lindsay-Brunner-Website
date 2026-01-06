# Recipe Template and Guidelines

This document provides a complete template and guidelines for creating recipe content files. For snapshot section details, see [`recipe-snapshot-template.md`](./recipe-snapshot-template.md).

## File Naming

- **Format:** `recipe-{name}.md`
- **Location:** `content/recipes/`
- **Example:** `recipe-bachan-pulled-pork.md`
- **Rules:**
  - Always use `recipe-` prefix
  - Use lowercase letters and hyphens
  - Be descriptive but concise

## Front Matter Template

```yaml
---
title: "Recipe Title"
date: YYYY-MM-DD
slug: "recipe-recipe-name"
subtitle: "Or: Brief subtitle or description"
description: "A compelling description for SEO and listings"
draft: false
social_image: "/images/social/recipe-recipe-name-og.png"
prepTime: "PT30M"
cookTime: "PT45M"
totalTime: "PT75M"
recipeYield: "6-8 servings"
recipeCategory: "Main Course"
recipeCuisine: "Italian-American"
recipeIngredient:
  - "1 cup ingredient one"
  - "2 Tbsp ingredient two"
  - "3 Tsp ingredient three"
recipeInstructions:
  - "Step one instructions"
  - "Step two instructions"
  - "Step three instructions"
---
```

## Front Matter Field Definitions

### Required Fields

#### Basic Content Fields
- **`title`** (string): The main recipe title
  - Use title case
  - Be descriptive and specific
  
- **`date`** (string): Publication date in `YYYY-MM-DD` format
  - Used for sorting and permalink generation
  - Use future dates with `draft: true` for scheduling

- **`slug`** (string): URL-friendly identifier
  - Format: `"recipe-recipe-name"`
  - Should match filename (without `.md`)

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

#### Recipe Schema Fields (Schema.org)

- **`prepTime`** (string): Preparation time in ISO 8601 duration format
  - Format: `"PT30M"` (30 minutes), `"PT1H30M"` (1 hour 30 minutes)
  - Examples: `"PT15M"`, `"PT45M"`, `"PT1H"`

- **`cookTime`** (string): Cooking time in ISO 8601 duration format
  - Same format as `prepTime`
  - Examples: `"PT30M"`, `"PT2H"`, `"PT1H15M"`

- **`totalTime`** (string): Total time in ISO 8601 duration format
  - Should equal or exceed prepTime + cookTime
  - Accounts for any additional time not covered by prep/cook

- **`recipeYield`** (string): Serving size or yield
  - Examples: `"6-8 servings"`, `"about 6 generous bowls"`, `"one 9×5 loaf"`

- **`recipeCategory`** (string): Recipe category
  - Examples: `"Main Course"`, `"Dessert"`, `"Snack"`, `"Side Dish"`, `"Appetizer"`

- **`recipeCuisine`** (string): Cuisine type
  - Examples: `"Italian-American"`, `"Japanese-American"`, `"American"`, `"Italian"`

- **`recipeIngredient`** (array of strings): List of ingredients
  - Must be a YAML array
  - Each ingredient as a string
  - Include quantities, units, and preparation notes
  - See [Measurement Formatting](#measurement-formatting) below

- **`recipeInstructions`** (array of strings): Step-by-step instructions
  - Must be a YAML array
  - Each step as a string
  - Can be brief or detailed depending on recipe complexity

### Optional Fields

- **`social_image`** (string): Path to Open Graph image
  - Format: `"/images/social/recipe-recipe-name-og.png"`
  - **Required for published recipes** (draft: false)
  - Generate with `npm run generate:og-images`
  - Review image before adding to front matter

## Content Structure

After the front matter, recipes follow this structure:

```markdown
---
[front matter]
---

[Opening description paragraph - repeats or expands on description field]

## Snapshot

[See recipe-snapshot-template.md for complete snapshot format]

## Ingredients

[Organized ingredient lists, optionally grouped by category]

## Method

[Numbered step-by-step instructions]

---

## Notes, swaps, and guardrails

[Optional section with tips, substitutions, variations, etc.]

## Credit where it's due

[Optional attribution section]
```

**Important:** Use horizontal lines (`---`) only:
1. After front matter (separates YAML from content)
2. Before Notes section (if present)

Do NOT use horizontal lines between Snapshot, Ingredients, and Method sections - headers provide sufficient separation.

## Content Section Guidelines

### Opening Description

- First paragraph after front matter
- Repeats or expands on the `description` field
- Provides context, inspiration, or key characteristics
- Separated from front matter by `---` (horizontal line)
- No horizontal line needed between opening description and Snapshot section

### Snapshot Section

See [`recipe-snapshot-template.md`](./recipe-snapshot-template.md) for complete guidelines.

**Quick reference:**
- **Implements:** Required, lists equipment/tools
- **Oven setting / Stove setting / Cooker setting / Heat setting / Heat:** As applicable
- **Batch size:** Serving/yield information
- **Notes:** Optional, for special instructions

### Ingredients Section

- Organize ingredients logically
- Group by category if helpful (e.g., "Sausage and aromatics", "Spices and tomato base")
- Use subheadings (###) for groups
- List format: `- Item` (dash bullets)
- Include quantities, units, and preparation notes

### Method Section

- Numbered list format: `1. **Step title**`
- Bold step titles for scannability
- Detailed instructions under each step
- Use clear, actionable language
- Include timing, temperatures, and visual cues

### Notes Section (Optional)

- Tips, substitutions, variations
- Storage instructions
- Troubleshooting guidance
- Ingredient explanations
- Technique notes

### Credit Section (Optional)

- Attribution for adapted recipes
- Links to inspiration sources
- Acknowledgments

## Formatting Rules

### Section Separators

- Use `---` (three dashes) as horizontal rules only:
  1. After front matter (separates YAML from content)
  2. Before Notes section (if present)
- Do NOT use horizontal lines between Snapshot, Ingredients, and Method sections
- Do NOT use `⸻` (triple em dash) or other separator characters
- Headers (##) provide sufficient visual separation between main sections

### Temperature Formatting

- Always use degree symbols: `°F` and `°C`
- Standard format: `200°F (93°C)` (Fahrenheit first, Celsius in parentheses)
- For ranges: `160–165°F (71–74°C)`
- Do NOT use slash format (`350°F / 175°C`) — use parentheses instead

### Percent Formatting

- Always use no space before the percent sign: `85%`, `20–25%`, `80–90%`
- Do NOT use space before percent: `85 %` (incorrect)
- Standard format: `85% lean`, `60% of capacity`, `40–60% of batter`

### Measurement Formatting

**Always capitalize abbreviations:**
- `Tbsp`, `Tsp` (not `tbsp`, `tsp`)
- `Cup`, `Cups` (can abbreviate in lists)
- `oz` (ounce), `lb` (pound), `g` (gram), `ml` (milliliter), `in` (inch)

**Always spell out:**
- `minutes` / `minute` (not `min`)
- `hours` / `hour` (not `hr`)
- `seconds` / `second` (not `sec`)

**Acceptable abbreviations:**
- `Tbsp` / `Tsp` (tablespoon/teaspoon) — always abbreviate
- `cup` / `cups` — can abbreviate in lists, spell out in narrative text
- `oz`, `lb`, `g`, `ml`, `in` — always abbreviate

**Metric conversions:**
- Optional but helpful
- Format: `1 cup (240 ml)`, `2 Tbsp (30 g)`
- Include when it adds clarity

**Fractions:**
- **Always use Unicode fractions:** `½`, `⅓`, `¼`, `¾`, `⅔`, `⅛`, `⅜`, `⅝`, `⅞`
- **Do NOT use regular fractions:** `1/2`, `1/3`, `1/4`, `3/4`, etc. (incorrect)
- **For mixed numbers:** Use `1½` (not `1 1/2` or `1 ½`)
- **Exception:** Ratios like `75/25` (fat ratio) are acceptable as they're not standard fractions

### Header Formatting

- **H1:** Title case (handled by front matter `title`)
- **H2:** Sentence case (`## Ingredients`, `## Method`)
- **H3:** Sentence case (`### Sausage and aromatics`)

### Writing Style

Follow guidelines in [`CONTENT_STYLE_GUIDE.md`](../CONTENT_STYLE_GUIDE.md):

- Wry, plainspoken, pragmatic tone
- No em dashes (use parentheses, commas, or break sentences)
- Title case for H1s, sentence case for all other headers
- Write for builders and practitioners as peers
- Lead with lived experience

## Permalink Structure

Recipes use the pattern: `/recipes/:year-:month-:day/:slug/`

Example: `recipe-bachan-pulled-pork.md` with date `2025-11-09` becomes:
`/recipes/2025-11-09/recipe-bachan-pulled-pork/`

## OG Image Workflow

**Published recipes must have `social_image` set:**

1. Generate OG images:
   ```bash
   npm run generate:og-images
   ```

2. Review generated image in `static/images/social/`
   - Look for: `recipe-{slug}-og.png`

3. Add to front matter:
   ```yaml
   social_image: "/images/social/recipe-{slug}-og.png"
   ```

4. Set `draft: false` when ready to publish

**Why?** Tests will fail if a published recipe doesn't have `social_image` set. This ensures:
- OG images are visually reviewed before going live
- No accidental publishing with broken/missing images
- Consistent quality control for social sharing

## Scheduling Recipes

To schedule a recipe for future publication:

1. Set `draft: true` and a future `date` in front matter
2. **Important:** Set `social_image` before the publish date (or recipe will be skipped)
3. GitHub Actions workflow runs hourly and auto-publishes when date arrives
4. Test locally: `npm run schedule-posts`

## Complete Example

```markdown
---
title: "Extra Protein-y Pasta e Fagioli"
date: 2025-12-30
slug: "recipe-extra-protein-pasta-e-fagioli"
subtitle: "Or: Sausage and white bean soup that eats like dinner"
description: "Hearty pasta e fagioli with Italian sausage and creamy cannellini beans, built from pantry staples and concentrated broth so it feels like a meal."
draft: false
social_image: "/images/social/recipe-extra-protein-pasta-e-fagioli-og.png"
prepTime: "PT15M"
cookTime: "PT45M"
totalTime: "PT60M"
recipeYield: "about 6 generous bowls"
recipeCategory: "Main Course"
recipeCuisine: "Italian-American"
recipeIngredient:
  - "1 lb Italian sausage (½ lb sweet + ½ lb hot)"
  - "Olive oil"
  - "1 medium onion, finely diced"
  - "5 to 6 cloves garlic, minced"
  - "2 Tsp dried basil"
recipeInstructions:
  - "Brown the sausage. Warm a large heavy pot over medium heat with a small drizzle of olive oil. Add the sausage, break it up, and let it brown thoroughly."
  - "Cook the aromatics. Add the onion to the pot and cook until softened, stirring and scraping up browned bits."
---

Hearty pasta e fagioli with Italian sausage and creamy cannellini beans, built from pantry staples and concentrated broth so it feels like a meal. It is savory without being spicy, rich without being heavy, and it gets even better as leftovers.

## Snapshot

- **Implements:** large heavy pot; wooden spoon or spatula; ladle
- **Stove setting:** medium heat for browning and simmering (about 60 minutes total)
- **Batch size:** about 6 generous bowls

## Ingredients

### Sausage and aromatics

- 1 lb Italian sausage (½ lb sweet + ½ lb hot)
- Olive oil
- 1 medium onion, finely diced
- 5 to 6 cloves garlic, minced

## Method

1. **Brown the sausage**

   Warm a large heavy pot over medium heat with a small drizzle of olive oil. Add the sausage, break it up, and let it brown thoroughly. Transfer the browned sausage to a bowl with a slotted spoon.

2. **Cook the aromatics**

   Add the onion to the pot and cook until softened, stirring and scraping up browned bits. Add garlic and cook just until fragrant.

---

## Notes, swaps, and guardrails

### Broth base choices

Blending concentrated stocks from what you have on hand keeps this pantry-forward. The Knorr Rich Beef Stock Pot brings savory depth that pairs beautifully with sausage.

## Credit where it's due

This recipe is adapted from a pasta e fagioli shared by [@thedishonhealthy](https://www.instagram.com/thedishonhealthy/) on Instagram, which inspired the original structure and flavor direction.
```

## Testing

After creating or editing a recipe:

```bash
npm run build          # Build the site first
npm run test:content   # Run content validation tests
```

Tests validate:
- Front matter structure and required fields
- Recipe schema fields (times, ingredients, instructions)
- Social image existence (for published recipes)
- Date format (YYYY-MM-DD)
- Permalink structure

## References

- **`recipe-snapshot-template.md`**: Complete snapshot section guidelines
- **`CONTENT_STYLE_GUIDE.md`**: Writing style, tone, and voice guidelines
- **`BRAND.md`**: Brand guidelines and design system
- **`README.md`**: Setup, scripts, and general content management
- **`agents.md`**: AI assistant guidelines and project context

