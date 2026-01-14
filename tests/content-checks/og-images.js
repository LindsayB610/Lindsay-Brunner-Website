const fs = require('fs');
const path = require('path');
const {
  homepagePath,
  aboutPagePath,
  error404Path,
  recipeIndexPath1,
  publicDir,
  thoughtsDir,
  recipesDir,
  staticDir,
  parseFrontMatter
} = require('./utils');

function validateAllPagesHaveOGImages() {
  console.log('\n🖼️  Validating OG images on all pages...');
  
  const errors = [];
  const warnings = [];
  
  // Helper function to check OG image in HTML content
  function checkOGImage(htmlContent, pagePath) {
    // Look for og:image meta tag
    // Pattern: <meta property="og:image" content="..." />
    const ogImageMatch = htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/);
    
    if (!ogImageMatch) {
      errors.push(`${pagePath}: Missing og:image meta tag`);
      return;
    }
    
    const imageUrl = ogImageMatch[1];
    
    // Extract the path from the URL (remove base URL if present)
    let imagePath = imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Extract path from full URL
      try {
        const url = new URL(imageUrl);
        imagePath = url.pathname;
      } catch (e) {
        warnings.push(`${pagePath}: Could not parse image URL: ${imageUrl}`);
        return;
      }
    }
    
    // Remove leading slash for path joining
    if (imagePath.startsWith('/')) {
      imagePath = imagePath.substring(1);
    }
    
    // Check if image exists
    const fullImagePath = path.join(staticDir, imagePath);
    if (!fs.existsSync(fullImagePath)) {
      errors.push(`${pagePath}: OG image not found: ${imageUrl} (checked: ${fullImagePath})`);
    } else {
      // Verify it's not empty
      try {
        const stats = fs.statSync(fullImagePath);
        if (stats.size === 0) {
          errors.push(`${pagePath}: OG image is empty: ${imageUrl}`);
        }
      } catch (err) {
        errors.push(`${pagePath}: Error checking OG image: ${err.message}`);
      }
    }
  }
  
  // List of key pages to check
  const keyPages = [
    { path: homepagePath, name: 'Homepage' },
    { path: aboutPagePath, name: 'About page' },
    { path: error404Path, name: '404 page' },
    { path: path.join(publicDir, 'recipes', 'index.html'), name: 'Recipes list page' },
    { path: path.join(publicDir, 'thoughts', 'index.html'), name: 'Thoughts list page' },
    { path: recipeIndexPath1, name: 'Recipe index page (/recipes/all/)' },
  ];
  
  // Check key pages
  keyPages.forEach(({ path: pagePath, name }) => {
    if (!fs.existsSync(pagePath)) {
      warnings.push(`${name}: Page not found at ${pagePath} (may not be built yet)`);
      return;
    }
    
    try {
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      checkOGImage(pageContent, name);
    } catch (error) {
      errors.push(`${name}: Error reading file - ${error.message}`);
    }
  });
  
  // Also check a sample of published content pages
  const samplePages = [];
  
  // Sample thought post
  const thoughtFiles = fs.readdirSync(thoughtsDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  if (thoughtFiles.length > 0) {
    const thoughtFile = thoughtFiles[0];
    const thoughtFrontMatter = parseFrontMatter(path.join(thoughtsDir, thoughtFile));
    if (thoughtFrontMatter && thoughtFrontMatter.date && thoughtFrontMatter.slug && !thoughtFrontMatter.draft) {
      const dateMatch = thoughtFrontMatter.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const thoughtPath = path.join(publicDir, 'thoughts', `${year}-${month}-${day}`, thoughtFrontMatter.slug, 'index.html');
        if (fs.existsSync(thoughtPath)) {
          samplePages.push({ path: thoughtPath, name: `Thought post: ${thoughtFile}` });
        }
      }
    }
  }
  
  // Sample recipe post
  const recipeFiles = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md' && file.startsWith('recipe-'));
  if (recipeFiles.length > 0) {
    const recipeFile = recipeFiles[0];
    const recipeFrontMatter = parseFrontMatter(path.join(recipesDir, recipeFile));
    if (recipeFrontMatter && recipeFrontMatter.date && !recipeFrontMatter.draft) {
      const dateMatch = recipeFrontMatter.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const slug = recipeFrontMatter.slug || recipeFile.replace('.md', '').replace('recipe-', '');
        const recipePath = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, slug, 'index.html');
        if (fs.existsSync(recipePath)) {
          samplePages.push({ path: recipePath, name: `Recipe post: ${recipeFile}` });
        }
      }
    }
  }
  
  // Check sample content pages
  samplePages.forEach(({ path: pagePath, name }) => {
    try {
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      checkOGImage(pageContent, name);
    } catch (error) {
      errors.push(`${name}: Error reading file - ${error.message}`);
    }
  });
  
  if (warnings.length > 0) {
    console.warn('⚠️  OG image validation warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ OG image validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  // Now check ALL pages in the public directory
  console.log('\n   Scanning all pages in public directory...');
  const allHtmlFiles = [];
  
  function findHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findHtmlFiles(filePath);
      } else if (file === 'index.html') {
        allHtmlFiles.push(filePath);
      }
    });
  }
  
  if (fs.existsSync(publicDir)) {
    findHtmlFiles(publicDir);
  }
  
  const pagesWithoutOG = [];
  const pagesWithOG = [];
  
  allHtmlFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasOGImage = /property=["']og:image["']/i.test(content);
      
      // Get a readable path (relative to public)
      const relativePath = path.relative(publicDir, filePath);
      
      if (hasOGImage) {
        pagesWithOG.push(relativePath);
      } else {
        pagesWithoutOG.push(relativePath);
      }
    } catch (err) {
      warnings.push(`Error reading ${filePath}: ${err.message}`);
    }
  });
  
  if (pagesWithoutOG.length > 0) {
    console.error(`\n❌ Found ${pagesWithoutOG.length} page(s) without OG images:`);
    pagesWithoutOG.forEach(page => {
      console.error(`   - ${page}`);
      errors.push(`${page}: Missing og:image meta tag`);
    });
  } else {
    console.log(`   ✅ All ${allHtmlFiles.length} pages have OG images`);
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  OG image validation warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('\n❌ OG image validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log(`\n✅ All ${allHtmlFiles.length} pages have valid OG images.`);
}

module.exports = {
  validateAllPagesHaveOGImages
};
