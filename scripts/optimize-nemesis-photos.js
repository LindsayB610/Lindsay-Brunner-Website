#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const photosDir = path.join(process.cwd(), 'static', 'images', 'nemesis', 'session-photos');
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const targetWidth = 2400;
const targetHeight = 1350;
const jpegQuality = 85;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizePhoto(photoPath) {
  const originalSize = fs.statSync(photoPath).size;
  const metadata = await sharp(photoPath).metadata();
  const tempPath = `${photoPath}.tmp`;

  console.log(`\n📸 Optimizing: ${path.basename(photoPath)}`);
  console.log(`   Original size: ${formatFileSize(originalSize)}`);
  console.log(`   Original dimensions: ${metadata.width}x${metadata.height}`);

  await sharp(photoPath)
    .rotate()
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'attention',
      withoutEnlargement: false,
    })
    .jpeg({
      quality: jpegQuality,
      mozjpeg: true,
      progressive: true,
    })
    .toFile(tempPath);

  fs.renameSync(tempPath, photoPath);

  const newSize = fs.statSync(photoPath).size;
  const reduction = originalSize - newSize;
  const percent = ((reduction / originalSize) * 100).toFixed(1);

  console.log(`   Cropped to: ${targetWidth}x${targetHeight}`);
  console.log(`   New size: ${formatFileSize(newSize)}`);
  console.log(`   Reduction: ${formatFileSize(reduction)} (${percent}%)`);

  return {
    originalSize,
    newSize,
  };
}

async function main() {
  if (!fs.existsSync(photosDir)) {
    console.log('No Nemesis session photo directory found yet. Nothing to optimize.');
    return;
  }

  const photoPaths = fs
    .readdirSync(photosDir)
    .filter((file) => allowedExtensions.has(path.extname(file).toLowerCase()))
    .map((file) => path.join(photosDir, file))
    .sort();

  if (photoPaths.length === 0) {
    console.log('No Nemesis session photos found. Nothing to optimize.');
    return;
  }

  console.log(`🎨 Optimizing ${photoPaths.length} Nemesis session photo(s)...`);
  console.log(`   Target dimensions: ${targetWidth}x${targetHeight}`);

  let totalOriginalSize = 0;
  let totalNewSize = 0;

  for (const photoPath of photoPaths) {
    const result = await optimizePhoto(photoPath);
    totalOriginalSize += result.originalSize;
    totalNewSize += result.newSize;
  }

  const totalReduction = totalOriginalSize - totalNewSize;
  const totalPercent = ((totalReduction / totalOriginalSize) * 100).toFixed(1);

  console.log('\n✨ Nemesis photo optimization complete!');
  console.log(`   Images optimized: ${photoPaths.length}`);
  console.log(`   Total original size: ${formatFileSize(totalOriginalSize)}`);
  console.log(`   Total new size: ${formatFileSize(totalNewSize)}`);
  console.log(`   Total reduction: ${formatFileSize(totalReduction)} (${totalPercent}%)`);
}

main().catch((error) => {
  console.error(`❌ Nemesis photo optimization failed: ${error.message}`);
  process.exit(1);
});
