# MyLife Release Process

## 🔑 Step 1: Generate Updater Keys (One-Time Setup)

```powershell
cd frontend
npm run tauri signer generate -- -w updater-keys.json
```

This creates `frontend/updater-keys.json`:
```json
{
  "pubkey": "dW50cnVzdGVkIGNvbW1lbnQN...",
  "privkey": "LS0tLS1CRUdJTiBQUklWQVRF..."
}
```

**⚠️ IMPORTANT:**
- Copy the `pubkey` value to `src-tauri/tauri.conf.json` → `tauri.updater.pubkey`
- **NEVER** commit `updater-keys.json` to git (it's in `.gitignore`)
- Store `privkey` securely (e.g., GitHub Secrets for CI/CD)

---

## 📝 Step 2: Update Version

Update version in **3 places** (must match):

1. `frontend/src-tauri/tauri.conf.json`:
   ```json
   "package": {
     "version": "0.2.0"
   }
   ```

2. `frontend/src-tauri/Cargo.toml`:
   ```toml
   [package]
   version = "0.2.0"
   ```

3. Git tag (created in Step 4)

---

## 🏗️ Step 3: Build Release

### Build Backend Executable
```powershell
cd backend
pip install pyinstaller
pyinstaller mylife-backend.spec

# Copy to Tauri resources
Copy-Item dist\mylife-backend.exe ..\frontend\src-tauri\resources\
```

### Build Desktop App
```powershell
cd ..\frontend
npm run tauri build
```

**Output Location:**
```
frontend\src-tauri\target\release\bundle\msi\MyLife_0.2.0_x64_en-US.msi
```

---

## ✍️ Step 4: Sign the Installer

```powershell
cd frontend

# Sign the .msi file
npm run tauri signer sign `
  src-tauri\target\release\bundle\msi\MyLife_0.2.0_x64_en-US.msi `
  -k updater-keys.json
```

**Output:** Creates `MyLife_0.2.0_x64_en-US.msi.sig` in the same directory

---

## 📦 Step 5: Create latest.json Manifest

Create `latest.json` manually or use this template:

```json
{
  "version": "0.2.0",
  "notes": "## What's New\n- New feature 1\n- Bug fix 2\n- Performance improvements",
  "pub_date": "2026-01-20T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "PASTE_SIGNATURE_FROM_.sig_FILE_HERE",
      "url": "https://github.com/YOUR_USERNAME/MyLife/releases/download/v0.2.0/MyLife_0.2.0_x64_en-US.msi"
    }
  }
}
```

**To get signature:**
```powershell
Get-Content src-tauri\target\release\bundle\msi\MyLife_0.2.0_x64_en-US.msi.sig
```

---

## 🚀 Step 6: Create GitHub Release

### Via GitHub CLI (Recommended)
```powershell
# Tag the release
git tag v0.2.0
git push origin v0.2.0

# Create GitHub release
gh release create v0.2.0 `
  --title "MyLife v0.2.0" `
  --notes "Release notes here" `
  frontend\src-tauri\target\release\bundle\msi\MyLife_0.2.0_x64_en-US.msi `
  frontend\src-tauri\target\release\bundle\msi\MyLife_0.2.0_x64_en-US.msi.sig `
  latest.json
```

### Via GitHub Web UI
1. Go to: https://github.com/YOUR_USERNAME/MyLife/releases/new
2. Tag: `v0.2.0`
3. Title: `MyLife v0.2.0`
4. Description: Release notes
5. Upload files:
   - `MyLife_0.2.0_x64_en-US.msi`
   - `MyLife_0.2.0_x64_en-US.msi.sig`
   - `latest.json`
6. Click "Publish release"

---

## ✅ Step 7: Update Tauri Config

Update `frontend/src-tauri/tauri.conf.json`:

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://github.com/YOUR_USERNAME/MyLife/releases/latest/download/latest.json"
  ],
  "dialog": false,
  "pubkey": "YOUR_PUBLIC_KEY_FROM_STEP_1"
}
```

Replace:
- `YOUR_USERNAME` with your GitHub username
- `YOUR_PUBLIC_KEY_FROM_STEP_1` with the pubkey from `updater-keys.json`

---

## 🧪 Step 8: Test the Updater

### Local Testing

1. Install the **old version** (e.g., v0.1.0)
2. Build a **new version** (e.g., v0.2.0) and publish to GitHub
3. Open the installed app
4. Go to **Settings → Updates**
5. Click "Check for Updates"
6. Should show: "Update available: v0.2.0"
7. Click "Download & Install"
8. App should download, install, and restart

### Staging Testing

For pre-release testing, use a draft GitHub release or a separate test repository.

---

## 🔄 Complete Build Script

Save as `release.ps1`:

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "🚀 Building MyLife v$Version" -ForegroundColor Cyan

# Step 1: Update versions
Write-Host "`n📝 Updating version numbers..." -ForegroundColor Yellow
# (Add version update automation here)

# Step 2: Build backend
Write-Host "`n🏗️ Building backend..." -ForegroundColor Yellow
cd backend
pyinstaller mylife-backend.spec
Copy-Item dist\mylife-backend.exe ..\frontend\src-tauri\resources\

# Step 3: Build desktop
Write-Host "`n🖥️ Building desktop app..." -ForegroundColor Yellow
cd ..\frontend
npm run tauri build

# Step 4: Sign installer
Write-Host "`n✍️ Signing installer..." -ForegroundColor Yellow
$msiPath = "src-tauri\target\release\bundle\msi\MyLife_${Version}_x64_en-US.msi"
npm run tauri signer sign $msiPath -k updater-keys.json

Write-Host "`n✅ Build complete!" -ForegroundColor Green
Write-Host "`nRelease artifacts:" -ForegroundColor Cyan
Write-Host "  - $msiPath" -ForegroundColor White
Write-Host "  - $msiPath.sig" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Create latest.json" -ForegroundColor White
Write-Host "  2. Create GitHub release: gh release create v$Version" -ForegroundColor White
```

Usage:
```powershell
.\release.ps1 -Version "0.2.0"
```

---

## 📋 Checklist

Before releasing:

- [ ] Updated version in `tauri.conf.json`
- [ ] Updated version in `Cargo.toml`
- [ ] Built backend exe
- [ ] Built desktop app
- [ ] Signed installer (.sig file created)
- [ ] Created `latest.json` with correct signature
- [ ] Tested build locally
- [ ] Created Git tag (`v0.X.X`)
- [ ] Published GitHub release with all 3 files
- [ ] Tested updater on old version
- [ ] Updated README/CHANGELOG

---

## 🐛 Troubleshooting

### "Invalid signature" error
- Ensure pubkey in `tauri.conf.json` matches the one used to sign
- Verify `.sig` file is uploaded to GitHub releases
- Check signature in `latest.json` matches `.sig` file content

### "No update available"
- Verify GitHub release is published (not draft)
- Check URL in `tauri.conf.json` is correct
- Ensure version in `latest.json` > installed version
- Clear app cache and try again

### Updater not working
- Ensure `"updater"` feature is in `Cargo.toml`
- Verify `updater.active: true` in `tauri.conf.json`
- Check browser/network logs for download errors
- Test with `--log-level=trace` for Tauri debugging

---

## 🔒 Security Notes

- Private key must NEVER be committed to repository
- Use GitHub Secrets for CI/CD workflows
- Always use HTTPS for update endpoints
- Signature verification prevents tampered updates
- Users should only download from official GitHub releases
