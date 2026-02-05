const fs = require('fs');
const path = require('path');
const { thoughtsDir, REQUIRED_THOUGHTS_FIELDS, parseFrontMatter, staticDir } = require('./utils');

function validateFrontMatter() {
  console.log('\n📋 Validating thoughts front matter structure...');
  
  const errors = [];
  const files = fs.readdirSync(thoughtsDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  if (files.length === 0) {
    console.log('⚠️  No thought posts found to validate.');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(thoughtsDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter) {
      errors.push(`${file}: Missing or invalid front matter`);
      return;
    }
    
    // Check required fields
    REQUIRED_THOUGHTS_FIELDS.forEach(field => {
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

    // Subtitle should be sentence case (CONTENT_STYLE_GUIDE: "Sentence case all other headers")
    if (frontMatter.subtitle && frontMatter.subtitle.trim().startsWith('Or:')) {
      const afterOr = frontMatter.subtitle.substring(3).trim();
      const words = afterOr.split(/\s+/);
      // Words that should be lowercase when not first word or after sentence-ending punctuation
      const shouldBeLowercase = new Set(['from', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'of', 'inside', 'and', 'or', 'but', 'an', 'a', 'the', 'that', 'when', 'where', 'what', 'how', 'why', 'it', 'its', 'is', 'are', 'was', 'were']);
      let afterSentenceEnd = true; // First word gets capitalized
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const cleanWord = word.replace(/[^\w'-]/g, '').toLowerCase();
        const isFirstOrAfterPunct = afterSentenceEnd;
        afterSentenceEnd = /[.!?]$/.test(word);
        if (!isFirstOrAfterPunct && shouldBeLowercase.has(cleanWord) && /^[A-Z]/.test(word)) {
          errors.push(`${file}: Subtitle should be sentence case. "${word}" should be lowercase: "${frontMatter.subtitle}"`);
        }
        // Check hyphenated compounds: "AI-Assisted" should be "AI-assisted"
        if (word.includes('-') && /^[A-Z][a-z]*-[A-Z]/.test(word)) {
          const afterHyphen = word.split('-').slice(1).join('-');
          if (/^[a-z]/.test(afterHyphen.toLowerCase()) && /^[A-Z]/.test(afterHyphen)) {
            errors.push(`${file}: Subtitle should be sentence case. "${word}" should use lowercase after hyphen (e.g. "AI-assisted"): "${frontMatter.subtitle}"`);
          }
        }
      }
    }
  });
  
  if (errors.length > 0) {
    console.error('❌ Front matter validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log(`✅ Front matter validation passed for ${files.length} thought post(s).`);
}

function checkSocialImages() {
  console.log('\n🖼️  Checking social images for thoughts...');
  
  const errors = [];
  const files = fs.readdirSync(thoughtsDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  if (files.length === 0) {
    console.log('⚠️  No thought posts found to check.');
    return;
  }
  
  files.forEach(file => {
    const filePath = path.join(thoughtsDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter) return;
    
    // Check both og_image and social_image (some posts use different field names)
    const imageField = frontMatter.og_image || frontMatter.social_image;
    
    if (imageField) {
      // Remove leading slash if present for path joining
      const imagePath = imageField.startsWith('/') 
        ? imageField.substring(1) 
        : imageField;
      const fullImagePath = path.join(staticDir, imagePath);
      
      if (!fs.existsSync(fullImagePath)) {
        errors.push(`${file}: Social image not found: ${imageField}`);
      } else {
        console.log(`   ✓ ${file}: ${imageField} exists`);
      }
    }
  });
  
  if (errors.length > 0) {
    console.error('❌ Social image validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ All specified social images exist for thoughts.');
}

module.exports = {
  validateFrontMatter,
  checkSocialImages
};
