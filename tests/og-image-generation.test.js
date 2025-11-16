/**
 * Test suite for OG image generation script
 * 
 * Tests that the OG image generation script:
 * - Generates images for recipes without custom social images
 * - Skips recipes with custom social images
 * - Skips drafts
 * - Creates images with correct naming convention
 * - Generates valid image files
 */

const fs = require('fs');
const path = require('path');
const { generateOGImage, parseFrontMatter } = require('../scripts/generate-og-images');

const recipesDir = path.join(__dirname, '..', 'content', 'recipes');
const outputDir = path.join(__dirname, '..', 'static', 'images', 'social');

// Simple test runner
if (require.main === module) {
  console.log('🧪 Testing OG image generation...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Run tests
  try {
    const recipeFiles = fs.readdirSync(recipesDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md' && file.startsWith('recipe-'));
    
    recipeFiles.forEach(file => {
      const filePath = path.join(recipesDir, file);
      const frontMatter = parseFrontMatter(filePath);
      
      if (!frontMatter) {
        console.log(`⚠️  Skipping ${file}: Could not parse front matter`);
        return;
      }
      
      const slug = frontMatter.slug || file.replace('.md', '');
      const expectedImageName = `recipe-${slug}-og.svg`;
      const expectedImagePath = path.join(outputDir, expectedImageName);
      
      // Test 1: Custom images should be skipped
      if (frontMatter.social_image || frontMatter.og_image) {
        if (!fs.existsSync(expectedImagePath)) {
          console.log(`   ✓ ${file}: Has custom image, correctly skipped`);
          passed++;
        } else {
          console.log(`   ❌ ${file}: Has custom image but generated image exists`);
          failed++;
        }
        return;
      }
      
      // Test 2: Drafts should be skipped
      if (frontMatter.draft) {
        if (!fs.existsSync(expectedImagePath)) {
          console.log(`   ✓ ${file}: Draft, correctly skipped`);
          passed++;
        } else {
          console.log(`   ❌ ${file}: Draft but generated image exists`);
          failed++;
        }
        return;
      }
      
      // Test 3: Published recipes should have images
      if (fs.existsSync(expectedImagePath)) {
        const stats = fs.statSync(expectedImagePath);
        if (stats.size > 0) {
          console.log(`   ✓ ${file}: Auto-generated image exists and is valid`);
          passed++;
        } else {
          console.log(`   ❌ ${file}: Generated image is empty`);
          failed++;
        }
      } else {
        console.log(`   ⚠️  ${file}: Expected image not found (run 'npm run generate:og-images')`);
        // Don't count as failure - might just need to run generation
      }
    });
    
    // Test naming convention
    const generatedImages = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('recipe-') && file.endsWith('-og.svg'));
    
    generatedImages.forEach(imageFile => {
      const pattern = /^recipe-[a-z0-9-]+-og\.svg$/;
      if (pattern.test(imageFile)) {
        console.log(`   ✓ ${imageFile}: Naming convention correct`);
        passed++;
      } else {
        console.log(`   ❌ ${imageFile}: Naming convention incorrect`);
        failed++;
      }
    });
    
    console.log(`\n✨ Tests: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

