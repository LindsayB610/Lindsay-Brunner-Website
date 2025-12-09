# Lindsay Brunner - Personal Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/e566bc7d-91da-44d9-836f-389a1d193c75/deploy-status)](https://app.netlify.com/projects/angry-minsky-477f42/deploys)

> Experienced content strategist, developer advocacy leader, and actually kinda cool human who transforms complex technology concepts into content experiences that developers and technical audiences love.

This is the source code for Lindsay Brunner's personal website, built with Hugo and Builder.io and deployed on Netlify. The site showcases expertise in developer advocacy, content strategy, and technical leadership.

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
- `npm run build` - Build the site for production with minification
- `npm run start` - Alternative command to start the development server
- `npm run serve` - Serve the site without draft content
- `npm run clean` - Remove the generated `public` directory
- `npm run test` - Run all tests (builds site, validates HTML, checks links, validates content)
- `npm run test:content` - Run content validation tests only
- `npm run test:html` - Validate generated HTML
- `npm run test:links` - Check for broken internal links
- `npm run schedule-posts` - Check and auto-publish scheduled posts (runs automatically via GitHub Actions)

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
│   ├── 404.html         # 404 error page
│   └── index.html       # Homepage layout
├── static/              # Static assets
│   ├── css/             # Stylesheets
│   ├── favicons/        # Site favicons
│   ├── images/          # Site images
│   │   └── social/      # Social sharing (Open Graph) images for posts and default site image
│   ├── _headers         # Netlify headers configuration
│   └── _redirects       # Netlify redirects configuration
├── tests/                # Test files
│   └── content-checks.js # Content validation tests
├── agents.md            # AI assistant guidelines (for Cursor, Copilot, etc.)
├── BRAND.md             # Brand guidelines and design system
├── config.toml          # Hugo site configuration
├── netlify.toml         # Netlify deployment configuration
└── package.json         # Node.js dependencies and scripts
```

## ✍️ Content Management

### Adding New Thought Leadership Content

The "thoughts" section is where Lindsay shares insights on developer advocacy, content strategy, and technical leadership. Here's how to add new .md files:

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
   ```

3. **Set up the front matter** (the metadata at the top of your .md file):

   ```markdown
   ---
   title: "Your Thought Title"
   date: 2024-01-15T10:30:00Z
   draft: false
   description: "A compelling description that will appear in listings and SEO"
   subtitle: "A brief subtitle or first sentence that appears on the homepage"
   ---

   Your thought leadership content goes here...
   ```

4. **Front matter options for thoughts**:

   - `title`: The main title of your piece
   - `date`: Publication date (Hugo sorts by this)
   - `draft`: Set to `true` to hide from production, `false` to publish
   - `description`: Used for SEO and content previews
   - `subtitle`: Brief subtitle or first sentence for homepage preview

5. **Write your content** using Markdown syntax:

   ```markdown
   ## Your Section Header

   Your thoughtful insights here. You can use:

   - **Bold text** for emphasis
   - _Italic text_ for subtle emphasis
   - `code snippets` for technical terms
   - [Links](https://example.com) to external resources

   ### Subsections

   Break up your thoughts into digestible sections.

   > Use blockquotes for important insights or quotes
   ```

6. **Preview your work**:

   ```bash
   # Start the development server to see your changes
   npm run dev

   # Visit http://localhost:1313/thoughts/ to see your new content
   ```

7. **File naming conventions**:
   - Use lowercase letters
   - Use hyphens instead of spaces: `my-great-thought.md`
   - Be descriptive but concise: `future-of-developer-experience.md`
   - Avoid special characters or numbers at the start

### Adding New Recipe Content

The "recipes" section showcases tested recipes and kitchen experiments. Here's how to add new recipe files:

1. **Create a new recipe file**:

   ```bash
   # Create the file in the recipes directory with recipe- prefix
   touch content/recipes/recipe-your-recipe-name.md
   ```

2. **Set up the front matter** with all required fields:

   ```markdown
   ---
   title: "Your Recipe Title"
   date: 2025-01-15
   slug: "recipe-your-recipe-name"
   subtitle: "Brief subtitle or description"
   description: "A compelling description for SEO and listings"
   draft: false
   prepTime: "PT30M"        # ISO 8601 duration format
   cookTime: "PT45M"         # ISO 8601 duration format
   totalTime: "PT75M"        # ISO 8601 duration format
   recipeYield: "6-8 servings"
   recipeCategory: "Main Course"
   recipeCuisine: "American"
   recipeIngredient:
     - "1 cup ingredient one"
     - "2 tbsp ingredient two"
   recipeInstructions:
     - "Step one instructions"
     - "Step two instructions"
   ---
   ```

3. **Required recipe front matter fields**:
   - `title`, `date`, `description`, `subtitle`, `draft` (same as thoughts)
   - `prepTime`, `cookTime`, `totalTime` (ISO 8601 format: PT30M = 30 minutes)
   - `recipeYield` (string, e.g., "6-8 servings")
   - `recipeCategory` (string, e.g., "Main Course", "Dessert")
   - `recipeCuisine` (string, e.g., "American", "Japanese-American")
   - `recipeIngredient` (YAML array of strings)
   - `recipeInstructions` (YAML array of strings)

4. **File naming**: Always use `recipe-` prefix (e.g., `recipe-bachan-pulled-pork.md`)

5. **Permalink structure**: Recipes use `/recipes/:year-:month-:day/:slug/` format (with trailing slash)

6. **🔒 OG Image Review (Required for Published Recipes)**:
   
   Published recipes **must** have `social_image` explicitly set in front matter. This enforces manual review of OG images before publishing.
   
   **Workflow:**
   ```bash
   # 1. Generate OG images for all recipes
   npm run generate:og-images
   
   # 2. Review the generated image(s) in static/images/social/
   #    Look for: recipe-{slug}-og.svg
   
   # 3. Add the social_image field to your recipe front matter:
   social_image: "/images/social/recipe-{slug}-og.svg"
   
   # 4. Set draft: false when ready to publish
   ```
   
   **Why?** Tests will fail if a published recipe doesn't have `social_image` set. This ensures:
   - OG images are visually reviewed before going live
   - No accidental publishing with broken/missing images
   - Consistent quality control for social sharing
   
   **Note:** Drafts don't require `social_image` (they're skipped in validation), but you can still generate images for preview purposes.

### Updating Existing Pages

- **Homepage**: Edit `content/_index.md`
- **About**: Edit `content/about/index.md`
- **Thoughts listing page**: Edit `content/thoughts/_index.md`

### Hugo Content Organization Tips

- **Drafts**: Set `draft: true` to work on content without publishing
- **Future dates**: Hugo won't show posts with future dates unless in draft mode
- **URL structure**: Files in `thoughts/` become `/thoughts/filename/`
- **Ordering**: Hugo sorts by date (newest first) by default

### 📅 Scheduling Posts for Auto-Publication

The site includes an automated scheduling system that publishes draft posts when their publish date arrives.

**How it works:**
1. Create your post with `draft: true` and set a future `date` in the front matter
2. The GitHub Actions workflow runs every hour and checks for posts ready to publish
3. When a post's date arrives (or has passed), it automatically sets `draft: false` and commits the change
4. Netlify rebuilds the site on commit, and your post goes live

**Setting up a scheduled post:**
```yaml
---
title: "My Scheduled Post"
date: 2025-12-15  # Future date
draft: true        # Will be auto-changed to false when date arrives
description: "This post will auto-publish on December 15, 2025"
---
```

**Important notes:**
- **Recipes**: Scheduled recipes must have `social_image` set in front matter before the publish date, or they will be skipped (to ensure OG images are reviewed)
- **Timing**: Posts are checked hourly, so a post scheduled for 9:00 AM will publish between 9:00-9:59 AM
- **Testing**: Run `npm run schedule-posts` locally to test which posts would be published
- **Manual trigger**: You can manually trigger the workflow from the GitHub Actions tab if needed

**Workflow location:** `.github/workflows/schedule-posts.yml`

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

# Check for broken links (requires dev server running)
npm run test:links
```

### Test Coverage

The test suite includes:

**Content validation** (`tests/content-checks.js`):

- **Content Structure**:
  - Homepage sections (hero, Recent Thoughts, Let's Connect)
  - Front matter validation for thoughts and recipes
  - Required fields and data format validation
  - Date format validation (YYYY-MM-DD)
  - Recipe schema validation (times, ingredients, instructions)

- **Assets**:
  - Social image existence (thoughts and recipes)
  - Static asset checks (CSS files, favicons, default images)
  - About page image references

- **Site Structure**:
  - RSS feed structure and validity
  - Sitemap structure and validity
  - 404 error page structure
  - Permalink structure validation

- **Quality Checks**:
  - HTML validation (via html-validate)
  - Broken link detection (via broken-link-checker)

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
- **Ahrefs Web Analytics**: Simple, privacy-friendly traffic monitoring via a script in the site head
- **RSS Feed**: Available at `/index.xml` for content syndication
- **Social Media**: Open Graph tags for better social sharing

## 🔄 Deployment

The site is automatically deployed to Netlify when changes are pushed to the master branch. The deployment process includes:

1. Building the site with Hugo
2. Minifying assets
3. Applying Netlify headers and redirects
4. Deploying to the CDN

## 📝 License

This project is private and proprietary. All rights reserved.
