const fs = require('fs');
const path = require('path');
const {
  homepagePath,
  aboutPagePath,
  publicDir
} = require('./utils');

function validateContextAwareRSSLinks() {
  console.log('\n🔗 Validating context-aware RSS links in header...');
  
  const errors = [];
  
  // Helper function to check RSS link in HTML content
  function checkRSSLink(htmlContent, expectedLink, pageDescription) {
    // Find the RSS link in the social-links section
    // Handle both minified HTML (class=social-links) and formatted HTML (class="social-links")
    const socialLinksMatch = htmlContent.match(/class=["']?social-links["']?[^>]*>([\s\S]*?)<\/div>/);
    if (!socialLinksMatch) {
      errors.push(`${pageDescription}: Could not find social-links section in header`);
      return;
    }
    
    const socialLinksContent = socialLinksMatch[1];
    
    // Look for RSS link - handle both quoted and unquoted href attributes in minified HTML
    // Pattern: href="/blog/index.xml" or href=/blog/index.xml
    const rssLinkMatch = socialLinksContent.match(/href=["']?([^"'\s>]*\/index\.xml)["']?/);
    
    if (!rssLinkMatch) {
      errors.push(`${pageDescription}: RSS link not found in header`);
      return;
    }
    
    const actualLink = rssLinkMatch[1];
    if (actualLink !== expectedLink) {
      errors.push(`${pageDescription}: RSS link points to "${actualLink}" but expected "${expectedLink}"`);
    }
    
    // Also check aria-label for accessibility - handle both quoted and unquoted
    let ariaLabel = null;
    const ariaLabelMatch = socialLinksContent.match(/aria-label=["']([^"']*RSS[^"']*)["']/);
    if (ariaLabelMatch) {
      ariaLabel = ariaLabelMatch[1];
    } else {
      // Try unquoted aria-label (minified HTML)
      const ariaLabelMatchUnquoted = socialLinksContent.match(/aria-label=([^\s>]*RSS[^\s>]*)/);
      if (ariaLabelMatchUnquoted) {
        ariaLabel = ariaLabelMatchUnquoted[1];
      }
    }
    
    if (!ariaLabel) {
      errors.push(`${pageDescription}: RSS link missing aria-label`);
      return;
    }
    
    if (expectedLink.includes('/recipes/')) {
      if (!ariaLabel.includes('Recipes')) {
        errors.push(`${pageDescription}: RSS link aria-label should mention "Recipes" but found "${ariaLabel}"`);
      }
    } else if (expectedLink.includes('/blog/')) {
      // Should be "Blog RSS Feed" (new) or "RSS Feed" (old/backward compatible)
      if (!ariaLabel.includes('Blog') && !ariaLabel.includes('RSS Feed')) {
        errors.push(`${pageDescription}: RSS link aria-label should mention "Blog" or "RSS Feed" but found "${ariaLabel}"`);
      }
    }
  }
  
  // Test 1: Homepage should have blog RSS link
  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    checkRSSLink(homepageContent, '/blog/index.xml', 'Homepage');
  } catch (error) {
    errors.push(`Homepage: Error reading file - ${error.message}`);
  }
  
  // Test 2: About page should have blog RSS link (default)
  try {
    const aboutContent = fs.readFileSync(aboutPagePath, 'utf8');
    checkRSSLink(aboutContent, '/blog/index.xml', 'About page');
  } catch (error) {
    errors.push(`About page: Error reading file - ${error.message}`);
  }
  
  // Test 3: Recipes list page should have recipes RSS link
  const recipesListPath = path.join(publicDir, 'recipes', 'index.html');
  try {
    if (fs.existsSync(recipesListPath)) {
      const recipesListContent = fs.readFileSync(recipesListPath, 'utf8');
      checkRSSLink(recipesListContent, '/recipes/index.xml', 'Recipes list page');
    } else {
      console.warn('   ⚠️  Recipes list page not found (may not be built yet)');
    }
  } catch (error) {
    errors.push(`Recipes list page: Error reading file - ${error.message}`);
  }
  
  // Test 4: A recipe single page should have recipes RSS link
  const recipeSinglePath = path.join(publicDir, 'recipes', '2026-01-02', 'recipe-spaghetti-and-meatballs', 'index.html');
  try {
    if (fs.existsSync(recipeSinglePath)) {
      const recipeContent = fs.readFileSync(recipeSinglePath, 'utf8');
      checkRSSLink(recipeContent, '/recipes/index.xml', 'Recipe single page');
    } else {
      console.warn('   ⚠️  Recipe single page not found (may not be built yet)');
    }
  } catch (error) {
    errors.push(`Recipe single page: Error reading file - ${error.message}`);
  }
  
  // Test 5: Blog list page should have blog RSS link
  const blogListPath = path.join(publicDir, 'blog', 'index.html');
  try {
    if (fs.existsSync(blogListPath)) {
      const blogListContent = fs.readFileSync(blogListPath, 'utf8');
      checkRSSLink(blogListContent, '/blog/index.xml', 'Blog list page');
    } else {
      console.warn('   ⚠️  Blog list page not found (may not be built yet)');
    }
  } catch (error) {
    errors.push(`Blog list page: Error reading file - ${error.message}`);
  }
  
  // Test 6: A blog post page should have the blog RSS link
  const blogSinglePath = path.join(publicDir, 'blog', '2025-11-17', 'category-creation-calling-shot', 'index.html');
  try {
    if (fs.existsSync(blogSinglePath)) {
      const blogContent = fs.readFileSync(blogSinglePath, 'utf8');
      checkRSSLink(blogContent, '/blog/index.xml', 'Blog post page');
    } else {
      console.warn('   ⚠️  Blog post page not found (may not be built yet)');
    }
  } catch (error) {
    errors.push(`Blog post page: Error reading file - ${error.message}`);
  }
  
  if (errors.length > 0) {
    console.error('❌ Context-aware RSS link validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Context-aware RSS links are correct.');
}

module.exports = {
  validateContextAwareRSSLinks
};
