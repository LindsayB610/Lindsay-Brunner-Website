const fs = require('fs');
const path = require('path');
const {
  homepagePath,
  aboutPagePath,
  publicDir
} = require('./utils');

function extractFooter(htmlContent, pageDescription, errors) {
  const footerMatch = htmlContent.match(/<footer\b[^>]*id=["']?site-footer["']?[^>]*>([\s\S]*?)<\/footer>/);

  if (!footerMatch) {
    errors.push(`${pageDescription}: Missing #site-footer`);
    return null;
  }

  return footerMatch[1];
}

function getAttribute(tagContent, attributeName) {
  const attributeMatch = tagContent.match(new RegExp(`${attributeName}=["']?([^"'\\s>]+)["']?`));
  return attributeMatch ? attributeMatch[1] : null;
}

function hasClass(htmlContent, className) {
  const quotedClassPattern = new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["']`);
  const unquotedClassPattern = new RegExp(`class=[^\\s>]*\\b${className}\\b[^\\s>]*`);
  return quotedClassPattern.test(htmlContent) || unquotedClassPattern.test(htmlContent);
}

function validateFooterStructure() {
  console.log('\n🧭 Validating footer structure...');

  const errors = [];
  const requiredFooterLinks = [
    { label: 'About', href: '/about/' },
    { label: 'Thoughts', href: '/thoughts/' },
    { label: 'Recipes', href: '/recipes/' },
    { label: 'Nemesis', href: '/nemesis/' },
    { label: 'Vinyl', href: 'https://github.com/LindsayB610/family-vinyl' }
  ];

  try {
    const homepageContent = fs.readFileSync(homepagePath, 'utf8');
    const footerContent = extractFooter(homepageContent, 'Homepage', errors);

    if (footerContent) {
      const requiredClasses = [
        'footer-brand',
        'footer-logo',
        'footer-logo-mark',
        'footer-logo-name',
        'footer-nav',
        'footer-divider',
        'footer-bottom',
        'footer-social-links'
      ];

      requiredClasses.forEach(className => {
        if (!hasClass(footerContent, className)) {
          errors.push(`Homepage footer missing .${className}`);
        }
      });

      if (!footerContent.includes('Lindsay Brunner')) {
        errors.push('Homepage footer missing Lindsay Brunner brand text');
      }

      if (!footerContent.includes('&copy; 2026 Lindsay Brunner') && !footerContent.includes('© 2026 Lindsay Brunner')) {
        errors.push('Homepage footer missing copyright text');
      }

      if (footerContent.includes('Built with') || footerContent.includes('Hugo')) {
        errors.push('Homepage footer should not include build-tool credit text');
      }

      requiredFooterLinks.forEach(({ label, href }) => {
        if (!footerContent.includes(`href="${href}"`) && !footerContent.includes(`href=${href}`)) {
          errors.push(`Homepage footer missing ${label} link (${href})`);
        }
      });

      ['picsift', 'yarny'].forEach(projectName => {
        if (footerContent.toLowerCase().includes(projectName)) {
          errors.push(`Homepage footer should not include ${projectName}`);
        }
      });
    }
  } catch (error) {
    errors.push(`Homepage: Error reading file - ${error.message}`);
  }

  if (errors.length > 0) {
    console.error('❌ Footer structure validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('✅ Footer structure is valid.');
}

function validateFooterLogoStyles() {
  console.log('\n🎨 Validating footer logo styles...');

  const errors = [];
  const cssPath = path.join(__dirname, '..', '..', 'static', 'css', 'main.css');

  try {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const footerLogoMarkMatch = cssContent.match(/\.footer-logo-mark\s*\{([\s\S]*?)\n\}/);

    if (!footerLogoMarkMatch) {
      errors.push('Missing .footer-logo-mark styles');
    } else {
      const footerLogoMarkStyles = footerLogoMarkMatch[1];

      if (!footerLogoMarkStyles.includes('"Inter"')) {
        errors.push('.footer-logo-mark must use Inter to match the header logo');
      }

      if (!footerLogoMarkStyles.includes('font-weight: 800')) {
        errors.push('.footer-logo-mark must use font-weight: 800 to match the header logo');
      }

      if (!footerLogoMarkStyles.includes('background: var(--gradient-main)')) {
        errors.push('.footer-logo-mark must use --gradient-main to match the header logo');
      }

      if (footerLogoMarkStyles.includes('background-size: 80% 100%')) {
        errors.push('.footer-logo-mark must not use the hero H1 background-size override');
      }

      if (!footerLogoMarkStyles.includes('letter-spacing: -0.025em')) {
        errors.push('.footer-logo-mark must use the same letter spacing as the header logo');
      }
    }

    const footerSocialHoverMatch = cssContent.match(/\.footer-social-link:hover\s*\{([\s\S]*?)\n\}/);
    if (!footerSocialHoverMatch) {
      errors.push('Missing .footer-social-link:hover styles');
    } else {
      const footerSocialHoverStyles = footerSocialHoverMatch[1];

      if (footerSocialHoverStyles.includes('border-color') || footerSocialHoverStyles.includes('background:')) {
        errors.push('.footer-social-link:hover should not add a circle, border, or background');
      }
    }

    const footerTopLineMatch = cssContent.match(/\.site-footer::before\s*\{([\s\S]*?)\n\}/);
    if (!footerTopLineMatch) {
      errors.push('Missing animated footer top line styles');
    } else {
      const footerTopLineStyles = footerTopLineMatch[1];

      if (!footerTopLineStyles.includes('animation: header-flow 8s linear infinite')) {
        errors.push('.site-footer::before must use the same animated gradient motion as the header');
      }

      if (!footerTopLineStyles.includes('background: var(--gradient-main)')) {
        errors.push('.site-footer::before must use the site gradient');
      }

      if (!footerTopLineStyles.includes('opacity: 0.7')) {
        errors.push('.site-footer::before must use the same opacity as the header gradient line');
      }
    }

    if (!cssContent.includes('@keyframes header-flow')) {
      errors.push('Missing header-flow keyframes for animated header and footer lines');
    }
  } catch (error) {
    errors.push(`Error reading CSS file - ${error.message}`);
  }

  if (errors.length > 0) {
    console.error('❌ Footer logo style validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('✅ Footer logo styles match the header logo treatment.');
}

function validateFooterSocialAndRSSLinks() {
  console.log('\n🔗 Validating footer social and RSS links...');

  const errors = [];

  function checkFooterSocials(htmlContent, expectedRssLink, expectedRssLabel, pageDescription) {
    const footerContent = extractFooter(htmlContent, pageDescription, errors);
    if (!footerContent) return;

    const socialNavMatch = footerContent.match(/<nav\b[^>]*class=["']?footer-social-links["']?[^>]*aria-label=["']?Social links["']?[^>]*>([\s\S]*?)<\/nav>/);
    if (!socialNavMatch) {
      errors.push(`${pageDescription}: Missing labeled footer social navigation`);
      return;
    }

    const socialNavContent = socialNavMatch[1];
    const expectedSocialLabels = ['GitHub', 'LinkedIn', 'Bluesky', expectedRssLabel];

    expectedSocialLabels.forEach(label => {
      if (!socialNavContent.includes(`aria-label="${label}"`) && !socialNavContent.includes(`aria-label=${label}`)) {
        errors.push(`${pageDescription}: Footer social links missing aria-label "${label}"`);
      }
    });

    const rssLinkMatch = socialNavContent.match(/<a\b[^>]*href=["']?([^"'\s>]*\/index\.xml)["']?[^>]*>/);
    if (!rssLinkMatch) {
      errors.push(`${pageDescription}: Footer RSS link not found`);
      return;
    }

    const actualRssLink = getAttribute(rssLinkMatch[0], 'href');
    if (actualRssLink !== expectedRssLink) {
      errors.push(`${pageDescription}: Footer RSS link points to "${actualRssLink}" but expected "${expectedRssLink}"`);
    }
  }

  const checks = [
    {
      filePath: homepagePath,
      expectedRssLink: '/thoughts/index.xml',
      expectedRssLabel: 'Thoughts RSS Feed',
      pageDescription: 'Homepage'
    },
    {
      filePath: aboutPagePath,
      expectedRssLink: '/thoughts/index.xml',
      expectedRssLabel: 'Thoughts RSS Feed',
      pageDescription: 'About page'
    },
    {
      filePath: path.join(publicDir, 'recipes', 'index.html'),
      expectedRssLink: '/recipes/index.xml',
      expectedRssLabel: 'Recipes RSS Feed',
      pageDescription: 'Recipes list page'
    },
    {
      filePath: path.join(publicDir, 'thoughts', 'index.html'),
      expectedRssLink: '/thoughts/index.xml',
      expectedRssLabel: 'Thoughts RSS Feed',
      pageDescription: 'Thoughts list page'
    }
  ];

  checks.forEach(({ filePath, expectedRssLink, expectedRssLabel, pageDescription }) => {
    try {
      if (!fs.existsSync(filePath)) {
        errors.push(`${pageDescription}: Built page not found at ${filePath}`);
        return;
      }

      const htmlContent = fs.readFileSync(filePath, 'utf8');
      checkFooterSocials(htmlContent, expectedRssLink, expectedRssLabel, pageDescription);
    } catch (error) {
      errors.push(`${pageDescription}: Error reading file - ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ Footer social and RSS link validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('✅ Footer social and RSS links are valid.');
}

module.exports = {
  validateFooterStructure,
  validateFooterLogoStyles,
  validateFooterSocialAndRSSLinks
};
