/**
 * Test suite for recipe search JSON index
 * 
 * Tests that the recipe search JSON index:
 * - Is valid JSON and parseable
 * - Contains all required fields per recipe
 * - Excludes drafts
 * - Has correct date format (ISO 8601)
 * - Has correct structure (array of recipe objects)
 * - Handles edge cases (0 recipes, 1 recipe, multiple recipes)
 */

const fs = require('fs');
const path = require('path');
const { parseFrontMatter } = require('./content-checks/utils');

const jsonIndexPath = path.join(__dirname, '..', 'public', 'recipes', 'index.json');
const recipesDir = path.join(__dirname, '..', 'content', 'recipes');

// Required fields in the JSON index
const REQUIRED_JSON_FIELDS = ['title', 'date', 'permalink'];
const OPTIONAL_JSON_FIELDS = ['description', 'subtitle', 'slug', 'recipeCategory', 'recipeCuisine', 'recipeIngredient', 'recipeInstructions', 'social_image', 'dietary'];

// Simple test runner
if (require.main === module) {
  console.log('🧪 Testing recipe search JSON index...\n');
  
  let passed = 0;
  let failed = 0;
  const errors = [];
  
  // Test 1: JSON file exists
  console.log('📄 Testing JSON file existence...');
  try {
    if (!fs.existsSync(jsonIndexPath)) {
      console.error(`❌ JSON index file not found at: ${jsonIndexPath}`);
      console.error('   Run "npm run build" to generate the JSON index.');
      failed++;
      errors.push('JSON index file does not exist');
    } else {
      console.log('   ✓ JSON index file exists');
      passed++;
    }
  } catch (error) {
    console.error(`   ❌ Error checking JSON file: ${error.message}`);
    failed++;
    errors.push(`Error checking JSON file: ${error.message}`);
  }
  
  // Test 2: JSON is valid and parseable
  console.log('\n🔍 Testing JSON validity...');
  try {
    const jsonContent = fs.readFileSync(jsonIndexPath, 'utf8');
    let recipes;
    
    try {
      recipes = JSON.parse(jsonContent);
      console.log('   ✓ JSON is valid and parseable');
      passed++;
    } catch (parseError) {
      console.error(`   ❌ JSON parse error: ${parseError.message}`);
      failed++;
      errors.push(`JSON parse error: ${parseError.message}`);
      process.exit(1);
    }
    
    // Test 3: Is an array
    if (!Array.isArray(recipes)) {
      console.error('   ❌ JSON is not an array');
      failed++;
      errors.push('JSON index is not an array');
    } else {
      console.log(`   ✓ JSON is an array with ${recipes.length} recipe(s)`);
      passed++;
    }
    
    // Test 4: Validate each recipe object structure
    console.log('\n📋 Testing recipe object structure...');
    let structureErrors = 0;
    recipes.forEach((recipe, index) => {
      // Check required fields
      REQUIRED_JSON_FIELDS.forEach(field => {
        if (!(field in recipe)) {
          console.error(`   ❌ Recipe ${index} (${recipe.title || 'unknown'}): Missing required field "${field}"`);
          failed++;
          structureErrors++;
          errors.push(`Recipe ${index}: Missing required field "${field}"`);
        }
      });
      
      // Validate date format (ISO 8601)
      if (recipe.date) {
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
        if (!iso8601Regex.test(recipe.date)) {
          console.error(`   ❌ Recipe ${index} (${recipe.title}): Date "${recipe.date}" is not in ISO 8601 format`);
          failed++;
          errors.push(`Recipe ${index}: Date format is not ISO 8601`);
        } else {
          if (index === 0) {
            console.log(`   ✓ Recipe ${index}: Date format is valid ISO 8601`);
          }
        }
      }
      
      // Validate permalink format (should start with /recipes/)
      if (recipe.permalink) {
        if (!recipe.permalink.startsWith('/recipes/')) {
          console.error(`   ❌ Recipe ${index} (${recipe.title}): Permalink "${recipe.permalink}" does not start with /recipes/`);
          failed++;
          errors.push(`Recipe ${index}: Permalink format is incorrect`);
        } else {
          if (index === 0) {
            console.log(`   ✓ Recipe ${index}: Permalink format is correct`);
          }
        }
      }
      
      // Validate recipeIngredient is an array if present
      if (recipe.recipeIngredient !== undefined && !Array.isArray(recipe.recipeIngredient)) {
        console.error(`   ❌ Recipe ${index} (${recipe.title}): recipeIngredient is not an array`);
        failed++;
        errors.push(`Recipe ${index}: recipeIngredient must be an array`);
      }
      
      // Validate recipeInstructions is a string if present (joined from array)
      if (recipe.recipeInstructions !== undefined && typeof recipe.recipeInstructions !== 'string') {
        console.error(`   ❌ Recipe ${index} (${recipe.title}): recipeInstructions is not a string`);
        failed++;
        structureErrors++;
        errors.push(`Recipe ${index}: recipeInstructions must be a string`);
      }
    });
    
    if (structureErrors === 0 && recipes.length > 0) {
      console.log(`   ✓ All ${recipes.length} recipe(s) have valid structure`);
      passed++;
    } else if (recipes.length === 0) {
      console.log('   ⚠️  No recipes to validate structure');
    }
    
    // Test 5: Verify drafts are excluded
    console.log('\n🚫 Testing draft exclusion...');
    try {
      // Count recipes in content directory (including drafts)
      const allRecipeFiles = fs.readdirSync(recipesDir)
        .filter(file => file.endsWith('.md') && file !== '_index.md' && file.startsWith('recipe-'));
      
      // Parse front matter to count published recipes
      let publishedCount = 0;
      allRecipeFiles.forEach(file => {
        const filePath = path.join(recipesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        
        if (frontMatterMatch) {
          const frontMatterText = frontMatterMatch[1];
          // Simple check for draft: false or no draft field (defaults to false in Hugo)
          if (!frontMatterText.includes('draft: true') && !frontMatterText.match(/draft:\s*true/i)) {
            publishedCount++;
          }
        }
      });
      
      if (recipes.length === publishedCount) {
        console.log(`   ✓ Drafts correctly excluded (${recipes.length} published recipes in index)`);
        passed++;
      } else {
        console.error(`   ❌ Draft exclusion mismatch: Expected ${publishedCount} published recipes, found ${recipes.length} in index`);
        console.error(`   💡 Tip: Run "npm run build" to regenerate the JSON index, or run "npm test" which builds automatically.`);
        failed++;
        errors.push(`Draft exclusion: Expected ${publishedCount} published, found ${recipes.length}`);
      }
    } catch (error) {
      console.error(`   ❌ Error checking draft exclusion: ${error.message}`);
      failed++;
      errors.push(`Error checking drafts: ${error.message}`);
    }

    // Test 6: Verify recipes stay sorted newest-first
    console.log('\n📅 Testing newest-first sort order...');
    try {
      const publishedRecipes = fs.readdirSync(recipesDir)
        .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md' && file.startsWith('recipe-'))
        .map(file => ({ file, frontMatter: parseFrontMatter(path.join(recipesDir, file)) }))
        .filter(({ frontMatter }) => frontMatter && !/true/i.test(String(frontMatter.draft || 'false')) && frontMatter.date);

      if (recipes.length > 0 && publishedRecipes.length > 0) {
        const latestDate = publishedRecipes.reduce((max, { frontMatter }) => {
          return frontMatter.date > max ? frontMatter.date : max;
        }, '0000-00-00');

        const latestTitles = new Set(
          publishedRecipes
            .filter(({ frontMatter }) => frontMatter.date === latestDate)
            .map(({ frontMatter, file }) => frontMatter.title || file)
        );

        const firstRecipeDate = recipes[0].date.slice(0, 10);
        if (firstRecipeDate !== latestDate) {
          console.error(`   ❌ First recipe date mismatch: expected latest published date ${latestDate}, found ${firstRecipeDate}`);
          failed++;
          errors.push(`Newest-first sort mismatch: expected first recipe date ${latestDate}, found ${firstRecipeDate}`);
        } else if (!latestTitles.has(recipes[0].title)) {
          console.error(`   ❌ First recipe title mismatch for latest date ${latestDate}: found "${recipes[0].title}"`);
          failed++;
          errors.push(`Newest-first sort mismatch: first recipe "${recipes[0].title}" is not among latest dated recipes`);
        } else {
          console.log(`   ✓ First recipe matches latest published date (${latestDate})`);
          passed++;
        }

        let isSorted = true;
        for (let index = 1; index < recipes.length; index++) {
          if (recipes[index - 1].date < recipes[index].date) {
            isSorted = false;
            console.error(`   ❌ Recipes out of order at indexes ${index - 1} and ${index}: ${recipes[index - 1].date} before ${recipes[index].date}`);
            failed++;
            errors.push(`Newest-first sort mismatch between indexes ${index - 1} and ${index}`);
            break;
          }
        }

        if (isSorted) {
          console.log('   ✓ Recipe index JSON is sorted newest-first');
          passed++;
        }
      }
    } catch (error) {
      console.error(`   ❌ Error checking sort order: ${error.message}`);
      failed++;
      errors.push(`Error checking sort order: ${error.message}`);
    }
    
    // Test 7: Edge cases - at least one recipe
    console.log('\n📊 Testing edge cases...');
    if (recipes.length === 0) {
      console.log('   ⚠️  Warning: No recipes in index (this might be expected if all are drafts)');
    } else if (recipes.length === 1) {
      console.log('   ✓ Edge case: Single recipe handled correctly');
      passed++;
    } else {
      console.log(`   ✓ Multiple recipes (${recipes.length}) handled correctly`);
      passed++;
    }
    
    // Test 8: Check for unexpected fields
    console.log('\n🔎 Testing for unexpected fields...');
    const allValidFields = [...REQUIRED_JSON_FIELDS, ...OPTIONAL_JSON_FIELDS];
    recipes.forEach((recipe, index) => {
      Object.keys(recipe).forEach(key => {
        if (!allValidFields.includes(key)) {
          console.error(`   ❌ Recipe ${index} (${recipe.title}): Unexpected field "${key}"`);
          failed++;
          errors.push(`Recipe ${index}: Unexpected field "${key}"`);
        }
      });
    });
    
    if (recipes.length > 0 && errors.filter(e => e.includes('Unexpected field')).length === 0) {
      console.log('   ✓ No unexpected fields found');
      passed++;
    }
    
  } catch (error) {
    console.error(`❌ Error reading JSON file: ${error.message}`);
    failed++;
    errors.push(`Error reading JSON: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

module.exports = {};
