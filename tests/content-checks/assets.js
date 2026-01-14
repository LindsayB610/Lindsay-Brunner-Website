const fs = require('fs');
const path = require('path');
const { staticDir, rssFeedPath, recipesRssFeedPath, sitemapPath, DEFAULT_SOCIAL_IMAGE } = require('./utils');

function checkStaticAssets() {
  console.log('\n📦 Checking static assets...');
  
  const errors = [];
  
  // Check CSS files
  const cssFiles = ['css/main.css', 'css/custom.css'];
  cssFiles.forEach(cssFile => {
    const cssPath = path.join(staticDir, cssFile);
    if (!fs.existsSync(cssPath)) {
      errors.push(`CSS file not found: ${cssFile}`);
    } else {
      console.log(`   ✓ ${cssFile} exists`);
    }
  });
  
  // Check favicon files
  const faviconFiles = [
    'favicons/favicon.ico',
    'favicons/favicon-16x16.png',
    'favicons/favicon-32x32.png',
    'favicons/apple-touch-icon.png',
    'favicons/android-chrome-192x192.png',
    'favicons/android-chrome-512x512.png',
    'favicons/site.webmanifest'
  ];
  faviconFiles.forEach(faviconFile => {
    const faviconPath = path.join(staticDir, faviconFile);
    if (!fs.existsSync(faviconPath)) {
      errors.push(`Favicon file not found: ${faviconFile}`);
    } else {
      console.log(`   ✓ ${faviconFile} exists`);
    }
  });
  
  // Check default social image
  const defaultImagePath = DEFAULT_SOCIAL_IMAGE.startsWith('/')
    ? DEFAULT_SOCIAL_IMAGE.substring(1)
    : DEFAULT_SOCIAL_IMAGE;
  const fullDefaultImagePath = path.join(staticDir, defaultImagePath);
  if (!fs.existsSync(fullDefaultImagePath)) {
    errors.push(`Default social image not found: ${DEFAULT_SOCIAL_IMAGE}`);
  } else {
    console.log(`   ✓ Default social image exists: ${DEFAULT_SOCIAL_IMAGE}`);
  }
  
  if (errors.length > 0) {
    console.error('❌ Static asset validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ All required static assets exist.');
}

function validateRSSFeed() {
  console.log('\n📡 Validating thoughts RSS feed...');
  
  if (!fs.existsSync(rssFeedPath)) {
    console.error(`❌ RSS feed not found at ${rssFeedPath}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  try {
    const rssContent = fs.readFileSync(rssFeedPath, 'utf8');
    
    // Basic XML structure validation
    if (!rssContent.includes('<?xml')) {
      console.error('❌ RSS feed is not valid XML (missing XML declaration)');
      process.exit(1);
    }
    
    if (!rssContent.includes('<rss')) {
      console.error('❌ RSS feed is missing <rss> root element');
      process.exit(1);
    }
    
    if (!rssContent.includes('<channel>')) {
      console.error('❌ RSS feed is missing <channel> element');
      process.exit(1);
    }
    
    // Check for required channel elements
    const requiredChannelElements = ['<title>', '<link>', '<description>'];
    requiredChannelElements.forEach(element => {
      if (!rssContent.includes(element)) {
        console.error(`❌ RSS feed is missing required channel element: ${element}`);
        process.exit(1);
      }
    });
    
    // Check for custom description (from custom template)
    if (!rssContent.includes('Recent thoughts from')) {
      console.warn('⚠️  RSS feed may not be using custom template (expected "Recent thoughts from" in description)');
    }
    
    // Check for at least one item
    if (!rssContent.includes('<item>')) {
      console.warn('⚠️  RSS feed contains no items (this might be expected if no posts are published)');
    }
    
    // Basic well-formed XML check (opening and closing tags match)
    const openTags = (rssContent.match(/<[^/!?][^>]*>/g) || []).length;
    const closeTags = (rssContent.match(/<\/[^>]+>/g) || []).length;
    
    if (Math.abs(openTags - closeTags) > 2) { // Allow some variance for self-closing tags
      console.warn('⚠️  RSS feed may have mismatched XML tags (this is a basic check)');
    }
    
    console.log('✅ Thoughts RSS feed structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating RSS feed: ${error.message}`);
    process.exit(1);
  }
}

function validateRecipesRSSFeed() {
  console.log('\n📡 Validating recipes RSS feed...');
  
  if (!fs.existsSync(recipesRssFeedPath)) {
    console.error(`❌ Recipes RSS feed not found at ${recipesRssFeedPath}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  try {
    const rssContent = fs.readFileSync(recipesRssFeedPath, 'utf8');
    
    // Basic XML structure validation
    if (!rssContent.includes('<?xml')) {
      console.error('❌ Recipes RSS feed is not valid XML (missing XML declaration)');
      process.exit(1);
    }
    
    if (!rssContent.includes('<rss')) {
      console.error('❌ Recipes RSS feed is missing <rss> root element');
      process.exit(1);
    }
    
    if (!rssContent.includes('<channel>')) {
      console.error('❌ Recipes RSS feed is missing <channel> element');
      process.exit(1);
    }
    
    // Check for required channel elements
    const requiredChannelElements = ['<title>', '<link>', '<description>'];
    requiredChannelElements.forEach(element => {
      if (!rssContent.includes(element)) {
        console.error(`❌ Recipes RSS feed is missing required channel element: ${element}`);
        process.exit(1);
      }
    });
    
    // Check for custom description (from custom template)
    if (!rssContent.includes('Recent recipes from')) {
      console.warn('⚠️  Recipes RSS feed may not be using custom template (expected "Recent recipes from" in description)');
    }
    
    // Check for at least one item
    if (!rssContent.includes('<item>')) {
      console.warn('⚠️  Recipes RSS feed contains no items (this might be expected if no recipes are published)');
    }
    
    // Basic well-formed XML check (opening and closing tags match)
    const openTags = (rssContent.match(/<[^/!?][^>]*>/g) || []).length;
    const closeTags = (rssContent.match(/<\/[^>]+>/g) || []).length;
    
    if (Math.abs(openTags - closeTags) > 2) { // Allow some variance for self-closing tags
      console.warn('⚠️  Recipes RSS feed may have mismatched XML tags (this is a basic check)');
    }
    
    console.log('✅ Recipes RSS feed structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating recipes RSS feed: ${error.message}`);
    process.exit(1);
  }
}

function validateSitemap() {
  console.log('\n🗺️  Validating sitemap...');
  
  if (!fs.existsSync(sitemapPath)) {
    console.error(`❌ Sitemap not found at ${sitemapPath}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  try {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    
    // Basic XML structure validation
    if (!sitemapContent.includes('<?xml')) {
      console.error('❌ Sitemap is not valid XML (missing XML declaration)');
      process.exit(1);
    }
    
    if (!sitemapContent.includes('<urlset')) {
      console.error('❌ Sitemap is missing <urlset> root element');
      process.exit(1);
    }
    
    // Check for at least one URL
    if (!sitemapContent.includes('<url>')) {
      console.warn('⚠️  Sitemap contains no URLs (this might be expected if no content is published)');
    }
    
    // Check for required URL elements
    if (sitemapContent.includes('<url>')) {
      if (!sitemapContent.includes('<loc>')) {
        console.error('❌ Sitemap URLs are missing <loc> elements');
        process.exit(1);
      }
    }
    
    console.log('✅ Sitemap structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating sitemap: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  checkStaticAssets,
  validateRSSFeed,
  validateRecipesRSSFeed,
  validateSitemap
};
