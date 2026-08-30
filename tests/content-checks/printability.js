/**
 * Printability tests: ensure print stylesheet and page structures
 * support a good print experience (Ctrl/Cmd+P) across all page types.
 */

const fs = require('fs');
const path = require('path');
const {
  publicDir,
  staticDir,
  homepagePath,
  aboutPagePath,
  recipeIndexPath1,
  recipeIndexPath2,
  recipeIndexPath3,
  recipeIndexPath4,
  blogDir,
  parseFrontMatter
} = require('./utils');

const customCssPath = path.join(staticDir, 'css', 'custom.css');

/**
 * Required @media print selectors that must exist for print to work site-wide.
 * - Hide: header, footer, nav, supplementary sections
 * - Show/style: hero, article content, about content, sections, recipe index
 */
const REQUIRED_PRINT_HIDE_SELECTORS = [
  '.site-header',
  '.site-footer',
  '.no-print',
  'section.no-print'
];

const REQUIRED_PRINT_STYLE_SELECTORS = [
  '@media print',
  '@page',
  '.article-content',
  '.hero',
  '.about-content',
  'main .section',
  '.recipe-index-'
];

/**
 * Validate that custom.css has a complete print stylesheet for all page types.
 */
function validatePrintStylesheet() {
  console.log('\n🖨️  Validating print stylesheet...');

  if (!fs.existsSync(customCssPath)) {
    console.error('❌ Print stylesheet not found: custom.css');
    process.exit(1);
  }

  const css = fs.readFileSync(customCssPath, 'utf8');
  const errors = [];

  if (!css.includes('@media print')) {
    errors.push('custom.css must contain @media print block');
  }

  REQUIRED_PRINT_HIDE_SELECTORS.forEach(selector => {
    if (!css.includes(selector)) {
      errors.push(`Print stylesheet should hide ${selector} in @media print`);
    }
  });

  REQUIRED_PRINT_STYLE_SELECTORS.forEach(selector => {
    if (!css.includes(selector)) {
      errors.push(`Print stylesheet should include styles for ${selector}`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ Print stylesheet validation failed:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log('   ✓ @media print block and required selectors present');
  console.log('✅ Print stylesheet is valid.');
}

/**
 * Resolve the recipe index HTML path (Hugo may output to different locations).
 */
function getRecipeIndexPath() {
  if (fs.existsSync(recipeIndexPath1)) return recipeIndexPath1;
  if (fs.existsSync(recipeIndexPath2)) return recipeIndexPath2;
  if (fs.existsSync(recipeIndexPath3)) return recipeIndexPath3;
  if (fs.existsSync(recipeIndexPath4)) return recipeIndexPath4;
  return null;
}

/**
 * Find one published blog and return its built HTML path.
 */
function getOneBlogSinglePath() {
  const files = fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md') && f !== '_index.md' && !f.startsWith('draft-'));
  for (const file of files) {
    const frontMatter = parseFrontMatter(path.join(blogDir, file));
    if (!frontMatter || frontMatter.draft === true || frontMatter.draft === 'true') continue;
    const date = frontMatter.date;
    const slug = frontMatter.slug || path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    if (!date || !slug) continue;
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) continue;
    const [, year, month, day] = dateMatch;
    const htmlPath = path.join(publicDir, 'blog', `${year}-${month}-${day}`, slug, 'index.html');
    if (fs.existsSync(htmlPath)) return htmlPath;
  }
  return null;
}

/**
 * Validate that key pages have the HTML structure (classes) that print CSS expects.
 */
function validatePrintablePageStructures() {
  console.log('\n🖨️  Validating printable page structures...');

  const errors = [];
  let checks = 0;

  // Homepage: hero and sections must exist for print (minified HTML may use class=hero)
  if (fs.existsSync(homepagePath)) {
    checks++;
    const html = fs.readFileSync(homepagePath, 'utf8');
    if (!html.includes('class="hero') && !html.includes("class='hero") && !html.includes('class=hero')) {
      errors.push('Homepage must contain .hero for print');
    }
    if (!html.includes('class="section') && !html.includes("class='section") && !html.includes('class=section')) {
      errors.push('Homepage must contain .section for print');
    }
  }

  // About: about-content must exist
  if (fs.existsSync(aboutPagePath)) {
    checks++;
    const html = fs.readFileSync(aboutPagePath, 'utf8');
    if (!html.includes('about-content')) {
      errors.push('About page must contain .about-content for print');
    }
  }

  // Blog list: section and featured-post (minified HTML may use class=section)
  const blogListPath = path.join(publicDir, 'blog', 'index.html');
  if (fs.existsSync(blogListPath)) {
    checks++;
    const html = fs.readFileSync(blogListPath, 'utf8');
    if (!html.includes('class="section') && !html.includes("class='section") && !html.includes('class=section')) {
      errors.push('Blog list must contain .section for print');
    }
    if (!html.includes('featured-post')) {
      errors.push('Blog list must contain .featured-post for print');
    }
  }

  // Recipe index: recipe-index structure (one of the possible paths)
  const recipeIndexPath = getRecipeIndexPath();
  if (recipeIndexPath) {
    checks++;
    const html = fs.readFileSync(recipeIndexPath, 'utf8');
    if (!html.includes('recipe-index') && !html.includes('recipe-index-categories-grid')) {
      errors.push('Recipe index page must contain .recipe-index or .recipe-index-categories-grid for print');
    }
  }

  // One blog post: article-content and no-print on supplementary sections
  const blogSinglePath = getOneBlogSinglePath();
  if (blogSinglePath) {
    checks++;
    const html = fs.readFileSync(blogSinglePath, 'utf8');
    if (!html.includes('article-content')) {
      errors.push('Blog post page must contain .article-content for print');
    }
    if (!html.includes('no-print')) {
      errors.push('Blog post page must mark supplementary sections with .no-print');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Printable page structure validation failed:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log(`   ✓ Checked ${checks} page type(s) for print structure`);
  console.log('✅ Printable page structures are valid.');
}

/**
 * Run all printability validations.
 */
function validatePrintability() {
  validatePrintStylesheet();
  validatePrintablePageStructures();
}

module.exports = {
  validatePrintability,
  validatePrintStylesheet,
  validatePrintablePageStructures
};
