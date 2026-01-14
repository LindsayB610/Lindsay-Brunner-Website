const fs = require('fs');
const { homepagePath } = require('./utils');

function checkRecentThoughtsSection() {
  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    const expectedText = 'Recent Thoughts';

    if (homepageContent.includes(expectedText)) {
      console.log('✅ "Recent Thoughts" section found on homepage.');
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
    if (!homepageContent.includes('Lindsay Brunner')) {
      errors.push('Hero section with name not found');
    }
    
    // Check for "Recent Thoughts" section
    if (!homepageContent.includes('Recent Thoughts')) {
      errors.push('"Recent Thoughts" section not found');
    }
    
    // Check for "Let's Connect" section
    if (!homepageContent.includes("Let's Connect")) {
      errors.push('"Let\'s Connect" section not found');
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
