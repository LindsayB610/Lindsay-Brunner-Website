const fs = require('fs');
const path = require('path');
const { recipesDir, thoughtsDir, parseFrontMatter } = require('./utils');

// SEO best practices
const MAX_META_DESCRIPTION_LENGTH = 160; // Google typically truncates at 155-160 characters
const MIN_META_DESCRIPTION_LENGTH = 120; // Minimum recommended length for SEO

/**
 * Validate meta description length for all content
 */
function validateMetaDescriptionLength() {
  console.log('\n🔍 Validating meta description lengths (SEO)...');
  
  const errors = [];
  const warnings = [];
  
  // Check recipes
  const recipeFiles = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md' && file.startsWith('recipe-'));
  
  recipeFiles.forEach(file => {
    const filePath = path.join(recipesDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter || !frontMatter.description) {
      return; // Missing description is handled by other validation
    }
    
    const description = frontMatter.description.trim();
    const length = description.length;
    const isDraft = frontMatter.draft === true || frontMatter.draft === 'true';
    
    // Skip drafts (they can be fixed before publishing)
    if (isDraft) {
      return;
    }
    
    if (length > MAX_META_DESCRIPTION_LENGTH) {
      errors.push(
        `recipes/${file}: Meta description is ${length} characters (max ${MAX_META_DESCRIPTION_LENGTH}). ` +
        `Current: "${description.substring(0, 80)}${description.length > 80 ? '...' : ''}"`
      );
    } else if (length < MIN_META_DESCRIPTION_LENGTH) {
      warnings.push(
        `recipes/${file}: Meta description is ${length} characters (recommended min ${MIN_META_DESCRIPTION_LENGTH}). ` +
        `Consider expanding for better SEO.`
      );
    }
  });
  
  // Check thoughts
  const thoughtFiles = fs.readdirSync(thoughtsDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  thoughtFiles.forEach(file => {
    const filePath = path.join(thoughtsDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter || !frontMatter.description) {
      return; // Missing description is handled by other validation
    }
    
    const description = frontMatter.description.trim();
    const length = description.length;
    const isDraft = frontMatter.draft === true || frontMatter.draft === 'true';
    
    // Skip drafts (they can be fixed before publishing)
    if (isDraft) {
      return;
    }
    
    if (length > MAX_META_DESCRIPTION_LENGTH) {
      errors.push(
        `thoughts/${file}: Meta description is ${length} characters (max ${MAX_META_DESCRIPTION_LENGTH}). ` +
        `Current: "${description.substring(0, 80)}${description.length > 80 ? '...' : ''}"`
      );
    } else if (length < MIN_META_DESCRIPTION_LENGTH) {
      warnings.push(
        `thoughts/${file}: Meta description is ${length} characters (recommended min ${MIN_META_DESCRIPTION_LENGTH}). ` +
        `Consider expanding for better SEO.`
      );
    }
  });
  
  // Show warnings first (non-blocking)
  if (warnings.length > 0) {
    console.warn('⚠️  Meta description length warnings (recommended improvements):');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  // Show errors (blocking)
  if (errors.length > 0) {
    console.error('❌ Meta description length validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error(`\n💡 SEO best practice: Meta descriptions should be ${MIN_META_DESCRIPTION_LENGTH}-${MAX_META_DESCRIPTION_LENGTH} characters.`);
    console.error('   Google typically truncates descriptions longer than 155-160 characters in search results.');
    process.exit(1);
  }
  
  const totalChecked = recipeFiles.length + thoughtFiles.length;
  if (warnings.length === 0 && errors.length === 0) {
    console.log(`✅ All meta descriptions are within recommended length (${MIN_META_DESCRIPTION_LENGTH}-${MAX_META_DESCRIPTION_LENGTH} characters).`);
  } else if (errors.length === 0) {
    console.log(`✅ All meta descriptions are within maximum length (${MAX_META_DESCRIPTION_LENGTH} characters).`);
  }
}

module.exports = {
  validateMetaDescriptionLength
};
