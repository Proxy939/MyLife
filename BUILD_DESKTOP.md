# MyLife Desktop Build - Complete Guide

## 🎯 Overview
This guide explains how to build MyLife as a standalone Windows desktop application with the FastAPI backend bundled inside.

## 📋 Prerequisites

1. **Python 3.10+** (for building backend exe)
2. **Node.js 18+** (for frontend)
3. **Rust** (for Tauri) - Install from https://www.rust-lang.org/
4. **Visual Studio Build Tools** (for Windows builds)

## 🚀 Quick Build

### Option 1: Use the Complete Build Script

```powershell
# Run from project root
.\build_desktop.ps1
```

This single script will:
- Build backend executable with PyInstaller
- Copy it to Tauri resources
- Build the complete desktop installer

### Option 2: Manual Step-by-Step

#### Step 1: Build Backend Executable

```powershell
cd backend

# Install PyInstaller
pip install pyinstaller

# Build the exe
pyinstaller mylife-backend.spec

# Verify output
dir dist\mylife-backend.exe
```

#### Step 2: Copy Backend to Tauri Resources

```powershell
# Create resources directory
New-Item -ItemType Directory -Force -Path ..\frontend\src-tauri\resources

# Copy backend exe
Copy-Item dist\mylife-backend.exe ..\frontend\src-tauri\resources\
```

#### Step 3: Build Desktop App

```powershell
cd ..\frontend

# Install dependencies (if needed)
npm install

# Build Tauri app
npm run tauri build
```

#### Step 4: Find the Installer

The installer will be at:
```
frontend\src-tauri\target\release\bundle\msi\MyLife_*.msi
```

## 📁 Data Storage

The desktop app stores all data in:
```
%APPDATA%\MyLife\
├── db\
│   └── mylife.db
├── storage\
│   ├── photos\
│   └── backups_tmp\
└── models\
    └── sentence-transformers\
```

This ensures:
- ✅ Data persists across app updates
- ✅ No permission issues in Program Files
- ✅ Each user has their own data

## 🔧 How It Works

### Development Mode
- Frontend: `npm run dev` (Vite dev server)
- Backend: Python + uvicorn from `backend/venv`
- Data: Stored in `backend/` directory

### Production Mode (Bundled)
- Frontend: Built with Vite, embedded in Tauri
- Backend: `mylife-backend.exe` from resources
- Data: Stored in `%APPDATA%\MyLife\`

The Rust launcher automatically detects which mode to use.

## 🐛 Troubleshooting

### Backend exe fails to build
```powershell
# Make sure all dependencies are installed
cd backend
pip install -r requirements.txt
pip install pyinstaller

# Try manual build
pyinstaller mylife-backend.spec --clean
```

### Tauri build fails
```powershell
# Update Tauri CLI
npm install --save-dev @tauri-apps/cli@latest

# Clean build
cd frontend
rm -r node_modules
rm -r src-tauri/target
npm install
npm run tauri build
```

### Backend doesn't start in desktop app
- Check if `mylife-backend.exe` exists in `src-tauri/resources/`
- Verify `tauri.conf.json` includes `"resources": ["resources/*"]`
- Check app logs in `%APPDATA%\MyLife\`

## 📦 Distribution

1. Test the `.msi` installer on a clean Windows machine
2. Verify:
   - App launches successfully
   - Backend starts automatically
   - Data is created in `%APPDATA%\MyLife\`
   - App works without Python installed
3. Distribute the `.msi` file to users

## 🔄 Updating the App

To release updates:

1. Update version in `frontend/src-tauri/tauri.conf.json`
2. Rebuild with `.\build_desktop.ps1`
3. Users can install the new `.msi` over the old version
4. Data in `%APPDATA%\MyLife\` will be preserved

## ⚙️ Configuration

### Backend Port
Default: `127.0.0.1:8000`

To change, update in multiple files:
- `frontend/.env.production`
- `frontend/src-tauri/src/main.rs` (BACKEND_URL constant)
- `backend/app/config.py` (API_PORT)

### App Name/ID
Update in:
- `frontend/src-tauri/tauri.conf.json` (productName, identifier)
- `backend/mylife-backend.spec` (name)

## 📝 Notes

- First run downloads sentence-transformers model (~100MB)
- Backend exe size is ~100-200 MB (includes PyTorch)
- Total installer size is ~150-250 MB
- Windows Defender may flag the exe initially (false positive)
