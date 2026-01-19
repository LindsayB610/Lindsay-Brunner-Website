const fs = require('fs');
const path = require('path');

const recipesDir = path.join(__dirname, '..', 'content', 'recipes');

// Helper function to parse front matter (reused from content-checks.js)
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
    
    frontMatterText.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('-')) {
        if (currentKey) {
          const arrayItem = trimmedLine.substring(1).trim();
          const cleanItem = arrayItem.replace(/^["']|["']$/g, '');
          arrayValue.push(cleanItem);
          inArray = true;
        }
        return;
      }
      
      if (inArray && currentKey && trimmedLine.includes(':')) {
        frontMatter[currentKey] = arrayValue;
        arrayValue = [];
        inArray = false;
        currentKey = null;
      }
      
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex > 0) {
        if (inArray && currentKey) {
          frontMatter[currentKey] = arrayValue;
          arrayValue = [];
          inArray = false;
        }
        
        const key = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();
        
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
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
    
    if (inArray && currentKey && arrayValue.length > 0) {
      frontMatter[currentKey] = arrayValue;
    }
    
    return frontMatter;
  } catch (error) {
    console.error(`Error parsing front matter in ${filePath}: ${error.message}`);
    return null;
  }
}

// Get content after front matter
function getContentAfterFrontMatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontMatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
      return content; // No front matter, return all content
    }
    
    return content.substring(match[0].length);
  } catch (error) {
    console.error(`Error reading content from ${filePath}: ${error.message}`);
    return '';
  }
}

function validateRecipeTemplate() {
  console.log('\n📋 Validating recipe template structure...');
  
  const errors = [];
  const warnings = [];
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md');
  
  if (files.length === 0) {
    console.log('⚠️  No recipe posts found to validate.');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(recipesDir, file);
    const frontMatter = parseFrontMatter(filePath);
    const content = getContentAfterFrontMatter(filePath);
    
    if (!frontMatter) {
      errors.push(`${file}: Missing or invalid front matter`);
      return;
    }
    
    // 1. File naming convention
    if (!file.startsWith('recipe-')) {
      errors.push(`${file}: Recipe files must start with "recipe-" prefix`);
    }
    
    // 1.5. Subtitle validation
    if (frontMatter.subtitle) {
      const subtitle = frontMatter.subtitle.trim();
      // Check that subtitle starts with "Or:"
      if (!subtitle.startsWith('Or:')) {
        errors.push(`${file}: Subtitle must start with "Or:". Found: "${subtitle.substring(0, 20)}..."`);
      } else {
        // Check that the first word after "Or:" is capitalized
        const afterOr = subtitle.substring(3).trim(); // Skip "Or:"
        if (afterOr.length > 0) {
          const firstChar = afterOr[0];
          if (firstChar !== firstChar.toUpperCase()) {
            errors.push(`${file}: Subtitle first word after "Or:" must be capitalized. Found: "${afterOr.substring(0, 20)}..."`);
          }
        }
      }
    } else {
      errors.push(`${file}: Missing required field "subtitle"`);
    }
    
    // 2. Content structure validation
    const hasOpeningDescription = content.trim().length > 0 && 
                                  !content.trim().startsWith('##');
    const hasSnapshot = /^##\s+Snapshot\s*$/m.test(content);
    const hasIngredients = /^##\s+Ingredients\s*$/m.test(content);
    const hasMethod = /^##\s+Method\s*$/m.test(content);
    const hasNotes = /^##\s+Notes(,?\s+swaps,?\s+)?and\s+guardrails\s*$/im.test(content) || /^##\s+Notes\s+and\s+guardrails\s*$/im.test(content);
    const hasCredit = /^##\s+Credit\s+where\s+it'?s\s+due\s*$/im.test(content);
    
    // Check required sections
    if (!hasOpeningDescription) {
      errors.push(`${file}: Missing opening description paragraph after front matter`);
    }
    
    if (!hasSnapshot) {
      errors.push(`${file}: Missing "## Snapshot" section`);
    }
    
    if (!hasIngredients) {
      errors.push(`${file}: Missing "## Ingredients" section`);
    }
    
    if (!hasMethod) {
      errors.push(`${file}: Missing "## Method" section`);
    }
    
    // 3. Section order validation
    if (hasSnapshot && hasIngredients && hasMethod) {
      const snapshotIndex = content.search(/^##\s+Snapshot\s*$/m);
      const ingredientsIndex = content.search(/^##\s+Ingredients\s*$/m);
      const methodIndex = content.search(/^##\s+Method\s*$/m);
      
      if (snapshotIndex > ingredientsIndex) {
        errors.push(`${file}: Snapshot section must come before Ingredients section`);
      }
      if (ingredientsIndex > methodIndex) {
        errors.push(`${file}: Ingredients section must come before Method section`);
      }
      if (hasNotes) {
        const notesIndex = content.search(/^##\s+Notes(,?\s+swaps,?\s+)?and\s+guardrails\s*$/im) >= 0 
          ? content.search(/^##\s+Notes(,?\s+swaps,?\s+)?and\s+guardrails\s*$/im)
          : content.search(/^##\s+Notes\s+and\s+guardrails\s*$/im);
        if (methodIndex > notesIndex) {
          errors.push(`${file}: Method section must come before Notes section`);
        }
      }
      if (hasCredit) {
        const creditIndex = content.search(/^##\s+Credit\s+where\s+it'?s\s+due\s*$/im);
        // Exception: recipe-consummate-chocolate-chip-cookies.md can have Credit before Notes
        const allowCreditBeforeNotes = file === 'recipe-consummate-chocolate-chip-cookies.md' || file === 'recipe-favorite-chocolate-chip-cookies.md';
        if (hasNotes) {
          const notesIndex = content.search(/^##\s+Notes(,?\s+swaps,?\s+)?and\s+guardrails\s*$/im) >= 0 
          ? content.search(/^##\s+Notes(,?\s+swaps,?\s+)?and\s+guardrails\s*$/im)
          : content.search(/^##\s+Notes\s+and\s+guardrails\s*$/im);
          if (notesIndex > creditIndex && !allowCreditBeforeNotes) {
            errors.push(`${file}: Notes section must come before Credit section`);
          }
        } else if (methodIndex > creditIndex && !allowCreditBeforeNotes) {
          errors.push(`${file}: Method section must come before Credit section`);
        }
      }
    }
    
    // 4. Section separator validation
    // Should only have `---` after front matter and before Notes section
    // Since we're looking at content after front matter, we should only see separators before Notes
    const horizontalRules = content.match(/^---\s*$/gm) || [];
    const hasNotesSection = hasNotes;
    
    if (hasNotesSection) {
      // Should have exactly one separator before Notes section
      if (horizontalRules.length === 0) {
        errors.push(`${file}: Missing horizontal rule (---) before Notes section`);
      } else if (horizontalRules.length > 1) {
        errors.push(`${file}: Too many horizontal rules (---). Only use --- after front matter and before Notes section`);
      } else {
        // Check that the separator is actually before Notes section
        const separatorIndex = content.indexOf('---');
        const notesIndex = content.search(/^##\s+Notes(,?\s+swaps,?\s+)?and\s+guardrails\s*$/im) >= 0 
          ? content.search(/^##\s+Notes(,?\s+swaps,?\s+)?and\s+guardrails\s*$/im)
          : content.search(/^##\s+Notes\s+and\s+guardrails\s*$/im);
        if (separatorIndex > notesIndex || notesIndex - separatorIndex > 50) {
          errors.push(`${file}: Horizontal rule (---) should be immediately before Notes section`);
        }
      }
    } else {
      // No Notes section, so no separators should be present (front matter separator is already removed)
      if (horizontalRules.length > 0) {
        errors.push(`${file}: Horizontal rules (---) should only be used before Notes section. Found ${horizontalRules.length} invalid separator(s)`);
      }
    }
    
    // 5. Snapshot section format validation
    if (hasSnapshot) {
      // Find the Snapshot section and get content until next section
      const snapshotHeaderIndex = content.search(/^##\s+Snapshot\s*$/m);
      if (snapshotHeaderIndex >= 0) {
        // Get content after Snapshot header
        const afterSnapshot = content.substring(snapshotHeaderIndex);
        // Find the next section header (##) or end of content
        const nextSectionMatch = afterSnapshot.match(/\n##\s+/);
        const snapshotEndIndex = nextSectionMatch ? nextSectionMatch.index : afterSnapshot.length;
        const snapshotContent = afterSnapshot.substring(0, snapshotEndIndex);
        
        // Check for required Implements field (with dash bullet)
        if (!/-\s+\*\*Implements:\*\*/.test(snapshotContent)) {
          errors.push(`${file}: Snapshot section must include "- **Implements:**" field with dash bullet`);
        }
        
        // Check for heat/cooking method field (at least one should be present)
        const hasHeatField = /-\s+\*\*(Oven setting|Stove setting|Cooker setting|Heat setting|Heat|Oven):\*\*/.test(snapshotContent);
        if (!hasHeatField) {
          warnings.push(`${file}: Snapshot section should include a heat/cooking method field (Oven setting, Stove setting, Cooker setting, Heat setting, or Heat)`);
        }
        
        // Check for batch size (optional but recommended)
        // Allow for variations like "Batch size (safety):"
        if (!/-\s+\*\*Batch size/.test(snapshotContent)) {
          warnings.push(`${file}: Snapshot section should include "- **Batch size:**" field`);
        }
        
        // Validate snapshot uses dash bullets
        const snapshotBullets = snapshotContent.match(/^-\s+\*\*/gm);
        if (!snapshotBullets || snapshotBullets.length === 0) {
          errors.push(`${file}: Snapshot section must use dash bullets (-) for list items`);
        }
      }
    }
    
    // 6. Temperature formatting validation
    // Should use °F and °C with format: 200°F (93°C) or 160–165°F (71–74°C)
    // Should NOT use slash format: 350°F / 175°C
    const temperaturePatterns = [
      /\d+\s*°F\s*\/\s*\d+\s*°C/,  // Slash format (invalid)
      /\d+\s*°F\s*\/\s*\d+\s*°C/,  // Another slash variant
    ];
    
    temperaturePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        errors.push(`${file}: Invalid temperature format found. Use parentheses format: "200°F (93°C)" instead of slash format: "200°F / 93°C"`);
      }
    });
    
    // Check for proper temperature format (should have °F and optionally °C in parentheses)
    // This is a warning, not an error, as some recipes might not have temperatures
    const hasTemperatures = /°F|°C/.test(content);
    if (hasTemperatures) {
      const properFormat = /\d+[–-]?\d*\s*°F\s*\(\s*\d+[–-]?\d*\s*°C\s*\)/.test(content);
      if (!properFormat) {
        // Check if there are any temperatures at all
        const tempMatches = content.match(/\d+\s*°[FC]/g);
        if (tempMatches && tempMatches.length > 0) {
          warnings.push(`${file}: Temperature formatting may not follow standard format. Use "200°F (93°C)" format`);
        }
      }
    }
    
    // 6.5. Percent formatting validation
    // Should use: 85% (no space before %)
    // Should NOT use: 85 % (space before %)
    const percentWithSpace = content.match(/\d+\s+%/g);
    if (percentWithSpace && percentWithSpace.length > 0) {
      errors.push(`${file}: Percent formatting should not have space before %. Found: "${percentWithSpace[0]}". Use "85%" not "85 %"`);
    }
    
    // 6.6. Fraction formatting validation
    // Should use Unicode fractions: ½, ⅓, ¼, ¾, etc.
    // Should NOT use regular fractions: 1/2, 1/3, 1/4, 3/4, etc.
    // Exception: Ratios like 75/25 are acceptable
    const regularFractions = content.match(/\b(1\/2|1\/3|1\/4|3\/4|2\/3|1\/8|3\/8|5\/8|7\/8|1\/6|5\/6)\b/g);
    if (regularFractions && regularFractions.length > 0) {
      // Filter out ratios (like 75/25) - these are acceptable
      const actualFractions = regularFractions.filter(f => {
        const parts = f.split('/');
        const num = parseInt(parts[0]);
        const den = parseInt(parts[1]);
        // Ratios are typically larger numbers, fractions are small (1-7 numerator, 2-8 denominator)
        return num <= 7 && den <= 8;
      });
      if (actualFractions.length > 0) {
        const fractionMap = {
          '1/2': '½', '1/3': '⅓', '1/4': '¼', '3/4': '¾',
          '2/3': '⅔', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
          '1/6': '⅙', '5/6': '⅚'
        };
        const firstFraction = actualFractions[0];
        const unicodeVersion = fractionMap[firstFraction] || firstFraction;
        errors.push(`${file}: Use Unicode fractions instead of regular fractions. Found: "${firstFraction}". Use "${unicodeVersion}" instead`);
      }
    }
    
    // Check for mixed numbers with regular fractions (like "1 1/2")
    const mixedNumberFractions = content.match(/\b\d+\s+(1\/2|1\/3|1\/4|3\/4|2\/3|1\/8|3\/8|5\/8|7\/8)\b/g);
    if (mixedNumberFractions && mixedNumberFractions.length > 0) {
      const firstMixed = mixedNumberFractions[0];
      const parts = firstMixed.split(/\s+/);
      const whole = parts[0];
      const fraction = parts[1];
      const fractionMap = {
        '1/2': '½', '1/3': '⅓', '1/4': '¼', '3/4': '¾',
        '2/3': '⅔', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞'
      };
      const unicodeFraction = fractionMap[fraction] || fraction;
      errors.push(`${file}: Use Unicode fractions in mixed numbers. Found: "${firstMixed}". Use "${whole}${unicodeFraction}" instead`);
    }
    
    // 7. Measurement formatting validation
    // Should capitalize: Tbsp, Tsp
    // Should NOT use: tbsp, tsp (lowercase)
    // Case-sensitive check - only flag actual lowercase instances
    const lowercaseTbsp = content.match(/\btbsp\b/g);
    if (lowercaseTbsp && lowercaseTbsp.length > 0) {
      errors.push(`${file}: Measurement abbreviations must be capitalized. Found: "tbsp". Use "Tbsp"`);
    }
    
    const lowercaseTsp = content.match(/\btsp\b/g);
    if (lowercaseTsp && lowercaseTsp.length > 0) {
      errors.push(`${file}: Measurement abbreviations must be capitalized. Found: "tsp". Use "Tsp"`);
    }
    
    // "cup" / "cups" should be lowercase (not a proper noun), unless it's the first word in a sentence
    // Check for capitalized "Cup" or "Cups" - flag any that are NOT clearly at sentence start
    // In recipe contexts, "cup" should almost always be lowercase
    const capitalizedCup = content.match(/\bCup\b/g);
    const capitalizedCups = content.match(/\bCups\b/g);
    
    if (capitalizedCup) {
      // Check each occurrence to see if it's at sentence start
      const cupMatches = [...content.matchAll(/\bCup\b/g)];
      let foundInvalid = false;
      
      for (const match of cupMatches) {
        const index = match.index;
        // Allow if at very start of content
        if (index === 0) continue;
        
        // Get context before "Cup" (up to 10 chars to catch sentence endings)
        const beforeContext = content.substring(Math.max(0, index - 10), index);
        
        // Allow if it's clearly at sentence start: after . ! ? followed by space/newline
        if (/[.!?]\s+$/.test(beforeContext) || /^\n/.test(beforeContext)) {
          continue;
        }
        
        // Otherwise, flag it (most recipe contexts should use lowercase)
        foundInvalid = true;
        break;
      }
      
      if (foundInvalid) {
        errors.push(`${file}: "cup" should be lowercase (not a proper noun). Found: "Cup". Use "cup" unless it's the first word in a sentence.`);
      }
    }
    
    if (capitalizedCups) {
      const cupsMatches = [...content.matchAll(/\bCups\b/g)];
      let foundInvalid = false;
      
      for (const match of cupsMatches) {
        const index = match.index;
        if (index === 0) continue;
        
        const beforeContext = content.substring(Math.max(0, index - 10), index);
        if (/[.!?]\s+$/.test(beforeContext) || /^\n/.test(beforeContext)) {
          continue;
        }
        
        foundInvalid = true;
        break;
      }
      
      if (foundInvalid) {
        errors.push(`${file}: "cups" should be lowercase (not a proper noun). Found: "Cups". Use "cups" unless it's the first word in a sentence.`);
      }
    }
    
    // Should spell out: minutes, hours, seconds (not min, hr, sec)
    const abbreviatedTime = [
      /\bmin\b(?!ute)/gi,  // "min" but not "minute"
      /\bhr\b(?!s|our)/gi,  // "hr" but not "hours" or "hour"
      /\bsec\b(?!ond)/gi,   // "sec" but not "second"
    ];
    
    abbreviatedTime.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        errors.push(`${file}: Time units must be spelled out. Found: "${matches[0]}". Use "minutes", "hours", or "seconds"`);
      }
    });
    
    // 8. Header formatting validation
    // H2 headers should be sentence case (Ingredients, Method, not INGREDIENTS, METHOD)
    const h2Headers = content.match(/^##\s+(.+)$/gm) || [];
    h2Headers.forEach(header => {
      const headerText = header.replace(/^##\s+/, '').trim();
      // Skip if it's all caps (likely wrong)
      if (headerText === headerText.toUpperCase() && headerText.length > 3) {
        errors.push(`${file}: H2 header "${headerText}" should be sentence case, not all caps`);
      }
      // Check for title case when it should be sentence case
      // This is a warning, not strict, as some headers might legitimately be title case
      const words = headerText.split(/\s+/);
      if (words.length > 1 && words.every(word => /^[A-Z]/.test(word))) {
        // All words start with capital - might be title case when it should be sentence case
        const commonHeaders = ['Ingredients', 'Method', 'Snapshot', 'Notes', 'Credit'];
        if (!commonHeaders.includes(headerText)) {
          warnings.push(`${file}: H2 header "${headerText}" might should be sentence case (only first word capitalized)`);
        }
      }
    });
    
    // H3 headers should be sentence case
    const h3Headers = content.match(/^###\s+(.+)$/gm) || [];
    h3Headers.forEach(header => {
      const headerText = header.replace(/^###\s+/, '').trim();
      if (headerText === headerText.toUpperCase() && headerText.length > 3) {
        errors.push(`${file}: H3 header "${headerText}" should be sentence case, not all caps`);
      }
    });
    
    // 9. Method section format validation
    if (hasMethod) {
      // Fix: The original regex had $ in lookahead which matches end-of-line with /m flag,
      // causing the non-greedy match to capture nothing. Fix by matching next section or end of string.
      const methodMatch = content.match(/^##\s+Method\s*$\n?([\s\S]*?)(?=\n##\s+[^#]|\n---|$)/m);
      if (methodMatch && methodMatch[1] && methodMatch[1].trim().length > 0) {
        const methodContent = methodMatch[1];
        // Method should use numbered list format: 1. **Step title** or 1. Step title
        // Check for numbered steps (with or without bold)
        const numberedSteps = methodContent.match(/^\d+\.\s+(\*\*)?[^*]/gm);
        if (!numberedSteps || numberedSteps.length === 0) {
          warnings.push(`${file}: Method section should use numbered list format: "1. **Step title**" or "1. Step title"`);
        }
      }
    }
  });
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  Template warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Recipe template validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log(`✅ Recipe template validation passed for ${files.length} recipe(s).`);
}

// Run the validation
validateRecipeTemplate();

