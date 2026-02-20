@echo off
REM ─────────────────────────────────────────────────────────────────────
REM  MediCode AI — One-Click Docker Deploy Script (Windows)
REM  Run this from the project root: C:\...\fiestaa\
REM ─────────────────────────────────────────────────────────────────────

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║         MediCode AI — Docker Deployment              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

REM ── Step 1: Check Docker is running ──────────────────────────────────
docker info >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Docker is not running!
    echo  Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo  [OK] Docker is running.

REM ── Step 2: Check API key is set ─────────────────────────────────────
findstr /C:"your_gemini_api_key_here" backend\.env >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo.
    echo  [WARNING] GEMINI_API_KEY is still the placeholder!
    echo  Edit backend\.env and replace:
    echo    GEMINI_API_KEY=your_gemini_api_key_here
    echo  with your real key from https://aistudio.google.com/
    echo.
    set /p CONTINUE="Continue anyway? (y/N): "
    IF /I NOT "%CONTINUE%"=="y" (
        echo  Aborted. Please set your API key first.
        exit /b 1
    )
)

REM ── Step 3: Stop any existing containers ─────────────────────────────
echo.
echo  [1/4] Stopping existing containers...
docker compose down --remove-orphans 2>nul

REM ── Step 4: Build images ─────────────────────────────────────────────
echo  [2/4] Building Docker images (this takes ~2-3 minutes first time)...
docker compose build --no-cache
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Build failed. Check output above.
    pause
    exit /b 1
)

REM ── Step 5: Start containers ─────────────────────────────────────────
echo  [3/4] Starting containers...
docker compose up -d
IF %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Failed to start containers. Check output above.
    pause
    exit /b 1
)

REM ── Step 6: Wait for health checks ───────────────────────────────────
echo  [4/4] Waiting for services to become healthy...
timeout /t 20 /nobreak >nul

REM ── Done ─────────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  ✅ MediCode AI is running!                          ║
echo  ║                                                      ║
echo  ║  🌐 Open in browser:  http://localhost:3000          ║
echo  ║  🔌 Backend API:      http://localhost:5001/api/health║
echo  ║                                                      ║
echo  ║  To stop:  docker compose down                       ║
echo  ║  Logs:     docker compose logs -f                    ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

REM Auto-open browser
start http://localhost:3000

pause
