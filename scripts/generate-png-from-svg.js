#!/usr/bin/env node
/**
 * Generate PNG from SVG for OG images
 * 
 * Usage: npm run generate:png -- static/images/social/recipe-xxx-og.svg
 * 
 * This script converts an edited SVG to PNG for social media compatibility.
 * Social platforms (Twitter, Facebook, LinkedIn) don't support SVG for OG images.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const WIDTH = 2400;
const HEIGHT = 1260;

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
    return pngPath;
  } catch (error) {
    console.error(`❌ Error converting SVG to PNG: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const svgPath = process.argv[2];
  
  if (!svgPath) {
    console.error('❌ Error: Please provide an SVG file path');
    console.error('   Usage: npm run generate:png -- static/images/social/recipe-xxx-og.svg');
    process.exit(1);
  }
  
  // Resolve path (could be relative or absolute)
  const resolvedSvgPath = path.isAbsolute(svgPath) 
    ? svgPath 
    : path.join(process.cwd(), svgPath);
  
  if (!fs.existsSync(resolvedSvgPath)) {
    console.error(`❌ Error: SVG file not found: ${resolvedSvgPath}`);
    process.exit(1);
  }
  
  if (!resolvedSvgPath.endsWith('.svg')) {
    console.error('❌ Error: File must be an SVG (.svg)');
    process.exit(1);
  }
  
  // PNG should be saved in the main social directory, not in working-files
  // If SVG is in working-files, go up two levels; otherwise go up one level
  const svgDir = path.dirname(resolvedSvgPath);
  const isInWorkingFiles = path.basename(svgDir) === 'working-files';
  const socialDir = isInWorkingFiles 
    ? path.join(svgDir, '..')
    : path.join(svgDir, '..');
  const pngFilename = path.basename(resolvedSvgPath, '.svg') + '.png';
  const pngPath = path.join(socialDir, pngFilename);
  
  console.log(`🎨 Converting SVG to PNG...`);
  console.log(`   SVG: ${resolvedSvgPath}`);
  console.log(`   PNG: ${pngPath}\n`);
  
  try {
    await generatePNGFromSVG(resolvedSvgPath, pngPath);
    console.log(`\n✨ Done! PNG ready for OG image.`);
    console.log(`   Add to front matter: social_image: "/images/social/${pngFilename}"`);
  } catch (error) {
    console.error(`\n❌ Failed to generate PNG`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { generatePNGFromSVG };

