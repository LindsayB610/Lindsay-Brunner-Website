#!/usr/bin/env node

/**
 * Optimize image file sizes
 * 
 * Usage: 
 *   npm run optimize:images -- static/images/pork-shoulder-broiled.jpg
 *   npm run optimize:images -- static/images/pork-shoulder-broiled.jpg static/images/pork-shoulder-two-pieces-new.jpg
 *   npm run optimize:images -- static/images/*.jpg
 * 
 * This script uses sharp to compress images while maintaining visual quality.
 * It creates optimized versions that are smaller in file size.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Default quality settings
const JPEG_QUALITY = 85; // Good balance between quality and file size (0-100)
const PNG_QUALITY = 90;  // PNG compression quality
const MAX_WIDTH = 2400;  // Maximum width for images (OG images are 2400px)
const MAX_HEIGHT = 2400; // Maximum height for images

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculate compression ratio
 */
function getCompressionRatio(originalSize, newSize) {
  const reduction = originalSize - newSize;
  const percent = ((reduction / originalSize) * 100).toFixed(1);
  return { reduction, percent };
}

/**
 * Optimize a single image
 */
async function optimizeImage(imagePath, options = {}) {
  const {
    quality = JPEG_QUALITY,
    maxWidth = MAX_WIDTH,
    maxHeight = MAX_HEIGHT,
    backup = true
  } = options;

  // Resolve absolute path
  const resolvedPath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), imagePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Image not found: ${resolvedPath}`);
  }

  // Get file extension
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}. Supported: .jpg, .jpeg, .png, .webp`);
  }

  // Get original file size
  const originalSize = getFileSize(resolvedPath);
  console.log(`\n📸 Optimizing: ${path.basename(resolvedPath)}`);
  console.log(`   Original size: ${formatFileSize(originalSize)}`);

  // Create backup if requested
  let backupPath = null;
  if (backup) {
    backupPath = resolvedPath + '.backup';
    fs.copyFileSync(resolvedPath, backupPath);
    console.log(`   Backup created: ${path.basename(backupPath)}`);
  }

  // Get image metadata to check dimensions
  const metadata = await sharp(resolvedPath).metadata();
  const needsResize = metadata.width > maxWidth || metadata.height > maxHeight;

  // Create sharp instance with optimization
  let sharpInstance = sharp(resolvedPath);

  // Resize if needed (maintain aspect ratio)
  if (needsResize) {
    sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
    console.log(`   Resizing: ${metadata.width}x${metadata.height} → max ${maxWidth}x${maxHeight}`);
  }

  // Apply format-specific optimizations
  if (ext === '.jpg' || ext === '.jpeg') {
    sharpInstance = sharpInstance.jpeg({
      quality: quality,
      mozjpeg: true, // Use mozjpeg for better compression
      progressive: true // Progressive JPEG for better perceived performance
    });
  } else if (ext === '.png') {
    sharpInstance = sharpInstance.png({
      quality: PNG_QUALITY,
      compressionLevel: 9, // Maximum compression
      adaptiveFiltering: true
    });
  } else if (ext === '.webp') {
    sharpInstance = sharpInstance.webp({
      quality: quality
    });
  }

  // Write to temporary file first (sharp can't write to same file it's reading)
  const tempPath = resolvedPath + '.tmp';
  await sharpInstance.toFile(tempPath);

  // Replace original with optimized version
  fs.renameSync(tempPath, resolvedPath);

  // Get new file size
  const newSize = getFileSize(resolvedPath);
  const { reduction, percent } = getCompressionRatio(originalSize, newSize);

  console.log(`   New size: ${formatFileSize(newSize)}`);
  console.log(`   Reduction: ${formatFileSize(reduction)} (${percent}%)`);

  return {
    path: resolvedPath,
    originalSize,
    newSize,
    reduction,
    percent,
    backupPath
  };
}

/**
 * Main function
 */
async function main() {
  const imagePaths = process.argv.slice(2);

  if (imagePaths.length === 0) {
    console.error('❌ Error: Please provide at least one image file path');
    console.error('   Usage: npm run optimize:images -- static/images/image1.jpg [image2.jpg ...]');
    console.error('   Example: npm run optimize:images -- static/images/pork-shoulder-broiled.jpg');
    process.exit(1);
  }

  // Expand glob patterns if needed (basic support)
  const expandedPaths = [];
  for (const pattern of imagePaths) {
    if (pattern.includes('*')) {
      // Simple glob expansion using fs
      const dir = path.dirname(pattern);
      const glob = path.basename(pattern);
      const regex = new RegExp('^' + glob.replace(/\*/g, '.*') + '$');
      const files = fs.readdirSync(path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir));
      const matches = files.filter(f => regex.test(f));
      matches.forEach(f => expandedPaths.push(path.join(dir, f)));
    } else {
      expandedPaths.push(pattern);
    }
  }

  if (expandedPaths.length === 0) {
    console.error('❌ Error: No images found matching the provided paths');
    process.exit(1);
  }

  console.log(`🎨 Optimizing ${expandedPaths.length} image(s)...\n`);

  const results = [];
  let totalOriginalSize = 0;
  let totalNewSize = 0;

  for (const imagePath of expandedPaths) {
    try {
      const result = await optimizeImage(imagePath, {
        quality: JPEG_QUALITY,
        backup: true
      });
      results.push(result);
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;
    } catch (error) {
      console.error(`❌ Error optimizing ${imagePath}: ${error.message}`);
    }
  }

  // Summary
  if (results.length > 0) {
    const totalReduction = totalOriginalSize - totalNewSize;
    const totalPercent = ((totalReduction / totalOriginalSize) * 100).toFixed(1);

    console.log(`\n✨ Optimization complete!`);
    console.log(`   Images optimized: ${results.length}`);
    console.log(`   Total original size: ${formatFileSize(totalOriginalSize)}`);
    console.log(`   Total new size: ${formatFileSize(totalNewSize)}`);
    console.log(`   Total reduction: ${formatFileSize(totalReduction)} (${totalPercent}%)`);
    console.log(`\n💾 Backups created with .backup extension`);
    console.log(`   You can delete backups after verifying the optimized images look good.`);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}
