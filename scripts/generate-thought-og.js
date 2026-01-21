#!/usr/bin/env node

/**
 * Generate Open Graph image for a specific thoughts post
 * Uses the same style as recipe OG images: black background, gradient text
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
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
const outputDir = path.join(__dirname, '..', 'static', 'images', 'social');
const workingFilesDir = path.join(outputDir, 'working-files');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(workingFilesDir)) {
  fs.mkdirSync(workingFilesDir, { recursive: true });
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
 * Generate SVG for thoughts OG image
 */
function generateThoughtOGImage(text, slug) {
  const leftPadding = 120;
  const rightPadding = 120;
  const maxTextWidth = WIDTH - leftPadding - rightPadding;
  
  // Use canvas to measure text and calculate line breaks
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Calculate text layout
  const fontSize = 140; // Increased font size for better visibility
  const lineHeight = 170;
  
  ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
  const words = text.split(' ');
  const textLines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTextWidth && currentLine) {
      textLines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) textLines.push(currentLine);
  
  // Calculate vertical centering
  const totalTextHeight = textLines.length * lineHeight;
  const textY = (HEIGHT - totalTextHeight) / 2;
  
  // Website URL position
  const urlX = WIDTH - rightPadding;
  const urlY = HEIGHT - 80;
  const urlFontSize = 36;
  
  // Measure URL text
  ctx.font = `bold ${urlFontSize}px "Inter", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const urlMetrics = ctx.measureText('lindsaybrunner.com');
  
  // Generate SVG
  const baselineOffset = fontSize * 0.8;
  const urlBaselineOffset = urlFontSize * 0.8;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Black background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.black}"/>
  
  <!-- Main text lines with gradient -->
`;

  // Add text lines with gradient
  textLines.forEach((line, index) => {
    const y = textY + (index * lineHeight) + baselineOffset;
    const gradientId = `textGradient${index}`;
    
    svg += `  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${COLORS.pink};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffaa00;stop-opacity:1" />
    </linearGradient>
  </defs>
  <text x="${leftPadding}" y="${y}" font-family="Inter, sans-serif" font-size="${fontSize}" font-weight="bold" fill="url(#${gradientId})">${escapeXml(line)}</text>
`;
  });
  
  // Add website URL with gradient
  const urlGradientId = 'urlGradient';
  svg += `  <defs>
    <linearGradient id="${urlGradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${COLORS.yellow};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff8800;stop-opacity:1" />
    </linearGradient>
  </defs>
  <text x="${urlX}" y="${urlY}" font-family="Inter, sans-serif" font-size="${urlFontSize}" font-weight="bold" fill="url(#${urlGradientId})" text-anchor="end" dominant-baseline="auto">${escapeXml('lindsaybrunner.com')}</text>
`;
  
  // Add underline with gradient
  const underlineY = Math.round(urlY + urlMetrics.actualBoundingBoxDescent + 14);
  const underlineRightX = urlX;
  const underlineLeftX = urlX - urlMetrics.width;
  
  const underlineGradientId = 'underlineGradient';
  svg += `  <defs>
    <linearGradient id="${underlineGradientId}" x1="${underlineLeftX}" y1="${underlineY}" x2="${underlineRightX}" y2="${underlineY}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" style="stop-color:#ff8800;stop-opacity:1" />
      <stop offset="100%" style="stop-color:${COLORS.pink};stop-opacity:1" />
    </linearGradient>
  </defs>
  <line x1="${underlineLeftX}" y1="${underlineY}" x2="${underlineRightX}" y2="${underlineY}" stroke="url(#${underlineGradientId})" stroke-width="5"/>
`;

  svg += `</svg>`;
  
  // Save SVG
  const svgPath = path.join(workingFilesDir, `${slug}-og.svg`);
  fs.writeFileSync(svgPath, svg);
  
  return svgPath;
}

/**
 * Convert SVG to PNG
 */
async function generatePNGFromSVG(svgPath, pngPath) {
  try {
    await sharp(svgPath)
      .resize(WIDTH, HEIGHT)
      .png()
      .toFile(pngPath);
    console.log(`✅ Generated PNG: ${pngPath}`);
  } catch (error) {
    console.error(`❌ Error converting SVG to PNG: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const text = process.argv[2] || "Rules are allowed to be ridiculous, and truth is rarely found in the loudest message you hear.";
  const slug = process.argv[3] || "alices-restaurant-family-ritual";
  
  console.log('🎨 Generating OG image for thoughts post...\n');
  console.log(`Text: "${text}"`);
  console.log(`Slug: ${slug}\n`);
  
  // Generate SVG
  const svgPath = generateThoughtOGImage(text, slug);
  console.log(`✅ Generated SVG: ${svgPath}`);
  
  // Generate PNG
  const pngPath = path.join(outputDir, `${slug}-og.png`);
  await generatePNGFromSVG(svgPath, pngPath);
  
  console.log(`\n✨ Done!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review the SVG: ${svgPath}`);
  console.log(`   2. Edit if needed, then regenerate PNG`);
  console.log(`   3. Add to front matter: social_image: "/images/social/${slug}-og.png"`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { generateThoughtOGImage };
