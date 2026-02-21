#!/bin/bash
# MediCode AI — Local Development Startup (Linux/Mac)
# Usage: bash start-dev.sh

set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        MediCode AI — Local Dev Mode                  ║${NC}"
echo -e "${CYAN}║  Django Backend  →  http://localhost:8000             ║${NC}"
echo -e "${CYAN}║  React Frontend  →  http://localhost:5173             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check .env exists
if [ ! -f backend/.env ]; then
    echo -e "${RED}[ERROR] backend/.env not found!${NC}"
    echo "  Run: cp backend/.env.example backend/.env"
    echo "  Then add your GEMINI_API_KEY."
    exit 1
fi

echo -e "${GREEN}[1/2] Starting Django backend on :8000${NC}"
cd backend
python manage.py migrate --run-syncdb 2>/dev/null || true
python manage.py runserver 8000 &
BACKEND_PID=$!
cd ..

sleep 2

echo -e "${GREEN}[2/2] Starting React frontend on :5173${NC}"
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}Both services are running.${NC}"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  Admin:    http://localhost:8000/admin/"
echo ""
echo "Press Ctrl+C to stop both services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
