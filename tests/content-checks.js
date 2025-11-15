const fs = require('fs');
const path = require('path');

const homepagePath = path.join(__dirname, '..', 'public', 'index.html');
const thoughtsDir = path.join(__dirname, '..', 'content', 'thoughts');
const staticDir = path.join(__dirname, '..', 'static');
const publicDir = path.join(__dirname, '..', 'public');
const rssFeedPath = path.join(publicDir, 'thoughts', 'index.xml');

// Required front matter fields for thoughts posts
const REQUIRED_FIELDS = ['title', 'date', 'description', 'subtitle', 'draft'];
const OPTIONAL_FIELDS = ['slug', 'og_image', 'social_image'];

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
    
    // Simple YAML parser for basic key: value pairs
    frontMatterText.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        frontMatter[key] = value;
      }
    });
    
    return frontMatter;
  } catch (error) {
    console.error(`Error parsing front matter in ${filePath}: ${error.message}`);
    return null;
  }
}

function validateFrontMatter() {
  console.log('\n📋 Validating front matter structure...');
  
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
    REQUIRED_FIELDS.forEach(field => {
      if (!(field in frontMatter)) {
        errors.push(`${file}: Missing required field "${field}"`);
      }
    });
    
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
  
  console.log(`✅ Front matter validation passed for ${files.length} post(s).`);
}

function checkSocialImages() {
  console.log('\n🖼️  Checking social images...');
  
  const errors = [];
  const warnings = [];
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
    } else {
      // Not an error, but could be a warning if you want all posts to have social images
      // warnings.push(`${file}: No social image specified`);
    }
  });
  
  if (warnings.length > 0) {
    warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ Social image validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ All specified social images exist.');
}

function validateRSSFeed() {
  console.log('\n📡 Validating RSS feed...');
  
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
    
    console.log('✅ RSS feed structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating RSS feed: ${error.message}`);
    process.exit(1);
  }
}

// Run all tests
console.log('🧪 Running content validation tests...\n');

checkRecentThoughtsSection();
validateFrontMatter();
checkSocialImages();
validateRSSFeed();

console.log('\n✅ All content validation tests passed!');
