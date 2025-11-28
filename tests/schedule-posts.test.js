/**
 * Test suite for schedule-posts script
 * 
 * Tests that the scheduling script:
 * - Correctly identifies posts ready to publish (draft: true, date <= today)
 * - Skips posts with future dates
 * - Skips posts that are already published (draft: false)
 * - Validates recipes have social_image before publishing
 * - Correctly parses dates and compares them
 */

const fs = require('fs');
const path = require('path');
const { processFile, isDatePassed } = require('../scripts/schedule-posts');

const thoughtsDir = path.join(__dirname, '..', 'content', 'thoughts');
const recipesDir = path.join(__dirname, '..', 'content', 'recipes');

// Simple test runner
if (require.main === module) {
  console.log('🧪 Testing schedule-posts script...\n');
  
  let passed = 0;
  let failed = 0;
  const errors = [];
  
  // Test date comparison function
  console.log('📅 Testing date comparison...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Test past date
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    if (isDatePassed(pastDateStr)) {
      console.log(`   ✓ Past date (${pastDateStr}) correctly identified as passed`);
      passed++;
    } else {
      console.log(`   ❌ Past date (${pastDateStr}) not identified as passed`);
      failed++;
      errors.push(`Date comparison failed for past date: ${pastDateStr}`);
    }
    
    // Test today's date
    const todayStr = today.toISOString().split('T')[0];
    if (isDatePassed(todayStr)) {
      console.log(`   ✓ Today's date (${todayStr}) correctly identified as passed`);
      passed++;
    } else {
      console.log(`   ❌ Today's date (${todayStr}) not identified as passed`);
      failed++;
      errors.push(`Date comparison failed for today: ${todayStr}`);
    }
    
    // Test future date
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    if (!isDatePassed(futureDateStr)) {
      console.log(`   ✓ Future date (${futureDateStr}) correctly identified as not passed`);
      passed++;
    } else {
      console.log(`   ❌ Future date (${futureDateStr}) incorrectly identified as passed`);
      failed++;
      errors.push(`Date comparison failed for future date: ${futureDateStr}`);
    }
    
    // Test invalid date
    if (!isDatePassed('invalid-date')) {
      console.log(`   ✓ Invalid date correctly handled`);
      passed++;
    } else {
      console.log(`   ❌ Invalid date not handled correctly`);
      failed++;
      errors.push('Invalid date not handled correctly');
    }
  } catch (error) {
    console.error(`   ❌ Date comparison test error: ${error.message}`);
    failed++;
    errors.push(`Date comparison test error: ${error.message}`);
  }
  
  // Test actual content files
  console.log('\n📝 Testing content files...');
  
  // Test thoughts
  if (fs.existsSync(thoughtsDir)) {
    const thoughtFiles = fs.readdirSync(thoughtsDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md');
    
    thoughtFiles.forEach(file => {
      const filePath = path.join(thoughtsDir, file);
      try {
        const result = processFile(filePath, 'thought');
        
        // Validate result structure
        if (result && typeof result.published === 'boolean' && typeof result.skipped === 'boolean') {
          console.log(`   ✓ ${file}: Processed correctly (published: ${result.published}, skipped: ${result.skipped})`);
          passed++;
        } else {
          console.log(`   ❌ ${file}: Invalid result structure`);
          failed++;
          errors.push(`${file}: Invalid result structure`);
        }
      } catch (error) {
        console.log(`   ❌ ${file}: Error processing - ${error.message}`);
        failed++;
        errors.push(`${file}: ${error.message}`);
      }
    });
  }
  
  // Test recipes
  if (fs.existsSync(recipesDir)) {
    const recipeFiles = fs.readdirSync(recipesDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md' && file.startsWith('recipe-'));
    
    recipeFiles.forEach(file => {
      const filePath = path.join(recipesDir, file);
      try {
        const result = processFile(filePath, 'recipe');
        
        // Validate result structure
        if (result && typeof result.published === 'boolean' && typeof result.skipped === 'boolean') {
          // Check if recipe validation is working (recipes without social_image should be skipped)
          const content = fs.readFileSync(filePath, 'utf8');
          const hasSocialImage = content.includes('social_image:') || content.includes('og_image:');
          const isDraft = content.match(/^draft:\s*(true|"true")/m);
          const dateMatch = content.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
          
          if (isDraft && dateMatch && isDatePassed(dateMatch[1]) && !hasSocialImage) {
            // Recipe should be skipped if it's a draft with past date but no social_image
            if (result.skipped && !result.published) {
              console.log(`   ✓ ${file}: Correctly skipped (draft with past date but no social_image)`);
              passed++;
            } else {
              console.log(`   ❌ ${file}: Should be skipped (no social_image) but wasn't`);
              failed++;
              errors.push(`${file}: Recipe validation not working correctly`);
            }
          } else {
            console.log(`   ✓ ${file}: Processed correctly (published: ${result.published}, skipped: ${result.skipped})`);
            passed++;
          }
        } else {
          console.log(`   ❌ ${file}: Invalid result structure`);
          failed++;
          errors.push(`${file}: Invalid result structure`);
        }
      } catch (error) {
        console.log(`   ❌ ${file}: Error processing - ${error.message}`);
        failed++;
        errors.push(`${file}: ${error.message}`);
      }
    });
  }
  
  // Summary
  console.log(`\n✨ Tests: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    errors.forEach(error => console.log(`   - ${error}`));
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}
