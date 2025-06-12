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
  "Space Grotesk", "Inter", system-ui, sans-serif; /* Primary body font */
--font-accent:
  "Space Grotesk", "Inter", system-ui, sans-serif; /* Headers h2-h6, navigation */
--font-mono:
  "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Consolas", monospace;
```

### 🔒 PROTECTED Typography Elements

**Critical font assignments that must NOT be changed:**

- **h1 "Lindsay Brunner"**: `font-family: 'Inter'` - Required for gradient to render correctly
- **LB Logo**: `font-family: 'Inter'` - Must match h1 for visual consistency

### Font Hierarchy

```css
h1: Inter font + gradient (LOCKED - do not change)
h2-h6: Space Grotesk accent font with tight letter spacing
Body copy: Space Grotesk for modern character
Navigation: Space Grotesk accent font
Buttons: Space Grotesk for consistency
```

### Heading Colors

```css
h1: Gradient (see locked configuration above)
h2: var(--brand-primary) (#ff1b8d)
h3: var(--brand-primary) (#ff1b8d)
h4: var(--color-yellow) (#ffdd00)
```

## Design Principles

### Modern Rounded Design

Evolved from angular to sophisticated rounded aesthetic:

- Border radius restored: sm(6px), md(8px), lg(12px), xl(16px)
- Rounded buttons, cards, and elements
- Clean, approachable aesthetic
- Maintains modern tech feel without harsh edges

### Geometric Elements

Subtle shapes inspired by modern tech design:

- Floating triangles and circles in hero
- Geometric corner accents on cards
- Flowing gradient lines (minimal usage)

## Usage Guidelines

### ✅ Do:

- Use Space Grotesk as primary font except for protected h1/logo
- Apply gradient backgrounds to buttons and key interactive elements
- Maintain rounded corners for modern, approachable feel
- Use solid brand colors for most UI elements
- Keep hover effects consistent (gradient text for nav/footer)
- Preserve the locked hero gradient configuration

### ❌ Don't:

- Change h1 or LB logo fonts (must stay Inter)
- Modify the hero H1 gradient configuration
- Add hover states to content cards/tiles
- Use angular/borderless design elements
- Overuse gradients for backgrounds

### 🔒 NEVER TOUCH:

- Hero h1 gradient configuration
- LB logo and h1 font family (Inter)
- Gradient color values and percentages

## Components

### Buttons (CTA)

```css
background: var(--gradient-main); /* Full gradient background */
color: var(--dark-text); /* White text - explicitly maintained on hover */
font-family: var(--font-accent); /* Space Grotesk */
font-size: 1.125rem; /* Larger, readable text */
border-radius: var(--radius-xl); /* Rounded corners */
box-shadow: pink glow effect; /* Elegant depth */
```

**Hover**: Lift + intensified glow (no brightness filter for readability)
**Current Links**: Both "Explore my work" and "Start a conversation" → LinkedIn

### Cards

```css
background: var(--dark-surface);
border-radius: var(--radius-xl);
```

**Behavior**: Static (no hover states for content tiles)
**Usage**: Three "What I Do" tiles, blog post cards

### Social Icons

- **Color**: `var(--brand-orange)` (#ff8800)
- **Style**: Clean, recognizable filled icons
- **Hover**: `var(--brand-warm)` (#ff4b6b)
- **Design**: Rounded, minimal

### Footer Links

- **Style**: Bold + gradient text effect
- **Hover**: Brightness increase
- **Applies to**: "Hugo" and "Builder.io" links

## Page Layouts

### Thoughts List Page (Builder.io inspired)

```css
.featured-post          /* Large hero post layout */
.posts-grid             /* 3-column grid for remaining posts */
.grid-title             /* "Latest Thoughts" section header */
.no-posts               /* Coming soon message when no content */
```

**Features**:

- Featured post prominently displayed
- Clean grid layout for additional posts
- No category tags (removed for simplicity)
- Responsive design

### 404 Error Page

```css
Giant "404" with var(--gradient-main)
Error messages in brand colors (yellow, pink, red)
Two CTA buttons: "Go home" + "Browse thoughts"
Techy error console styling
```

### About Page

- **Hugo config**: `unsafe = true` for raw HTML support
- **Layout**: Left-aligned with headshot placeholder
- **Template**: Custom `layouts/about/single.html`

## Navigation Structure

**Layout**: LB logo → About → Thoughts → (space) → Social Icons

- **Position**: Left-aligned next to LB logo
- **Font**: Space Grotesk accent font
- **Color**: Warm off-white (#f5f5f0)
- **Hover**: Bold + gradient text effect (matches footer links)
- **Spacing**: Tight gaps for cohesive grouping

### Pages & Structure

- **Homepage**: Hero + What I Do + Recent Thoughts sections
- **About**: Left-aligned content with headshot placeholder (Hugo raw HTML enabled)
- **Thoughts**: Builder.io-inspired list page with featured post + grid layout
- **404**: Custom error page with gradient "404" and techy error messages
- **Contact/Blog**: Legacy redirects to home

### Content Strategy

- **Recent Thoughts section**: Dynamic tiles that show placeholders until 3+ posts exist
- **No category tags**: Clean, minimal approach to content organization
- **Hitchhiker's Guide humor**: "Life, the universe, and the meaning of everything. Or something."

## File Structure

- **Brand colors**: `static/css/main.css` (CSS custom properties)
- **Fonts**: Google Fonts: Inter + Space Grotesk
- **Templates**:
  - `layouts/index.html` (homepage with What I Do + Recent Thoughts)
  - `layouts/about/single.html` (left-aligned about page)
  - `layouts/thoughts/list.html` (Builder.io inspired blog layout)
  - `layouts/_default/list.html` (override for theme conflicts - ensures thoughts page works)
  - `layouts/404.html` (custom error page)
- **Content**:
  - `content/about/index.md` (about page with headshot placeholder)
  - `content/thoughts/*.md` (blog posts)
- **Config**:
  - `config.toml` (Hugo config with unsafe HTML enabled)
  - Site title: "LB"
- **Redirects**:
  - `layouts/contact/index.html` → home
  - `layouts/blog/index.html` → home (legacy)

## Content Management 📝

### Adding New Thought Posts

Hugo is fully configured for easy content management:

**1. Create a new file** in `content/thoughts/` directory:

```
content/thoughts/my-new-post.md
```

**2. Add front matter** at the top:

```markdown
---
title: "Your Post Title"
date: 2024-01-20T10:00:00-08:00
description: "Brief description of your post"
---

Your post content goes here using standard Markdown...
```

**3. Hugo automatically handles everything:**

- Homepage Recent Thoughts switches from placeholders to real posts (when 3+ exist)
- Thoughts page displays posts in Builder.io-style grid layout
- Most recent post gets featured treatment
- Clean URLs and responsive design
- No manual updates needed

### File Structure

```
content/thoughts/
├── _index.md          # Page configuration (set up)
├── post-1.md         # Your posts go here
├── post-2.md         # Standard markdown files
└── post-3.md         # With front matter
```

## Current Status ✅

### Working Features

- **Typography**: Space Grotesk primary font with protected Inter for h1/logo
- **Navigation**: Functional left-aligned nav with gradient hover effects
- **Color System**: Three-color gradient + solid brand colors working harmoniously
- **Responsive Design**: All layouts work across devices
- **Content Management**: Fully automated - just drop in markdown files
- **404 Handling**: Custom error page with brand styling

### Protected Elements (🔒 NEVER CHANGE)

- Hero h1 gradient: background-size: 80% 100% + exact color percentages
- LB logo + h1 font family: Must stay Inter for gradient rendering
- Button hover: White text explicitly maintained for readability

## Troubleshooting 🔧

### Hugo Template Issues

If navigation links appear broken (showing as plain text instead of clickable links) or page layouts don't render correctly:

1. **Restart dev server**: `dev_server_control restart`
2. **Clear browser cache**: Hard refresh (Ctrl+F5 / Cmd+Shift+R)
3. **Check template conflicts**: The `layouts/_default/list.html` file overrides theme conflicts

### Template Hierarchy

Hugo follows this order (our templates override old theme):

1. `layouts/[section]/list.html` (specific section)
2. `layouts/_default/list.html` (our override)
3. `themes/[theme]/layouts/` (old theme - ignored)

---

**Philosophy:** The magic is in the restraint. This palette works because we use gradients strategically, embrace rounded corners for approachability, and let Space Grotesk add personality while keeping the core elements perfectly calibrated.
