#!/usr/bin/env node

/**
 * Spell check content files
 * 
 * Uses cspell to check spelling in markdown content files.
 * By default, only checks modified files (git diff).
 * Pass --all to check all files.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const contentDir = path.join(__dirname, '..', 'content');
const checkAll = process.argv.includes('--all');

console.log('🔍 Running spell check...\n');

function getChangedFiles() {
  try {
    // Get staged and unstaged modified markdown files
    const staged = execSync('git diff --cached --name-only --diff-filter=ACMR', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    }).trim().split('\n').filter(Boolean);
    
    const unstaged = execSync('git diff --name-only --diff-filter=ACMR', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    }).trim().split('\n').filter(Boolean);
    
    const allChanged = [...new Set([...staged, ...unstaged])];
    const mdFiles = allChanged.filter(file => 
      file.endsWith('.md') && 
      file.startsWith('content/') &&
      fs.existsSync(path.join(__dirname, '..', file))
    );
    
    return mdFiles;
  } catch (error) {
    // If git fails or we're not in a git repo, return empty array
    return [];
  }
}

try {
  let filesToCheck;
  let command;
  
  if (checkAll) {
    console.log('Checking all content files...\n');
    command = `npx cspell --no-progress --show-context "${contentDir}/**/*.md"`;
  } else {
    const changedFiles = getChangedFiles();
    
    if (changedFiles.length === 0) {
      console.log('✅ No modified markdown files to check.');
      process.exit(0);
    }
    
    console.log(`Checking ${changedFiles.length} modified file(s):\n`);
    changedFiles.forEach(file => console.log(`  - ${file}`));
    console.log();
    
    // cspell needs file paths relative to cwd or absolute
    const filePaths = changedFiles.map(file => 
      path.join(__dirname, '..', file)
    ).join(' ');
    
    command = `npx cspell --no-progress --show-context ${filePaths}`;
  }
  
  const result = execSync(
    command,
    { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    }
  );
  
  console.log(result);
  console.log('✅ Spell check passed!');
  process.exit(0);
} catch (error) {
  if (error.status === 1) {
    // cspell exits with status 1 when errors are found
    console.error(error.stdout || error.stderr);
    console.error('\n❌ Spell check found errors. Please fix the typos above.');
    console.error('💡 Tip: Add valid words to cspell.json if they are false positives.');
    process.exit(1);
  } else {
    console.error('❌ Error running spell check:', error.message);
    process.exit(1);
  }
}

