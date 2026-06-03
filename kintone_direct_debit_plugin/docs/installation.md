# Installation Guide

## Prerequisites

- Kintone domain (Free or paid)
- Admin access to manage apps and plugins
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js v14+ (for building from source)

## Download Options

### Option 1: Download Pre-built Plugin (Easiest)

1. Go to [GitHub Releases](https://github.com/samir0furukawa/kintone_direct_debit/releases)
2. Download `kintone-billing-plugin.zip`
3. Skip to Step 2: Install in Kintone

### Option 2: Build from Source

```bash
git clone https://github.com/samir0furukawa/kintone_direct_debit.git
cd kintone_direct_debit
npm install
npm run release