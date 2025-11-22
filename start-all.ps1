# Script pour démarrer tous les services PalFroG dans le bon ordre

Write-Host "`n🚀 Démarrage de PalFroG..." -ForegroundColor Cyan

# 1. Démarrer le Backend
Write-Host "`n📦 Démarrage du Backend (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\backend'; npm run start:dev"
Start-Sleep -Seconds 8

# Vérifier le backend
$backend = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($backend) {
    Write-Host "✅ Backend démarré sur port 3001" -ForegroundColor Green
} else {
    Write-Host "❌ Échec du démarrage du Backend" -ForegroundColor Red
    exit 1
}

# 2. Démarrer Vite
Write-Host "`n🎨 Démarrage de Vite (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\apps\frontend'; npm run dev"
Start-Sleep -Seconds 5

# Vérifier Vite
$vite = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($vite) {
    Write-Host "✅ Vite démarré sur port 5173" -ForegroundColor Green
} else {
    Write-Host "❌ Échec du démarrage de Vite" -ForegroundColor Red
    exit 1
}

# 3. Démarrer Electron
Write-Host "`n⚡ Démarrage d'Electron..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev:electron"

Write-Host "`n✅ Tous les services sont demarres!" -ForegroundColor Green
Write-Host "`nPour tester:" -ForegroundColor Cyan
Write-Host "  1. Ouvrez Electron" -ForegroundColor White
Write-Host "  2. Connectez 2 utilisateurs" -ForegroundColor White
Write-Host "  3. Changez le statut" -ForegroundColor White
Write-Host "  4. Verifiez la notification" -ForegroundColor White
