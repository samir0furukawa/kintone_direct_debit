
---

```markdown
<!-- docs/CONFIGURATION.md -->

# Configuration Guide

## Overview

All configuration is done through the plugin's **Configure** tab. No code changes needed.

## Configuration Sections

### 1. General Settings

**Location:** Dashboard tab → Settings

#### Plugin Version
- Read-only display of current version
- Current: 2.0.0

#### Module Toggles

| Setting | Default | Purpose |
|---------|---------|---------|
| Enable Import Module | ✓ On | Allow CSV imports |
| Enable Export Module | ✓ On | Allow data exports |
| Enable Calendar UI | ✓ On | Show business day calendar |
| Auto-lock Records | ✓ On | Lock records after export |

#### Processing Settings

**Batch Size**
- Range: 10-500 records
- Default: 100
- Purpose: How many records per API call
- Recommendation: Leave at 100 (API limit)

**Default Export Format**
- Options: Excel (.xlsx) or CSV (.csv)
- Default: Excel (.xlsx)
- Purpose: Format when exporting

**Target View ID**
- Default: 15929930
- Purpose: Which view displays the plugin
- Format: Numeric ID only

### 2. App IDs Configuration

**Location:** Configure tab → App IDs

All app IDs are **environment-specific** and can be different per installation.

#### Import Source Apps

**CSV Import App**
- Purpose: Stores imported CSV data
- Required: Yes
- Example: 720

#### Processing Apps

**Bank Export App (請求)**
- Purpose: Contains billing data for bank transfer
- Required: Yes
- Example: 722

**Bank Results App (結果取込)**
- Purpose: Receives bank processing results
- Required: Yes
- Example: 724

**Company Master App**
- Purpose: Master data for company codes and info
- Required: Yes
- Example: 721

**SEQ Mapping App**
- Purpose: Maps SEQ to company codes
- Required: Yes
- Example: 720 (can be same as CSV Import)

#### Output Apps

**Full Results App**
- Purpose: All aggregated results
- Required: Yes
- Example: 725

**Filtered Results App**
- Purpose: Only successful results (result == "0")
- Required: Yes
- Example: 726

**Summary App** (Optional)
- Purpose: Export operation summaries
- Required: No
- Example: 723

### 3. Field Codes Configuration

**Location:** Configure tab → Fields

Map Kintone field codes to plugin field names.

#### Billing/Banking Fields

| Plugin Field | Kintone Code | Type | Required |
|--------------|--------------|------|----------|
| Bill Date | bill_date | Date | Yes |
| Bill Amount | bill_amount | Number | Yes |
| Bank Code | bank_code | Text | Yes |
| Bank Name | bank_name | Text | No |
| Branch Code | branch_code | Text | Yes |
| Branch Name | branch_name | Text | No |
| Account Type | account_type | Text | No |
| Account Number | account_no | Text | Yes |
| Customer Name | customer_name | Text | No |

#### Company/Master Fields

| Plugin Field | Kintone Code | Type | Required |
|--------------|--------------|------|----------|
| Company Code | company_code | Text | Yes |
| Company Name | company_name | Text | Yes |
| LV Code | LVcode | Text | No |
| SEQ | seq | Number | Yes |
| Transfer Type | transfer_type | Text | No |

#### Result/Status Fields

| Plugin Field | Kintone Code | Type | Required |
|--------------|--------------|------|----------|
| Result | result | Text | No |
| Data Lock | data_lock | Checkbox | Yes |

#### Export Exclusion Fields

Comma-separated field codes to exclude from exports.

Default excludes:
- `$id` - Record ID
- `$revision` - Revision number
- `レコード番号` - Record number
- `更新者` - Last modified by
- `作成者` - Created by
- `data_lock` - Lock field
- `bank_name` - Bank name

### 4. Bank Format Configuration

**Location:** Configure tab → Bank

All bank details are **environment-specific variables**.

#### Header Record Settings

**Bank Code** (4 digits)
- Example: 0001
- Purpose: Bank identifier
- Format: Numeric

**Bank Name** (Katakana, 15 chars)
- Example: ミズホ
- Purpose: Bank name in Katakana
- Format: Katakana only

**Branch Code** (3 digits)
- Example: 125
- Purpose: Branch identifier
- Format: Numeric

**Branch Name** (Katakana, 15 chars)
- Example: ギンザチユウオウ
- Purpose: Branch name in Katakana
- Format: Katakana only

**Company Use Code** (10 digits)
- Example: 0000000000
- Purpose: Company identifier for bank
- Format: Numeric

**Company Name** (Katakana, 40 chars)
- Example: ヤブシキカイシャ
- Purpose: Company name in Katakana
- Format: Katakana only

**Account Type Code**
- Options: 1, 2, 3, 9
- 1 = Normal (普通)
- 2 = Checking (当座)
- 3 = Tax Reserve (納税準備)
- 9 = Other (その他)

**Bank Account Number** (7 digits)
- Example: 0000000
- Purpose: Bank account identifier
- Format: Numeric

#### CSV Import Settings

**CSV Encoding**
- Options: UTF-8, Shift_JIS, EUC-JP
- Default: Shift_JIS
- Purpose: How to read CSV files

**CSV Line Delimiter**
- Options: Auto-detect, LF, CRLF, CR
- Default: Auto-detect
- Purpose: Line ending format

**Transfer Type Value**
- Example: 口座振替
- Purpose: Required transfer type code
- Default: 口座振替

### 5. Holidays Configuration

**Location:** Configure tab → Holidays

#### Holiday Source

**Option 1: Fetch from API** (Recommended)
- Automatically updates holidays annually
- URL: https://holidays-jp.github.io/api/v1/date.json
- Auto-refresh: Daily/Weekly

**Option 2: Manual List**
- Enter holidays manually
- Format: YYYY-MM-DD, one per line
- Example:2026-01-01
2026-01-13
2026-02-11

#### Working Day Configuration

**Exclude Weekends**
- Default: ✓ On
- Purpose: Saturday & Sunday marked as non-working

## Best Practices

### App ID Assignment

1. Run **Full Setup** first (auto-creates apps)
2. Note the generated App IDs
3. Use these IDs in configuration
4. Never change IDs once configured

### Field Code Mapping

1. Check your app's actual field codes
2. Match exactly (case-sensitive)
3. Test one field at a time
4. Save and verify after each change

### Bank Details

1. Get correct values from your bank
2. Verify Katakana characters are correct
3. Test export before production use
4. Keep backup of original values

### Holidays

1. Use API method if possible
2. Test holiday exclusion in calendar
3. Update annually if using manual list
4. Verify excluded dates in exports

## Validation

After configuring, click **✓ Validate Config** to check:
- All app IDs are valid
- Field codes exist in apps
- Bank format is correct
- No required settings are missing

## Reset Configuration

Click **🔄 Reset to Defaults** to:
- Revert all changes
- Keep auto-created apps
- Start configuration over

**Note:** Cannot be undone easily, so use with caution.

## Common Configuration Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions.