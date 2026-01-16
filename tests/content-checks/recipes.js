const fs = require('fs');
const path = require('path');
const { recipesDir, REQUIRED_RECIPE_FIELDS, parseFrontMatter, staticDir } = require('./utils');

function validateRecipeFrontMatter() {
  console.log('\n🍳 Validating recipe front matter structure...');
  
  const errors = [];
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md');
  
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
    
    // Validate time format (should be ISO 8601 duration like PT30M or PT1H30M)
    const timeFields = ['prepTime', 'cookTime', 'totalTime'];
    timeFields.forEach(field => {
      if (frontMatter[field] && !frontMatter[field].match(/^PT((\d+H(\d+M)?)|(\d+M))$/)) {
        errors.push(`${file}: Invalid ${field} format "${frontMatter[field]}" (expected ISO 8601 duration like PT30M or PT1H30M)`);
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

function checkRecipeSocialImages() {
  console.log('\n🖼️  Checking social images for recipes...');
  
  const errors = [];
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md' && file.startsWith('recipe-'));
  
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

function checkRecipeInlineImages() {
  console.log('\n🖼️  Checking inline images in recipe content...');
  
  const errors = [];
  const warnings = [];
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md' && file.startsWith('recipe-'));
  
  if (files.length === 0) {
    console.log('⚠️  No recipe posts found to check.');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(recipesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all img tags in the content
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    const matches = [...content.matchAll(imgRegex)];
    
    if (matches.length === 0) {
      // No images in this recipe, skip
      return;
    }
    
    matches.forEach((match, index) => {
      const imageSrc = match[1];
      
      // Skip external URLs
      if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
        console.log(`   ⏭️  ${file}: Image ${index + 1} is external URL (skipped)`);
        return;
      }
      
      // Validate image path
      const imagePath = imageSrc.startsWith('/') 
        ? imageSrc.substring(1) 
        : imageSrc;
      const fullImagePath = path.join(staticDir, imagePath);
      
      if (!fs.existsSync(fullImagePath)) {
        errors.push(`${file}: Inline image not found: ${imageSrc} (checked: ${fullImagePath})`);
      } else {
        // Verify it's actually an image file (not empty or corrupted)
        try {
          const stats = fs.statSync(fullImagePath);
          if (stats.size === 0) {
            errors.push(`${file}: Inline image is empty: ${imageSrc}`);
          } else {
            console.log(`   ✓ ${file}: Image ${index + 1} exists and is valid (${imageSrc})`);
          }
        } catch (err) {
          errors.push(`${file}: Error checking inline image: ${err.message}`);
        }
      }
    });
    
    // Check for captions - if there's an img tag, check if following content has caption class
    // Look for patterns like: <img ... /> followed by <p class="image-caption">
    const captionRegex = /<img[^>]+>[\s\n]*<p[^>]*class=["'][^"']*image-caption[^"']*["']/;
    const hasCaption = captionRegex.test(content);
    
    // Also check for standalone image-caption class usage
    const hasImageCaptionClass = /class=["'][^"']*image-caption[^"']*["']/.test(content);
    
    if (matches.length > 0 && !hasImageCaptionClass) {
      warnings.push(`${file}: Has ${matches.length} image(s) but no image-caption class found. Consider adding captions with class="image-caption"`);
    }
  });
  
  if (warnings.length > 0) {
    console.warn('⚠️  Recipe image caption warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ Recipe inline image validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  if (warnings.length === 0 && errors.length === 0) {
    console.log('✅ All inline images in recipes are valid.');
  } else if (errors.length === 0) {
    console.log('✅ All inline images in recipes are valid (some captions may need attention).');
  }
}

module.exports = {
  validateRecipeFrontMatter,
  checkRecipeSocialImages,
  checkRecipeInlineImages
};
