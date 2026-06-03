#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n📦 Pre-build checks...\n');

const manifestPath = path.join(__dirname, '../../manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('✗ manifest.json not found');
  process.exit(1);
}

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('✓ manifest.json valid');
  console.log(`  Version: ${manifest.version}`);
  console.log(`  Name: ${manifest.name.en}`);
} catch (err) {
  console.error(`✗ Invalid manifest.json: ${err.message}`);
  process.exit(1);
}

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
  console.error('✗ Missing files:');
  missingFiles.forEach(file => console.error(`  - ${file}`));
  process.exit(1);
}

console.log('✓ All required files present');

const distDir = path.join(__dirname, '../../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✓ Created dist directory');
}

console.log('\n✓ Pre-build checks passed!\n');
