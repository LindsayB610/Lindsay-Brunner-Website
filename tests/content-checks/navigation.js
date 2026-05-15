const fs = require('fs');
const path = require('path');

function validateNavDropdownBehavior() {
  console.log('\n🧭 Validating nav dropdown behavior...');

  const errors = [];
  const headerPath = path.join(__dirname, '..', '..', 'layouts', 'partials', 'header.html');

  try {
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    if (!headerContent.includes('querySelectorAll(".nav-dropdown details[open]")')) {
      errors.push('Header dropdown must target open nav dropdown details elements');
    }

    if (!headerContent.includes('dropdown.contains(event.target)')) {
      errors.push('Header dropdown must preserve clicks inside the open menu');
    }

    if (!headerContent.includes('dropdown.removeAttribute("open")')) {
      errors.push('Header dropdown must close by removing the open attribute');
    }

    if (!headerContent.includes('event.key !== "Escape"')) {
      errors.push('Header dropdown must close on Escape for keyboard users');
    }

    if (!headerContent.includes('<a href="/ai-chat-exporter/">AI Chat Exporter</a>')) {
      errors.push('Header More dropdown must link to the AI Chat Exporter page');
    }
  } catch (error) {
    errors.push(`Error reading header partial - ${error.message}`);
  }

  if (errors.length > 0) {
    console.error('❌ Nav dropdown behavior validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('✅ Nav dropdown behavior is valid.');
}

module.exports = {
  validateNavDropdownBehavior
};
