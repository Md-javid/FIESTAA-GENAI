@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  MediCode AI v3 — Local Development Startup Script (Windows)
REM  Starts: Django Backend (port 8000) + React Frontend (port 5173)
REM ─────────────────────────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║        MediCode AI v3.0  —  Local Dev Mode           ║
echo ╠══════════════════════════════════════════════════════╣
echo ║  Django Backend  →  http://localhost:8000            ║
echo ║  React Frontend  →  http://localhost:5173            ║
echo ║  Django Admin    →  http://localhost:8000/admin/     ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM ── Backend ──────────────────────────────────────────────────────────────────
echo [1/2] Starting Django backend...
start "MediCode Backend" cmd /k "cd /d %~dp0backend && python manage.py runserver 8000"

timeout /t 3 /nobreak >nul

REM ── Frontend ─────────────────────────────────────────────────────────────────
echo [2/2] Starting React frontend...
start "MediCode Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ Both services launching in new windows.
echo    Open http://localhost:5173 in your browser.
echo.
pause
