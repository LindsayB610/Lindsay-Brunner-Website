/**
 * Tests for recipe dietary labels.
 * Ensures only the four defined labels are allowed and that validation rules are applied.
 * Definitions and "base recipe only" / Notes rules: see docs/recipe-template.md, README.md, agents.md.
 */

const path = require('path');
const { recipesDir, parseFrontMatter } = require('./content-checks/utils');

// Must match layouts/partials/recipe-dietary-icons.html and docs
const ALLOWED_DIETARY_VALUES = ['dairy-free', 'vegetarian', 'vegan', 'gluten-free'];

function validateDietaryInFrontMatter(frontMatter, file) {
  const errors = [];
  if (frontMatter.dietary === undefined) return errors;
  let dietaryList = frontMatter.dietary;
  if (!Array.isArray(dietaryList)) {
    if (typeof dietaryList === 'string' && dietaryList.trim().startsWith('[')) {
      try {
        dietaryList = JSON.parse(dietaryList);
      } catch (_) {
        dietaryList = null;
      }
    }
    if (!Array.isArray(dietaryList)) {
      errors.push(`${file}: dietary must be an array`);
      return errors;
    }
  }
  const seen = new Set();
  dietaryList.forEach((value, index) => {
    const v = typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, '-') : String(value);
    if (!ALLOWED_DIETARY_VALUES.includes(v)) {
      errors.push(`${file}: dietary[${index}] "${value}" is not allowed. Allowed: ${ALLOWED_DIETARY_VALUES.join(', ')}`);
    }
    if (seen.has(v)) errors.push(`${file}: dietary contains duplicate "${v}"`);
    seen.add(v);
  });
  return errors;
}

// Standalone runner
if (require.main === module) {
  console.log('🧪 Testing recipe dietary labels...\n');
  let passed = 0;
  let failed = 0;

  console.log('📋 Allowed values (base recipe only):');
  ALLOWED_DIETARY_VALUES.forEach(v => console.log(`   - ${v}`));
  console.log('');

  console.log('🔍 Validating each recipe that has dietary...');
  const files = require('fs').readdirSync(recipesDir)
    .filter(f => f.endsWith('.md') && f.startsWith('recipe-') && f !== '_index.md' && f !== 'recipe-index.md');

  const allErrors = [];
  files.forEach(file => {
    const fp = path.join(recipesDir, file);
    const fm = parseFrontMatter(fp);
    if (!fm || fm.dietary === undefined) return;
    const errors = validateDietaryInFrontMatter(fm, file);
    if (errors.length) {
      failed++;
      allErrors.push(...errors);
    } else {
      passed++;
      console.log(`   ✓ ${file}: ${[].concat(fm.dietary).join(', ')}`);
    }
  });

  console.log('\n🧪 Unit checks: each allowed value is valid when used alone');
  ALLOWED_DIETARY_VALUES.forEach(value => {
    const errs = validateDietaryInFrontMatter({ dietary: [value] }, 'mock');
    if (errs.length) {
      failed++;
      allErrors.push(`Allowed value "${value}" was rejected: ${errs[0]}`);
    } else {
      passed++;
      console.log(`   ✓ "${value}" accepted`);
    }
  });

  console.log('\n🧪 Invalid value is rejected');
  const invalidErrs = validateDietaryInFrontMatter({ dietary: ['pescatarian'] }, 'mock');
  if (invalidErrs.length === 0) {
    failed++;
    allErrors.push('Invalid value "pescatarian" should have been rejected');
  } else {
    passed++;
    console.log('   ✓ Invalid value "pescatarian" rejected');
  }

  console.log('\n🧪 Duplicate in dietary is rejected');
  const dupErrs = validateDietaryInFrontMatter({ dietary: ['vegan', 'vegan'] }, 'mock');
  if (dupErrs.length === 0) {
    failed++;
    allErrors.push('Duplicate "vegan" should have been rejected');
  } else {
    passed++;
    console.log('   ✓ Duplicate "vegan" rejected');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  if (allErrors.length) {
    console.log('\n❌ Errors:');
    allErrors.forEach(e => console.error('   -', e));
    process.exit(1);
  }
  console.log('\n✅ All dietary label tests passed.');
  process.exit(0);
}

module.exports = { ALLOWED_DIETARY_VALUES, validateDietaryInFrontMatter };
