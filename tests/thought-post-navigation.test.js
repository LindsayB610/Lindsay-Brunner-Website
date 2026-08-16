/**
 * Thoughts post navigation contract.
 *
 * Chronological navigation should read in the direction it travels: newer
 * posts point back, and older posts point backward in the archive.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'layouts', 'thoughts', 'single.html');
const template = fs.readFileSync(templatePath, 'utf8');

assert(
  template.includes('← {{ $olderPost.Title }}'),
  'Older-post links should begin with a left-pointing arrow',
);
assert(
  !template.includes('{{ $olderPost.Title }} →'),
  'Older-post links should not end with a right-pointing arrow',
);

console.log('✅ Thoughts post navigation contract passed!');
