/**
 * Elite Test Runner
 * 
 * Comprehensive test runner for the Nationwide Toll Hub system
 * that executes tests across all services and applications.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  services: [
    'services/auth',
    'services/event-processor', 
    'services/database'
  ],
  packages: [
    'packages/shared',
    'packages/connectors'
  ],
  apps: [
    'apps/web'
  ]
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd) {
  try {
    log(`\n${colors.bold}Running: ${command}${colors.reset}`, 'blue');
    log(`Directory: ${cwd}`, 'yellow');
    
    const output = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    log(`✅ Success`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ Failed: ${error.message}`, 'red');
    return { success: false, error: error.message, output: error.stdout };
  }
}

function checkPackageJson(dir) {
  const packagePath = path.join(dir, 'package.json');
  return fs.existsSync(packagePath);
}

function installDependencies(dir) {
  log(`\n${colors.bold}Installing dependencies for ${dir}${colors.reset}`, 'blue');
  
  if (!checkPackageJson(dir)) {
    log(`⚠️  No package.json found in ${dir}`, 'yellow');
    return { success: true };
  }
  
  return runCommand('npm install --legacy-peer-deps', dir);
}

function runTests(dir) {
  log(`\n${colors.bold}Running tests for ${dir}${colors.reset}`, 'blue');
  
  if (!checkPackageJson(dir)) {
    log(`⚠️  No package.json found in ${dir}`, 'yellow');
    return { success: true };
  }
  
  // Check if test script exists
  const packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  if (!packageJson.scripts || !packageJson.scripts.test) {
    log(`⚠️  No test script found in ${dir}`, 'yellow');
    return { success: true };
  }
  
  return runCommand('npm test', dir);
}

async function main() {
  log(`${colors.bold}🚀 Nationwide Toll Hub Test Suite${colors.reset}`, 'blue');
  log('=' * 50, 'blue');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Test services
  log(`\n${colors.bold}📦 Testing Backend Services${colors.reset}`, 'blue');
  for (const service of testConfig.services) {
    results.total++;
    
    const installResult = installDependencies(service);
    if (!installResult.success) {
      log(`❌ Failed to install dependencies for ${service}`, 'red');
      results.failed++;
      continue;
    }
    
    const testResult = runTests(service);
    if (testResult.success) {
      log(`✅ Tests passed for ${service}`, 'green');
      results.passed++;
    } else {
      log(`❌ Tests failed for ${service}`, 'red');
      results.failed++;
    }
  }
  
  // Test packages
  log(`\n${colors.bold}📚 Testing Shared Packages${colors.reset}`, 'blue');
  for (const pkg of testConfig.packages) {
    results.total++;
    
    const installResult = installDependencies(pkg);
    if (!installResult.success) {
      log(`❌ Failed to install dependencies for ${pkg}`, 'red');
      results.failed++;
      continue;
    }
    
    const testResult = runTests(pkg);
    if (testResult.success) {
      log(`✅ Tests passed for ${pkg}`, 'green');
      results.passed++;
    } else {
      log(`❌ Tests failed for ${pkg}`, 'red');
      results.failed++;
    }
  }
  
  // Test web app
  log(`\n${colors.bold}🌐 Testing Web Application${colors.reset}`, 'blue');
  for (const app of testConfig.apps) {
    results.total++;
    
    const installResult = installDependencies(app);
    if (!installResult.success) {
      log(`❌ Failed to install dependencies for ${app}`, 'red');
      results.failed++;
      continue;
    }
    
    const testResult = runTests(app);
    if (testResult.success) {
      log(`✅ Tests passed for ${app}`, 'green');
      results.passed++;
    } else {
      log(`❌ Tests failed for ${app}`, 'red');
      results.failed++;
    }
  }
  
  // Summary
  log(`\n${colors.bold}📊 Test Summary${colors.reset}`, 'blue');
  log('=' * 30, 'blue');
  log(`Total: ${results.total}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Skipped: ${results.skipped}`, 'yellow');
  
  if (results.failed === 0) {
    log(`\n🎉 All tests passed!`, 'green');
    process.exit(0);
  } else {
    log(`\n💥 ${results.failed} test(s) failed!`, 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
