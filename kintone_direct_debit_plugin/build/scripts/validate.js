#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n✓ Validating plugin structure...\n'));

const distDir = path.join(__dirname, '../../dist');
const requiredFiles = [
  'manifest.json',
  'html/config.html',
  'html/desktop.html',
  'css/config.css',
  'css/desktop.css',
  'js/config.js',
  'js/desktop.js',
  'README.md'
];

const errors = [];
const warnings = [];

requiredFiles.forEach(file => {
  const fullPath = path.join(distDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing: ${file}`);
  } else {
    const size = fs.statSync(fullPath).size;
    if (size === 0) {
      warnings.push(`Empty file: ${file}`);
    } else {
      console.log(chalk.green(`✓ ${file} (${formatBytes(size)})`));
    }
  }
});

if (warnings.length > 0) {
  console.log(chalk.yellow('\n⚠ Warnings:'));
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.log(chalk.red('\n✗ Errors:'));
  errors.forEach(e => console.log(`  ${e}`));
  process.exit(1);
}

// Validate manifest
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8')
  );
  
  // Check required fields
  const requiredFields = ['manifest_version', 'version', 'name', 'desktop'];
  const missingFields = requiredFields.filter(f => !(f in manifest));
  
  if (missingFields.length > 0) {
    console.error(chalk.red(`✗ Invalid manifest - missing: ${missingFields.join(', ')}`));
    process.exit(1);
  }
  
  console.log(chalk.green('\n✓ Manifest validation passed'));
  console.log(`  Version: ${manifest.version}`);
  
} catch (err) {
  console.error(chalk.red(`✗ Manifest JSON error: ${err.message}`));
  process.exit(1);
}

console.log(chalk.green.bold('\n✓ All validations passed!\n'));

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}