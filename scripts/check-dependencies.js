#!/usr/bin/env node

/**
 * Check all project dependencies for security issues and updates
 * 
 * This script checks:
 * - npm package security vulnerabilities (npm audit)
 * - Outdated npm packages
 * - Node.js version
 * - GitHub Actions versions
 * 
 * Run with: npm run check:dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse version string
function parseVersion(versionString) {
  const match = versionString.match(/v?(\d+)\.(\d+)\.(\d+)/);
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

// Get current Node.js version
function getNodeVersion() {
  try {
    const version = process.version;
    return parseVersion(version);
  } catch (err) {
    return null;
  }
}

// Get latest Node.js LTS version
function getLatestNodeVersion() {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https.get('https://nodejs.org/dist/index.json', {
      headers: {
        'User-Agent': 'Node-Version-Checker'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const releases = JSON.parse(data);
          // Find LTS version
          const lts = releases.find(r => r.lts !== false);
          if (lts) {
            const version = parseVersion(lts.version);
            resolve({
              ...version,
              lts: lts.lts,
              date: lts.date
            });
          } else {
            // Fallback to latest
            const latest = releases[0];
            const version = parseVersion(latest.version);
            resolve({
              ...version,
              lts: false,
              date: latest.date
            });
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Run npm audit
function runNpmAudit() {
  try {
    const output = execSync('npm audit --json', { encoding: 'utf-8', stdio: 'pipe' });
    return JSON.parse(output);
  } catch (err) {
    // npm audit returns non-zero exit code if vulnerabilities found
    try {
      const output = err.stdout || err.stderr || '';
      return JSON.parse(output);
    } catch (parseErr) {
      return { error: 'Could not parse npm audit output' };
    }
  }
}

// Get outdated packages
function getOutdatedPackages() {
  try {
    const output = execSync('npm outdated --json', { encoding: 'utf-8', stdio: 'pipe' });
    return JSON.parse(output);
  } catch (err) {
    // npm outdated returns non-zero if packages are outdated
    try {
      const output = err.stdout || err.stderr || '';
      if (output.trim()) {
        return JSON.parse(output);
      }
      return {};
    } catch (parseErr) {
      return {};
    }
  }
}

// Check GitHub Actions versions
function checkGitHubActions() {
  const workflowsDir = path.join(__dirname, '..', '.github', 'workflows');
  const actions = [];
  
  if (!fs.existsSync(workflowsDir)) {
    return actions;
  }
  
  const workflowFiles = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  
  for (const file of workflowFiles) {
    const content = fs.readFileSync(path.join(workflowsDir, file), 'utf-8');
    // Match action references like actions/checkout@v4
    const actionMatches = content.matchAll(/uses:\s*([^\s@]+)@([^\s\n]+)/g);
    
    for (const match of actionMatches) {
      const action = match[1];
      const version = match[2];
      actions.push({
        action,
        version,
        file
      });
    }
  }
  
  return actions;
}

// Get package.json dependencies
function getDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  return {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    engines: packageJson.engines || {}
  };
}

async function main() {
  const jsonOutput = process.argv.includes('--json');
  
  if (!jsonOutput) {
    console.log('🔍 Checking project dependencies and security...\n');
  }
  
  const results = {
    timestamp: new Date().toISOString(),
    node: {},
    npm: {},
    githubActions: [],
    summary: {
      hasSecurityIssues: false,
      hasUpdates: false,
      criticalIssues: 0,
      highIssues: 0,
      moderateIssues: 0,
      lowIssues: 0,
      outdatedCount: 0
    }
  };
  
  try {
    // Check Node.js version
    const currentNode = getNodeVersion();
    if (currentNode) {
      results.node.current = currentNode.full;
      
      if (!jsonOutput) {
        console.log(`📦 Node.js version: v${currentNode.full}`);
      }
      
      try {
        const latestNode = await getLatestNodeVersion();
        results.node.latest = latestNode.full;
        results.node.lts = latestNode.lts;
        results.node.updateAvailable = (
          currentNode.major < latestNode.major ||
          (currentNode.major === latestNode.major && currentNode.minor < latestNode.minor)
        );
        
        if (!jsonOutput) {
          if (results.node.updateAvailable) {
            console.log(`   Latest LTS: v${latestNode.full} (${latestNode.lts || 'Current'})`);
            console.log(`   ⚠️  Update available`);
          } else {
            console.log(`   ✅ Up to date`);
          }
        }
      } catch (err) {
        if (!jsonOutput) {
          console.log(`   ⚠️  Could not check latest version: ${err.message}`);
        }
      }
    }
    
    if (!jsonOutput) {
      console.log('');
    }
    
    // Check npm audit
    if (!jsonOutput) {
      console.log('🔒 Running npm audit...');
    }
    const audit = runNpmAudit();
    
    if (audit.metadata) {
      results.npm.audit = {
        vulnerabilities: audit.metadata.vulnerabilities || {},
        totalVulnerabilities: audit.metadata.vulnerabilities?.total || 0,
        critical: audit.metadata.vulnerabilities?.critical || 0,
        high: audit.metadata.vulnerabilities?.high || 0,
        moderate: audit.metadata.vulnerabilities?.moderate || 0,
        low: audit.metadata.vulnerabilities?.low || 0,
        info: audit.metadata.vulnerabilities?.info || 0
      };
      
      results.summary.hasSecurityIssues = results.npm.audit.totalVulnerabilities > 0;
      results.summary.criticalIssues = results.npm.audit.critical;
      results.summary.highIssues = results.npm.audit.high;
      results.summary.moderateIssues = results.npm.audit.moderate;
      results.summary.lowIssues = results.npm.audit.low;
      
      if (!jsonOutput) {
        if (results.npm.audit.totalVulnerabilities > 0) {
          console.log(`   ⚠️  Found ${results.npm.audit.totalVulnerabilities} vulnerabilities:`);
          if (results.npm.audit.critical > 0) {
            console.log(`      🚨 Critical: ${results.npm.audit.critical}`);
          }
          if (results.npm.audit.high > 0) {
            console.log(`      ⚠️  High: ${results.npm.audit.high}`);
          }
          if (results.npm.audit.moderate > 0) {
            console.log(`      ⚠️  Moderate: ${results.npm.audit.moderate}`);
          }
          if (results.npm.audit.low > 0) {
            console.log(`      ℹ️  Low: ${results.npm.audit.low}`);
          }
          console.log(`   Run 'npm audit fix' to attempt automatic fixes`);
        } else {
          console.log(`   ✅ No known vulnerabilities`);
        }
      }
    } else if (audit.error) {
      results.npm.audit = { error: audit.error };
      if (!jsonOutput) {
        console.log(`   ⚠️  Could not run audit: ${audit.error}`);
      }
    }
    
    if (!jsonOutput) {
      console.log('');
    }
    
    // Check outdated packages
    if (!jsonOutput) {
      console.log('📊 Checking for outdated packages...');
    }
    const outdated = getOutdatedPackages();
    
    if (Object.keys(outdated).length > 0) {
      results.npm.outdated = outdated;
      results.summary.hasUpdates = true;
      results.summary.outdatedCount = Object.keys(outdated).length;
      
      if (!jsonOutput) {
        console.log(`   ⚠️  Found ${Object.keys(outdated).length} outdated package(s):`);
        for (const [pkg, info] of Object.entries(outdated)) {
          console.log(`      ${pkg}: ${info.current} → ${info.wanted || info.latest}`);
        }
        console.log(`   Run 'npm update' to update packages`);
      }
    } else {
      if (!jsonOutput) {
        console.log(`   ✅ All packages up to date`);
      }
    }
    
    if (!jsonOutput) {
      console.log('');
    }
    
    // Check GitHub Actions
    if (!jsonOutput) {
      console.log('🔄 Checking GitHub Actions...');
    }
    const actions = checkGitHubActions();
    results.githubActions = actions;
    
    if (actions.length > 0) {
      if (!jsonOutput) {
        console.log(`   Found ${actions.length} action(s) in workflows:`);
        const uniqueActions = new Map();
        for (const action of actions) {
          const key = `${action.action}@${action.version}`;
          if (!uniqueActions.has(key)) {
            uniqueActions.set(key, action);
            console.log(`      ${action.action}@${action.version}`);
          }
        }
        console.log(`   💡 Check GitHub Actions marketplace for updates`);
      }
    } else {
      if (!jsonOutput) {
        console.log(`   ℹ️  No GitHub Actions workflows found`);
      }
    }
    
    // Get dependency list
    const deps = getDependencies();
    results.dependencies = deps;
    
    if (!jsonOutput) {
      console.log('\n📋 Summary:');
      if (results.summary.hasSecurityIssues) {
        console.log(`   🚨 Security issues found: ${results.summary.criticalIssues} critical, ${results.summary.highIssues} high`);
      } else {
        console.log(`   ✅ No security issues`);
      }
      if (results.summary.hasUpdates) {
        console.log(`   💡 Updates available: ${results.summary.outdatedCount} package(s)`);
      } else {
        console.log(`   ✅ All packages up to date`);
      }
      if (results.node.updateAvailable) {
        console.log(`   💡 Node.js update available: v${results.node.current} → v${results.node.latest}`);
      }
      
      console.log('\n💡 Recommendations:');
      if (results.summary.hasSecurityIssues) {
        console.log('   1. Run: npm audit fix');
        console.log('   2. Review and test changes');
        console.log('   3. Run: npm test');
      }
      if (results.summary.hasUpdates) {
        console.log('   1. Review outdated packages: npm outdated');
        console.log('   2. Update selectively: npm install package@latest');
        console.log('   3. Test after updates: npm test');
      }
      console.log('\n   Run this check monthly: npm run check:dependencies');
    }
    
    // Output JSON if requested
    if (jsonOutput) {
      console.log(JSON.stringify(results, null, 2));
    }
    
    // Exit with error code if security issues found
    if (results.summary.hasSecurityIssues && (results.summary.criticalIssues > 0 || results.summary.highIssues > 0)) {
      process.exit(1);
    }
    
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
