const fs = require('fs');
const { homepagePath } = require('./utils');

function checkRecentThoughtsSection() {
  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    const expectedText = 'How I Think';

    if (homepageContent.includes(expectedText)) {
      console.log('✅ "How I Think" section found on homepage.');
    } else {
      console.error(`❌ "${expectedText}" section NOT found on homepage.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error reading homepage file: ${error.message}`);
    process.exit(1);
  }
}

function checkHomepageContent() {
  console.log('\n🏠 Checking homepage content...');
  
  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    const errors = [];
    
    // Check for hero section
    if (!homepageContent.includes('Complex technical ideas, made clear enough to trust.')) {
      errors.push('Hero positioning headline not found');
    }
    
    // Check for selected writing section
    if (!homepageContent.includes('How I Think')) {
      errors.push('"How I Think" section not found');
    }
    
    // Check for consulting CTA section
    if (!homepageContent.includes('Bring Me Your Weird Content Problem')) {
      errors.push('"Bring Me Your Weird Content Problem" section not found');
    }
    
    // Check for hero CTA
    if (!homepageContent.includes('hero-cta')) {
      errors.push('Hero CTA button not found');
    }
    
    if (errors.length > 0) {
      console.error('❌ Homepage content validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ Homepage content structure is valid.');
  } catch (error) {
    console.error(`❌ Error checking homepage: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  checkRecentThoughtsSection,
  checkHomepageContent
};
