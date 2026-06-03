// build/scripts/postbuild.js

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n🔧 Post-build processing...\n'));

const srcDir = path.join(__dirname, '../../src');
const distDir = path.join(__dirname, '../../dist');

// Copy HTML files
const htmlFiles = ['config.html', 'desktop.html'];
htmlFiles.forEach(file => {
  const src = path.join(srcDir, 'html', file);
  const dst = path.join(distDir, 'html', file);
  
  const dstDir = path.dirname(dst);
  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }
  
  fs.copyFileSync(src, dst);
  console.log(chalk.green(`✓ Copied ${file}`));
});

// Copy CSS files
const cssFiles = ['config.css', 'desktop.css', 'common.css'];
cssFiles.forEach(file => {
  const src = path.join(srcDir, 'css', file);
  const dst = path.join(distDir, 'css', file);
  
  if (!fs.existsSync(src)) return;
  
  const dstDir = path.dirname(dst);
  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }
  
  fs.copyFileSync(src, dst);
  console.log(chalk.green(`✓ Copied ${file}`));
});

// Copy manifest
const manifestSrc = path.join(__dirname, '../../manifest.json');
const manifestDst = path.join(distDir, 'manifest.json');
fs.copyFileSync(manifestSrc, manifestDst);
console.log(chalk.green(`✓ Copied manifest.json`));

// Copy README
const readmeSrc = path.join(__dirname, '../../README.md');
const readmeDst = path.join(distDir, 'README.md');
if (fs.existsSync(readmeSrc)) {
  fs.copyFileSync(readmeSrc, readmeDst);
  console.log(chalk.green(`✓ Copied README.md`));
}

// Copy icon if exists
const iconSrc = path.join(srcDir, 'image', 'icon.png');
const iconDst = path.join(distDir, 'image', 'icon.png');
if (fs.existsSync(iconSrc)) {
  const iconDir = path.dirname(iconDst);
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }
  fs.copyFileSync(iconSrc, iconDst);
  console.log(chalk.green(`✓ Copied icon.png`));
}

console.log(chalk.green.bold('\n✓ Post-build processing complete!\n'));