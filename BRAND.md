# Lindsay Brunner Brand Guidelines

## Color Palette

### Core Gradient Colors

The foundation of the brand is built on three primary colors that create the signature gradient:

```css
--color-red: #ff0037 /* Vibrant red */ --color-pink: #ff1b8d /* Hot pink */
  --color-yellow: #ffdd00 /* Bright yellow */;
```

### Brand Colors (Solid Applications)

Derived from the gradient spectrum for non-gradient usage:

```css
--brand-primary: #ff1b8d /* Pink - main brand color */ --brand-warm: #ff4b6b
  /* Warm coral between red and pink */ --brand-accent: #ffaa00
  /* Warm orange-yellow for accents */ --brand-orange: #ff8800
  /* Orange-yellow (social icons, highlights) */;
```

### Dark Theme Base

Supporting colors for the dark theme aesthetic:

```css
--dark-bg: #000000 /* Pure black background */ --dark-surface: #0f0f0f
  /* Cards and containers */ --dark-surface-lighter: #1a1a1a /* Hover states */
  --dark-border: #3d3d3d /* Subtle borders */ --dark-text: #ffffff
  /* Primary text */ --dark-text-secondary: #cccccc /* Secondary text */
  --dark-text-muted: #888888 /* Muted text */;
```

## Gradients

### Main Brand Gradient

The signature gradient used throughout the site:

```css
--gradient-main: linear-gradient(
  135deg,
  var(--color-red) 0%,
  var(--color-pink) 50%,
  var(--color-yellow) 100%
);
```

**Used for:**

- Header logo
- Flowing design elements
- Special accents

### 🔒 LOCKED: Hero H1 Gradient

**⚠️ CRITICAL - DO NOT MODIFY**

```css
background: linear-gradient(
  135deg,
  var(--color-red) 0%,
  var(--color-pink) 50%,
  var(--color-yellow) 100%
);
background-size: 80% 100%; /* REQUIRED for gradient to reach yellow at end */
```

**Why this configuration is locked:**

- The hero text is larger than header text, stretching the gradient over more pixels
- `background-size: 80% 100%` compresses the gradient so yellow reaches the final "r"
- Changing percentages or removing background-size will break the gradient match
- This ensures "Lindsay Brunner" in hero matches the header perfectly

## Typography

### Font Stack

```css
--font-sans:
  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
--font-mono:
  "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Consolas", monospace;
```

### Heading Colors

```css
h1: Gradient (see locked configuration above)
h2: var(--brand-primary) (#ff1b8d)
h3: var(--brand-primary) (#ff1b8d)
h4: var(--color-yellow) (#ffdd00)
```

## Design Principles

### Angular & Borderless

Inspired by Vercel's design language:

- No border-radius (all set to 0)
- Minimal borders
- Clean geometric shapes
- Borderless social icons

### Geometric Elements

Subtle shapes inspired by modern tech design:

- Floating triangles and circles in hero
- Geometric corner accents on cards
- Flowing gradient lines (minimal usage)

## Usage Guidelines

### ✅ Do:

- Use the main gradient sparingly for special elements
- Apply solid brand colors for most UI elements
- Maintain the locked hero gradient configuration
- Keep geometric elements subtle (low opacity)

### ❌ Don't:

- Overuse gradients (avoid gradient scrollbars, too many gradient elements)
- Modify the hero H1 gradient configuration
- Add rounded corners
- Use bright colors for large areas

## Social Icons

- Color: `var(--brand-orange)` (#ff8800)
- Style: Clean, recognizable filled icons
- Hover: `var(--brand-warm)` (#ff4b6b)
- Design: Borderless, minimal

## Navigation Structure

Main navigation: About, Thoughts

- Home: Accessible via LB logo (no redundant nav item)
- Contact page: Redirects to home (removed from navigation)
- Thoughts: Active section with blog posts
- Blog: Redirects to home (legacy URL)

## File Structure

- Brand colors: `static/css/main.css` (CSS custom properties)
- Social icons: `layouts/partials/header.html`
- Site title: `config.toml` (set to "LB")
- Contact redirect: `layouts/contact/index.html`

---

**Remember:** The magic is in the restraint. This palette works because we use gradients strategically and rely on solid colors for most elements.
