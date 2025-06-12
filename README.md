# Lindsay Brunner - Personal Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_NETLIFY_BADGE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_SITE_NAME/deploys)

> Experienced content strategist, developer advocacy leader, and actually kinda cool human who transforms complex technology concepts into content experiences that developers and technical audiences love.

This is the source code for Lindsay Brunner's personal website, built with Hugo and deployed on Netlify. The site showcases expertise in developer advocacy, content strategy, and technical leadership.

## 🚀 Live Site

Visit the live site at: [lindsaybrunner.com](https://lindsaybrunner.com)

## 🛠 Tech Stack

- **Static Site Generator**: [Hugo](https://gohugo.io/) v0.147.8+
- **Styling**: Custom CSS with modern design principles
- **Hosting**: [Netlify](https://netlify.com) with continuous deployment
- **Content Management**: Markdown files with Hugo's content organization
- **Performance**: Optimized with Hugo's built-in minification and asset processing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) v18.0.0 or higher
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
│   ├── blog/            # Blog section
│   ├── contact/         # Contact page
│   ├── thoughts/        # Thought leadership content
│   └── _index.md        # Homepage content
├── layouts/             # Hugo templates
│   ├── _default/        # Default page layouts
│   ├── partials/        # Reusable template components
│   ├── about/           # About page specific layout
│   ├── blog/            # Blog specific layouts
│   ├── contact/         # Contact page layout
│   ├── thoughts/        # Thoughts section layout
│   ├── 404.html         # 404 error page
│   └── index.html       # Homepage layout
├── static/              # Static assets
│   ├── css/             # Stylesheets
│   ├── _headers         # Netlify headers configuration
│   └── _redirects       # Netlify redirects configuration
├── config.toml          # Hugo site configuration
├── netlify.toml         # Netlify deployment configuration
└── package.json         # Node.js dependencies and scripts
```

## ✍️ Content Management

### Adding New Blog Posts

1. Create a new Markdown file in the appropriate section:

   ```bash
   # For blog posts
   hugo new blog/your-post-title.md

   # For thought leadership content
   hugo new thoughts/your-thought-title.md
   ```

2. Edit the front matter and content:

   ```markdown
   ---
   title: "Your Post Title"
   date: 2024-01-01T00:00:00Z
   draft: false
   description: "Brief description of your post"
   ---

   Your content here...
   ```

3. Preview your changes with `npm run dev`

### Updating Pages

- **Homepage**: Edit `content/_index.md`
- **About**: Edit `content/about/index.md`
- **Contact**: Edit `content/contact/_index.md`

## 🎨 Styling

The site uses custom CSS located in `static/css/`:

- `main.css` - Core styles and layout
- `custom.css` - Custom styling and overrides

Key design elements:

- Dark theme with gradient accents
- Space Grotesk and Inter font families
- Mobile-first responsive design
- Smooth animations and transitions

## 🚢 Deployment

The site is automatically deployed to Netlify when changes are pushed to the main branch.

### Manual Deployment

1. **Build the site**

   ```bash
   npm run build
   ```

2. **Deploy the `public` folder** to your hosting provider

### Netlify Configuration

The site uses the following Netlify configuration in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `public`
- Node.js version: 18+

## 🔧 Configuration

### Hugo Configuration

Key settings in `config.toml`:

- Site title and description
- Navigation menu items
- Social media links
- SEO settings

### Performance Optimization

The site includes several performance optimizations:

- Minified CSS and HTML
- Optimized images
- Efficient caching headers
- Fast loading fonts

## 🤝 Contributing

While this is a personal website, suggestions and improvements are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

Lindsay Brunner

- Website: [lindsaybrunner.com](https://lindsaybrunner.com)
- GitHub: [@LindsayB610](https://github.com/LindsayB610)
- LinkedIn: [Lindsay Brunner](https://www.linkedin.com/in/lindsaybrunner/)

---

⚡ Built with [Hugo](https://gohugo.io/) • Deployed on [Netlify](https://netlify.com) • Made with ❤️ and lots of ☕
