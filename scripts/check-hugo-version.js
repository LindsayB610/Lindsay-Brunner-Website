#!/usr/bin/env node

/**
 * Check Hugo version and security status
 * 
 * This script checks:
 * - Current Hugo version (via hugo-bin)
 * - Available updates
 * - Known security vulnerabilities
 * 
 * Run with: npm run check:hugo
 */

const { execSync } = require('child_process');
const https = require('https');

// Known security vulnerabilities and their fixes
const SECURITY_FIXES = {
  'CVE-2024-32875': {
    description: 'XSS vulnerability in title arguments (render hooks)',
    fixedIn: '0.125.3',
    severity: 'high'
  },
  'CVE-2024-55601': {
    description: 'HTML escaping issues in internal templates',
    fixedIn: '0.139.4',
    severity: 'high'
  }
};

// Parse version string like "hugo v0.152.2-6abdacad..."
function parseHugoVersion(versionString) {
  const match = versionString.match(/hugo v(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    full: `${match[1]}.${match[2]}.${match[3]}`
  };
}

// Compare two version objects
function compareVersions(v1, v2) {
  if (v1.major !== v2.major) return v1.major - v2.major;
  if (v1.minor !== v2.minor) return v1.minor - v2.minor;
  return v1.patch - v2.patch;
}

// Check if version is >= required version
function isVersionAtLeast(current, required) {
  return compareVersions(current, required) >= 0;
}

// Get latest Hugo version from GitHub releases
function getLatestHugoVersion() {
  return new Promise((resolve, reject) => {
    https.get('https://api.github.com/repos/gohugoio/hugo/releases/latest', {
      headers: {
        'User-Agent': 'Hugo-Version-Checker'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          const version = release.tag_name.replace(/^v/, '');
          const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
          if (match) {
            resolve({
              major: parseInt(match[1], 10),
              minor: parseInt(match[2], 10),
              patch: parseInt(match[3], 10),
              full: version,
              url: release.html_url
            });
          } else {
            reject(new Error('Could not parse version from GitHub API'));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Check security status
function checkSecurityStatus(currentVersion) {
  const issues = [];
  
  for (const [cve, info] of Object.entries(SECURITY_FIXES)) {
    const requiredVersion = parseHugoVersion(`hugo v${info.fixedIn}`);
    if (!isVersionAtLeast(currentVersion, requiredVersion)) {
      issues.push({
        cve,
        description: info.description,
        fixedIn: info.fixedIn,
        severity: info.severity
      });
    }
  }
  
  return issues;
}

async function main() {
  const jsonOutput = process.argv.includes('--json');
  
  if (!jsonOutput) {
    console.log('🔍 Checking Hugo version status...\n');
  }
  
  try {
    // Get current version
    let hugoVersionOutput;
    try {
      hugoVersionOutput = execSync('npx hugo version', { encoding: 'utf-8', stdio: 'pipe' });
    } catch (err) {
      // npx hugo might not be available or might fail
      const errorMsg = err.message || 'Could not run npx hugo version';
      if (jsonOutput) {
        console.log(JSON.stringify({ error: errorMsg, details: err.stdout || err.stderr }, null, 2));
      } else {
        console.error(`❌ Error running Hugo: ${errorMsg}`);
      }
      process.exit(1);
    }
    
    const currentVersion = parseHugoVersion(hugoVersionOutput.trim());
    
    if (!currentVersion) {
      if (jsonOutput) {
        console.log(JSON.stringify({ error: 'Could not parse Hugo version', output: hugoVersionOutput }, null, 2));
      } else {
        console.error('❌ Could not parse Hugo version');
        console.error(`Raw output: ${hugoVersionOutput}`);
      }
      process.exit(1);
    }
    
    if (!jsonOutput) {
      console.log(`📦 Current Hugo version: v${currentVersion.full}`);
    }
    
    // Check security status
    const securityIssues = checkSecurityStatus(currentVersion);
    
    if (!jsonOutput) {
      if (securityIssues.length > 0) {
        console.log('\n⚠️  SECURITY ISSUES FOUND:');
        securityIssues.forEach(issue => {
          console.log(`   ${issue.cve} (${issue.severity}): ${issue.description}`);
          console.log(`   Fixed in: v${issue.fixedIn}`);
        });
        console.log('\n🚨 ACTION REQUIRED: Update Hugo immediately!');
      } else {
        console.log('✅ No known security vulnerabilities');
      }
    }
    
    // Check for latest version
    let latestVersion = null;
    let updateAvailable = false;
    let versionBehind = null;
    
    try {
      if (!jsonOutput) {
        console.log('\n🔎 Checking for latest version...');
      }
      latestVersion = await getLatestHugoVersion();
      
      if (!jsonOutput) {
        console.log(`📦 Latest Hugo version: v${latestVersion.full}`);
      }
      
      if (compareVersions(currentVersion, latestVersion) < 0) {
        updateAvailable = true;
        const isMajorBehind = currentVersion.major < latestVersion.major;
        const isMinorBehind = currentVersion.minor < latestVersion.minor;
        
        if (isMajorBehind) {
          versionBehind = {
            type: 'major',
            count: latestVersion.major - currentVersion.major
          };
        } else if (isMinorBehind) {
          versionBehind = {
            type: 'minor',
            count: latestVersion.minor - currentVersion.minor
          };
        } else {
          versionBehind = {
            type: 'patch',
            count: latestVersion.patch - currentVersion.patch
          };
        }
        
        if (!jsonOutput) {
          console.log(`\n📊 Version comparison:`);
          console.log(`   Current: v${currentVersion.full}`);
          console.log(`   Latest:  v${latestVersion.full}`);
          
          if (versionBehind.type === 'major') {
            console.log(`\n⚠️  You are ${versionBehind.count} major version(s) behind`);
          } else if (versionBehind.type === 'minor') {
            console.log(`\n💡 You are ${versionBehind.count} minor version(s) behind`);
          } else {
            console.log(`\n💡 You are ${versionBehind.count} patch version(s) behind`);
          }
          
          console.log(`\n🔗 Release notes: ${latestVersion.url}`);
          console.log(`\n💡 To update:`);
          console.log(`   1. Check hugo-bin package for updates: npm outdated hugo-bin`);
          console.log(`   2. Update if available: npm install hugo-bin@latest`);
          console.log(`   3. Test your site: npm run build && npm test`);
        }
      } else {
        if (!jsonOutput) {
          console.log('\n✅ You are on the latest version!');
        }
      }
    } catch (err) {
      if (!jsonOutput) {
        console.log(`\n⚠️  Could not check latest version (network error): ${err.message}`);
        console.log('   You can manually check: https://github.com/gohugoio/hugo/releases/latest');
      }
    }
    
    // Check hugo-bin package version
    let hugoBinVersion = null;
    try {
      const path = require('path');
      const fs = require('fs');
      const packageJsonPath = path.join(__dirname, '..', 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        hugoBinVersion = packageJson.dependencies && packageJson.dependencies['hugo-bin'];
        if (!jsonOutput && hugoBinVersion) {
          console.log(`\n📦 hugo-bin package: ${hugoBinVersion}`);
        }
      }
    } catch (err) {
      // Ignore - not critical
    }
    
    if (!jsonOutput) {
      console.log('\n💡 Recommendation: Check Hugo version monthly or when security advisories are published');
      console.log('   Run this script with: npm run check:hugo');
    }
    
    // Output JSON if requested
    if (jsonOutput) {
      const result = {
        currentVersion: currentVersion.full,
        securityIssues: securityIssues,
        hasSecurityIssues: securityIssues.length > 0,
        latestVersion: latestVersion ? latestVersion.full : null,
        updateAvailable: updateAvailable,
        versionBehind: versionBehind,
        hugoBinVersion: hugoBinVersion,
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(result, null, 2));
    }
    
    // Don't exit with error code - let the workflow handle it
    // Security issues are reported in the JSON output
    
  } catch (error) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: error.message }, null, 2));
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

main();
