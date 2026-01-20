# MyLife v1.0 Release Guide

## Prerequisites
- Python 3.10+
- Node.js 18+
- PowerShell (Windows)

## Backend Build

### 1. Install Dependencies
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Build Executable
```powershell
# Install PyInstaller
pip install pyinstaller

# Build backend executable
pyinstaller --name mylife-backend --onefile --add-data "app;app" run.py

# Output: dist/mylife-backend.exe
```

## Frontend Build

### 1. Install Dependencies
```powershell
cd frontend
npm install
```

### 2. Build Production Bundle
```powershell
npm run build

# Output: dist/
```

## Desktop App Build (Tauri)

### 1. Install Tauri CLI
```powershell
cd frontend
npm install --save-dev @tauri-apps/cli
```

### 2. Configure Tauri
Create `src-tauri/tauri.conf.json`:
- Set app name, version
- Configure backend executable path
- Set window properties

### 3. Build Desktop App
```powershell
npm run tauri build

# Output: src-tauri/target/release/bundle/
```

## Installer Creation

### Windows (NSIS)
```powershell
# Tauri automatically creates MSI installer
# Find in: src-tauri/target/release/bundle/msi/
```

### Manual ZIP Distribution
```powershell
# Create dist folder
New-Item -ItemType Directory -Force -Path dist

# Copy backend
Copy-Item backend/dist/mylife-backend.exe dist/

# Copy frontend build
Copy-Item -Recurse frontend/dist/* dist/web/

# Create ZIP
Compress-Archive -Path dist/* -DestinationPath MyLife-v1.0.0-Windows.zip
```

## Testing Release Build

### 1. Test Backend
```powershell
.\dist\mylife-backend.exe
# Should start on http://127.0.0.1:8000
```

### 2. Test Frontend
```powershell
cd frontend/dist
# Serve with any static server
npx serve
```

### 3. End-to-End Test
- Create vault
- Add memories
- Test sync
- Test backup/restore

## Publishing

### GitHub Release
1. Create Git tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Create GitHub Release
4. Upload `MyLife-v1.0.0-Windows.zip`

### Installer Distribution
- Upload MSI to release assets
- Provide installation instructions
- Include .env.example files

## Post-Release Checklist

- [ ] Verify app version in UI
- [ ] Test clean install
- [ ] Test vault lock/unlock
- [ ] Test all major features
- [ ] Verify error handling
- [ ] Check diagnostics page
- [ ] Test Google Drive sync
- [ ] Verify data encryption

## Troubleshooting

### Backend Won't Start
- Check Python version
- Verify all dependencies installed
- Check port 8000 available

### Frontend Build Fails
- Clear `node_modules` and reinstall
- Check Node version
- Run `npm run build` with `--verbose`

### Tauri Build Issues
- Install Rust toolchain
- Update Tauri CLI
- Check system requirements

## Version Bumping

Update version in:
1. `backend/app/config.py` - `APP_VERSION`
2. `frontend/package.json` - `version`
3. `src-tauri/tauri.conf.json` - `version`

## Support

For issues, check:
- Diagnostics page: `/diagnostics`
- Export diagnostics report
- Review error logs
