# Recipe Snapshot Section Template

This document defines the standard format for the "Snapshot" section in recipe files.

## Standard Format

```markdown
## Snapshot

- **Implements:** [list of equipment/tools needed]
- **[Heat/Cooking Method Field]:** [temperature, settings, or method details]
- **Batch size:** [serving information]
```

## Field Definitions

### Implements (Required)
- **Format:** `- **Implements:**` (bold, dash bullet)
- **Content:** List equipment and tools needed, separated by semicolons
- **Example:** `- **Implements:** large heavy pot; wooden spoon or spatula; ladle`

### Heat/Cooking Method Field (When Applicable)
Use the appropriate field based on cooking method:

- **Oven setting:** For standard oven recipes with specific temperature settings
  - **Example:** `- **Oven setting:** 350°F (175°C) for 45–55 minutes`
  - **Alternative:** `- **Oven:**` for simpler oven recipes
    - **Example:** `- **Oven:** 400°F (200°C)`

- **Stove setting:** For stovetop recipes
  - **Example:** `- **Stove setting:** boil for blanching, then medium-high for glazing (about 5–7 minutes)`

- **Cooker setting:** For pressure cooker recipes
  - **Example:** `- **Cooker setting:** High Pressure 55 minutes, then 15-minute natural release`

- **Heat setting:** For specialized appliances (e.g., pizzelle iron, waffle maker)
  - **Example:** `- **Heat setting:** preheated pizzelle iron (medium or "cookie" setting, per your model)`

- **Heat:** For no-heat/no-cook recipes
  - **Example:** `- **Heat:** no oven; room‑temperature or fridge drying`

### Batch size (When Applicable)
- **Format:** `- **Batch size:**` (always use "Batch size", never "Yield")
- **Content:** Serving information, yield details, or portion sizes
- **Examples:**
  - `- **Batch size:** about 6 generous bowls`
  - `- **Batch size:** one 9×5 loaf (about 8–10 slices)`
  - `- **Batch size:** 3–4 lb (1.4–1.8 kg) bone-in, skin-on turkey legs and/or thighs (4–6 pieces), generously serving 4 with veg`

### Notes (Optional)
- **Format:** `- **Notes:**` (bold, dash bullet)
- **Content:** Important method notes, special instructions, or key tips that don't fit in other fields
- **Example:** `- **Notes:** Pasta cooked separately for reliable texture`

### Additional Time Information (Optional)
If time information is provided separately from front matter fields, include it:
- Only include if it adds context beyond what's in `prepTime`, `cookTime`, `totalTime`
- **Example:** `- **Total time:** about 1 hour` (if this provides helpful context)

## Formatting Rules

1. **Always use bold for field labels:** `**Implements:**`, `**Oven setting:**`, etc.
2. **Always use dash bullets:** `-` (not asterisks or other markers)
3. **Include blank line after `## Snapshot` header:** (for consistency)
4. **Include blank line before next section:** (typically `## Ingredients`)
5. **Order fields in this sequence:**
   1. Implements
   2. Heat/Cooking Method (if applicable)
   3. Batch size (if applicable)
   4. Notes (if applicable)
   5. Time information (if provided separately)

## Examples

### Standard Oven Recipe
```markdown
## Snapshot

- **Implements:** mixing bowl; whisk or fork; wooden spoon or spatula; rimmed baking sheet; parchment paper; serrated knife; cooling rack (nice but optional)
- **Oven setting:** 350°F (175°C) (first bake 30 minutes; second bake about 10 minutes)
- **Batch size:** About 16 crisp biscotti (depending on how thick you slice)
```

### Stovetop Recipe
```markdown
## Snapshot

- **Implements:** medium pot; colander; large skillet with lid; tongs or spatula; measuring spoons
- **Stove setting:** boil for blanching, then medium-high for glazing (about 5–7 minutes)
- **Batch size:** ~1½ lb (680 g) carrots (4–6 side servings)
```

### Pressure Cooker Recipe
```markdown
## Snapshot

- **Implements:** 16-cup (about 4-quart) electric pressure cooker; large bowl; tongs; cutting board; forks for shredding; sheet pan (for optional broil)
- **Cooker setting:** High Pressure 55 minutes, then 15-minute natural release
- **Batch size (safety):** About 3 to 3 1/2 pounds pork shoulder in a 4-quart cooker. Manufacturer guidance: keep total food plus liquid at or below 60% of the pot's capacity and use at least 1/2 cup liquid (I use 1 cup).
```

### No-Cook Recipe
```markdown
## Snapshot

- **Implements:** stand mixer or sturdy hand mixer; rubber spatula; parchment‑lined sheet pans; fork or small mint molds
- **Heat:** no oven; room‑temperature or fridge drying
- **Batch size:** ~100–140 bite‑size mints, depending on how small you portion
```

### Simple Oven Recipe
```markdown
## Snapshot

- **Implements:** rimmed sheet pan; wire rack; foil (for sanity); tongs; paper towels; heatproof jar/bowl for bacon fat (optional but highly encouraged)
- **Oven setting:** Cold start, then 350°F (175°C) (optional hot finish at 400°F (205°C))
- **Batch size:** 1 lb thick-cut bacon per sheet pan (don't crowd; use two pans if you need to)
```

### Recipe with Notes
```markdown
## Snapshot

- **Implements:** sheet pan, large pot, skillet, mixing spoon, sharp knife, wooden spoon
- **Oven setting:** 425°F (220°C) for roasting squash
- **Batch size:** 6 main course servings or 8–10 as a side
- **Notes:** Pasta cooked separately for reliable texture
```

