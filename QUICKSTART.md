# MediCode AI — Quick Start Guide

Complete setup from zero to running app in ~5 minutes.

---

## Step 1 — Clone the repository

```bash
git clone https://github.com/Md-javid/FIESTAA-GENAI.git
cd FIESTAA-GENAI
```

---

## Step 2 — Get a Gemini API key (free)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API key**
3. Copy the key — you'll need it in the next step

---

## Step 3 — Configure environment

**Windows:**
```bat
copy backend\.env.example backend\.env
notepad backend\.env
```

**Linux / Mac:**
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Set these two values in `.env`:

```env
GEMINI_API_KEY=paste_your_key_here
DJANGO_SECRET_KEY=any-long-random-string
```

---

## Step 4 — Run (choose one option)

### Option A — One command (recommended for development)

**Windows:**
```bat
start-dev.bat
```

**Linux / Mac:**
```bash
bash start-dev.sh
```

This opens two terminal windows: Django on :8000 and Vite on :5173.

---

### Option B — Docker (production-like)

```bash
# Windows
deploy.bat

# Linux / Mac
bash deploy.sh
```

App runs at **http://localhost:3000**

---

### Option C — Manual

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

---

## Step 5 — Open the app

| URL | Description |
|-----|-------------|
| http://localhost:5173 | React app (dev mode) |
| http://localhost:3000 | React app (Docker mode) |
| http://localhost:8000/admin/ | Django admin |
| http://localhost:8000/api/auth/health/ | API health check |

---

## Step 6 — Create an account

1. Open **http://localhost:5173**
2. Click **Register**
3. Choose role: **Doctor** or **Hospital**
4. Fill in required fields and submit
5. Log in and start using the AI assistant

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `GEMINI_API_KEY is not configured` | Check `backend/.env` exists and has a valid key |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` in your venv |
| `npm: command not found` | Install Node.js from [nodejs.org](https://nodejs.org) |
| CORS error in browser | Make sure backend is running on port 8000 |
| Port already in use | Kill the process using the port or change the port |

---

## Resetting the database

```bash
cd backend
rm db.sqlite3          # Linux/Mac
del db.sqlite3         # Windows
python manage.py migrate
```
