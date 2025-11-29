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
 * Calculate the nth occurrence of a day in a month (e.g., 2nd Sunday)
 */
function getNthDayOfMonth(year, month, dayOfWeek, n) {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  let date = 1 + (dayOfWeek - firstDayOfWeek + 7) % 7;
  if (date < 1) date += 7;
  date += (n - 1) * 7;
  return date;
}

/**
 * Check if a date is in DST period for Pacific Time
 * DST: 2nd Sunday in March to 1st Sunday in November
 */
function isPacificDST(year, month, day) {
  // Month is 0-indexed in JavaScript Date
  const marchSecondSunday = getNthDayOfMonth(year, 2, 0, 2); // 0 = Sunday, month 2 = March
  const novemberFirstSunday = getNthDayOfMonth(year, 10, 0, 1); // month 10 = November
  
  // Before March 2nd Sunday: PST
  if (month < 2 || (month === 2 && day < marchSecondSunday)) {
    return false;
  }
  
  // After November 1st Sunday: PST
  if (month > 10 || (month === 10 && day > novemberFirstSunday)) {
    return false;
  }
  
  // Between March 2nd Sunday and November 1st Sunday: PDT
  return true;
}

/**
 * Check if date has passed and it's 6am PT or later
 * GitHub Actions runs in UTC, so we need to check if it's 6am PT
 * 6am PT = 14:00 UTC (PST, UTC-8) or 13:00 UTC (PDT, UTC-7)
 */
function isDatePassed(dateString) {
  if (!dateString) return false;
  
  try {
    // Parse the publish date (month is 1-indexed from string: 1-12)
    const [year, monthStr, day] = dateString.split('-').map(Number);
    const month = monthStr - 1; // Convert to 0-indexed for Date operations
    
    // Get current time in UTC
    const now = new Date();
    const nowUTC = new Date(now.toISOString());
    
    // Determine if DST is in effect for the publish date
    // isPacificDST expects 0-indexed month (0-11)
    const isDST = isPacificDST(year, month, day);
    
    // For Pacific Time:
    // PST (UTC-8): 6am PT = 14:00 UTC
    // PDT (UTC-7): 6am PT = 13:00 UTC
    const utcHour = isDST ? 13 : 14;
    const publishDateUTC = new Date(Date.UTC(year, month, day, utcHour, 0, 0, 0));
    
    // Check if current UTC time is at or past 6am PT on the publish date
    return nowUTC >= publishDateUTC;
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

module.exports = { 
  processFile, 
  isDatePassed,
  isPacificDST,
  getNthDayOfMonth
};
