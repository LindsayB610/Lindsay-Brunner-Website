const fs = require('fs');
const path = require('path');

// Path constants
const publicDir = path.join(__dirname, '..', '..', 'public');
const thoughtsDir = path.join(__dirname, '..', '..', 'content', 'thoughts');
const recipesDir = path.join(__dirname, '..', '..', 'content', 'recipes');
const staticDir = path.join(__dirname, '..', '..', 'static');

// File path constants
const homepagePath = path.join(publicDir, 'index.html');
const rssFeedPath = path.join(publicDir, 'thoughts', 'index.xml');
const recipesRssFeedPath = path.join(publicDir, 'recipes', 'index.xml');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const aboutPagePath = path.join(publicDir, 'about', 'index.html');
const error404Path = path.join(publicDir, '404.html');
const recipeIndexPath1 = path.join(publicDir, 'recipes', 'all', 'index.html');
const recipeIndexPath2 = path.join(publicDir, 'recipes', 'index', 'index.html');
const recipeIndexPath3 = path.join(publicDir, 'recipes', 'index.html');
const recipeIndexPath4 = path.join(publicDir, 'recipes', '1-01-01', 'recipe-index', 'index.html');

// Required front matter fields for thoughts posts
const REQUIRED_THOUGHTS_FIELDS = ['title', 'description', 'subtitle', 'draft'];
const OPTIONAL_THOUGHTS_FIELDS = ['slug', 'date', 'og_image', 'social_image'];

// Required front matter fields for recipes
const REQUIRED_RECIPE_FIELDS = ['title', 'description', 'subtitle', 'draft', 'prepTime', 'cookTime', 'totalTime', 'recipeYield', 'recipeCategory', 'recipeCuisine', 'recipeIngredient', 'recipeInstructions'];
const OPTIONAL_RECIPE_FIELDS = ['slug', 'date', 'og_image', 'social_image'];

// Default social image from config
const DEFAULT_SOCIAL_IMAGE = '/images/social/default-og.png';

/**
 * Parse front matter from markdown file
 */
function parseFrontMatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
      return null;
    }
    
    const frontMatterText = match[1];
    const frontMatter = {};
    
    let currentKey = null;
    let inArray = false;
    let arrayValue = [];
    
    // Enhanced YAML parser that handles arrays
    frontMatterText.split('\n').forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if this is an array item (starts with -)
      if (trimmedLine.startsWith('-')) {
        if (currentKey) {
          const arrayItem = trimmedLine.substring(1).trim();
          // Remove quotes if present
          const cleanItem = arrayItem.replace(/^["']|["']$/g, '');
          arrayValue.push(cleanItem);
          inArray = true;
        }
        return;
      }
      
      // If we were in an array and hit a new key, save the array
      if (inArray && currentKey && trimmedLine.includes(':')) {
        frontMatter[currentKey] = arrayValue;
        arrayValue = [];
        inArray = false;
        currentKey = null;
      }
      
      // Check for key: value pair
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex > 0) {
        // Save previous array if we have one
        if (inArray && currentKey) {
          frontMatter[currentKey] = arrayValue;
          arrayValue = [];
          inArray = false;
        }
        
        const key = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Check if this might be the start of an array (empty value)
        if (value === '' || value === '[]') {
          currentKey = key;
          inArray = true;
          arrayValue = [];
        } else {
          frontMatter[key] = value;
          currentKey = null;
          inArray = false;
        }
      }
    });
    
    // Save any remaining array
    if (inArray && currentKey && arrayValue.length > 0) {
      frontMatter[currentKey] = arrayValue;
    }
    
    return frontMatter;
  } catch (error) {
    console.error(`Error parsing front matter in ${filePath}: ${error.message}`);
    return null;
  }
}

module.exports = {
  // Paths
  publicDir,
  thoughtsDir,
  recipesDir,
  staticDir,
  homepagePath,
  rssFeedPath,
  recipesRssFeedPath,
  sitemapPath,
  aboutPagePath,
  error404Path,
  recipeIndexPath1,
  recipeIndexPath2,
  recipeIndexPath3,
  recipeIndexPath4,
  
  // Constants
  REQUIRED_THOUGHTS_FIELDS,
  OPTIONAL_THOUGHTS_FIELDS,
  REQUIRED_RECIPE_FIELDS,
  OPTIONAL_RECIPE_FIELDS,
  DEFAULT_SOCIAL_IMAGE,
  
  // Functions
  parseFrontMatter
};
