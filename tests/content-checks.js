const fs = require('fs');
const path = require('path');

const homepagePath = path.join(__dirname, '..', 'public', 'index.html');
const thoughtsDir = path.join(__dirname, '..', 'content', 'thoughts');
const recipesDir = path.join(__dirname, '..', 'content', 'recipes');
const staticDir = path.join(__dirname, '..', 'static');
const publicDir = path.join(__dirname, '..', 'public');
const rssFeedPath = path.join(publicDir, 'thoughts', 'index.xml');
const recipesRssFeedPath = path.join(publicDir, 'recipes', 'index.xml');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const aboutPagePath = path.join(publicDir, 'about', 'index.html');
const error404Path = path.join(publicDir, '404.html');

// Required front matter fields for thoughts posts
// Note: 'date' is optional for drafts, but required when draft: false
const REQUIRED_THOUGHTS_FIELDS = ['title', 'description', 'subtitle', 'draft'];
const OPTIONAL_THOUGHTS_FIELDS = ['slug', 'date', 'og_image', 'social_image'];

// Required front matter fields for recipes
// Note: 'date' is optional for drafts, but required when draft: false
const REQUIRED_RECIPE_FIELDS = ['title', 'description', 'subtitle', 'draft', 'prepTime', 'cookTime', 'totalTime', 'recipeYield', 'recipeCategory', 'recipeCuisine', 'recipeIngredient', 'recipeInstructions'];
const OPTIONAL_RECIPE_FIELDS = ['slug', 'date', 'og_image', 'social_image'];

// Default social image from config
const DEFAULT_SOCIAL_IMAGE = '/images/social/default-og.png';

function checkRecentThoughtsSection() {
  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    const expectedText = 'Recent Thoughts';

    if (homepageContent.includes(expectedText)) {
      console.log('✅ "Recent Thoughts" section found on homepage.');
    } else {
      console.error(`❌ "${expectedText}" section NOT found on homepage.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error reading homepage file: ${error.message}`);
    process.exit(1);
  }
}

function checkHomepageContent() {
  console.log('\n🏠 Checking homepage content...');
  
  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    const errors = [];
    
    // Check for hero section
    if (!homepageContent.includes('Lindsay Brunner')) {
      errors.push('Hero section with name not found');
    }
    
    // Check for "Recent Thoughts" section
    if (!homepageContent.includes('Recent Thoughts')) {
      errors.push('"Recent Thoughts" section not found');
    }
    
    // Check for "Let's Connect" section
    if (!homepageContent.includes("Let's Connect")) {
      errors.push('"Let\'s Connect" section not found');
    }
    
    // Check for hero CTA
    if (!homepageContent.includes('hero-cta')) {
      errors.push('Hero CTA button not found');
    }
    
    if (errors.length > 0) {
      console.error('❌ Homepage content validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ Homepage content structure is valid.');
  } catch (error) {
    console.error(`❌ Error checking homepage: ${error.message}`);
    process.exit(1);
  }
}

function parseFrontMatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
      return null;
    }
    
    const frontMatterText = match[1];
    const frontMatter = {};
    
    let currentKey = null;
    let inArray = false;
    let arrayValue = [];
    
    // Enhanced YAML parser that handles arrays
    frontMatterText.split('\n').forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if this is an array item (starts with -)
      if (trimmedLine.startsWith('-')) {
        if (currentKey) {
          const arrayItem = trimmedLine.substring(1).trim();
          // Remove quotes if present
          const cleanItem = arrayItem.replace(/^["']|["']$/g, '');
          arrayValue.push(cleanItem);
          inArray = true;
        }
        return;
      }
      
      // If we were in an array and hit a new key, save the array
      if (inArray && currentKey && trimmedLine.includes(':')) {
        frontMatter[currentKey] = arrayValue;
        arrayValue = [];
        inArray = false;
        currentKey = null;
      }
      
      // Check for key: value pair
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex > 0) {
        // Save previous array if we have one
        if (inArray && currentKey) {
          frontMatter[currentKey] = arrayValue;
          arrayValue = [];
          inArray = false;
        }
        
        const key = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Check if this might be the start of an array (empty value)
        if (value === '' || value === '[]') {
          currentKey = key;
          inArray = true;
          arrayValue = [];
        } else {
          frontMatter[key] = value;
          currentKey = null;
          inArray = false;
        }
      }
    });
    
    // Save any remaining array
    if (inArray && currentKey && arrayValue.length > 0) {
      frontMatter[currentKey] = arrayValue;
    }
    
    return frontMatter;
  } catch (error) {
    console.error(`Error parsing front matter in ${filePath}: ${error.message}`);
    return null;
  }
}

function validateFrontMatter() {
  console.log('\n📋 Validating thoughts front matter structure...');
  
  const errors = [];
  const files = fs.readdirSync(thoughtsDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  if (files.length === 0) {
    console.log('⚠️  No thought posts found to validate.');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(thoughtsDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter) {
      errors.push(`${file}: Missing or invalid front matter`);
      return;
    }
    
    // Check required fields
    REQUIRED_THOUGHTS_FIELDS.forEach(field => {
      if (!(field in frontMatter)) {
        errors.push(`${file}: Missing required field "${field}"`);
      }
    });
    
    // Date is required when draft: false, optional for drafts
    const isDraft = frontMatter.draft === true || frontMatter.draft === 'true';
    if (!isDraft && !frontMatter.date) {
      errors.push(`${file}: Missing required field "date" (required when draft: false)`);
    }
    
    // Validate date format (should be YYYY-MM-DD)
    if (frontMatter.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(frontMatter.date)) {
        errors.push(`${file}: Invalid date format "${frontMatter.date}" (expected YYYY-MM-DD)`);
      }
    }
    
    // Validate draft is boolean
    if (frontMatter.draft !== undefined && 
        frontMatter.draft !== 'true' && 
        frontMatter.draft !== 'false') {
      errors.push(`${file}: Invalid draft value "${frontMatter.draft}" (expected true or false)`);
    }
  });
  
  if (errors.length > 0) {
    console.error('❌ Front matter validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log(`✅ Front matter validation passed for ${files.length} thought post(s).`);
}

function validateRecipeFrontMatter() {
  console.log('\n🍳 Validating recipe front matter structure...');
  
  const errors = [];
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  if (files.length === 0) {
    console.log('⚠️  No recipe posts found to validate.');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(recipesDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter) {
      errors.push(`${file}: Missing or invalid front matter`);
      return;
    }
    
    // Check required fields
    REQUIRED_RECIPE_FIELDS.forEach(field => {
      if (!(field in frontMatter)) {
        errors.push(`${file}: Missing required field "${field}"`);
      }
    });
    
    // Date is required when draft: false, optional for drafts
    const isDraft = frontMatter.draft === true || frontMatter.draft === 'true';
    if (!isDraft && !frontMatter.date) {
      errors.push(`${file}: Missing required field "date" (required when draft: false)`);
    }
    
    // Validate date format (should be YYYY-MM-DD)
    if (frontMatter.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(frontMatter.date)) {
        errors.push(`${file}: Invalid date format "${frontMatter.date}" (expected YYYY-MM-DD)`);
      }
    }
    
    // Validate draft is boolean
    if (frontMatter.draft !== undefined && 
        frontMatter.draft !== 'true' && 
        frontMatter.draft !== 'false') {
      errors.push(`${file}: Invalid draft value "${frontMatter.draft}" (expected true or false)`);
    }
    
    // Validate time format (should be ISO 8601 duration like PT30M)
    const timeFields = ['prepTime', 'cookTime', 'totalTime'];
    timeFields.forEach(field => {
      if (frontMatter[field] && !frontMatter[field].match(/^PT\d+[HM]$/)) {
        errors.push(`${file}: Invalid ${field} format "${frontMatter[field]}" (expected ISO 8601 duration like PT30M)`);
      }
    });
    
    // Validate recipeIngredient is an array
    if (frontMatter.recipeIngredient) {
      if (!Array.isArray(frontMatter.recipeIngredient) || frontMatter.recipeIngredient.length === 0) {
        errors.push(`${file}: recipeIngredient must be a non-empty array`);
      }
    }
    
    // Validate recipeInstructions is an array
    if (frontMatter.recipeInstructions) {
      if (!Array.isArray(frontMatter.recipeInstructions) || frontMatter.recipeInstructions.length === 0) {
        errors.push(`${file}: recipeInstructions must be a non-empty array`);
      }
    }
    
    // 🔒 ENFORCE: Published recipes MUST have social_image (manual review required)
    // This ensures OG images are reviewed before going live
    // (isDraft already declared above)
    if (!isDraft && !frontMatter.social_image && !frontMatter.og_image) {
      errors.push(
        `${file}: Published recipes MUST have social_image or og_image set. ` +
        `This enforces manual review of OG images before publishing. ` +
        `Run 'npm run generate:og-images', review the image, then add 'social_image: "/images/social/recipe-${frontMatter.slug || file.replace('.md', '')}-og.svg"' to front matter.`
      );
    }
  });
  
  if (errors.length > 0) {
    console.error('❌ Recipe front matter validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log(`✅ Recipe front matter validation passed for ${files.length} recipe(s).`);
}

function checkSocialImages() {
  console.log('\n🖼️  Checking social images for thoughts...');
  
  const errors = [];
  const files = fs.readdirSync(thoughtsDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  if (files.length === 0) {
    console.log('⚠️  No thought posts found to check.');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(thoughtsDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter) return;
    
    // Check both og_image and social_image (some posts use different field names)
    const imageField = frontMatter.og_image || frontMatter.social_image;
    
    if (imageField) {
      // Remove leading slash if present for path joining
      const imagePath = imageField.startsWith('/') 
        ? imageField.substring(1) 
        : imageField;
      const fullImagePath = path.join(staticDir, imagePath);
      
      if (!fs.existsSync(fullImagePath)) {
        errors.push(`${file}: Social image not found: ${imageField}`);
      } else {
        console.log(`   ✓ ${file}: ${imageField} exists`);
      }
    }
  });
  
  if (errors.length > 0) {
    console.error('❌ Social image validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ All specified social images exist for thoughts.');
}

function checkRecipeSocialImages() {
  console.log('\n🖼️  Checking social images for recipes...');
  
  const errors = [];
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file.startsWith('recipe-'));
  
  if (files.length === 0) {
    console.log('⚠️  No recipe posts found to check.');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(recipesDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter) return;
    
    const isDraft = frontMatter.draft === true || frontMatter.draft === 'true';
    
    // Skip drafts (they don't need images yet)
    if (isDraft) {
      console.log(`   ⏭️  ${file}: Draft (skipped - images not required for drafts)`);
      return;
    }
    
    // 🔒 ENFORCE: Published recipes MUST have social_image explicitly set
    // This ensures manual review before publishing
    const imageField = frontMatter.og_image || frontMatter.social_image;
    
    if (!imageField) {
      errors.push(
        `${file}: Published recipe MUST have social_image or og_image set. ` +
        `This enforces manual review of OG images. ` +
        `Run 'npm run generate:og-images', review the generated image, then add it to front matter.`
      );
      return;
    }
    
    // Verify the specified image exists
    const imagePath = imageField.startsWith('/') 
      ? imageField.substring(1) 
      : imageField;
    const fullImagePath = path.join(staticDir, imagePath);
    
    if (!fs.existsSync(fullImagePath)) {
      errors.push(`${file}: Social image not found: ${imageField}`);
    } else {
      // Verify it's actually an image file (not empty or corrupted)
      try {
        const stats = fs.statSync(fullImagePath);
        if (stats.size === 0) {
          errors.push(`${file}: Social image is empty: ${imageField}`);
        } else {
          console.log(`   ✓ ${file}: Social image exists and is valid (${imageField})`);
        }
      } catch (err) {
        errors.push(`${file}: Error checking social image: ${err.message}`);
      }
    }
  });
  
  if (errors.length > 0) {
    console.error('❌ Recipe social image validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n💡 Workflow:');
    console.error('   1. Run: npm run generate:og-images');
    console.error('   2. Review the generated image in static/images/social/');
    console.error('   3. Add social_image: "/images/social/recipe-{slug}-og.svg" to recipe front matter');
    console.error('   4. Set draft: false when ready to publish');
    process.exit(1);
  }
  
  console.log('✅ All published recipes have reviewed social images.');
}

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

function validateAboutPage() {
  console.log('\n👤 Validating about page...');
  
  if (!fs.existsSync(aboutPagePath)) {
    console.error(`❌ About page not found at ${aboutPagePath}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  try {
    const aboutContent = fs.readFileSync(aboutPagePath, 'utf8');
    const errors = [];
    
    // Check for title
    if (!aboutContent.includes('About') && !aboutContent.includes('Lindsay')) {
      errors.push('About page missing title or name');
    }
    
    // Check for basic content structure
    if (aboutContent.length < 500) {
      errors.push('About page seems too short (may be missing content)');
    }
    
    // Check for image reference (headshot)
    if (aboutContent.includes('avatar-color-trans.png')) {
      const imagePath = path.join(staticDir, 'images', 'avatar-color-trans.png');
      if (!fs.existsSync(imagePath)) {
        errors.push('About page references avatar image that does not exist');
      } else {
        console.log('   ✓ Avatar image exists');
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ About page validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ About page structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating about page: ${error.message}`);
    process.exit(1);
  }
}

function validate404Page() {
  console.log('\n🚫 Validating 404 error page...');
  
  if (!fs.existsSync(error404Path)) {
    console.error(`❌ 404 page not found at ${error404Path}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  try {
    const error404Content = fs.readFileSync(error404Path, 'utf8');
    const errors = [];
    
    // Check for 404 text
    if (!error404Content.includes('404')) {
      errors.push('404 page missing "404" text');
    }
    
    // Check for error message
    if (!error404Content.includes('Page Not Found') && !error404Content.includes('not found')) {
      errors.push('404 page missing error message');
    }
    
    // Check for navigation links (handle minified HTML)
    const hasHomeLink = error404Content.includes('href="/"') || error404Content.includes('href=/');
    const hasThoughtsLink = error404Content.includes('href="/thoughts/') || error404Content.includes('href=/thoughts/');
    
    if (!hasHomeLink && !hasThoughtsLink) {
      errors.push('404 page missing navigation links');
    }
    
    if (errors.length > 0) {
      console.error('❌ 404 page validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ 404 page structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating 404 page: ${error.message}`);
    process.exit(1);
  }
}

function validatePermalinks() {
  console.log('\n🔗 Validating permalink structure...');
  
  const errors = [];
  const warnings = [];
  
  // Check thoughts permalinks (should be /thoughts/YYYY-MM-DD/slug)
  const thoughtsFiles = fs.readdirSync(thoughtsDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  thoughtsFiles.forEach(file => {
    const filePath = path.join(thoughtsDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter || frontMatter.draft === 'true') return;
    
    if (frontMatter.date && frontMatter.slug) {
      const dateMatch = frontMatter.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const expectedPath = path.join(publicDir, 'thoughts', `${year}-${month}-${day}`, frontMatter.slug);
        const expectedPathAlt = path.join(publicDir, 'thoughts', `${year}-${month}-${day}`, frontMatter.slug, 'index.html');
        
        if (!fs.existsSync(expectedPath) && !fs.existsSync(expectedPathAlt)) {
          // Try without slug (using filename)
          const filenameSlug = file.replace('.md', '');
          const expectedPathFilename = path.join(publicDir, 'thoughts', `${year}-${month}-${day}`, filenameSlug);
          const expectedPathFilenameAlt = path.join(publicDir, 'thoughts', `${year}-${month}-${day}`, filenameSlug, 'index.html');
          
          if (!fs.existsSync(expectedPathFilename) && !fs.existsSync(expectedPathFilenameAlt)) {
            warnings.push(`Thought "${file}" may not have correct permalink structure`);
          }
        }
      }
    }
  });
  
  // Check recipes permalinks (should be /recipes/YYYY-MM-DD/slug)
  const recipeFiles = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  recipeFiles.forEach(file => {
    const filePath = path.join(recipesDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter || frontMatter.draft === 'true') return;
    
    if (frontMatter.date && frontMatter.slug) {
      const dateMatch = frontMatter.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const expectedPath = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, frontMatter.slug);
        const expectedPathAlt = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, frontMatter.slug, 'index.html');
        
        if (!fs.existsSync(expectedPath) && !fs.existsSync(expectedPathAlt)) {
          // Try without slug (using filename)
          const filenameSlug = file.replace('.md', '').replace('recipe-', '');
          const expectedPathFilename = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, filenameSlug);
          const expectedPathFilenameAlt = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, filenameSlug, 'index.html');
          
          if (!fs.existsSync(expectedPathFilename) && !fs.existsSync(expectedPathFilenameAlt)) {
            warnings.push(`Recipe "${file}" may not have correct permalink structure`);
          }
        }
      }
    }
  });
  
  if (warnings.length > 0) {
    console.warn('⚠️  Permalink warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ Permalink validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Permalink structure appears valid.');
}

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
    // Pattern: href="/thoughts/index.xml" or href=/thoughts/index.xml
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
    } else if (expectedLink.includes('/thoughts/')) {
      // Should be "Thoughts RSS Feed" (new) or "RSS Feed" (old/backward compatible)
      if (!ariaLabel.includes('Thoughts') && !ariaLabel.includes('RSS Feed')) {
        errors.push(`${pageDescription}: RSS link aria-label should mention "Thoughts" or "RSS Feed" but found "${ariaLabel}"`);
      }
    }
  }
  
  // Test 1: Homepage should have thoughts RSS link
  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    checkRSSLink(homepageContent, '/thoughts/index.xml', 'Homepage');
  } catch (error) {
    errors.push(`Homepage: Error reading file - ${error.message}`);
  }
  
  // Test 2: About page should have thoughts RSS link (default)
  try {
    const aboutContent = fs.readFileSync(aboutPagePath, 'utf8');
    checkRSSLink(aboutContent, '/thoughts/index.xml', 'About page');
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
  
  // Test 5: Thoughts list page should have thoughts RSS link
  const thoughtsListPath = path.join(publicDir, 'thoughts', 'index.html');
  try {
    if (fs.existsSync(thoughtsListPath)) {
      const thoughtsListContent = fs.readFileSync(thoughtsListPath, 'utf8');
      checkRSSLink(thoughtsListContent, '/thoughts/index.xml', 'Thoughts list page');
    } else {
      console.warn('   ⚠️  Thoughts list page not found (may not be built yet)');
    }
  } catch (error) {
    errors.push(`Thoughts list page: Error reading file - ${error.message}`);
  }
  
  // Test 6: A thoughts single page should have thoughts RSS link
  const thoughtSinglePath = path.join(publicDir, 'thoughts', '2025-11-17', 'category-creation-calling-shot', 'index.html');
  try {
    if (fs.existsSync(thoughtSinglePath)) {
      const thoughtContent = fs.readFileSync(thoughtSinglePath, 'utf8');
      checkRSSLink(thoughtContent, '/thoughts/index.xml', 'Thought single page');
    } else {
      console.warn('   ⚠️  Thought single page not found (may not be built yet)');
    }
  } catch (error) {
    errors.push(`Thought single page: Error reading file - ${error.message}`);
  }
  
  if (errors.length > 0) {
    console.error('❌ Context-aware RSS link validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Context-aware RSS links are correct.');
}

// Run all tests
console.log('🧪 Running comprehensive content validation tests...\n');

checkRecentThoughtsSection();
checkHomepageContent();
validateFrontMatter();
validateRecipeFrontMatter();
checkSocialImages();
checkRecipeSocialImages();
checkStaticAssets();
validateRSSFeed();
validateRecipesRSSFeed();
validateContextAwareRSSLinks();
validateSitemap();
validateAboutPage();
validate404Page();
validatePermalinks();

console.log('\n✅ All content validation tests passed!');
