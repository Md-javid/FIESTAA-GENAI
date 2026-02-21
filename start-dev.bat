@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  MediCode AI — Local Development Startup Script (Windows)
REM  Starts: Django Backend (port 8000) + React Frontend (port 5173)
REM  Usage: double-click or run from project root
REM ─────────────────────────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║        MediCode AI  —  Local Dev Mode                ║
echo ╠══════════════════════════════════════════════════════╣
echo ║  Django Backend  →  http://localhost:8000            ║
echo ║  React Frontend  →  http://localhost:5173            ║
echo ║  Django Admin    →  http://localhost:8000/admin/     ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM ── Check .env exists ─────────────────────────────────────────────────────
IF NOT EXIST "%~dp0backend\.env" (
    echo [ERROR] backend\.env not found!
    echo.
    echo   Run:  copy backend\.env.example backend\.env
    echo   Then open backend\.env and set GEMINI_API_KEY.
    echo.
    pause
    exit /b 1
)

REM ── Backend ──────────────────────────────────────────────────────────────────
echo [1/2] Starting Django backend on :8000...
start "MediCode Backend" cmd /k "cd /d %~dp0backend && python manage.py migrate --run-syncdb 2>nul & python manage.py runserver 8000"

timeout /t 3 /nobreak >nul

REM ── Frontend ─────────────────────────────────────────────────────────────────
echo [2/2] Starting React frontend on :5173...
start "MediCode Frontend" cmd /k "cd /d %~dp0frontend && npm install --silent && npm run dev"

echo.
echo  Both services launching in new windows.
echo  Open http://localhost:5173 in your browser.
echo.
pause
