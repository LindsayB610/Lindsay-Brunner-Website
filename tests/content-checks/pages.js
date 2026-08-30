const fs = require('fs');
const path = require('path');
const {
  aboutPagePath,
  error404Path,
  recipeIndexPath1,
  recipeIndexPath2,
  recipeIndexPath3,
  recipeIndexPath4,
  publicDir,
  blogDir,
  recipesDir,
  staticDir,
  sitemapPath,
  rssFeedPath,
  parseFrontMatter
} = require('./utils');

function validateAboutPage() {
  console.log('\n👤 Validating about page...');
  
  if (!fs.existsSync(aboutPagePath)) {
    console.error(`❌ About page not found at ${aboutPagePath}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  try {
    const aboutContent = fs.readFileSync(aboutPagePath, 'utf8');
    const errors = [];
    
    // Check for title
    if (!aboutContent.includes('About') && !aboutContent.includes('Lindsay')) {
      errors.push('About page missing title or name');
    }
    
    // Check for basic content structure
    if (aboutContent.length < 500) {
      errors.push('About page seems too short (may be missing content)');
    }
    
    // Check for image reference (headshot)
    if (aboutContent.includes('avatar-color-trans.png')) {
      const imagePath = path.join(staticDir, 'images', 'avatar-color-trans.png');
      if (!fs.existsSync(imagePath)) {
        errors.push('About page references avatar image that does not exist');
      } else {
        console.log('   ✓ Avatar image exists');
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ About page validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ About page structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating about page: ${error.message}`);
    process.exit(1);
  }
}

function validate404Page() {
  console.log('\n🚫 Validating 404 error page...');
  
  if (!fs.existsSync(error404Path)) {
    console.error(`❌ 404 page not found at ${error404Path}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  try {
    const error404Content = fs.readFileSync(error404Path, 'utf8');
    const errors = [];
    
    // Check for 404 text
    if (!error404Content.includes('404')) {
      errors.push('404 page missing "404" text');
    }
    
    // Check for error message
    if (!error404Content.includes('Page Not Found') && !error404Content.includes('not found')) {
      errors.push('404 page missing error message');
    }
    
    // Check for navigation links (handle minified HTML)
    const hasHomeLink = error404Content.includes('href="/"') || error404Content.includes('href=/');
    const hasBlogLink = error404Content.includes('href="/blog/') || error404Content.includes('href=/blog/');
    
    if (!hasHomeLink && !hasBlogLink) {
      errors.push('404 page missing navigation links');
    }
    
    if (errors.length > 0) {
      console.error('❌ 404 page validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ 404 page structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating 404 page: ${error.message}`);
    process.exit(1);
  }
}

function validatePermalinks() {
  console.log('\n🔗 Validating permalink structure...');
  
  const errors = [];
  const warnings = [];
  
  // Check blog permalinks (should be /blog/YYYY-MM-DD/slug)
  const blogFiles = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  blogFiles.forEach(file => {
    const filePath = path.join(blogDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter || frontMatter.draft === 'true') return;
    
    if (frontMatter.date && frontMatter.slug) {
      const dateMatch = frontMatter.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const expectedPath = path.join(publicDir, 'blog', `${year}-${month}-${day}`, frontMatter.slug);
        const expectedPathAlt = path.join(publicDir, 'blog', `${year}-${month}-${day}`, frontMatter.slug, 'index.html');
        
        if (!fs.existsSync(expectedPath) && !fs.existsSync(expectedPathAlt)) {
          // Try without slug (using filename)
          const filenameSlug = file.replace('.md', '');
          const expectedPathFilename = path.join(publicDir, 'blog', `${year}-${month}-${day}`, filenameSlug);
          const expectedPathFilenameAlt = path.join(publicDir, 'blog', `${year}-${month}-${day}`, filenameSlug, 'index.html');
          
          if (!fs.existsSync(expectedPathFilename) && !fs.existsSync(expectedPathFilenameAlt)) {
            warnings.push(`Blog "${file}" may not have correct permalink structure`);
          }
        }
      }
    }
  });
  
  // Check recipes permalinks (should be /recipes/YYYY-MM-DD/slug)
  const recipeFiles = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md');
  
  recipeFiles.forEach(file => {
    const filePath = path.join(recipesDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter || frontMatter.draft === 'true') return;
    
    if (frontMatter.date && frontMatter.slug) {
      const dateMatch = frontMatter.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const expectedPath = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, frontMatter.slug);
        const expectedPathAlt = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, frontMatter.slug, 'index.html');
        
        if (!fs.existsSync(expectedPath) && !fs.existsSync(expectedPathAlt)) {
          // Try without slug (using filename)
          const filenameSlug = file.replace('.md', '').replace('recipe-', '');
          const expectedPathFilename = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, filenameSlug);
          const expectedPathFilenameAlt = path.join(publicDir, 'recipes', `${year}-${month}-${day}`, filenameSlug, 'index.html');
          
          if (!fs.existsSync(expectedPathFilename) && !fs.existsSync(expectedPathFilenameAlt)) {
            warnings.push(`Recipe "${file}" may not have correct permalink structure`);
          }
        }
      }
    }
  });
  
  if (warnings.length > 0) {
    console.warn('⚠️  Permalink warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ Permalink validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Permalink structure appears valid.');
}

function validateRecipeIndexPage() {
  console.log('\n📚 Validating recipe index page...');
  
  // Try all possible paths
  let recipeIndexPath = null;
  if (fs.existsSync(recipeIndexPath1)) {
    recipeIndexPath = recipeIndexPath1;
  } else if (fs.existsSync(recipeIndexPath2)) {
    recipeIndexPath = recipeIndexPath2;
  } else if (fs.existsSync(recipeIndexPath3)) {
    recipeIndexPath = recipeIndexPath3;
  } else if (fs.existsSync(recipeIndexPath4)) {
    recipeIndexPath = recipeIndexPath4;
  }
  
  if (!recipeIndexPath) {
    console.error(`❌ Recipe index page not found at any expected path:`);
    console.error(`   - ${recipeIndexPath1}`);
    console.error(`   - ${recipeIndexPath2}`);
    console.error(`   - ${recipeIndexPath3}`);
    console.error(`   - ${recipeIndexPath4}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  try {
    const recipeIndexContent = fs.readFileSync(recipeIndexPath, 'utf8');
    const errors = [];
    const publishedRecipes = fs.readdirSync(recipesDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md' && file !== 'recipe-index.md' && file.startsWith('recipe-'))
      .map(file => {
        const filePath = path.join(recipesDir, file);
        const frontMatter = parseFrontMatter(filePath);
        return { file, frontMatter };
      })
      .filter(({ frontMatter }) => frontMatter && !/true/i.test(String(frontMatter.draft || 'false')));
    
    // Check for title (handle minified HTML)
    if (!recipeIndexContent.includes('Recipe Index') && !recipeIndexContent.match(/<title[^>]*>.*Recipe Index/i)) {
      errors.push('Recipe index page missing "Recipe Index" title');
    }
    
    // Check that the page has some recipe-related content
    // Since the layout might not be applied yet, we'll do a basic check
    // that the page exists and has the expected title/description
    const hasRecipeContent = recipeIndexContent.includes('recipes') || 
                              recipeIndexContent.includes('Recipe') ||
                              recipeIndexContent.includes('category');
    
    if (!hasRecipeContent && recipeIndexContent.length < 500) {
      errors.push('Recipe index page seems to be missing content');
    }
    
    if (!recipeIndexContent.includes('recipe-index-category-title')) {
      errors.push('Recipe index page is missing recipe category headings');
    }
    if (!recipeIndexContent.includes('recipe-index-list')) {
      errors.push('Recipe index page is missing recipe list structure');
    }

    const categoryNames = [...new Set(
      publishedRecipes
        .map(({ frontMatter }) => frontMatter.recipeCategory)
        .filter(Boolean)
    )];
    categoryNames.forEach(category => {
      if (!recipeIndexContent.includes(category)) {
        errors.push(`Recipe index page is missing category heading "${category}"`);
      }
    });

    publishedRecipes.forEach(({ file, frontMatter }) => {
      const slug = frontMatter.slug || file.replace(/\.md$/, '');
      const permalink = `/recipes/${frontMatter.date}/${slug}/`;
      if (!recipeIndexContent.includes(permalink)) {
        errors.push(`Recipe index page is missing recipe link for ${file} (${permalink})`);
      }
    });
    
    // Check that the page is not empty
    if (recipeIndexContent.length < 1000) {
      errors.push('Recipe index page seems too short (may be missing content)');
    }
    
    // Verify it's valid HTML structure
    if (!recipeIndexContent.includes('<!DOCTYPE') && !recipeIndexContent.includes('<html')) {
      errors.push('Recipe index page does not appear to be valid HTML');
    }
    
    if (errors.length > 0) {
      console.error('❌ Recipe index page validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ Recipe index page structure is valid.');
  } catch (error) {
    console.error(`❌ Error validating recipe index page: ${error.message}`);
    process.exit(1);
  }
}

function validateNoDraftInBlogUrls() {
  console.log('\n🚫 Validating that "draft" never appears in blog URLs...');
  
  if (!fs.existsSync(publicDir)) {
    console.error(`❌ Public directory not found at ${publicDir}`);
    console.error('   Make sure to run "npm run build" before running tests.');
    process.exit(1);
  }
  
  const errors = [];
  
  try {
    // Check all file paths in the blog directory
    const blogPublicDir = path.join(publicDir, 'blog');
    if (fs.existsSync(blogPublicDir)) {
      const checkDirectory = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Check if the path contains "draft" (case-insensitive)
          if (entry.name.toLowerCase().includes('draft')) {
            errors.push(`Found "draft" in file/directory path: ${path.relative(publicDir, fullPath)}`);
          }
          
          // Recursively check subdirectories
          if (entry.isDirectory()) {
            checkDirectory(fullPath);
          }
        }
      };
      
      checkDirectory(blogPublicDir);
    }
    
    // Check all HTML files in blog for URLs containing "draft"
    const checkHtmlFiles = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          checkHtmlFiles(fullPath);
        } else if (entry.name.endsWith('.html')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for URLs in href attributes
          const hrefMatches = content.match(/href=["']([^"']*draft[^"']*)["']/gi);
          if (hrefMatches) {
            hrefMatches.forEach(match => {
              const url = match.match(/href=["']([^"']*)["']/i)[1];
              if (url.includes('/blog/')) {
                errors.push(`Found "draft" in href URL: ${url} (in ${path.relative(publicDir, fullPath)})`);
              }
            });
          }
          
          // Check for canonical URLs
          const canonicalMatches = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*draft[^"']*)["']/gi);
          if (canonicalMatches) {
            canonicalMatches.forEach(match => {
              const url = match.match(/href=["']([^"']*)["']/i)[1];
              if (url.includes('/blog/')) {
                errors.push(`Found "draft" in canonical URL: ${url} (in ${path.relative(publicDir, fullPath)})`);
              }
            });
          }
          
          // Check for Open Graph URLs
          const ogUrlMatches = content.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']*draft[^"']*)["']/gi);
          if (ogUrlMatches) {
            ogUrlMatches.forEach(match => {
              const url = match.match(/content=["']([^"']*)["']/i)[1];
              if (url.includes('/blog/')) {
                errors.push(`Found "draft" in og:url: ${url} (in ${path.relative(publicDir, fullPath)})`);
              }
            });
          }
        }
      }
    };
    
    if (fs.existsSync(blogPublicDir)) {
      checkHtmlFiles(blogPublicDir);
    }
    
    // Check sitemap for blog URLs containing "draft"
    if (fs.existsSync(sitemapPath)) {
      const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
      const urlMatches = sitemapContent.match(/<loc>([^<]*\/blog\/[^<]*draft[^<]*)<\/loc>/gi);
      if (urlMatches) {
        urlMatches.forEach(match => {
          const url = match.match(/<loc>([^<]*)<\/loc>/i)[1];
          errors.push(`Found "draft" in sitemap URL: ${url}`);
        });
      }
    }
    
    // Check RSS feed for blog URLs containing "draft"
    if (fs.existsSync(rssFeedPath)) {
      const rssContent = fs.readFileSync(rssFeedPath, 'utf8');
      const linkMatches = rssContent.match(/<link>([^<]*\/blog\/[^<]*draft[^<]*)<\/link>/gi);
      if (linkMatches) {
        linkMatches.forEach(match => {
          const url = match.match(/<link>([^<]*)<\/link>/i)[1];
          errors.push(`Found "draft" in RSS feed URL: ${url}`);
        });
      }
      
      const guidMatches = rssContent.match(/<guid[^>]*>([^<]*\/blog\/[^<]*draft[^<]*)<\/guid>/gi);
      if (guidMatches) {
        guidMatches.forEach(match => {
          const url = match.match(/<guid[^>]*>([^<]*)<\/guid>/i)[1];
          errors.push(`Found "draft" in RSS feed GUID: ${url}`);
        });
      }
    }
    
    if (errors.length > 0) {
      console.error('❌ Found "draft" in blog URLs:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ No "draft" found in blog URLs.');
  } catch (error) {
    console.error(`❌ Error validating blog URLs: ${error.message}`);
    process.exit(1);
  }
}

function validateNoDraftPrefixInPublishedBlog() {
  console.log('\n📝 Validating that published blog posts don\'t have "draft-" prefix in filename...');
  
  const errors = [];
  
  try {
    const blogFiles = fs.readdirSync(blogDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md');
    
    blogFiles.forEach(file => {
      // Check if filename starts with "draft-"
      if (file.startsWith('draft-')) {
        const filePath = path.join(blogDir, file);
        const frontMatter = parseFrontMatter(filePath);
        
        if (frontMatter) {
          // Check if draft is explicitly false or not set (defaults to false)
          const isDraft = frontMatter.draft === true || frontMatter.draft === 'true';
          
          if (!isDraft) {
            errors.push(`Published blog post "${file}" still has "draft-" prefix in filename. Remove the prefix since draft: false.`);
          }
        }
      }
    });
    
    if (errors.length > 0) {
      console.error('❌ Published blog posts with "draft-" prefix found:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ No published blog posts have "draft-" prefix in filename.');
  } catch (error) {
    console.error(`❌ Error validating blog filenames: ${error.message}`);
    process.exit(1);
  }
}

function validateNoDuplicateDraftFiles() {
  console.log('\n🔍 Checking for duplicate draft files (draft-* and non-draft with same slug)...');
  
  const errors = [];
  
  try {
    const blogFiles = fs.readdirSync(blogDir)
      .filter(file => file.endsWith('.md') && file !== '_index.md');
    
    // Get all draft files and their slugs
    const draftFiles = new Map();
    const nonDraftFiles = new Map();
    
    blogFiles.forEach(file => {
      const filePath = path.join(blogDir, file);
      const frontMatter = parseFrontMatter(filePath);
      
      if (!frontMatter) return;
      
      // Get slug from front matter, or derive from filename
      const slug = frontMatter.slug || file.replace('.md', '').replace(/^draft-/, '');
      
      if (file.startsWith('draft-')) {
        draftFiles.set(slug, file);
      } else {
        nonDraftFiles.set(slug, file);
      }
    });
    
    // Check for duplicates: if a draft file and non-draft file have the same slug
    draftFiles.forEach((draftFile, slug) => {
      if (nonDraftFiles.has(slug)) {
        const nonDraftFile = nonDraftFiles.get(slug);
        errors.push(`Duplicate files found with slug "${slug}": "${draftFile}" and "${nonDraftFile}". Remove the draft-* file since a published version exists.`);
      }
    });
    
    if (errors.length > 0) {
      console.error('❌ Duplicate draft files found:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ No duplicate draft files found.');
  } catch (error) {
    console.error(`❌ Error checking for duplicate draft files: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  validateAboutPage,
  validate404Page,
  validatePermalinks,
  validateRecipeIndexPage,
  validateNoDraftInBlogUrls,
  validateNoDraftPrefixInPublishedBlog,
  validateNoDuplicateDraftFiles
};
