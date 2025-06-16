# Lindsay Brunner - Personal Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/e566bc7d-91da-44d9-836f-389a1d193c75/deploy-status)](https://app.netlify.com/projects/angry-minsky-477f42/deploys)

> Experienced content strategist, developer advocacy leader, and actually kinda cool human who transforms complex technology concepts into content experiences that developers and technical audiences love.

This is the source code for Lindsay Brunner's personal website, built with Hugo and Builder.io and deployed on Netlify. The site showcases expertise in developer advocacy, content strategy, and technical leadership.

## 🚀 Live Site

Visit the live site at: [lindsaybrunner.com](https://lindsaybrunner.com)

## 🛠 Tech Stack

- **Static Site Generator**: [Hugo](https://gohugo.io/) v0.121.0+
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

## 📁 Project Structure

```
├── archetypes/          # Content templates
├── content/             # Site content (Markdown files)
│   ├── about/           # About page content
│   ├── thoughts/        # Thought leadership content
│   └── _index.md        # Homepage content
├── layouts/             # Hugo templates
│   ├── _default/        # Default page layouts
│   ├── partials/        # Reusable template components
│   ├── about/           # About page specific layout
│   ├── thoughts/        # Thoughts section layout
│   ├── 404.html         # 404 error page
│   └── index.html       # Homepage layout
├── static/              # Static assets
│   ├── css/             # Stylesheets
│   ├── favicons/        # Site favicons
│   ├── _headers         # Netlify headers configuration
│   └── _redirects       # Netlify redirects configuration
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

### Updating Existing Pages

- **Homepage**: Edit `content/_index.md`
- **About**: Edit `content/about/index.md`
- **Thoughts listing page**: Edit `content/thoughts/_index.md`

### Hugo Content Organization Tips

- **Drafts**: Set `draft: true` to work on content without publishing
- **Future dates**: Hugo won't show posts with future dates unless in draft mode
- **URL structure**: Files in `thoughts/` become `/thoughts/filename/`
- **Ordering**: Hugo sorts by date (newest first) by default

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

## 🔍 SEO & Analytics

- **Meta Tags**: Configured in `config.toml` for optimal SEO
- **Analytics**: Privacy-friendly analytics via Plausible
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
