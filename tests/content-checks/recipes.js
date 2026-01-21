const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
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
      const fullMatch = match[0];
      
      // Skip external URLs
      if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
        console.log(`   ⏭️  ${file}: Image ${index + 1} is external URL (skipped)`);
        return;
      }
      
      // Extract alt text from img tag
      const altMatch = fullMatch.match(/alt=["']([^"']*)["']/);
      const altText = altMatch ? altMatch[1] : '';
      
      // Validate alt text exists and is descriptive
      if (!altText || altText.trim() === '') {
        errors.push(`${file}: Image ${index + 1} (${imageSrc}) is missing alt text. All recipe images must have descriptive alt text.`);
      } else {
        // Check if alt text is descriptive (not generic or too short)
        const genericWords = ['image', 'photo', 'picture', 'img', 'photo of', 'image of', 'picture of'];
        const isGeneric = genericWords.some(word => 
          altText.toLowerCase().trim() === word || 
          altText.toLowerCase().trim().startsWith(word + ' ') ||
          altText.toLowerCase().trim() === word + 's'
        );
        
        // Alt text should be at least 10 characters and not be generic
        if (altText.trim().length < 10) {
          errors.push(`${file}: Image ${index + 1} (${imageSrc}) has alt text that is too short: "${altText}". Alt text should be descriptive (at least 10 characters).`);
        } else if (isGeneric) {
          errors.push(`${file}: Image ${index + 1} (${imageSrc}) has generic alt text: "${altText}". Alt text should be descriptive and specific to the image content.`);
        } else {
          console.log(`   ✓ ${file}: Image ${index + 1} has descriptive alt text: "${altText.substring(0, 50)}${altText.length > 50 ? '...' : ''}"`);
        }
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

async function validateRecipeImageStyling() {
  console.log('\n📐 Validating recipe image styling and aspect ratios...');
  
  const errors = [];
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md' && file.startsWith('recipe-'));
  
  if (files.length === 0) {
    console.log('⚠️  No recipe posts found to check.');
    return;
  }
  
  const imageData = []; // Store all images with their aspect ratios
  
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
      const fullMatch = match[0];
      
      // Skip external URLs
      if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
        return;
      }
      
      // Extract style attribute
      const styleMatch = fullMatch.match(/style=["']([^"']*)["']/);
      const style = styleMatch ? styleMatch[1] : '';
      
      // Check for width: 100%
      if (!style.includes('width: 100%')) {
        errors.push(`${file}: Image ${index + 1} (${imageSrc}) must have width: 100% in style attribute. Current style: "${style}"`);
      }
      
      // Check for max-width (should not be present)
      if (style.includes('max-width')) {
        errors.push(`${file}: Image ${index + 1} (${imageSrc}) must not have max-width in style attribute. All recipe images should be full width. Current style: "${style}"`);
      }
      
      // Get image path for aspect ratio check
      const imagePath = imageSrc.startsWith('/') 
        ? imageSrc.substring(1) 
        : imageSrc;
      const fullImagePath = path.join(staticDir, imagePath);
      
      if (fs.existsSync(fullImagePath)) {
        imageData.push({
          file,
          imageIndex: index + 1,
          imageSrc,
          fullImagePath
        });
      }
    });
  });
  
  // Check aspect ratios if we have images
  if (imageData.length > 0) {
    const aspectRatios = [];
    
    for (const img of imageData) {
      try {
        const metadata = await sharp(img.fullImagePath).metadata();
        const { width, height } = metadata;
        
        if (width && height) {
          const aspectRatio = width / height;
          aspectRatios.push({
            file: img.file,
            imageIndex: img.imageIndex,
            imageSrc: img.imageSrc,
            aspectRatio,
            width,
            height
          });
        }
      } catch (err) {
        errors.push(`${img.file}: Image ${img.imageIndex} (${img.imageSrc}) - Error reading image dimensions: ${err.message}`);
      }
    }
    
    // Check if all aspect ratios are the same (within tolerance)
    if (aspectRatios.length > 1) {
      const firstAspectRatio = aspectRatios[0].aspectRatio;
      const tolerance = 0.01; // 1% tolerance for floating point comparison
      
      aspectRatios.forEach(img => {
        const diff = Math.abs(img.aspectRatio - firstAspectRatio);
        if (diff > tolerance) {
          errors.push(
            `${img.file}: Image ${img.imageIndex} (${img.imageSrc}) has aspect ratio ${img.aspectRatio.toFixed(3)} ` +
            `(${img.width}x${img.height}), but expected ${firstAspectRatio.toFixed(3)} ` +
            `(from ${aspectRatios[0].file}). All recipe images must have the same aspect ratio.`
          );
        }
      });
      
      if (errors.length === 0) {
        console.log(`   ✓ All ${aspectRatios.length} recipe images have consistent aspect ratio: ${firstAspectRatio.toFixed(3)}`);
      }
    } else if (aspectRatios.length === 1) {
      const img = aspectRatios[0];
      console.log(`   ✓ ${img.file}: Image has aspect ratio ${img.aspectRatio.toFixed(3)} (${img.width}x${img.height})`);
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Recipe image styling validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n💡 Requirements:');
    console.error('   - All recipe images must have width: 100% in style attribute');
    console.error('   - All recipe images must NOT have max-width in style attribute');
    console.error('   - All recipe images must have the same aspect ratio');
    process.exit(1);
  }
  
  if (imageData.length > 0) {
    console.log('✅ All recipe images have correct styling and consistent aspect ratios.');
  } else {
    console.log('✅ No recipe images found to validate.');
  }
}

module.exports = {
  validateRecipeFrontMatter,
  checkRecipeSocialImages,
  checkRecipeInlineImages,
  validateRecipeImageStyling
};
