#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const photosDir = path.join(process.cwd(), 'static', 'images', 'nemesis', 'session-photos');
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

if (!fs.existsSync(photosDir)) {
  console.log('No Nemesis session photo directory found yet. Nothing to optimize.');
  process.exit(0);
}

const photoPaths = fs
  .readdirSync(photosDir)
  .filter((file) => allowedExtensions.has(path.extname(file).toLowerCase()))
  .map((file) => path.join('static', 'images', 'nemesis', 'session-photos', file))
  .sort();

if (photoPaths.length === 0) {
  console.log('No Nemesis session photos found. Nothing to optimize.');
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  [path.join('scripts', 'optimize-images.js'), ...photoPaths],
  { stdio: 'inherit', cwd: process.cwd() }
);

process.exit(result.status ?? 1);
