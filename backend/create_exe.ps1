# Build Backend Executable with PyInstaller
# Run this script from the backend directory

Write-Host "🔨 Building MyLife Backend Executable..." -ForegroundColor Cyan

# Step 1: Install PyInstaller if not already installed
Write-Host "`n📦 Checking PyInstaller..." -ForegroundColor Yellow
pip show pyinstaller > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing PyInstaller..." -ForegroundColor Yellow
    pip install pyinstaller
}

# Step 2: Clean previous builds
Write-Host "`n🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }

# Step 3: Build the executable
Write-Host "`n🚀 Building executable with PyInstaller..." -ForegroundColor Yellow
pyinstaller mylife-backend.spec

# Step 4: Check if build was successful
if (Test-Path "dist/mylife-backend.exe") {
    Write-Host "`n✅ Backend executable created successfully!" -ForegroundColor Green
    Write-Host "   Location: $(Resolve-Path 'dist/mylife-backend.exe')" -ForegroundColor Green
    
    # Show file size
    $size = (Get-Item "dist/mylife-backend.exe").Length / 1MB
    Write-Host "   Size: $([math]::Round($size, 2)) MB" -ForegroundColor Green
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Test the exe: .\dist\mylife-backend.exe" -ForegroundColor White
    Write-Host "   2. Copy to Tauri resources: Copy-Item 'dist\mylife-backend.exe' '..\frontend\src-tauri\resources\'" -ForegroundColor White
    Write-Host "   3. Build desktop app: cd ..\frontend && npm run tauri build" -ForegroundColor White
}
else {
    Write-Host "`n❌ Build failed! Check the output above for errors." -ForegroundColor Red
    exit 1
}
