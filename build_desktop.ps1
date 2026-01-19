# Complete Desktop Build Script for MyLife
# Builds backend exe + frontend + creates Windows installer

Write-Host "🚀 MyLife Desktop Build Process" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Step 1: Build Backend Executable
Write-Host "`n[1/4] Building Backend Executable..." -ForegroundColor Yellow
cd backend

# Install PyInstaller if needed
pip show pyinstaller > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing PyInstaller..." -ForegroundColor Yellow
    pip install pyinstaller
}

# Clean and build
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }

pyinstaller mylife-backend.spec

if (-not (Test-Path "dist/mylife-backend.exe")) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}

$size = (Get-Item "dist/mylife-backend.exe").Length / 1MB
Write-Host "✅ Backend exe created ($([math]::Round($size, 2)) MB)" -ForegroundColor Green

# Step 2: Copy Backend to Tauri Resources
Write-Host "`n[2/4] Copying backend to Tauri resources..." -ForegroundColor Yellow
cd ../frontend

# Create resources directory if it doesn't exist
$resourcesDir = "src-tauri/resources"
if (-not (Test-Path $resourcesDir)) {
    New-Item -ItemType Directory -Path $resourcesDir -Force | Out-Null
}

Copy-Item "../backend/dist/mylife-backend.exe" "$resourcesDir/" -Force
Write-Host "✅ Backend copied to $resourcesDir" -ForegroundColor Green

# Step 3: Install Frontend Dependencies
Write-Host "`n[3/4] Installing frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    npm install
}
else {
    Write-Host "Dependencies already installed" -ForegroundColor Gray
}

# Step 4: Build Tauri Desktop App
Write-Host "`n[4/4] Building Tauri desktop installer..." -ForegroundColor Yellow
Write-Host "This may take a while..." -ForegroundColor Gray

npm run tauri build

# Check for output
$msiPath = Get-ChildItem -Path "src-tauri/target/release/bundle/msi" -Filter "*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($msiPath) {
    Write-Host "`n✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "=" -repeat 50 -ForegroundColor Green
    Write-Host "`nInstaller created:" -ForegroundColor Cyan
    Write-Host "  Location: $(Resolve-Path $msiPath.FullName)" -ForegroundColor White
    
    $installerSize = $msiPath.Length / 1MB
    Write-Host "  Size: $([math]::Round($installerSize, 2)) MB" -ForegroundColor White
    
    Write-Host "`n📦 What's included:" -ForegroundColor Cyan
    Write-Host "  ✓ Frontend React app" -ForegroundColor White
    Write-Host "  ✓ Tauri desktop wrapper" -ForegroundColor White
    Write-Host "  ✓ Backend FastAPI server (mylife-backend.exe)" -ForegroundColor White
    Write-Host "  ✓ All dependencies bundled" -ForegroundColor White
    
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test the installer on a clean Windows machine" -ForegroundColor White
    Write-Host "  2. Verify backend auto-starts" -ForegroundColor White
    Write-Host "  3. Check data is stored in %APPDATA%\MyLife" -ForegroundColor White
    Write-Host "  4. Distribute the .msi file!" -ForegroundColor White
}
else {
    Write-Host "`n❌ Build failed! Check the output above for errors." -ForegroundColor Red
    exit 1
}
