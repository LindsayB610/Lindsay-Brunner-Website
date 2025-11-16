#!/usr/bin/env node

/**
 * Generate Open Graph images for recipes
 * 
 * This script reads all recipe markdown files, extracts front matter,
 * and generates branded OG images using the brand colors and styling.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const yaml = require('js-yaml');
const sharp = require('sharp');

// Brand colors from BRAND.md
const COLORS = {
  red: '#ff0037',
  pink: '#ff1b8d',
  yellow: '#ffdd00',
  black: '#000000',
  white: '#ffffff',
  textSecondary: '#cccccc',
  textMuted: '#888888'
};

// Image dimensions (standard OG image size)
const WIDTH = 2400;
const HEIGHT = 1260;

// Paths
const recipesDir = path.join(__dirname, '..', 'content', 'recipes');
const outputDir = path.join(__dirname, '..', 'static', 'images', 'social');
const workingFilesDir = path.join(outputDir, 'working-files');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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
    return yaml.load(frontMatterText);
  } catch (error) {
    console.error(`Error parsing front matter in ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Convert ISO 8601 duration (PT85M) to readable format (85 min)
 */
function formatDuration(isoDuration) {
  if (!isoDuration) return '';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}min`;
  }
  
  return isoDuration;
}

/**
 * Create gradient text effect - left-aligned version
 * Matches managing-up style: horizontal gradient from pink to orange-yellow
 */
function drawGradientTextLeft(ctx, text, x, y, fontSize, fontFamily) {
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Measure text
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2; // Add some padding
  
  // Create a temporary canvas for the text
  const textCanvas = createCanvas(Math.ceil(textWidth) + 20, Math.ceil(textHeight) + 20);
  const textCtx = textCanvas.getContext('2d');
  textCtx.font = `bold ${fontSize}px ${fontFamily}`;
  textCtx.textAlign = 'left';
  textCtx.textBaseline = 'top';
  
  // Draw text in white first (for masking)
  textCtx.fillStyle = '#ffffff';
  textCtx.fillText(text, 10, 10);
  
  // Get image data
  const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
  const data = imageData.data;
  
  // Apply horizontal gradient to the text pixels (pink to orange-yellow)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) { // If pixel is not transparent
      const pixelX = (i / 4) % textCanvas.width;
      const progress = Math.max(0, Math.min(1, (pixelX - 10) / textWidth)); // 0 to 1 across text width
      
      // Create gradient: pink (#ff1b8d) -> orange-yellow (#ffaa00)
      // This matches the managing-up style better
      const r = Math.round(255 + (255 - 255) * progress); // 255 (pink) to 255 (yellow)
      const g = Math.round(27 + (170 - 27) * progress);   // 27 (pink) to 170 (yellow)
      const b = Math.round(141 + (0 - 141) * progress);    // 141 (pink) to 0 (yellow)
      
      data[i] = Math.min(255, r);     // R
      data[i + 1] = Math.min(255, g); // G
      data[i + 2] = Math.min(255, b); // B
      // Alpha stays the same
    }
  }
  
  // Put modified image data back
  textCtx.putImageData(imageData, 0, 0);
  
  // Draw the gradient text onto the main canvas
  ctx.drawImage(textCanvas, x, y);
}

/**
 * Create gradient text effect - right-aligned version (for website URL)
 */
function drawGradientTextRight(ctx, text, x, y, fontSize, fontFamily) {
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  
  // Measure text
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;
  
  // Create a temporary canvas for the text
  const textCanvas = createCanvas(Math.ceil(textWidth) + 20, Math.ceil(textHeight) + 20);
  const textCtx = textCanvas.getContext('2d');
  textCtx.font = `bold ${fontSize}px ${fontFamily}`;
  textCtx.textAlign = 'right';
  textCtx.textBaseline = 'bottom';
  
  // Draw text in white first (for masking)
  textCtx.fillStyle = '#ffffff';
  textCtx.fillText(text, textCanvas.width - 10, textCanvas.height - 10);
  
  // Get image data
  const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
  const data = imageData.data;
  
  // Apply horizontal gradient (yellow to orange, matching managing-up style)
  // The managing-up image shows yellow-orange gradient, warmer tones
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const pixelX = (i / 4) % textCanvas.width;
      const progress = Math.max(0, Math.min(1, (pixelX - 10) / textWidth));
      
      // Gradient: yellow (#ffdd00) to orange (#ff8800) - warmer end of spectrum
      // Yellow: rgb(255, 221, 0) -> Orange: rgb(255, 136, 0)
      const r = Math.round(255); // Red stays at max
      const g = Math.round(221 + (136 - 221) * progress); // 221 (yellow) to 136 (orange)
      const b = Math.round(0); // Blue stays at 0
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
  
  // Put modified image data back
  textCtx.putImageData(imageData, 0, 0);
  
  // Draw the gradient text onto the main canvas
  ctx.drawImage(textCanvas, x - textCanvas.width, y - textCanvas.height);
}

/**
 * Generate OG image for a recipe
 * Matches the style of managing-up-og.png: left-aligned, bold gradient text, minimal design
 * Returns SVG path for easy editing
 */
function generateOGImage(recipe) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // We use canvas for measurements, but output SVG
  
  // Pure black background (no gradient overlay)
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Left padding for text (needed for SVG generation)
  const leftPadding = 120;
  const rightPadding = 120;
  const maxTextWidth = WIDTH - leftPadding - rightPadding;
  
  // Store layout info for SVG generation
  const layout = {
    leftPadding,
    rightPadding
  };
  
  // Title - left-aligned, large, bold, with gradient
  const titleFontSize = 160; // Much bigger
  const titleLineHeight = 180; // Spacing between lines
  
  // Calculate vertical centering
  // First, estimate how much space the title will take
  ctx.font = `bold ${titleFontSize}px "Inter", sans-serif`;
  const words = recipe.title.split(' ');
  const titleLines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTextWidth && currentLine) {
      titleLines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) titleLines.push(currentLine);
  
  // Calculate subtitle height if it exists
  let subtitleHeight = 0;
  let subtitleLines = []; // Initialize as empty array
  if (recipe.subtitle) {
    ctx.font = `bold 64px "Inter", sans-serif`;
    const subtitleWords = recipe.subtitle.split(' ');
    let currentSubtitleLine = '';
    
    subtitleWords.forEach(word => {
      const testLine = currentSubtitleLine + (currentSubtitleLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && currentSubtitleLine) {
        subtitleLines.push(currentSubtitleLine);
        currentSubtitleLine = word;
      } else {
        currentSubtitleLine = testLine;
      }
    });
    if (currentSubtitleLine) subtitleLines.push(currentSubtitleLine);
    subtitleHeight = subtitleLines.length * 85 + 80; // Line height + spacing (increased for larger font)
  }
  
  // Calculate total content height and center it vertically
  const totalTitleHeight = titleLines.length * titleLineHeight;
  const totalContentHeight = totalTitleHeight + subtitleHeight;
  const titleY = (HEIGHT - totalContentHeight) / 2;
  
  // Draw title with gradient (left-aligned)
  titleLines.forEach((line, index) => {
    drawGradientTextLeft(ctx, line, leftPadding, titleY + (index * titleLineHeight), titleFontSize, 'Inter');
  });
  
  // Subtitle (if exists) - left-aligned, smaller, secondary color
  // Reduced spacing from 80px to 20px to bring subtitle closer to headline
  let currentY = titleY + (titleLines.length * titleLineHeight) + 20;
  const subtitleIndent = 12; // Move a few more pixels to the right
  if (recipe.subtitle && subtitleLines.length > 0) {
    ctx.font = `bold 64px "Inter", sans-serif`;
    ctx.fillStyle = COLORS.textSecondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw subtitle lines (already calculated above)
    subtitleLines.forEach((line, index) => {
      ctx.fillText(line, leftPadding + subtitleIndent, currentY + (index * 85));
    });
    
    currentY += subtitleLines.length * 85 + 40;
  }
  
  // Website URL in bottom right corner (matching managing-up style)
  const websiteUrl = 'lindsaybrunner.com';
  const urlFontSize = 36; // Smaller than current, matching managing-up style
  const urlX = WIDTH - rightPadding;
  const urlY = HEIGHT - 80;
  
  // Measure text for underline (need to measure before drawing)
  ctx.font = `bold ${urlFontSize}px "Inter", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const urlMetrics = ctx.measureText(websiteUrl);
  
  // Draw website URL with gradient (yellow to orange, matching managing-up style)
  drawGradientTextRight(ctx, websiteUrl, urlX, urlY, urlFontSize, 'Inter');
  
  // Add gradient underline (orange to pink)
  // The drawGradientTextRight function draws text with 10px padding from the right edge
  // So the actual text right edge is at urlX - 10, and left edge is at urlX - 10 - width
  const underlineY = urlY + 5; // 5px below the text baseline
  const textRightEdge = urlX - 10; // Account for padding in drawGradientTextRight
  const underlineLeftX = textRightEdge - urlMetrics.width;
  const underlineRightX = textRightEdge;
  
  // Create gradient for underline: orange (#ff8800) to pink (#ff1b8d)
  const underlineGradient = ctx.createLinearGradient(underlineLeftX, underlineY, underlineRightX, underlineY);
  underlineGradient.addColorStop(0, '#ff8800'); // Orange
  underlineGradient.addColorStop(1, '#ff1b8d'); // Pink
  
  ctx.strokeStyle = underlineGradient;
  ctx.lineWidth = 3; // Slightly thicker
  ctx.beginPath();
  ctx.moveTo(underlineLeftX, underlineY);
  ctx.lineTo(underlineRightX, underlineY);
  ctx.stroke();
  
  // Generate SVG instead of PNG for easy editing
  return generateSVG(recipe, {
    leftPadding,
    rightPadding,
    titleLines,
    titleY,
    titleFontSize,
    titleLineHeight,
    subtitleLines: subtitleLines,
    subtitleY: currentY,
    subtitleIndent: 12,
    urlX,
    urlY,
    urlFontSize,
    urlMetrics,
    underlineLeftX,
    underlineRightX,
    underlineY
  });
}

/**
 * Generate SVG version of OG image (editable format)
 */
function generateSVG(recipe, layout) {
  // Get slug and ensure it doesn't have duplicate "recipe-" prefix
  let slug = recipe.slug || path.basename(recipe.filePath, '.md');
  if (slug.startsWith('recipe-')) {
    slug = slug.substring(7);
  }
  // Ensure working-files directory exists
  if (!fs.existsSync(workingFilesDir)) {
    fs.mkdirSync(workingFilesDir, { recursive: true });
  }
  const outputPath = path.join(workingFilesDir, `recipe-${slug}-og.svg`);
  
  // Build SVG with all elements
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Black background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.black}"/>
  
  <!-- Title lines with gradient -->
`;
  
  // Add title lines with gradient
  // SVG text y position is baseline, but we calculated for top-aligned canvas text
  // Need to adjust: canvas y + font size * 0.8 (approximate baseline offset for Inter)
  const baselineOffset = layout.titleFontSize * 0.8;
  layout.titleLines.forEach((line, index) => {
    const y = layout.titleY + (index * layout.titleLineHeight) + baselineOffset;
    const gradientId = `titleGradient${index}`;
    
    svg += `  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${COLORS.pink};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffaa00;stop-opacity:1" />
    </linearGradient>
  </defs>
  <text x="${layout.leftPadding}" y="${y}" font-family="Inter, sans-serif" font-size="${layout.titleFontSize}" font-weight="bold" fill="url(#${gradientId})">${escapeXml(line)}</text>
`;
  });
  
  // Add subtitle lines
  // SVG text y position is baseline, adjust for subtitle font size
  const subtitleBaselineOffset = 64 * 0.8; // 64px font size
  if (layout.subtitleLines.length > 0) {
    layout.subtitleLines.forEach((line, index) => {
      const y = layout.subtitleY + (index * 85) + subtitleBaselineOffset;
      svg += `  <text x="${layout.leftPadding + layout.subtitleIndent}" y="${y}" font-family="Inter, sans-serif" font-size="64" font-weight="bold" fill="${COLORS.textSecondary}">${escapeXml(line)}</text>
`;
    });
  }
  
  // Add website URL with gradient
  const urlGradientId = 'urlGradient';
  svg += `  <defs>
    <linearGradient id="${urlGradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${COLORS.yellow};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff8800;stop-opacity:1" />
    </linearGradient>
  </defs>
  <text x="${layout.urlX}" y="${layout.urlY}" font-family="Inter, sans-serif" font-size="${layout.urlFontSize}" font-weight="bold" fill="url(#${urlGradientId})" text-anchor="end" dominant-baseline="auto">${escapeXml('lindsaybrunner.com')}</text>
`;
  
  // Add underline with gradient
  // In SVG with text-anchor="end", the text ends at urlX, so underline should align with text edges
  // Text starts at urlX - urlMetrics.width, ends at urlX
  // With dominant-baseline="auto", urlY is the baseline. Need to add descent + spacing
  // Text baseline is at urlY (1180), descent is ~7px for 36px font, so bottom is at urlY + 7
  // Add 14px spacing below the text = 1180 + 7 + 14 = 1201 (more space from text)
  const underlineY = Math.round(layout.urlY + layout.urlMetrics.actualBoundingBoxDescent + 14);
  
  // Underline aligns with text edges (no extension)
  const underlineRightX = layout.urlX; // Text ends here (text-anchor="end")
  const underlineLeftX = layout.urlX - layout.urlMetrics.width; // Text starts here
  
  const underlineGradientId = 'underlineGradient';
  // Use absolute coordinates for the gradient to match the line position
  svg += `  <defs>
    <linearGradient id="${underlineGradientId}" x1="${underlineLeftX}" y1="${underlineY}" x2="${underlineRightX}" y2="${underlineY}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" style="stop-color:#ff8800;stop-opacity:1" />
      <stop offset="100%" style="stop-color:${COLORS.pink};stop-opacity:1" />
    </linearGradient>
  </defs>
  <line x1="${underlineLeftX}" y1="${underlineY}" x2="${underlineRightX}" y2="${underlineY}" stroke="url(#${underlineGradientId})" stroke-width="5"/>
`;

  svg += `</svg>`;
  
  // Save SVG (for editing) in working-files directory
  fs.writeFileSync(outputPath, svg);
  
  // PNG will be generated separately after manual edits, saved in main social directory
  const pngPath = path.join(outputDir, `recipe-${slug}-og.png`);
  
  return { svgPath: outputPath, pngPath }; // Return both paths
}

/**
 * Convert SVG to PNG for social media compatibility
 * Social platforms (Twitter, Facebook, LinkedIn) don't support SVG for OG images
 */
async function generatePNGFromSVG(svgPath, pngPath) {
  try {
    await sharp(svgPath)
      .resize(WIDTH, HEIGHT)
      .png()
      .toFile(pngPath);
  } catch (error) {
    console.error(`⚠️  Warning: Could not convert SVG to PNG for ${svgPath}: ${error.message}`);
    console.error('   SVG saved for editing, but PNG needed for social media. You may need to convert manually.');
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Generating OG images for recipes...\n');
  
  // Get all recipe markdown files
  const files = fs.readdirSync(recipesDir)
    .filter(file => file.endsWith('.md') && file !== '_index.md' && file.startsWith('recipe-'));
  
  if (files.length === 0) {
    console.log('⚠️  No recipe files found.');
    return;
  }
  
  let generated = 0;
  let skipped = 0;
  const needsReview = [];
  
  // Process files sequentially
  for (const file of files) {
    const filePath = path.join(recipesDir, file);
    const frontMatter = parseFrontMatter(filePath);
    
    if (!frontMatter) {
      console.log(`⚠️  Skipping ${file}: Could not parse front matter`);
      skipped++;
      continue;
    }
    
    // Skip if already has a custom social_image specified (already reviewed)
    if (frontMatter.social_image || frontMatter.og_image) {
      console.log(`⏭️  Skipping ${file}: Already has social image (reviewed)`);
      skipped++;
      continue;
    }
    
    // Generate SVG only (for editing)
    // PNG will be generated separately after manual edits
    try {
      frontMatter.filePath = filePath;
      const paths = generateOGImage(frontMatter);
      
      const svgRelativePath = path.relative(path.join(__dirname, '..'), paths.svgPath);
      
      // Get slug without duplicate "recipe-" prefix
      let slug = frontMatter.slug || file.replace('.md', '');
      if (slug.startsWith('recipe-')) {
        slug = slug.substring(7);
      }
      const imagePath = `/images/social/recipe-${slug}-og.png`; // PNG path (will be generated later)
      
      console.log(`✅ Generated: ${svgRelativePath} (editable)`);
      generated++;
      
      // Track recipes that need review
      const isDraft = frontMatter.draft === true || frontMatter.draft === 'true';
      if (!isDraft) {
        needsReview.push({ file, imagePath, svgPath: paths.svgPath });
      }
    } catch (error) {
      console.error(`❌ Error generating image for ${file}:`, error.message);
    }
  }
  
  console.log(`\n✨ Done! Generated ${generated} image(s), skipped ${skipped}.`);
  
  if (needsReview.length > 0) {
    console.log('\n🔍 ⚠️  MANUAL REVIEW REQUIRED:');
    console.log('   The following published recipes have generated OG images that need review:');
    needsReview.forEach(({ file, imagePath, svgPath }) => {
      console.log(`   - ${file}`);
      const svgRelativePath = path.relative(path.join(__dirname, '..'), svgPath);
      console.log(`     → Edit SVG: ${svgRelativePath}`);
      console.log(`     → Then run: npm run generate:png -- ${svgRelativePath}`);
      console.log(`     → Add to front matter: social_image: "${imagePath}"`);
    });
    console.log('\n   💡 Workflow:');
    console.log('      1. Edit the SVG file as needed');
    console.log('      2. Run: npm run generate:png -- <svg-path>');
    console.log('      3. Add social_image to front matter');
    console.log('      4. Ready to publish!');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { generateOGImage, parseFrontMatter };

