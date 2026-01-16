#!/usr/bin/env node

/**
 * Generate Substack banner image
 * 
 * Creates a PNG banner (1920x384px) using the website's brand colors and styling
 * Perfect for Substack publication headers
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
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

// Substack banner dimensions (standard)
const WIDTH = 1920;
const HEIGHT = 384;

// Output path
const outputDir = path.join(__dirname, '..', 'static', 'images', 'social');
const outputPath = path.join(outputDir, 'substack-banner.png');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Create gradient text effect matching the website's h1 style
 */
function drawGradientText(ctx, text, x, y, fontSize, fontFamily) {
  ctx.font = `800 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Measure text
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;
  
  // Create a temporary canvas for the text
  const textCanvas = createCanvas(Math.ceil(textWidth) + 40, Math.ceil(textHeight) + 40);
  const textCtx = textCanvas.getContext('2d');
  textCtx.font = `800 ${fontSize}px ${fontFamily}`;
  textCtx.textAlign = 'left';
  textCtx.textBaseline = 'top';
  
  // Draw text in white first (for masking)
  textCtx.fillStyle = '#ffffff';
  textCtx.fillText(text, 20, 20);
  
  // Get image data
  const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
  const data = imageData.data;
  
  // Apply gradient: red -> pink -> yellow (matching website gradient at 135deg)
  // For horizontal text, we'll apply the gradient horizontally
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) { // If pixel is not transparent
      const pixelX = (i / 4) % textCanvas.width;
      const progress = Math.max(0, Math.min(1, (pixelX - 20) / textWidth)); // 0 to 1 across text width
      
      // Gradient: red (#ff0037) -> pink (#ff1b8d) -> yellow (#ffdd00)
      // At 0%: red, at 50%: pink, at 100%: yellow
      let r, g, b;
      if (progress <= 0.5) {
        // Red to pink (0% to 50%)
        const localProgress = progress * 2; // 0 to 1
        r = Math.round(255); // Red stays at max
        g = Math.round(0 + (27 - 0) * localProgress); // 0 to 27
        b = Math.round(55 + (141 - 55) * localProgress); // 55 to 141
      } else {
        // Pink to yellow (50% to 100%)
        const localProgress = (progress - 0.5) * 2; // 0 to 1
        r = Math.round(255); // Red stays at max
        g = Math.round(27 + (221 - 27) * localProgress); // 27 to 221
        b = Math.round(141 + (0 - 141) * localProgress); // 141 to 0
      }
      
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
 * Generate Substack banner
 */
async function generateBanner() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Black background (matching website)
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Add subtle gradient overlay for depth (optional)
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, 'rgba(255, 0, 55, 0.05)'); // Subtle red tint
  gradient.addColorStop(0.5, 'rgba(255, 27, 141, 0.05)'); // Subtle pink tint
  gradient.addColorStop(1, 'rgba(255, 221, 0, 0.05)'); // Subtle yellow tint
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Padding
  const leftPadding = 120;
  const rightPadding = 120;
  const verticalCenter = HEIGHT / 2;
  
  // Main logo/text: "Cook with Me"
  const logoText = 'Cook with Me';
  const logoFontSize = 100; // Slightly smaller to fit longer text
  const logoY = verticalCenter - logoFontSize / 2;
  
  // Draw logo with gradient (matching site logo style)
  drawGradientText(ctx, logoText, leftPadding, logoY, logoFontSize, 'Inter');
  
  // Optional: Add tagline or website URL on the right
  const tagline = 'lindsaybrunner.com';
  const taglineFontSize = 32;
  ctx.font = `600 ${taglineFontSize}px "Space Grotesk", sans-serif`;
  ctx.fillStyle = COLORS.textSecondary;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagline, WIDTH - rightPadding, verticalCenter);
  
  // Add subtle decorative gradient line at bottom (matching website header style)
  const lineY = HEIGHT - 2;
  const lineGradient = ctx.createLinearGradient(0, lineY, WIDTH, lineY);
  lineGradient.addColorStop(0, COLORS.red);
  lineGradient.addColorStop(0.5, COLORS.pink);
  lineGradient.addColorStop(1, COLORS.yellow);
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, lineY);
  ctx.lineTo(WIDTH, lineY);
  ctx.stroke();
  
  // Convert canvas to buffer
  const buffer = canvas.toBuffer('image/png');
  
  // Save PNG using sharp for better quality
  await sharp(buffer)
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Generated Substack banner: ${outputPath}`);
  return outputPath;
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Generating Substack banner...\n');
  
  try {
    const bannerPath = await generateBanner();
    const relativePath = path.relative(path.join(__dirname, '..'), bannerPath);
    console.log(`\n✨ Done! Banner saved to: ${relativePath}`);
    console.log(`   Dimensions: ${WIDTH}x${HEIGHT}px`);
    console.log(`   Ready to upload to Substack!`);
  } catch (error) {
    console.error('❌ Error generating banner:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { generateBanner };
