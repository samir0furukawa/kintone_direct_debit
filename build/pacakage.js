#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n📦 Packaging plugin...\n'));

const distDir = path.join(__dirname, '../dist');
const outputFile = path.join(__dirname, '../dist/kintone-billing-plugin.zip');
const packageDir = path.join(distDir, 'package');

// Clean previous package
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
  console.log(chalk.gray('  Removed previous package'));
}

// Create package directory structure
if (fs.existsSync(packageDir)) {
  fs.rmSync(packageDir, { recursive: true });
}
fs.mkdirSync(packageDir, { recursive: true });

// Copy all files to package directory
const filesToPackage = [
  'manifest.json',
  { src: 'js', dst: 'js' },
  { src: 'css', dst: 'css' },
  { src: 'html', dst: 'html' },
  { src: 'image', dst: 'image' },
  'README.md'
];

filesToPackage.forEach(item => {
  if (typeof item === 'string') {
    const src = path.join(distDir, item);
    const dst = path.join(packageDir, item);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  } else {
    const src = path.join(distDir, item.src);
    const dst = path.join(packageDir, item.dst);
    if (fs.existsSync(src)) {
      copyDir(src, dst);
    }
  }
});

// Create ZIP file
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  const sizeKB = (archive.pointer() / 1024).toFixed(2);
  console.log(chalk.green(`✓ Plugin packaged: ${sizeKB} KB`));
  console.log(chalk.green(`✓ Output: ${outputFile}\n`));
  
  // Clean temp package dir
  fs.rmSync(packageDir, { recursive: true });
});

archive.on('error', (err) => {
  console.error(chalk.red(`✗ Archive error: ${err.message}`));
  process.exit(1);
});

archive.pipe(output);

// Add all files from package directory
archive.directory(packageDir + '/', false);

archive.finalize();

function copyDir(src, dst) {
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }
  
  fs.readdirSync(src).forEach(file => {
    const srcFile = path.join(src, file);
    const dstFile = path.join(dst, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      copyDir(srcFile, dstFile);
    } else {
      fs.copyFileSync(srcFile, dstFile);
    }
  });
}