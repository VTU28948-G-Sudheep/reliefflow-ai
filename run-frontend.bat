@echo off
title ReliefFlow AI - Frontend (Next.js)
echo Adding portable Node.js to PATH...
set "PATH=%~dp0node;%PATH%"
echo Starting ReliefFlow AI Next.js Frontend on http://localhost:3000...
cd /d "%~dp0frontend"
npm run dev
pause
