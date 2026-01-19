Write-Host "🔄 Clearing Vite cache and rebuilding..." -ForegroundColor Cyan

# Stop any running dev servers
Write-Host "⏹️  Stopping running processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Clear Vite cache
Write-Host "🗑️  Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "   ✅ Cleared node_modules\.vite" -ForegroundColor Green
}

# Clear dist
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✅ Cleared dist" -ForegroundColor Green
}

# Reinstall dependencies
Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "✅ Cache cleared! Now run: npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "Then in your browser:" -ForegroundColor Cyan
Write-Host "  1. Open DevTools (F12)" -ForegroundColor White
Write-Host "  2. Right-click Refresh button → Empty Cache and Hard Reload" -ForegroundColor White
Write-Host "  3. Or press: Ctrl+Shift+Delete → Clear browsing data" -ForegroundColor White
