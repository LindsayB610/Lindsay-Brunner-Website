#!/usr/bin/env node

/**
 * Schedule Posts Script
 * 
 * This script checks for draft posts (thoughts and recipes) where the publish
 * date has arrived, and automatically sets draft: false to publish them.
 * 
 * Designed to run via GitHub Actions on a schedule, but can also be run locally
 * for testing purposes.
 */

const fs = require('fs');
const path = require('path');

const thoughtsDir = path.join(__dirname, '..', 'content', 'thoughts');
const recipesDir = path.join(__dirname, '..', 'content', 'recipes');

/**
 * Parse front matter from markdown file
 */
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
    
    // Simple YAML parser for basic key-value pairs
    const lines = frontMatterText.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Handle boolean values
      if (value === 'true') {
        frontMatter[key] = true;
      } else if (value === 'false') {
        frontMatter[key] = false;
      } else {
        frontMatter[key] = value;
      }
    }
    
    return { frontMatter, content, match };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Update draft status in file
 */
function updateDraftStatus(filePath, frontMatter, content, match) {
  // Check if draft is already false
  if (frontMatter.draft === false) {
    return false; // No change needed
  }
  
  // Update the draft field in the front matter
  const frontMatterText = match[1];
  const updatedFrontMatter = frontMatterText.replace(
    /^draft:\s*(true|false|"true"|"false")/m,
    'draft: false'
  );
  
  const updatedContent = content.replace(
    /^---\s*\n([\s\S]*?)\n---\s*\n/,
    `---\n${updatedFrontMatter}\n---\n`
  );
  
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  return true; // Change made
}

/**
 * Check if date has passed
 */
function isDatePassed(dateString) {
  if (!dateString) return false;
  
  try {
    // Parse date string as local date (YYYY-MM-DD format)
    // Split to avoid timezone issues with Date constructor
    const [year, month, day] = dateString.split('-').map(Number);
    const postDate = new Date(year, month - 1, day);
    postDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    return postDate <= today;
  } catch (error) {
    console.error(`Error parsing date "${dateString}":`, error.message);
    return false;
  }
}

/**
 * Validate recipe has required fields before publishing
 */
function validateRecipeForPublishing(filePath, frontMatter) {
  // Recipes must have social_image when published
  if (!frontMatter.social_image && !frontMatter.og_image) {
    console.warn(`⚠️  ${path.basename(filePath)}: Skipping - published recipes require social_image`);
    return false;
  }
  
  return true;
}

/**
 * Process a single content file
 */
function processFile(filePath, type) {
  const parsed = parseFrontMatter(filePath);
  if (!parsed) {
    return { published: false, skipped: true, reason: 'Could not parse front matter' };
  }
  
  const { frontMatter, content, match } = parsed;
  
  // Only process drafts
  if (frontMatter.draft !== true) {
    return { published: false, skipped: true, reason: 'Not a draft' };
  }
  
  // Check if date has passed
  if (!isDatePassed(frontMatter.date)) {
    return { published: false, skipped: true, reason: 'Date not yet reached' };
  }
  
  // For recipes, validate required fields
  if (type === 'recipe' && !validateRecipeForPublishing(filePath, frontMatter)) {
    return { published: false, skipped: true, reason: 'Missing required fields (social_image)' };
  }
  
  // Update draft status
  const changed = updateDraftStatus(filePath, frontMatter, content, match);
  
  if (changed) {
    return { published: true, skipped: false, file: path.basename(filePath) };
  }
  
  return { published: false, skipped: true, reason: 'No change needed' };
}

/**
 * Main function
 */
function main() {
  console.log('📅 Checking for scheduled posts to publish...\n');
  
  const published = [];
  const skipped = [];
  
  // Process thoughts
  if (fs.existsSync(thoughtsDir)) {
    const thoughtFiles = fs.readdirSync(thoughtsDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md')
      .map(file => path.join(thoughtsDir, file));
    
    for (const file of thoughtFiles) {
      const result = processFile(file, 'thought');
      if (result.published) {
        published.push({ file: result.file, type: 'thought' });
      } else if (!result.skipped || result.reason === 'Date not yet reached') {
        // Only log if it's not just a normal skip
        skipped.push({ file: path.basename(file), reason: result.reason });
      }
    }
  }
  
  // Process recipes
  if (fs.existsSync(recipesDir)) {
    const recipeFiles = fs.readdirSync(recipesDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md')
      .map(file => path.join(recipesDir, file));
    
    for (const file of recipeFiles) {
      const result = processFile(file, 'recipe');
      if (result.published) {
        published.push({ file: result.file, type: 'recipe' });
      } else if (!result.skipped || result.reason === 'Date not yet reached') {
        // Only log if it's not just a normal skip
        skipped.push({ file: path.basename(file), reason: result.reason });
      }
    }
  }
  
  // Report results
  console.log('\n📊 Results:');
  if (published.length > 0) {
    console.log(`\n✅ Published ${published.length} post(s):`);
    published.forEach(({ file, type }) => {
      console.log(`   - ${type}: ${file}`);
    });
  } else {
    console.log('\n✅ No posts scheduled for publication today.');
  }
  
  if (skipped.length > 0) {
    console.log(`\n⚠️  Skipped ${skipped.length} post(s):`);
    skipped.forEach(({ file, reason }) => {
      console.log(`   - ${file}: ${reason}`);
    });
  }
  
  console.log('\n');
  
  // Exit with code 0 (success) even if nothing was published
  // This prevents GitHub Actions from failing when there's nothing to publish
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, isDatePassed };
