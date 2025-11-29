/**
 * Test suite for schedule-posts script
 * 
 * Tests that the scheduling script:
 * - Correctly identifies posts ready to publish (draft: true, date at 6am PT or later)
 * - Skips posts with future dates or dates before 6am PT
 * - Skips posts that are already published (draft: false)
 * - Validates recipes have social_image before publishing
 * - Correctly parses dates and compares them with timezone awareness
 * - Correctly detects DST for Pacific Time
 */

const fs = require('fs');
const path = require('path');
const { processFile, isDatePassed, isPacificDST, getNthDayOfMonth } = require('../scripts/schedule-posts');

const thoughtsDir = path.join(__dirname, '..', 'content', 'thoughts');
const recipesDir = path.join(__dirname, '..', 'content', 'recipes');

// Simple test runner
if (require.main === module) {
  console.log('🧪 Testing schedule-posts script...\n');
  
  let passed = 0;
  let failed = 0;
  const errors = [];
  
  // Test DST detection
  console.log('🌍 Testing DST detection...');
  try {
    // Test PST dates (winter)
    if (!isPacificDST(2025, 11, 1)) { // Dec 1, 2025 (month 11 = December, 0-indexed)
      console.log(`   ✓ December 1, 2025 correctly identified as PST`);
      passed++;
    } else {
      console.log(`   ❌ December 1, 2025 incorrectly identified as PDT`);
      failed++;
      errors.push('DST detection failed for December (should be PST)');
    }
    
    // Test PDT dates (summer)
    if (isPacificDST(2025, 5, 15)) { // Jun 15, 2025 (month 5 = June, 0-indexed)
      console.log(`   ✓ June 15, 2025 correctly identified as PDT`);
      passed++;
    } else {
      console.log(`   ❌ June 15, 2025 incorrectly identified as PST`);
      failed++;
      errors.push('DST detection failed for June (should be PDT)');
    }
    
    // Test edge case: March before 2nd Sunday (should be PST)
    if (!isPacificDST(2025, 2, 8)) { // March 8, 2025 (before 2nd Sunday on March 9)
      console.log(`   ✓ March 8, 2025 correctly identified as PST (before DST starts)`);
      passed++;
    } else {
      console.log(`   ❌ March 8, 2025 incorrectly identified as PDT`);
      failed++;
      errors.push('DST detection failed for March 8 (should be PST)');
    }
    
    // Test edge case: March 2nd Sunday (should be PDT)
    if (isPacificDST(2025, 2, 9)) { // March 9, 2025 (2nd Sunday)
      console.log(`   ✓ March 9, 2025 correctly identified as PDT (DST starts)`);
      passed++;
    } else {
      console.log(`   ❌ March 9, 2025 incorrectly identified as PST`);
      failed++;
      errors.push('DST detection failed for March 9 (should be PDT)');
    }
    
    // Test edge case: November 1st Sunday (should be PDT)
    if (isPacificDST(2025, 10, 2)) { // November 2, 2025 (1st Sunday)
      console.log(`   ✓ November 2, 2025 correctly identified as PDT (DST still active)`);
      passed++;
    } else {
      console.log(`   ❌ November 2, 2025 incorrectly identified as PST`);
      failed++;
      errors.push('DST detection failed for November 2 (should be PDT)');
    }
    
    // Test edge case: November after 1st Sunday (should be PST)
    if (!isPacificDST(2025, 10, 3)) { // November 3, 2025 (after 1st Sunday)
      console.log(`   ✓ November 3, 2025 correctly identified as PST (DST ends)`);
      passed++;
    } else {
      console.log(`   ❌ November 3, 2025 incorrectly identified as PDT`);
      failed++;
      errors.push('DST detection failed for November 3 (should be PST)');
    }
  } catch (error) {
    console.error(`   ❌ DST detection test error: ${error.message}`);
    failed++;
    errors.push(`DST detection test error: ${error.message}`);
  }
  
  // Test date comparison with time awareness
  console.log('\n📅 Testing time-aware date comparison...');
  try {
    const now = new Date();
    const nowUTC = new Date(now.toISOString());
    
    // Test past date (yesterday at 6am PT should have passed)
    const yesterday = new Date(nowUTC);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayYear = yesterday.getUTCFullYear();
    const yesterdayMonth = yesterday.getUTCMonth();
    const yesterdayDay = yesterday.getUTCDate();
    
    // Determine if yesterday was in DST
    const wasDST = isPacificDST(yesterdayYear, yesterdayMonth, yesterdayDay);
    const yesterdayUTCHour = wasDST ? 13 : 14; // 6am PT in UTC
    
    // Set to 6am PT on yesterday
    const yesterday6amPT = new Date(Date.UTC(yesterdayYear, yesterdayMonth, yesterdayDay, yesterdayUTCHour, 0, 0, 0));
    
    // If it's past 6am PT yesterday, the date should be passed
    const yesterdayStr = `${yesterdayYear}-${String(yesterdayMonth + 1).padStart(2, '0')}-${String(yesterdayDay).padStart(2, '0')}`;
    if (nowUTC >= yesterday6amPT) {
      if (isDatePassed(yesterdayStr)) {
        console.log(`   ✓ Past date (${yesterdayStr}) correctly identified as passed`);
        passed++;
      } else {
        console.log(`   ❌ Past date (${yesterdayStr}) not identified as passed`);
        failed++;
        errors.push(`Time-aware date comparison failed for past date: ${yesterdayStr}`);
      }
    } else {
      // If it's before 6am PT yesterday, it shouldn't be passed yet
      if (!isDatePassed(yesterdayStr)) {
        console.log(`   ✓ Past date (${yesterdayStr}) correctly identified as not yet passed (before 6am PT)`);
        passed++;
      } else {
        console.log(`   ❌ Past date (${yesterdayStr}) incorrectly identified as passed (before 6am PT)`);
        failed++;
        errors.push(`Time-aware date comparison failed for past date before 6am PT: ${yesterdayStr}`);
      }
    }
    
    // Test today's date - depends on current time
    const todayYear = nowUTC.getUTCFullYear();
    const todayMonth = nowUTC.getUTCMonth();
    const todayDay = nowUTC.getUTCDate();
    const todayIsDST = isPacificDST(todayYear, todayMonth, todayDay);
    const todayUTCHour = todayIsDST ? 13 : 14;
    const today6amPT = new Date(Date.UTC(todayYear, todayMonth, todayDay, todayUTCHour, 0, 0, 0));
    const todayStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    
    if (nowUTC >= today6amPT) {
      if (isDatePassed(todayStr)) {
        console.log(`   ✓ Today's date (${todayStr}) correctly identified as passed (after 6am PT)`);
        passed++;
      } else {
        console.log(`   ❌ Today's date (${todayStr}) not identified as passed (after 6am PT)`);
        failed++;
        errors.push(`Time-aware date comparison failed for today after 6am PT: ${todayStr}`);
      }
    } else {
      if (!isDatePassed(todayStr)) {
        console.log(`   ✓ Today's date (${todayStr}) correctly identified as not yet passed (before 6am PT)`);
        passed++;
      } else {
        console.log(`   ❌ Today's date (${todayStr}) incorrectly identified as passed (before 6am PT)`);
        failed++;
        errors.push(`Time-aware date comparison failed for today before 6am PT: ${todayStr}`);
      }
    }
    
    // Test future date (tomorrow should not be passed)
    const tomorrow = new Date(nowUTC);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowYear = tomorrow.getUTCFullYear();
    const tomorrowMonth = tomorrow.getUTCMonth();
    const tomorrowDay = tomorrow.getUTCDate();
    const tomorrowStr = `${tomorrowYear}-${String(tomorrowMonth + 1).padStart(2, '0')}-${String(tomorrowDay).padStart(2, '0')}`;
    
    if (!isDatePassed(tomorrowStr)) {
      console.log(`   ✓ Future date (${tomorrowStr}) correctly identified as not passed`);
      passed++;
    } else {
      console.log(`   ❌ Future date (${tomorrowStr}) incorrectly identified as passed`);
      failed++;
      errors.push(`Time-aware date comparison failed for future date: ${tomorrowStr}`);
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
    
    // Test null/empty date
    if (!isDatePassed(null) && !isDatePassed('')) {
      console.log(`   ✓ Null/empty date correctly handled`);
      passed++;
    } else {
      console.log(`   ❌ Null/empty date not handled correctly`);
      failed++;
      errors.push('Null/empty date not handled correctly');
    }
    
    // Test UTC conversion: PST date should use 14:00 UTC
    // Dec 1, 2025 at 6am PST = Dec 1, 2025 at 14:00 UTC
    const pstTestDate = '2025-12-01';
    const pst6amUTC = new Date(Date.UTC(2025, 11, 1, 14, 0, 0, 0)); // Dec 1, 2025 14:00 UTC
    const beforePST = new Date(Date.UTC(2025, 11, 1, 13, 59, 59, 0)); // Just before 6am PT
    const afterPST = new Date(Date.UTC(2025, 11, 1, 14, 0, 1, 0)); // Just after 6am PT
    
    // Mock current time to test UTC conversion
    const originalDate = global.Date;
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(beforePST); // Before 6am PT
        } else {
          super(...args);
        }
      }
      static now() {
        return beforePST.getTime();
      }
    };
    
    // Should not pass before 6am PT
    if (!isDatePassed(pstTestDate)) {
      console.log(`   ✓ PST date correctly not passed before 6am PT (14:00 UTC)`);
      passed++;
    } else {
      console.log(`   ❌ PST date incorrectly passed before 6am PT`);
      failed++;
      errors.push('PST UTC conversion failed (should not pass before 14:00 UTC)');
    }
    
    // Now test after 6am PT
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(afterPST); // After 6am PT
        } else {
          super(...args);
        }
      }
      static now() {
        return afterPST.getTime();
      }
    };
    
    if (isDatePassed(pstTestDate)) {
      console.log(`   ✓ PST date correctly passed after 6am PT (14:00 UTC)`);
      passed++;
    } else {
      console.log(`   ❌ PST date incorrectly not passed after 6am PT`);
      failed++;
      errors.push('PST UTC conversion failed (should pass after 14:00 UTC)');
    }
    
    // Test UTC conversion: PDT date should use 13:00 UTC
    // Jun 15, 2025 at 6am PDT = Jun 15, 2025 at 13:00 UTC
    const pdtTestDate = '2025-06-15';
    const pdt6amUTC = new Date(Date.UTC(2025, 5, 15, 13, 0, 0, 0)); // Jun 15, 2025 13:00 UTC
    const beforePDT = new Date(Date.UTC(2025, 5, 15, 12, 59, 59, 0)); // Just before 6am PT
    const afterPDT = new Date(Date.UTC(2025, 5, 15, 13, 0, 1, 0)); // Just after 6am PT
    
    // Before 6am PT
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(beforePDT);
        } else {
          super(...args);
        }
      }
      static now() {
        return beforePDT.getTime();
      }
    };
    
    if (!isDatePassed(pdtTestDate)) {
      console.log(`   ✓ PDT date correctly not passed before 6am PT (13:00 UTC)`);
      passed++;
    } else {
      console.log(`   ❌ PDT date incorrectly passed before 6am PT`);
      failed++;
      errors.push('PDT UTC conversion failed (should not pass before 13:00 UTC)');
    }
    
    // After 6am PT
    global.Date = class extends originalDate {
      constructor(...args) {
        if (args.length === 0) {
          super(afterPDT);
        } else {
          super(...args);
        }
      }
      static now() {
        return afterPDT.getTime();
      }
    };
    
    if (isDatePassed(pdtTestDate)) {
      console.log(`   ✓ PDT date correctly passed after 6am PT (13:00 UTC)`);
      passed++;
    } else {
      console.log(`   ❌ PDT date incorrectly not passed after 6am PT`);
      failed++;
      errors.push('PDT UTC conversion failed (should pass after 13:00 UTC)');
    }
    
    // Restore original Date
    global.Date = originalDate;
  } catch (error) {
    console.error(`   ❌ Time-aware date comparison test error: ${error.message}`);
    failed++;
    errors.push(`Time-aware date comparison test error: ${error.message}`);
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
