// build/scripts/prebuild.js

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n📦 Pre-build checks...\n'));

// Check manifest.json
const manifestPath = path.join(__dirname, '../../manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(chalk.red('✗ manifest.json not found'));
  process.exit(1);
}

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(chalk.green(`✓ manifest.json valid`));
  console.log(`  Version: ${manifest.version}`);
  console.log(`  Name: ${manifest.name.en}`);
} catch (err) {
  console.error(chalk.red(`✗ Invalid manifest.json: ${err.message}`));
  process.exit(1);
}

// Check required files
const requiredFiles = [
  'src/js/config.js',
  'src/js/desktop.js',
  'src/html/config.html',
  'src/html/desktop.html',
  'src/css/desktop.css',
  'src/css/config.css'
];

const missingFiles = requiredFiles.filter(file => {
  return !fs.existsSync(path.join(__dirname, '../../', file));
});

if (missingFiles.length > 0) {
  console.error(chalk.red(`✗ Missing files:`));
  missingFiles.forEach(file => console.error(`  - ${file}`));
  process.exit(1);
}

console.log(chalk.green(`✓ All required files present`));

// Create dist directory
const distDir = path.join(__dirname, '../../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(chalk.green(`✓ Created dist directory`));
}

console.log(chalk.green.bold('\n✓ Pre-build checks passed!\n'));