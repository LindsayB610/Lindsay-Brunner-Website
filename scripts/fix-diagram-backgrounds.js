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
  'technical-storytelling-structure-diagram.png',
  'content-system-structure.png',
  'content-system-feedback-loop.png',
  'leadership-communication-feedback-loop.png',
  'leadership-communication-audience-translation.png',
  'responsible-ai-content-creation-governance-workflow.png',
  'responsible-ai-content-creation-team-implementation-workflow.png'
];

async function fixBackground(imagePath) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    console.log(`\n📸 Processing: ${path.basename(imagePath)}`);
    console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`   Format: ${metadata.format}`);
    
    // Get raw pixel data
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Replace all pixels that are very dark (near black) with pure black
    // This ensures the background is exactly #000000
    const threshold = 30; // Pixels darker than this become pure black
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // If pixel is very dark (likely background), make it pure black
      if (r < threshold && g < threshold && b < threshold) {
        data[i] = 0;     // R
        data[i + 1] = 0; // G
        data[i + 2] = 0; // B
        // Keep alpha as is (or set to 255 for opaque)
        data[i + 3] = 255;
      }
    }
    
    // Create new image with pure black background and composited content
    const result = await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png()
    .toBuffer();
    
    // Save the result
    fs.writeFileSync(imagePath, result);
    
    const newSize = fs.statSync(imagePath).size;
    console.log(`   ✅ Updated with pure black background (#000000)`);
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
