#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
#  MediCode AI — One-Click Docker Deploy Script (Linux/macOS)
# ─────────────────────────────────────────────────────────────────────

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         MediCode AI — Docker Deployment              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Check Docker ────────────────────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker is not running. Start Docker Desktop and retry.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Docker is running.${NC}"

# ── Check API key ────────────────────────────────────────────────────────
if grep -q "your_gemini_api_key_here" backend/.env 2>/dev/null; then
    echo -e "${YELLOW}"
    echo "  [WARNING] GEMINI_API_KEY is still a placeholder!"
    echo "  Edit backend/.env → GEMINI_API_KEY=your_real_key"
    echo "  Get free key: https://aistudio.google.com/"
    echo -e "${NC}"
    read -p "  Continue anyway? (y/N): " CONTINUE
    [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]] && echo "Aborted." && exit 1
fi

# ── Stop existing ───────────────────────────────────────────────────────
echo ""
echo "[1/4] Stopping existing containers..."
docker compose down --remove-orphans 2>/dev/null || true

# ── Build ────────────────────────────────────────────────────────────────
echo "[2/4] Building Docker images..."
docker compose build --no-cache

# ── Start ────────────────────────────────────────────────────────────────
echo "[3/4] Starting containers..."
docker compose up -d

# ── Wait ─────────────────────────────────────────────────────────────────
echo "[4/4] Waiting for health checks (20s)..."
sleep 20

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ MediCode AI is running!                          ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  🌐 Open:     http://localhost:3000                  ║${NC}"
echo -e "${GREEN}║  🔌 API:      http://localhost:5001/api/health       ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Stop:        docker compose down                    ║${NC}"
echo -e "${GREEN}║  Logs:        docker compose logs -f                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Auto-open browser (macOS/Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
elif command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:3000
fi
