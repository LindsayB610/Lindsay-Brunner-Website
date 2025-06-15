const fs = require('fs');
const path = require('path');

const homepagePath = path.join(__dirname, '..', 'public', 'index.html');

function checkRecentThoughtsSection() {
  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    const expectedText = 'Recent Thoughts'; // Text we are looking for

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

checkRecentThoughtsSection(); 