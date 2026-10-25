@echo off
title ReliefFlow AI - Launch All Services
echo Starting ReliefFlow AI Services...
start "ReliefFlow Backend" cmd /c "%~dp0run-backend.bat"
timeout /t 2 /nobreak >nul
start "ReliefFlow Frontend" cmd /c "%~dp0run-frontend.bat"
echo.
echo Both servers are launching:
echo   - Backend API: http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
echo   - Frontend UI: http://localhost:3000
echo.
pause
