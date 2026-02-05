# Dietary Icons Proposal

> **Update:** Implemented letter abbreviations (DF, V, VG, GF) instead of icons. See `layouts/partials/recipe-dietary-icons.html`.

---

# Original Icon Proposal (superseded)

Proposed replacements for recipe dietary icons, aligned with **US conventions** and the site's minimal stroke-based style.

## Design constraints
- Match existing: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.5"`, `stroke-linecap="round"`
- Size: 1rem (16px) — must stay legible at small scale
- Single-color stroke (inherits `currentColor`, pink on hover)
- Recognizable at a glance on US restaurant menus and food labels

---

## 1. Dairy-free: milk bottle with slash

**US convention:** Milk is represented as a milk bottle in allergen/ingredient labeling (e.g. FSA, FDA, package labels). A bottle with a slash reads as "no dairy."

**Current:** Droplet with slash (confusing — reads as "no water" or generic liquid)  
**Proposed:** Milk bottle outline with diagonal slash

```
<path d="M9 2v2H8v14h8V4h-1V2H9z"/>
<path d="M5 5l14 14"/>
```

Bottle: cap (narrow top) + body. Slash: standard "prohibited" diagonal. Matches US allergen icon convention (milk bottle).

---

## 2. Vegetarian: leaf

**US convention:** Leaf symbol is widely used for vegetarian (e.g. menus, apps, packaging).

**Current:** Abstract shape (hard to interpret)  
**Proposed:** Simple symmetrical leaf (single path, no midline for minimal look)

```
<path d="M12 3C7 10 7 18 12 21c5-3 5-11 0-18z"/>
```

---

## 3. Vegan: V with leaf accent

**US convention:** Letter "V" or "VG" and leaf imagery both signal vegan. A V with a small leaf reads as vegan rather than generic "V."

**Current:** Abstract chevron / A-frame  
**Proposed:** Letter V with horizontal bar (common "V" vegan mark on US menus)

```
<path d="M7 20l5-16 5 16"/>
<path d="M9 12h6"/>
```

Simple V shape + crossbar. Widely recognized as vegan on US restaurant menus and packaging. Distinct from vegetarian (leaf).

---

## 4. Gluten-free: wheat stalk with slash

**US convention:** Crossed-out wheat stalk is the common "no gluten" symbol (e.g. packaging, GFCO-style branding).

**Current:** Wheat stalk with slash is conceptually correct but the stalk drawing is ambiguous  
**Proposed:** Wheat stalk (stem + grain heads) with diagonal slash

```
<path d="M12 3v18"/>
<path d="M8 7c2 1 4 1 6 0"/>
<path d="M7 12c2.5 1 5 1 7.5 0"/>
<path d="M8 17c2 1 4 1 6 0"/>
<path d="M5 5l14 14"/>
```

Vertical stem + three arched grain heads + diagonal slash. Standard "no gluten" symbol in US packaging.

---

## Summary

| Label      | Symbol           | Rationale                          |
|-----------|------------------|------------------------------------|
| Dairy-free| Milk bottle + ✕  | Aligns with allergen labeling      |
| Vegetarian| Leaf             | Common on US menus and packages    |
| Vegan     | V + leaf cue     | Clear "V" with plant association   |
| Gluten-free | Wheat stalk + ✕ | Standard "no gluten" symbol        |

---

## Implementation

Replace the SVG `path` elements in `layouts/partials/recipe-dietary-icons.html` for each dietary slug. The wrapper `<a>` and `title`/`aria-label` stay the same.
