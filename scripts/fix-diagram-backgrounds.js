#!/usr/bin/env node

/**
 * Fix diagram background colors to match site black (#000000)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '..', 'static', 'images');
const targetColor = { r: 0, g: 0, b: 0 }; // #000000

const diagramFiles = [
  'technical-storytelling-engineering-narrative-breakdown.png',
  'technical-storytelling-structure-diagram.png'
];

async function fixBackground(imagePath) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    console.log(`\n📸 Processing: ${path.basename(imagePath)}`);
    console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`   Format: ${metadata.format}`);
    
    // Create a new image with black background
    // We'll composite the original image over a black background
    const blackBackground = {
      input: Buffer.from([0, 0, 0, 255]), // Black pixel
      raw: {
        width: 1,
        height: 1,
        channels: 4
      }
    };
    
    // Get the original image data
    const originalBuffer = await image.toBuffer();
    
    // Create a new image: black background with original composited on top
    // This approach preserves transparency and ensures black background
    const result = await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
    .composite([{
      input: originalBuffer,
      blend: 'over'
    }])
    .png()
    .toBuffer();
    
    // Save the result
    fs.writeFileSync(imagePath, result);
    
    const newSize = fs.statSync(imagePath).size;
    console.log(`   ✅ Updated with black background (#000000)`);
    console.log(`   New size: ${(newSize / 1024).toFixed(2)} KB`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error processing ${imagePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Fixing diagram background colors to match site black (#000000)...\n');
  
  let processed = 0;
  let failed = 0;
  
  for (const filename of diagramFiles) {
    const imagePath = path.join(imagesDir, filename);
    
    if (!fs.existsSync(imagePath)) {
      console.error(`⚠️  File not found: ${imagePath}`);
      failed++;
      continue;
    }
    
    const success = await fixBackground(imagePath);
    if (success) {
      processed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n✨ Done!`);
  console.log(`   Processed: ${processed}`);
  if (failed > 0) {
    console.log(`   Failed: ${failed}`);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { fixBackground };
