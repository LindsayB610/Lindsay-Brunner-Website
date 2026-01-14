// Main orchestrator for content validation tests
// This file imports and runs all validation checks

const {
  checkRecentThoughtsSection,
  checkHomepageContent
} = require('./content-checks/homepage');

const {
  validateFrontMatter,
  checkSocialImages
} = require('./content-checks/thoughts');

const {
  validateRecipeFrontMatter,
  checkRecipeSocialImages
} = require('./content-checks/recipes');

const {
  checkStaticAssets,
  validateRSSFeed,
  validateRecipesRSSFeed,
  validateSitemap
} = require('./content-checks/assets');

const {
  validateAboutPage,
  validate404Page,
  validatePermalinks,
  validateRecipeIndexPage
} = require('./content-checks/pages');

const {
  validateContextAwareRSSLinks
} = require('./content-checks/rss-links');

const {
  validateAllPagesHaveOGImages
} = require('./content-checks/og-images');

// Run all tests
console.log('🧪 Running comprehensive content validation tests...\n');

checkRecentThoughtsSection();
checkHomepageContent();
validateFrontMatter();
validateRecipeFrontMatter();
checkSocialImages();
checkRecipeSocialImages();
checkStaticAssets();
validateRSSFeed();
validateRecipesRSSFeed();
validateContextAwareRSSLinks();
validateSitemap();
validateAboutPage();
validate404Page();
validatePermalinks();
validateRecipeIndexPage();
validateAllPagesHaveOGImages();

console.log('\n✅ All content validation tests passed!');
