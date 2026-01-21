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
  checkRecipeSocialImages,
  checkRecipeInlineImages,
  validateRecipeImageStyling
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
  validateRecipeIndexPage,
  validateNoDraftInThoughtsUrls
} = require('./content-checks/pages');

const {
  validateContextAwareRSSLinks
} = require('./content-checks/rss-links');

const {
  validateAllPagesHaveOGImages
} = require('./content-checks/og-images');

const {
  validateMetaDescriptionLength
} = require('./content-checks/seo');

// Run all tests
async function runAllTests() {
  console.log('🧪 Running comprehensive content validation tests...\n');

  checkRecentThoughtsSection();
  checkHomepageContent();
  validateFrontMatter();
  validateRecipeFrontMatter();
  checkSocialImages();
  checkRecipeSocialImages();
  checkRecipeInlineImages();
  await validateRecipeImageStyling();
  checkStaticAssets();
  validateRSSFeed();
  validateRecipesRSSFeed();
  validateContextAwareRSSLinks();
  validateSitemap();
  validateAboutPage();
  validate404Page();
  validatePermalinks();
  validateRecipeIndexPage();
  validateNoDraftInThoughtsUrls();
  validateAllPagesHaveOGImages();
  validateMetaDescriptionLength();

  console.log('\n✅ All content validation tests passed!');
}

runAllTests().catch(error => {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
});
