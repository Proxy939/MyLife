# Google Drive Cloud Backup Setup

## Overview
MyLife supports optional cloud backup to Google Drive using encrypted exports. This guide shows you how to set it up.

---

## Prerequisites
- A Google account
- MyLife backend running locally

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name: `MyLife Backup`
4. Click **Create**
5. Wait for project creation (~30 seconds)

---

## Step 2: Enable Google Drive API

1. In your project, go to **APIs & Services** → **Library**
2. Search for: `Google Drive API`
3. Click **Google Drive API**
4. Click **Enable**
5. Wait for API to be enabled

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for personal use)
3. Click **Create**
4. Fill in required fields:
   - **App name**: `MyLife Backup`
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click **Save and Continue**
6. Skip **Scopes** (click **Save and Continue**)
7. Add **Test users**:
   - Click **Add Users**
   - Enter your Gmail address
   - Click **Add**
8. Click **Save and Continue**
9. Review and click **Back to Dashboard**

---

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Desktop app**
4. Name: `MyLife Desktop`
5. Click **Create**
6. **Important:** Download `credentials.json`
   - Click **Download JSON**
   - Save as `credentials.json`

---

## Step 5: Install credentials.json

### Windows
```powershell
# Copy credentials.json to MyLife sync directory
Copy-Item credentials.json %APPDATA%\MyLife\sync\
```

### Manual
1. Navigate to: `%APPDATA%\MyLife\sync\`
2. Copy `credentials.json` into this folder

---

## Step 6: Connect from MyLife App

1. Open MyLife desktop app
2. Go to **Settings**
3. Scroll to **Cloud Backup (Google Drive)**
4. Click **Connect Google Drive**
5. Your browser will open
6. Sign in with your Google account
7. Click **Allow** when prompted
8. Return to MyLife - you should see "Connected"

---

## Usage

### Upload Backup (Push)
1. Go to Settings → Cloud Backup
2. Click **Upload Backup (Push)**
3. Wait for "Backup uploaded successfully"
4. Backup is stored in Google Drive under `MyLifeBackups/` folder

### Restore Backup (Pull)
1. Go to Settings → Cloud Backup
2. Check the confirmation box: "I understand this will overwrite my local data"
3. Click **Restore Latest Backup (Pull)**
4. Wait for download to complete
5. (Restore functionality coming in next update)

---

## Troubleshooting

### "credentials.json not found"

**Solution:**
- Make sure you copied `credentials.json` to `%APPDATA%\MyLife\sync\`
- Restart the backend

### "OAuth flow failed"

**Solution:**
- Make sure you added your email as a Test User in OAuth consent screen
- Try deleting `%APPDATA%\MyLife\sync\token.json` and reconnecting

### "Failed to upload backup"

**Possible causes:**
- No internet connection (app will still work offline)
- Google Drive quota exceeded
- OAuth token expired (try reconnecting)

### "Download failed"

**Possible causes:**
- No backups found on Google Drive (upload one first)
- No internet connection
- OAuth token expired

---

## Security Notes

- ✅ Only **encrypted** data is uploaded (vault.enc, encrypted photos)
- ✅ Your PIN is **never** uploaded to Google Drive
- ✅ Backups are stored in **your personal** Google Drive
- ✅ OAuth tokens are stored **locally** in `%APPDATA%\MyLife\sync\`

---

## Folder Structure

```
Google Drive/
└── MyLifeBackups/
    ├── MyLife-backup-2026-01-20-1200.zip
    ├── MyLife-backup-2026-01-21-1500.zip
    └── MyLife-backup-2026-01-22-0900.zip
```

Each backup is a ZIP file containing:
- `vault/vault.enc` (encrypted database)
- `vault/salt.bin` (encryption salt)
- `vault/photos/` (encrypted photo blobs)
- `vault/backups/` (if any)
- `metadata.json` (backup info)

---

## Optional: Quota Information

- Free Google Drive: 15 GB
- Typical MyLife backup size: 10-500 MB (depends on photos)
- Estimated backups you can store: 30-1500

---

## Uninstall / Disconnect

To remove Google Drive sync:

1. Delete `%APPDATA%\MyLife\sync\token.json`
2. Delete `%APPDATA%\MyLife\sync\credentials.json`
3. Optionally: Delete backups from Google Drive `MyLifeBackups/` folder

---

## Support

If you encounter issues:
1. Check backend logs
2. Verify credentials.json is in correct location
3. Ensure Google Drive API is enabled
4. Check internet connection
