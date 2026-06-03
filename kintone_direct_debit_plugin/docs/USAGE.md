<!-- docs/USAGE.md -->

# Usage Guide

## Overview

The plugin provides 5 main features:

1. **Dashboard** - System status and quick actions
2. **Create Apps** - Auto-generate required applications
3. **Configure** - Set up parameters
4. **Operations** - Run import/export operations
5. **Logs** - View activity history

## Dashboard

### Status Cards

**Apps Status**
- Shows all connected apps
- Green = Active
- Yellow = Missing
- Red = Error

**Configuration**
- Current setup status
- Number of apps created

**Quick Actions**
- 🚀 Run Full Setup
- ✓ Validate Config
- 🔄 Reset All

**Statistics**
- Total records in system
- Last import date
- Locked records count

### Recent Activity

Shows last 20 operations:
- Timestamp
- Operation type
- Status (success/error)
- Details

## Create Apps

**One-click app creation:**

1. Click **Create Apps** tab
2. Review 6 app templates
3. (Optional) Select dedicated space
4. Click **✨ Create All Apps Now**
5. Wait for completion
6. Note the App IDs shown

**What gets created:**
1. CSV Import Storage
2. Bank Export Preparation
3. Bank Processing Results
4. Company Master Data
5. Complete Results
6. Successful Results

## Configure

Set all your parameters here. See [CONFIGURATION.md](./CONFIGURATION.md) for details.

### Tabs

- **General** - Module settings, batch size
- **App IDs** - Which apps to use
- **Fields** - Field code mappings
- **Bank** - Bank-specific details
- **Holidays** - Holiday dates
- **Advanced** - Performance settings

### Saving

Click **✓ Save Configuration** to store all changes.

## Operations

### 📥 Import CSV Data

Import billing data from CSV file:

1. Click **Select CSV File**
2. Choose CSV from computer
3. Progress bar shows upload status
4. Completion message appears

**CSV Requirements:**
- Format: UTF-8 or Shift_JIS
- Headers in first row
- One record per line

### 🏦 Export to Bank Format

Generate bank transfer file:

1. Select format (TXT or CSV)
2. Click **Export Bank File**
3. File downloads automatically
4. Records auto-lock (if enabled)

**Output Format:**
- TXT: Fixed-length (120 chars per line)
- CSV: Comma-separated values

### 📤 Import Bank Results

Import bank processing results:

1. Click **Select Results File**
2. Choose TXT/CSV file
3. Plugin parses results
4. Records update automatically

### 🔄 Aggregate & Distribute

Run data joining and distribution:

1. Click **Start Aggregation**
2. Plugin joins data from multiple apps
3. Distributes to result apps
4. Completion message appears

### 📊 Export Results

Download results as CSV or Excel:

1. Select source app (Full/Successful)
2. Select format (Excel/CSV)
3. Click **Export Results**
4. File downloads automatically

### 🔒 Lock Management

Lock or unlock records:

**Lock All**
- Prevents accidental editing
- Click to lock all records

**Unlock All**
- Removes lock protection
- Click to unlock all records

## Calendar UI

If enabled, date picker shows:

- Business days only
- Weekends excluded
- Holidays excluded
- Easy selection interface

**How to use:**
1. Click on date field
2. Click "📅 日付選択" button
3. Select date from calendar
4. Click "✅ 確定" to confirm

## Logs

View all operations:

**Available actions:**
- Clear Logs - Remove all entries
- Download Logs - Save as JSON
- Refresh - Update display

**Log entries show:**
- Timestamp
- Operation type
- Status
- Details/errors

## Workflow Examples

### Complete Billing Cycle

1. **Import CSV** (📥)
   - Upload billing CSV
   - Verify records imported

2. **Configure** (⚙️)
   - Set bank details
   - Map fields

3. **Export to Bank** (🏦)
   - Generate bank file
   - Records auto-lock

4. **Wait for Bank Processing**
   - Bank processes transfers
   - Generates results file

5. **Import Results** (📤)
   - Upload results file
   - Records update

6. **Aggregate Data** (🔄)
   - Join data
   - Create reports

7. **Export Results** (📊)
   - Download final results
   - Archive data

### Daily Operations

1. Open Dashboard
2. Check statistics
3. Review recent activity
4. Run needed operations
5. Check logs for errors

## Tips & Tricks

### Speed Up Operations

- Reduce batch size if API errors occur
- Close other tabs
- Use wired internet
- Time operations during low-traffic hours

### Prevent Data Loss

- Always backup before major operations
- Use Lock feature to prevent editing
- Review data before exporting
- Keep operation logs

### Troubleshooting Operations

- Check logs (📋 Logs tab)
- Validate configuration
- Verify app connectivity
- Check data format

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save Config | Ctrl+S (or Cmd+S) |
| Open Logs | Ctrl+L (or Cmd+L) |
| Refresh | F5 |
| Dev Console | F12 |
| Clear Cache | Ctrl+Shift+Delete |

## FAQ

**Q: How often should I run aggregation?**
A: After each import cycle or daily

**Q: Can I change bank details later?**
A: Yes, anytime in Configure tab

**Q: What if export fails?**
A: Check logs, validate config, retry

**Q: How do I backup data?**
A: Use Export Results function

**Q: Can multiple users use this?**
A: Yes, one plugin per domain

## Getting Help

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review logs (📋 tab)
3. Validate configuration
4. Check app connectivity
5. Contact support if needed

## Next Steps

- Read [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Explore each tab systematically
- Start with small test data
- Gradually increase volume