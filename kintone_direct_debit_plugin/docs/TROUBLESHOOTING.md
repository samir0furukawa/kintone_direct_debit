<!-- docs/TROUBLESHOOTING.md -->

# Troubleshooting Guide

## Installation Issues

### Plugin doesn't appear in Admin Panel

**Check:**
- ZIP file is not corrupted
- ZIP file size > 1MB
- manifest.json is valid JSON

**Solution:**
1. Re-download plugin
2. Verify file integrity
3. Try different browser
4. Check firewall settings

### Plugin installed but won't activate

**Check:**
- User has admin permissions
- App exists and is accessible
- Plugin checkbox is checked

**Solution:**
1. Verify admin permissions
2. Try app refresh (F5)
3. Check Kintone system logs
4. Try different app first

### Plugin appears but shows blank

**Check:**
- Browser console for errors (F12)
- All files present in ZIP
- manifest.json paths are correct

**Solution:**
1. Clear browser cache
2. Try incognito mode
3. Check F12 console for errors
4. Re-upload plugin

## Configuration Issues

### App IDs not found

**Cause:** Entered wrong app IDs

**Solution:**
1. Go to each app
2. Check URL: `?appId=XXX`
3. Copy exact ID
4. Paste in configuration
5. Save and refresh

### Fields not mapping correctly

**Cause:** Field codes don't match

**Solution:**
1. Open actual app
2. Check field codes in settings
3. Verify exact spelling (case-sensitive)
4. Test one field at a time
5. Save after each field

### Bank details not saving

**Cause:** Validation error

**Solution:**
1. Check bank code is 4 digits
2. Verify branch code is 3 digits
3. Check Katakana characters
4. Verify no special characters
5. Check length limits

## Import Issues

### CSV import fails

**Cause:** File format or encoding wrong

**Solution:**
1. Check CSV encoding (UTF-8 or Shift_JIS)
2. Verify headers in first row
3. Check no empty rows
4. Validate data format
5. Try smaller file first

### "No records found" error

**Cause:** No valid data in CSV

**Solution:**
1. Check CSV not empty
2. Verify headers present
3. Check data format
4. Remove invalid rows
5. Check required fields

### Import hangs

**Cause:** Network or large file

**Solution:**
1. Reduce file size
2. Reduce batch size
3. Check internet connection
4. Try different network
5. Retry operation

## Export Issues

### Export produces blank file

**Cause:** No records selected or filter issue

**Solution:**
1. Check app has records
2. Verify filter criteria
3. Check exclude fields
4. Try smaller dataset
5. Check permissions

### Export format wrong

**Cause:** Format conversion error

**Solution:**
1. Verify XLSX library loaded
2. Try CSV format instead
3. Clear browser cache
4. Try different browser
5. Check file size

### Records not exporting

**Cause:** Field mapping or permission issue

**Solution:**
1. Verify field codes
2. Check read permissions
3. Test with single record
4. Check data format
5. Review logs

## Lock/Unlock Issues

### Records won't lock

**Cause:** Permission or field issue

**Solution:**
1. Verify data_lock field exists
2. Check write permissions
3. Verify field is writable
4. Check field code name
5. Test with single record

### Unlock fails

**Cause:** Locked records not found

**Solution:**
1. Check records are actually locked
2. Verify lock field name
3. Try manual unlock
4. Check app permissions
5. Refresh app

## Calendar Issues

### Calendar not showing

**Cause:** Plugin disabled or not loaded

**Solution:**
1. Check plugin is activated
2. Verify calendar enabled in config
3. Check field exists
4. Refresh page (F5)
5. Clear cache

### Dates greyed out incorrectly

**Cause:** Holiday or weekend configuration

**Solution:**
1. Check holiday list
2. Verify weekend exclusion setting
3. Test single date
4. Review calendar config
5. Update holidays if needed

### Can't select date

**Cause:** Date is excluded

**Solution:**
1. Check if weekend
2. Check if holiday
3. Change exclude settings
4. Try different date
5. Review configuration

## Performance Issues

### Slow export

**Cause:** Large dataset or network

**Solution:**
1. Reduce batch size to 50
2. Export smaller date range
3. Check network speed
4. Close other applications
5. Try during off-peak

### API errors

**Cause:** Rate limiting or timeout

**Solution:**
1. Increase timeout setting
2. Reduce batch size
3. Wait before retry
4. Check API limits
5. Try later

### Out of memory

**Cause:** Too many records

**Solution:**
1. Reduce dataset size
2. Export in batches
3. Close other tabs
4. Increase batch size
5. Use smaller format

## Data Issues

### Missing fields in export

**Cause:** Fields excluded or not mapped

**Solution:**
1. Check exclude fields list
2. Verify field mapping
3. Check field exists in app
4. Review field permissions
5. Test with simpler config

### Wrong data in export

**Cause:** Field mapping or data format

**Solution:**
1. Verify field codes
2. Check data source
3. Validate source records
4. Review field mapping
5. Test single record

### Duplicate records

**Cause:** Multiple imports or failed cleanup

**Solution:**
1. Check delete before import setting
2. Review import logs
3. Manual cleanup if needed
4. Verify app state
5. Try reimport

## Permission Issues

### "Access denied" error

**Cause:** Insufficient permissions

**Solution:**
1. Verify admin permissions
2. Check app access
3. Verify field permissions
4. Check record permissions
5. Contact domain admin

### Can't modify records

**Cause:** Read-only access

**Solution:**
1. Check user permissions
2. Verify app edit access
3. Check field editability
4. Review record locks
5. Contact admin

## General Troubleshooting

### Check System Status

1. Open Dashboard tab
2. Verify all apps are green
3. Check recent activity
4. Review statistics
5. Check logs

### Validate Configuration

1. Go to Configure tab
2. Review all settings
3. Click "Validate Config"
4. Fix any errors
5. Save and retry

### Review Logs

1. Click 📋 Logs tab
2. Search for errors
3. Check timestamp
4. Note error code
5. Use error code to troubleshoot

### Clear Cache & Retry

1. Clear browser cache (Ctrl+Shift+Delete)
2. Close browser completely
3. Restart browser
4. Log back into Kintone
5. Retry operation

## Getting Help

When reporting issues:
1. Include error message exactly
2. Provide app IDs
3. Screenshot of error
4. Recent logs (📋 tab)
5. Steps to reproduce

## Emergency Procedures

### Data Backup

Before major operations:
1. Export all data
2. Save locally
3. Verify backup readable
4. Keep dated copies
5. Test restore

### Rollback

If something goes wrong:
1. Stop current operations
2. Review logs for issue
3. Fix configuration
4. Verify fix
5. Re-attempt operation

### Reset Everything

Last resort if everything broken:
1. Note all settings
2. Click **🔄 Reset All**
3. Reconfigure from scratch
4. Test with small data
5. Gradually increase volume