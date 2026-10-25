# ReliefFlow AI Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      ReliefFlow AI Startup Guide       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in new window
Write-Host "Starting Backend (FastAPI on http://localhost:8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Frontend in new window
Write-Host "Starting Frontend (Next.js on http://localhost:3000)..." -ForegroundColor Green
$nodePath = "$projectRoot\node"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$nodePath;' + `$env:PATH; cd '$projectRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Servers launched!" -ForegroundColor Cyan
Write-Host "  Web Dashboard: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend Swagger Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Backend Health Check: http://localhost:8000/health" -ForegroundColor White
