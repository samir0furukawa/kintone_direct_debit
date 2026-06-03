#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk');
require('dotenv').config();

console.log(chalk.blue.bold('\n🔐 Signing plugin...\n'));

const pluginFile = path.join(__dirname, '../../dist/kintone-billing-plugin.zip');
const sigFile = path.join(__dirname, '../../dist/kintone-billing-plugin.zip.sig');

if (!fs.existsSync(pluginFile)) {
  console.error(chalk.red('✗ Plugin file not found'));
  process.exit(1);
}

try {
  // Read plugin file
  const fileContent = fs.readFileSync(pluginFile);
  
  // Create signature (using private key if available)
  const privateKey = process.env.PLUGIN_PRIVATE_KEY || '';
  
  if (!privateKey) {
    console.warn(chalk.yellow('⚠ No private key found - skipping signature'));
    console.log(chalk.yellow('  Set PLUGIN_PRIVATE_KEY environment variable to sign'));
    return;
  }
  
  // Sign file
  const sign = crypto.createSign('sha256');
  sign.update(fileContent);
  const signature = sign.sign(privateKey, 'hex');
  
  // Save signature
  fs.writeFileSync(sigFile, signature);
  
  console.log(chalk.green(`✓ Plugin signed`));
  console.log(chalk.green(`✓ Signature: ${sigFile}\n`));
  
} catch (err) {
  console.error(chalk.red(`✗ Signing failed: ${err.message}`));
  process.exit(1);
}