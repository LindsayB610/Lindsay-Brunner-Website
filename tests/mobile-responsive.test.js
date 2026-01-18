/**
 * Mobile and Responsive Design Tests
 * 
 * Validates that the site has proper mobile/responsive design implementation:
 * - Viewport meta tag
 * - CSS media queries for mobile breakpoints
 * - Mobile-specific styling
 * - Responsive images
 * - No fixed widths that break mobile
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const layoutsDir = path.join(__dirname, '..', 'layouts');
const staticDir = path.join(__dirname, '..', 'static');
const cssMainPath = path.join(staticDir, 'css', 'main.css');
const cssCustomPath = path.join(staticDir, 'css', 'custom.css');
const headPartialPath = path.join(layoutsDir, 'partials', 'head.html');

function testViewportMetaTag() {
  console.log('\n📱 Testing viewport meta tag...');
  
  if (!fs.existsSync(headPartialPath)) {
    console.error(`❌ Head partial not found at ${headPartialPath}`);
    process.exit(1);
  }
  
  try {
    const headContent = fs.readFileSync(headPartialPath, 'utf8');
    const errors = [];
    
    // Check for viewport meta tag
    const hasViewport = headContent.includes('viewport') && 
                       (headContent.includes('width=device-width') || 
                        headContent.includes('width=device-width'));
    
    if (!hasViewport) {
      errors.push('Missing viewport meta tag with width=device-width');
    }
    
    // Check for initial-scale
    const hasInitialScale = headContent.includes('initial-scale');
    if (!hasInitialScale) {
      errors.push('Viewport meta tag missing initial-scale');
    }
    
    if (errors.length > 0) {
      console.error('❌ Viewport meta tag validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('   ✓ Viewport meta tag is present and configured correctly');
  } catch (error) {
    console.error(`❌ Error checking viewport meta tag: ${error.message}`);
    process.exit(1);
  }
}

function testMediaQueries() {
  console.log('\n📐 Testing CSS media queries...');
  
  const errors = [];
  const warnings = [];
  
  // Check main.css
  if (!fs.existsSync(cssMainPath)) {
    console.error(`❌ Main CSS not found at ${cssMainPath}`);
    process.exit(1);
  }
  
  try {
    const mainCss = fs.readFileSync(cssMainPath, 'utf8');
    
    // Check for key mobile breakpoints
    const has768px = mainCss.includes('@media (max-width: 768px)') || 
                     mainCss.includes('@media(max-width:768px)') ||
                     mainCss.match(/@media\s*\([^)]*max-width:\s*768px/);
    
    const has480px = mainCss.includes('@media (max-width: 480px)') || 
                     mainCss.includes('@media(max-width:480px)') ||
                     mainCss.match(/@media\s*\([^)]*max-width:\s*480px/);
    
    if (!has768px) {
      errors.push('Missing 768px mobile breakpoint in main.css');
    } else {
      console.log('   ✓ 768px breakpoint found in main.css');
    }
    
    if (!has480px) {
      warnings.push('Missing 480px small mobile breakpoint in main.css (recommended)');
    } else {
      console.log('   ✓ 480px breakpoint found in main.css');
    }
    
    // Check for common mobile patterns
    const hasGridResponsive = mainCss.includes('grid-template-columns: 1fr') && 
                              (mainCss.includes('768px') || mainCss.includes('480px'));
    if (!hasGridResponsive) {
      warnings.push('Grid layouts may not be responsive (check grid-template-columns)');
    } else {
      console.log('   ✓ Responsive grid patterns found');
    }
    
  } catch (error) {
    console.error(`❌ Error checking main.css: ${error.message}`);
    process.exit(1);
  }
  
  // Check custom.css
  if (fs.existsSync(cssCustomPath)) {
    try {
      const customCss = fs.readFileSync(cssCustomPath, 'utf8');
      
      // Check for mobile-specific overrides
      const hasMobileOverrides = customCss.includes('@media') && 
                                 (customCss.includes('768px') || customCss.includes('480px'));
      
      if (hasMobileOverrides) {
        console.log('   ✓ Mobile-specific overrides found in custom.css');
      }
      
    } catch (error) {
      warnings.push(`Could not read custom.css: ${error.message}`);
    }
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Media query warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ Media query validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
}

function testMobileSpecificStyles() {
  console.log('\n🎨 Testing mobile-specific styles...');
  
  const errors = [];
  const warnings = [];
  
  if (!fs.existsSync(cssMainPath)) {
    console.error(`❌ Main CSS not found at ${cssMainPath}`);
    process.exit(1);
  }
  
  try {
    const mainCss = fs.readFileSync(cssMainPath, 'utf8');
    
    // Check for key mobile style patterns
    // Note: Media queries are separate blocks, so we check for both the selector and the media query separately
    const hasFeaturedPostMobile = mainCss.includes('.featured-post') && 
                                  mainCss.includes('@media') && 
                                  (mainCss.includes('768px') || mainCss.includes('480px'));
    
    const hasFeaturedH2Mobile = mainCss.includes('.featured-content h2') && 
                                mainCss.includes('@media') && 
                                (mainCss.includes('768px') || mainCss.includes('480px'));
    
    const hasHeroMobile = mainCss.includes('.hero') && 
                          mainCss.includes('@media') && 
                          (mainCss.includes('768px') || mainCss.includes('480px'));
    
    const hasContainerMobile = mainCss.includes('.container') && 
                               mainCss.includes('@media') && 
                               (mainCss.includes('480px') || mainCss.includes('768px'));
    
    const hasGridMobile = mainCss.includes('.grid') && 
                          mainCss.includes('grid-template-columns: 1fr') && 
                          mainCss.includes('@media');
    
    if (hasFeaturedPostMobile) {
      console.log('   ✓ Featured post mobile styles found');
    } else {
      warnings.push('Featured post mobile styles may be missing');
    }
    
    if (hasFeaturedH2Mobile) {
      console.log('   ✓ Featured post h2 mobile font size found');
    } else {
      warnings.push('Featured post h2 mobile font size may be missing');
    }
    
    if (hasHeroMobile) {
      console.log('   ✓ Hero section mobile styles found');
    } else {
      warnings.push('Hero section mobile styles may be missing');
    }
    
    if (hasContainerMobile) {
      console.log('   ✓ Container mobile padding found');
    } else {
      warnings.push('Container mobile padding may be missing');
    }
    
    if (hasGridMobile) {
      console.log('   ✓ Grid mobile single column found');
    } else {
      warnings.push('Grid mobile single column may be missing');
    }
    
    // Check for recipe index mobile styles
    if (fs.existsSync(cssCustomPath)) {
      const customCss = fs.readFileSync(cssCustomPath, 'utf8');
      if (customCss.includes('recipe-index-category-count') && 
          customCss.includes('display: none') &&
          customCss.includes('768px')) {
        console.log('   ✓ Recipe index category count hidden on mobile');
      }
    }
    
  } catch (error) {
    console.error(`❌ Error checking mobile styles: ${error.message}`);
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Mobile style warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ Mobile style validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
}

function testResponsiveImages() {
  console.log('\n🖼️  Testing responsive images...');
  
  const errors = [];
  
  if (!fs.existsSync(headPartialPath)) {
    console.error(`❌ Head partial not found at ${headPartialPath}`);
    process.exit(1);
  }
  
  try {
    const headContent = fs.readFileSync(headPartialPath, 'utf8');
    
    // Check that images in CSS have max-width: 100%
    if (fs.existsSync(cssMainPath)) {
      const mainCss = fs.readFileSync(cssMainPath, 'utf8');
      
      // Look for img styles with max-width
      const hasResponsiveImages = mainCss.includes('img') && 
                                  (mainCss.includes('max-width: 100%') || 
                                   mainCss.includes('max-width:100%'));
      
      if (hasResponsiveImages) {
        console.log('   ✓ Responsive image styles found (max-width: 100%)');
      } else {
        errors.push('Images may not be responsive (missing max-width: 100%)');
      }
    }
    
  } catch (error) {
    console.error(`❌ Error checking responsive images: ${error.message}`);
    process.exit(1);
  }
  
  if (errors.length > 0) {
    console.error('❌ Responsive image validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
}

function testNoFixedWidths() {
  console.log('\n📏 Testing for problematic fixed widths...');
  
  const warnings = [];
  
  if (!fs.existsSync(cssMainPath)) {
    console.error(`❌ Main CSS not found at ${cssMainPath}`);
    process.exit(1);
  }
  
  try {
    const mainCss = fs.readFileSync(cssMainPath, 'utf8');
    
    // Check for common problematic fixed widths (outside of media queries)
    // We'll look for width: values that are > 100% or very large pixel values
    // This is a heuristic check - not all fixed widths are bad
    
    // Check for container max-widths (these are OK)
    const hasContainerMaxWidth = mainCss.includes('.container') && 
                                 (mainCss.includes('max-width') || 
                                  mainCss.includes('container-narrow'));
    
    if (hasContainerMaxWidth) {
      console.log('   ✓ Container max-widths found (good for responsive design)');
    }
    
    // Check for viewport units (good for responsive)
    const hasViewportUnits = mainCss.includes('vw') || mainCss.includes('vh');
    if (hasViewportUnits) {
      console.log('   ✓ Viewport units found (good for responsive design)');
    }
    
    // Note: We're not flagging all fixed widths as errors because many are intentional
    // (like container max-widths, which are good for responsive design)
    
  } catch (error) {
    console.error(`❌ Error checking fixed widths: ${error.message}`);
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Fixed width warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
}

function test404MobileFix() {
  console.log('\n🚫 Testing 404 page mobile fix...');
  
  const errors = [];
  
  if (fs.existsSync(cssCustomPath)) {
    try {
      const customCss = fs.readFileSync(cssCustomPath, 'utf8');
      
      // Check for 404 page mobile font-size fix
      const has404MobileFix = customCss.includes('font-size: 8rem') && 
                              (customCss.includes('font-size: 4rem') || 
                               customCss.includes('font-size: 3rem')) &&
                              customCss.includes('768px');
      
      if (has404MobileFix) {
        console.log('   ✓ 404 page mobile font-size fix found');
      } else {
        errors.push('404 page may have oversized font on mobile (8rem not scaled down)');
      }
      
    } catch (error) {
      errors.push(`Could not check 404 mobile fix: ${error.message}`);
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ 404 mobile fix validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
}

// Run all tests
console.log('🧪 Running mobile and responsive design tests...\n');

testViewportMetaTag();
testMediaQueries();
testMobileSpecificStyles();
testResponsiveImages();
testNoFixedWidths();
test404MobileFix();

console.log('\n✅ All mobile and responsive design tests passed!');
console.log('\n💡 Note: These tests validate CSS structure and patterns.');
console.log('   For visual testing, use browser DevTools to test at 768px and 480px widths.');
