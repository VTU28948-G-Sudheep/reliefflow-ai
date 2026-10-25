@echo off
title ReliefFlow AI - Backend (FastAPI)
echo Starting ReliefFlow AI FastAPI Backend on http://localhost:8000...
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
