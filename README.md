# Lindsay Brunner - Personal Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/e566bc7d-91da-44d9-836f-389a1d193c75/deploy-status)](https://app.netlify.com/projects/angry-minsky-477f42/deploys)

> Experienced content strategist, developer advocacy leader, and actually kinda cool human who transforms complex technology concepts into content experiences that developers and technical audiences love.

This is the source code for Lindsay Brunner's personal website, built with Hugo and deployed on Netlify. The site showcases expertise in developer advocacy, content strategy, and technical leadership.

## 🚀 Live Site

Visit the live site at: [lindsaybrunner.com](https://lindsaybrunner.com)

## 🛠 Tech Stack

- **Static Site Generator**: [Hugo](https://gohugo.io/) v0.149.2+
- **Styling**: Custom CSS with modern design principles and responsive layouts
- **Hosting**: [Netlify](https://netlify.com) with continuous deployment
- **Content Management**: Markdown files with Hugo's content organization
- **Performance**: Optimized with Hugo's built-in minification and asset processing
- **Analytics**: [Plausible Analytics](https://plausible.io/) for privacy-friendly analytics
- **RSS Feed**: Built-in Hugo RSS feed generation
- **Responsive Design**: Mobile-first approach with optimized layouts for all devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) v18.0.0 or higher (specified in `.nvmrc`)
- [npm](https://www.npmjs.com/) v8.0.0 or higher
- [Hugo](https://gohugo.io/installation/) (automatically installed via hugo-bin)

## 🏃‍♀️ Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/LindsayB610/lindsay-brunner-hugo-site.git
   cd lindsay-brunner-hugo-site
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:1313` to see the site running locally.

## 📝 Available Scripts

- `npm run dev` - Start the Hugo development server with drafts enabled
- `npm run build` - Build the site for production with minification (includes OG image generation)
- `npm run generate:og-images` - Generate OG images for recipes (creates SVG files for editing)
- `npm run generate:png` - Convert SVG to PNG for social media compatibility (usage: `npm run generate:png -- static/images/social/working-files/recipe-xxx-og.svg`)
- `npm run start` - Alternative command to start the development server
- `npm run serve` - Serve the site without draft content
- `npm run clean` - Remove the generated `public` directory
- `npm run test` - Run all tests (builds site, validates HTML, checks links, validates content, spell check, OG images, scheduling, search JSON, recipe template, dietary labels, mobile responsive)
- `npm run test:content` - Run content validation tests only
- `npm run test:html` - Validate generated HTML
- `npm run test:links` - Check for broken internal links (starts dev server, waits for ready, runs check, then stops server)
- `npm run test:spell` - Spell check modified content files (git diff)
- `npm run test:spell:all` - Spell check all content files
- `npm run test:og-images` - OG image generation validation
- `npm run test:schedule` - Scheduled posts workflow validation
- `npm run test:search-json` - Recipe search JSON index validation
- `npm run test:recipe-template` - Recipe template structure validation
- `npm run test:dietary` - Dietary label validation (allowed values, no duplicates)
- `npm run test:mobile` - Mobile and responsive design validation
- `npm run schedule-posts` - Check and auto-publish scheduled posts (runs automatically via GitHub Actions)
- `npm run check:hugo` - Check Hugo version, security status, and available updates
- `npm run check:dependencies` - Check all dependencies (npm packages, Node.js, GitHub Actions) for security issues and updates
- `npm run optimize:images` - Optimize image file sizes (usage: `npm run optimize:images -- static/images/file.jpg`)
- `npm run optimize:images -- --cleanup-backups` - Optimize images and automatically delete backup files after successful optimization
- `npm run cleanup:backups` - Clean up existing backup files created by image optimization
- `node scripts/fix-diagram-backgrounds.js` - Fix diagram image background colors to match site black (#000000). Add new diagram filenames to the `diagramFiles` array in the script before running. **Note**: Currently only relevant for diagrams placed in thoughts posts, not other types of images or other page types.

## 📁 Project Structure

```
├── archetypes/          # Content templates
├── content/             # Site content (Markdown files)
│   ├── about/           # About page content
│   ├── thoughts/        # Thought leadership content
│   ├── recipes/         # Recipe content
│   └── _index.md        # Homepage content
├── layouts/             # Hugo templates
│   ├── _default/        # Default page layouts
│   ├── partials/        # Reusable template components
│   ├── about/           # About page specific layout
│   ├── thoughts/        # Thoughts section layout
│   ├── recipes/         # Recipes section layout
│   │   └── list.json    # Recipe search JSON index template
│   ├── 404.html         # 404 error page
│   └── index.html       # Homepage layout
├── static/              # Static assets
│   ├── css/             # Stylesheets
│   ├── favicons/        # Site favicons
│   ├── images/          # Site images
│   │   └── social/      # Social sharing (Open Graph) images for posts and default site image
│   │       └── working-files/  # Editable SVG files for OG images (before PNG conversion)
│   ├── _headers         # Netlify headers configuration
│   └── _redirects       # Netlify redirects configuration
├── tests/                # Test files
│   ├── content-checks.js # Content validation tests
│   ├── spell-check.js    # Spell checking script
│   ├── og-image-generation.test.js # OG image generation validation
│   ├── schedule-posts.test.js # Scheduled posts workflow validation
│   ├── recipe-search-json.test.js # Recipe search JSON index validation
│   └── recipe-template.test.js # Recipe template structure validation
├── scripts/              # Build and automation scripts
│   ├── generate-og-images.js # Generate OG images for recipes
│   ├── generate-png-from-svg.js # Convert SVG to PNG for social media
│   ├── fix-diagram-backgrounds.js # Fix diagram image backgrounds to match site black (#000000)
│   ├── optimize-images.js # Optimize image file sizes with automatic backup cleanup
│   ├── schedule-posts.js # Auto-publish scheduled posts script
│   ├── check-hugo-version.js # Check Hugo version and security status
│   └── check-dependencies.js # Check all dependencies for security and updates
├── agents.md            # AI assistant guidelines (for Cursor, Copilot, etc.)
├── BRAND.md             # Brand guidelines and design system
├── config.toml          # Hugo site configuration
├── netlify.toml         # Netlify deployment configuration
└── package.json         # Node.js dependencies and scripts
```

## ✍️ Content Management

### Adding New Thought Leadership Content

The "thoughts" section is where Lindsay shares insights on developer advocacy, content strategy, and technical leadership.

**📋 For complete thoughts guidelines, see [`docs/thoughts-template.md`](./docs/thoughts-template.md)**

The template includes:
- Complete front matter template with all required and optional fields
- Content structure guidelines (flexible, unlike recipes)
- Formatting rules (headers, links, emphasis, etc.)
- OG image workflow (manual creation)
- Scheduling instructions
- Complete examples

**Quick start:**

1. **Create a new thought piece using Hugo**:

   ```bash
   # Navigate to your project directory
   cd lindsay-brunner-hugo-site

   # Create a new thought piece (Hugo will use the archetype template)
   hugo new thoughts/your-thought-title.md
   ```

2. **Alternative: Manual file creation**:

   ```bash
   # Create the file manually in the thoughts directory
   touch content/thoughts/your-thought-title.md
   
   # For drafts, use the draft- prefix for easy identification:
   touch content/thoughts/draft-your-thought-title.md
   ```

3. **Use the template**: Copy the front matter template from `docs/thoughts-template.md` and fill in your details

4. **Set up the front matter** (the metadata at the top of your .md file):

   ```markdown
   ---
   title: "Your Thought Title"
   date: 2024-01-15
   slug: "your-thought-slug"
   description: "A compelling description that will appear in listings and SEO"
   subtitle: "Or: A brief subtitle or alternative description"
   draft: false
   ---
   ```

5. **Write your content** using Markdown syntax (see template for formatting guidelines)

6. **Optionally create OG image**: Manually create and add to `static/images/social/`, then reference in front matter

7. **For diagram images in thoughts posts**: If adding PNG diagram images (e.g., flowcharts, system diagrams) to thoughts post content, place them in `static/images/` and ensure their backgrounds match the site's true black (#000000). Add the filename to the `diagramFiles` array in `scripts/fix-diagram-backgrounds.js`, then run `node scripts/fix-diagram-backgrounds.js` to automatically fix background colors. **Note**: This script is specifically for diagrams in thoughts posts, not for other types of images or other page types.

8. **Test**: Run `npm run build && npm run test:content` to validate

**File naming conventions:**
- Use lowercase letters, hyphens, or underscores
- Be descriptive but concise
- For drafts, use `draft-` prefix: `draft-my-great-thought.md` (helps with organization; the `slug` field determines the URL)

### Adding New Recipe Content

The "recipes" section showcases tested recipes and kitchen experiments.

**📋 For complete recipe guidelines, see [`docs/recipe-template.md`](./docs/recipe-template.md)**

The template includes:
- Complete front matter template with all required and optional fields
- Content structure guidelines (snapshot, ingredients, method, notes)
- Formatting rules (temperatures, measurements, section separators)
- OG image workflow
- Scheduling instructions
- Complete examples

**Quick start:**

1. **Create a new recipe file**:
   ```bash
   touch content/recipes/recipe-your-recipe-name.md
   ```

2. **Use the template**: Copy the front matter template from `docs/recipe-template.md` and fill in your recipe details

3. **Follow the structure**: See the template for the standard content structure (description, snapshot, ingredients, method, notes)

4. **Generate OG image**: 
   - Run `npm run generate:og-images` to generate SVG files in `static/images/social/working-files/`
   - Edit the SVG file if needed
   - Convert to PNG: `npm run generate:png -- static/images/social/working-files/recipe-xxx-og.svg`
   - The PNG will be saved in `static/images/social/` for use as the OG image
   - Add `social_image: "/images/social/recipe-xxx-og.png"` to front matter

5. **Test**: Run `npm run build && npm run test:content` to validate

#### Dietary labels (optional)

Recipes can include a `dietary` front matter array for filtering and icon display. **Labels apply to the base recipe only** (main Ingredients and Method). Use exactly these values (lowercase, hyphenated):

| Label | Definition |
|-------|------------|
| **dairy-free** | Base recipe contains no milk, cream, butter, cheese, or other dairy. |
| **vegetarian** | Base recipe contains no meat, poultry, or fish. Eggs and dairy allowed. |
| **vegan** | Base recipe contains no animal products (no meat, fish, eggs, dairy, honey, etc.). |
| **gluten-free** | Base recipe contains no wheat, barley, rye, or ingredients derived from them. |

If anything in the **Notes** section (e.g. a serving suggestion or variation) would change the classification (e.g. "Serve with bread" on a gluten-free recipe), explicitly say so in that note: e.g. "The gluten-free label applies to the base recipe; serving with bread adds gluten." See `docs/recipe-template.md` for full definitions and the Notes rule.

### Recipe Print Functionality

Recipe pages include optimized print functionality:

**Features:**
- **Print icon button** at the top-right of the recipe header for quick access
- **Print and Email buttons** at the bottom of the recipe content (before "Make something else" section)
- **Optimized print stylesheet** that:
  - Hides navigation, headers, footers, and non-essential content
  - Uses serif fonts (Georgia) for better readability on paper
  - Displays black text on white background
  - Shows link URLs in parentheses (since links don't work on paper)
  - Includes recipe URL at the bottom for reference
  - Controls page breaks to avoid awkward splits

**Analytics tracking:**
- Print button clicks are tracked in Plausible Analytics as "Print Recipe" events
- Email button clicks are tracked as "Email Recipe" events
- Both include custom properties (recipe title and URL) for detailed analytics

**How it works:**
- Users can click the print icon at the top or the "Print" button at the bottom
- Both trigger the browser's native print dialog
- The print stylesheet automatically optimizes the layout for printing
- Email button opens the user's default email client with pre-filled subject and body

**Testing:**
- Print functionality is validated by `npm run test:content`
- Tests verify print buttons exist, print stylesheet is present, and email links are properly formatted

### Updating Existing Pages

- **Homepage**: Edit `content/_index.md`
- **About**: Edit `content/about/index.md`
- **Thoughts listing page**: Edit `content/thoughts/_index.md`

### Hugo Content Organization Tips

- **Drafts**: Set `draft: true` to work on content without publishing
- **Draft file naming (thoughts only)**: Prefix draft thoughts files with `draft-` for easy identification (e.g., `draft-my-post.md`). The `slug` field in front matter determines the URL, so "draft" won't appear in production URLs.
- **Future dates**: Hugo won't show posts with future dates unless in draft mode
- **URL structure**: Files in `thoughts/` become `/thoughts/filename/` (or use the `slug` field in front matter)
- **Ordering**: Hugo sorts by date (newest first) by default

### 📅 Scheduling Posts for Auto-Publication

The site includes an automated scheduling system that publishes draft posts when their publish date arrives.

**How it works:**
1. Create your post with `draft: true` and set a future `date` in the front matter
2. The GitHub Actions workflow runs twice daily (at 13:00 and 14:00 UTC) to cover both PDT and PST timezones, and checks for posts ready to publish
3. When a post's date arrives (or has passed), it automatically sets `draft: false` and commits the change
4. Netlify rebuilds the site on commit, and your post goes live

**Setting up a scheduled post:**

**Required front matter:**
```yaml
---
title: "Your Post Title"
date: 2025-12-15  # The date you want it to publish (YYYY-MM-DD format)
draft: true        # MUST be true for scheduling to work
description: "Your description"
subtitle: "Your subtitle"
---
```

**How it works:**
1. The GitHub Actions workflow runs twice daily at:
   - 13:00 UTC (covers PDT, when 6am PT = 13:00 UTC)
   - 14:00 UTC (covers PST, when 6am PT = 14:00 UTC)

2. The script checks if:
   - The post has `draft: true`
   - The `date` has passed and it's 6am PT or later on that date
   - The post is not marked with `skip_scheduling: true`

3. When conditions are met:
   - The script sets `draft: false`
   - The change is committed and pushed
   - Netlify rebuilds the site
   - The post goes live

**Important timing details:**
- **Publication time**: Posts publish at **6am Pacific Time** on the scheduled date
- If you schedule for December 15, 2025, it will publish on December 15, 2025 at 6am PT (or later, depending on when the workflow runs)
- The workflow runs twice daily, so it will publish during one of those two check times

**Drafts without dates:**
A draft without a `date` field will **never** auto-publish. This is useful for:
- Work-in-progress posts
- Ideas you're not ready to schedule
- Posts you want to manually publish later

Example:
```yaml
---
title: "My Work in Progress"
draft: true
# No date field - will never auto-publish
description: "Still working on this"
---
```

**Preventing auto-publishing:**
If you want a draft to never auto-publish (even with a date set), add:
```yaml
---
draft: true
skip_scheduling: true  # Prevents auto-publishing
date: 2025-12-15
---
```

**Testing before scheduling:**
Test locally to see what would be published:
```bash
npm run schedule-posts
```
This shows which posts would be published without making any changes.

**Example: Scheduling a post for December 20, 2025**
```yaml
---
title: "My Scheduled Thought"
date: 2025-12-20
draft: true
description: "This will publish on December 20, 2025 at 6am PT"
subtitle: "A scheduled post"
---
```
This will:
- Stay as a draft until December 20, 2025
- Publish on December 20, 2025 at 6am PT (or later during the workflow run)
- Not publish before that date/time

**Summary checklist:**
- ✅ `draft: true` in front matter
- ✅ Future `date` in YYYY-MM-DD format
- ✅ No `skip_scheduling: true` (unless you want to prevent auto-publishing)
- ✅ Commit and push the file to the repository

**Additional notes:**
- **Recipes**: Scheduled recipes must have `social_image` set in front matter before the publish date, or they will be skipped (to ensure OG images are reviewed)
- **Manual trigger**: You can manually trigger the workflow from the GitHub Actions tab if needed

**Workflow location:** `.github/workflows/schedule-posts.yml`

### 🔒 Security & Dependency Monitoring

The site includes automated security and dependency checking to ensure you're running secure, up-to-date versions of all tools and packages.

**How it works:**
1. A GitHub Actions workflow runs monthly (on the 1st of each month at 9am UTC)
2. Checks Hugo version, npm dependencies, Node.js version, and GitHub Actions
3. Runs `npm audit` to detect security vulnerabilities
4. Checks for outdated packages
5. Creates a GitHub Issue if security issues or updates are found
6. You'll receive email notifications from GitHub if you have issue notifications enabled

**Manual checks:**
```bash
npm run check:hugo          # Check Hugo version only
npm run check:dependencies # Check all dependencies (npm, Node.js, GitHub Actions)
```

**What gets checked:**
- **Hugo version**: Current version vs latest, known CVEs
- **npm packages**: Security vulnerabilities (`npm audit`), outdated packages
- **Node.js version**: Current vs latest LTS
- **GitHub Actions**: Versions used in workflows

**Email notifications:**
- GitHub will automatically send email notifications when issues are created
- Make sure you have GitHub email notifications enabled for your repository
- Go to GitHub Settings → Notifications → Issues to configure

**What triggers an issue:**
- **Security issues**: Hugo CVEs or npm vulnerabilities (critical/high severity)
- **Updates available**: Newer versions of Hugo, Node.js, or npm packages
- **Up to date**: No issue is created if everything is current

**Workflow location:** `.github/workflows/security-check.yml`

**Individual check workflows:**
- `.github/workflows/check-hugo-version.yml` - Hugo-only check (legacy, use security-check.yml instead)

## 📣 Social Sharing Images (Open Graph)

- Place all social sharing images in `static/images/social/`.
- To set a custom image for a post, add this to the post's front matter:
  ```yaml
  social_image: "/images/social/your-image.png"
  ```
- To set a default image for all pages, update `config.toml`:
  ```toml
  default_social_image = "/images/social/default-og.png"
  ```
- The site will use the post-specific image if set, otherwise the default.
- These images are used for Open Graph and Twitter card previews when your content is shared on social media.

### Generating OG Images for Recipes

The site includes automated OG image generation for recipes:

1. **Generate SVG files**: Run `npm run generate:og-images`
   - Creates editable SVG files in `static/images/social/working-files/`
   - Skips recipes that already have a `social_image` set

2. **Edit if needed**: Open the SVG file in your editor to make adjustments

3. **Convert to PNG**: Run `npm run generate:png -- static/images/social/working-files/recipe-xxx-og.svg`
   - Converts the SVG to PNG format (required for social media platforms)
   - Saves the PNG in `static/images/social/`

4. **Add to front matter**: Add `social_image: "/images/social/recipe-xxx-og.png"` to your recipe's front matter

**Note**: Social media platforms (Twitter, Facebook, LinkedIn) don't support SVG for OG images, so PNG conversion is required.

### Optimizing Images

The site includes a script to optimize image file sizes while maintaining visual quality:

**Basic usage:**
```bash
npm run optimize:images -- static/images/file.jpg
npm run optimize:images -- static/images/*.jpg  # Multiple files
```

**With automatic backup cleanup:**
```bash
npm run optimize:images -- --cleanup-backups static/images/file.jpg
```

**Manual backup cleanup:**
```bash
npm run cleanup:backups
```

**How it works:**
- Creates `.backup` files before optimizing (safety feature)
- Compresses images using Sharp with quality settings optimized for web
- Resizes images larger than 2400px (max width/height)
- Shows compression statistics (original size, new size, reduction percentage)

**Backup files:**
- Backup files (`.backup` extension) are automatically ignored by git
- Use `--cleanup-backups` flag to automatically delete backups after successful optimization
- Or run `npm run cleanup:backups` to manually clean up existing backups
- The cleanup script only deletes backups where the optimized file exists and is newer (indicating successful optimization)

## 🎨 Styling

The site uses custom CSS located in `static/css/`:

- `main.css` - Core styles, layout, and responsive design
- `custom.css` - Custom styling and overrides

### Responsive Design Features

- Mobile-first approach with breakpoints at 768px and 480px
- Optimized header layout for mobile devices
- Responsive typography and spacing
- Touch-friendly navigation elements
- Fluid layouts that adapt to different screen sizes

### Favicon Implementation

The site uses a comprehensive favicon setup with multiple sizes and formats:

- Standard favicon.ico for legacy browsers
- PNG favicons in multiple sizes (16x16, 32x32)
- Apple Touch Icon for iOS devices
- Android Chrome icons (192x192, 512x512)
- Web manifest for PWA support

## 🧪 Testing

The project includes comprehensive test coverage to ensure content quality and site integrity.

### Running Tests

```bash
# Run all tests (builds site first, then validates)
npm test

# Run only content validation tests
npm run test:content

# Run HTML validation
npm run test:html

# Check for broken links (starts server, runs check, stops server)
npm run test:links
```

### Test Coverage

The test suite includes:

**Mobile & Responsive Design** (`tests/mobile-responsive.test.js`):
- Viewport meta tag validation
- CSS media query breakpoints (768px, 480px)
- Mobile-specific style patterns
- Responsive image handling
- Mobile layout fixes (404 page, featured posts, etc.)

**Content validation** (`tests/content-checks.js` - modular structure in `tests/content-checks/`):

- **Content Structure**:
  - Homepage sections (hero, Recent Thoughts, Let's Connect)
  - Front matter validation for thoughts and recipes
  - No duplicate recipe page content (identical body in multiple files)
  - Required fields and data format validation
  - Date format validation (YYYY-MM-DD)
  - Recipe schema validation (times, ingredients, instructions)
  - Dietary labels: only `dairy-free`, `vegetarian`, `vegan`, `gluten-free` allowed; no duplicates (base recipe only; see recipe-template.md)

- **Assets**:
  - Social image existence (thoughts and recipes)
  - Static asset checks (CSS files, favicons, default images)
  - RSS feed structure and validity
  - Sitemap structure and validity

- **Site Structure**:
  - About page validation
  - 404 error page structure
  - Permalink structure validation
  - Recipe index page validation
  - Context-aware RSS link validation
  - OG image validation on all pages
  - Draft URL validation (ensures "draft" never appears in thoughts URLs)

- **Quality Checks**:
  - HTML validation (via html-validate)
  - Broken link detection (via broken-link-checker)

**Additional test suites**:

- **Spell checking** (`tests/spell-check.js`):
  - Checks spelling in markdown content files
  - By default, only checks modified files (git diff)
  - Use `--all` flag to check all files
  - Add valid words to `cspell.json` for false positives

- **OG image generation** (`tests/og-image-generation.test.js`):
  - Validates OG image generation script
  - Ensures images are generated correctly for recipes

- **Scheduled posts** (`tests/schedule-posts.test.js`):
  - Validates scheduled posts workflow
  - Ensures posts are published at the correct time

- **Recipe search JSON** (`tests/recipe-search-json.test.js`):
  - Validates recipe search JSON index structure
  - Ensures all required fields are present
  - Verifies drafts are excluded
  - Validates date format (ISO 8601)
  - Tests edge cases (0 recipes, 1 recipe, multiple recipes)

- **Recipe template** (`tests/recipe-template.test.js`):
  - Validates recipe template structure compliance
  - Ensures recipes follow the template guidelines

- **Dietary labels** (`tests/dietary-labels.test.js`) and content-checks recipe front matter:
  - Allowed values only: `dairy-free`, `vegetarian`, `vegan`, `gluten-free` (labels apply to base recipe only; see docs)
  - Rejects invalid or duplicate values
  - Each allowed value validated

- **Recipe print functionality** (`tests/content-checks/recipes.js`):
  - Validates print buttons exist on recipe pages
  - Checks print stylesheet has required @media print rules
- **Printability** (`tests/content-checks/printability.js`):
  - Validates print stylesheet has hide/show rules for all page types (header, footer, .no-print, .hero, .article-content, .about-content, sections, recipe index)
  - Validates key pages (homepage, about, thoughts list, recipe index, thought single) have the HTML structure (classes) required for print CSS
  - Verifies email link format and parameters
  - Ensures print-only URL footer exists

**Note**: Always run `npm run build` before running content tests, as they validate the generated `public/` directory.

## 🤖 AI Assistant Guidelines

This project includes an `agents.md` file with detailed guidelines for AI coding assistants (Cursor, GitHub Copilot, etc.). It covers:

- Protected elements that must not be modified
- Content creation patterns and conventions
- Testing requirements
- Brand guidelines reference
- Common tasks and workflows

If you're using an AI assistant to work on this project, refer to `agents.md` for project-specific context and constraints.

## 🔍 SEO & Analytics

- **Meta Tags**: Configured in `config.toml` for optimal SEO
- **Analytics**: Privacy-friendly analytics via Plausible
  - **Outbound link tracking**: Automatically tracks clicks on external links
  - **Custom events**: Print and Email recipe buttons are tracked with custom properties
- **Ahrefs Web Analytics**: Simple, privacy-friendly traffic monitoring via a script in the site head
- **RSS Feed**: Available at `/index.xml` for content syndication
- **Social Media**: Open Graph tags for better social sharing
- **Recipe Search**: JSON index available at `/recipes/index.json` for client-side recipe search functionality

## 🔄 Deployment

The site is automatically deployed to Netlify when changes are pushed to the master branch. The deployment process includes:

1. Building the site with Hugo
2. Minifying assets
3. Applying Netlify headers and redirects
4. Deploying to the CDN

## 📝 License

This project is private and proprietary. All rights reserved.
