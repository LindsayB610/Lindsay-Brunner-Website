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
 * Clean up backup files for optimized images
 */
function cleanupBackups(imagePaths) {
  const cleaned = [];
  for (const imagePath of imagePaths) {
    const resolvedPath = path.isAbsolute(imagePath)
      ? imagePath
      : path.join(process.cwd(), imagePath);
    const backupPath = resolvedPath + '.backup';
    
    if (fs.existsSync(backupPath)) {
      // Only delete if the original optimized file exists and is newer
      if (fs.existsSync(resolvedPath)) {
        const backupStats = fs.statSync(backupPath);
        const originalStats = fs.statSync(resolvedPath);
        
        // Delete backup if original exists and is newer (optimization was successful)
        if (originalStats.mtime > backupStats.mtime) {
          fs.unlinkSync(backupPath);
          cleaned.push(path.basename(backupPath));
        }
      }
    }
  }
  return cleaned;
}

/**
 * Optimize a single image
 */
async function optimizeImage(imagePath, options = {}) {
  const {
    quality = JPEG_QUALITY,
    maxWidth = MAX_WIDTH,
    maxHeight = MAX_HEIGHT,
    backup = true,
    autoCleanup = false
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

  // Auto-cleanup backup if requested and optimization was successful
  if (autoCleanup && backupPath && fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
    console.log(`   ✓ Backup cleaned up: ${path.basename(backupPath)}`);
  }

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
  const args = process.argv.slice(2);
  
  // Check for --cleanup-backups flag
  const autoCleanup = args.includes('--cleanup-backups');
  const imagePaths = args.filter(arg => !arg.startsWith('--'));

  if (imagePaths.length === 0) {
    console.error('❌ Error: Please provide at least one image file path');
    console.error('   Usage: npm run optimize:images -- static/images/image1.jpg [image2.jpg ...]');
    console.error('   Example: npm run optimize:images -- static/images/pork-shoulder-broiled.jpg');
    console.error('   Add --cleanup-backups to automatically delete backups after optimization');
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
        backup: true,
        autoCleanup: autoCleanup
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
    
    if (autoCleanup) {
      console.log(`\n🧹 Backups automatically cleaned up`);
    } else {
      console.log(`\n💾 Backups created with .backup extension`);
      console.log(`   You can delete backups after verifying the optimized images look good.`);
      console.log(`   Or use --cleanup-backups flag to auto-delete backups after optimization.`);
    }
  }
}

/**
 * Cleanup existing backup files
 */
function cleanupExistingBackups() {
  const imagesDir = path.join(process.cwd(), 'static', 'images');
  if (!fs.existsSync(imagesDir)) {
    console.log('❌ static/images directory not found');
    return;
  }

  console.log('🧹 Cleaning up backup files...\n');
  
  const backupFiles = [];
  function findBackups(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findBackups(filePath);
      } else if (file.endsWith('.backup')) {
        backupFiles.push(filePath);
      }
    }
  }
  
  findBackups(imagesDir);
  
  if (backupFiles.length === 0) {
    console.log('✅ No backup files found');
    return;
  }
  
  let cleaned = 0;
  for (const backupPath of backupFiles) {
    const originalPath = backupPath.replace('.backup', '');
    
    if (fs.existsSync(originalPath)) {
      const backupStats = fs.statSync(backupPath);
      const originalStats = fs.statSync(originalPath);
      
      // Only delete if original exists and is newer (optimization was successful)
      if (originalStats.mtime > backupStats.mtime) {
        fs.unlinkSync(backupPath);
        console.log(`   ✓ Deleted: ${path.relative(process.cwd(), backupPath)}`);
        cleaned++;
      } else {
        console.log(`   ⚠️  Skipped: ${path.relative(process.cwd(), backupPath)} (original is older, may need review)`);
      }
    } else {
      // Original doesn't exist, delete orphaned backup
      fs.unlinkSync(backupPath);
      console.log(`   ✓ Deleted orphaned backup: ${path.relative(process.cwd(), backupPath)}`);
      cleaned++;
    }
  }
  
  console.log(`\n✨ Cleanup complete! Deleted ${cleaned} backup file(s)`);
}

if (require.main === module) {
  // Check if --cleanup-only flag is present
  if (process.argv.includes('--cleanup-only')) {
    try {
      cleanupExistingBackups();
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    }
  } else {
    main().catch(error => {
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    });
  }
}
