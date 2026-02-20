# ⚕️ MediCode AI — v3.0 (Django + React + Gemini)

> AI-Powered Medical Coding & EHR Compliance Platform  
> ICD-11 TM2 · CPT · SNOMED CT · ABDM v3 · HL7 FHIR R4

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  React + Vite Frontend  (port 5173 dev / 3000 prod) │
│  → Auth: JWT  →  Role: Doctor | Hospital System     │
└──────────────────────┬──────────────────────────────┘
                       │ Bearer Token (JWT)
┌──────────────────────▼──────────────────────────────┐
│  Django 4.2 + DRF Backend  (port 8000)              │
│  ├── /api/auth/   → JWT register/login/logout       │
│  ├── /api/        → Medical codes, AI assistant     │
│  └── /admin/      → Django admin UI                 │
└──────────────────────┬──────────────────────────────┘
                       │ google-generativeai SDK
┌──────────────────────▼──────────────────────────────┐
│  Google Gemini 1.5 Flash API                        │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start — Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- Gemini API key → [aistudio.google.com](https://aistudio.google.com/)

### 1. Clone & Setup Backend
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment (key already set)
# Edit backend/.env to change GEMINI_API_KEY if needed

# Run database migrations
python manage.py migrate

# (Optional) Create admin superuser
python manage.py createsuperuser

# Start Django backend
python manage.py runserver 8000
```

### 2. Setup Frontend
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```

### 3. One-click Start (Windows)
```batch
# From project root:
start-dev.bat
```

Access the app at: **http://localhost:5173**  
Django admin at: **http://localhost:8000/admin/**

---

## 🐳 Docker Deployment

```bash
# Build and start all containers
docker compose up --build

# Detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

The app will be available at: **http://localhost:3000**

---

## 🔐 Authentication

### Roles
| Role | Description |
|------|-------------|
| `doctor` | Individual physician — requires Medical License Number |
| `hospital` | Hospital System — requires Hospital Name |

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | Public | Create account |
| POST | `/api/auth/login/` | Public | Get JWT tokens |
| POST | `/api/auth/logout/` | Bearer | Blacklist refresh token |
| POST | `/api/auth/token/refresh/` | Refresh | Get new access token |
| GET/PATCH | `/api/auth/me/` | Bearer | User profile |
| GET | `/api/auth/health/` | Public | Health check |

### AI Endpoints (require Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-medical-codes/` | ICD-11 + CPT + SNOMED generation |
| POST | `/api/generate-summary/` | Clinical note summarization |
| POST | `/api/ai-assistant/` | General AI medical Q&A |
| POST | `/api/fhir-compliance/` | FHIR R4 resource validation |
| POST | `/api/patient-risk/` | Patient risk stratification |
| GET | `/api/analytics/` | Dashboard analytics data |
| CRUD | `/api/patients/` | Patient management |
| GET | `/api/coding-history/` | Code generation history |

---

## 🧠 AI Features (Gemini 1.5 Flash)

1. **Medical Code Generation** — ICD-11 TM2, CPT, SNOMED CT from clinical notes
2. **Clinical Summary** — SOAP-format AI note summarization
3. **AI Assistant** — Medical Q&A with domain-specific context
4. **FHIR Compliance Check** — Validate HL7 FHIR R4 resources
5. **Patient Risk Analysis** — AI-powered risk stratification

---

## 📁 Project Structure

```
fiestaa/
├── backend/                  ← Django Backend
│   ├── medicode_backend/     ← Django settings & URLs
│   ├── accounts/             ← Custom User model + JWT auth
│   ├── api/                  ← Medical API + Gemini service
│   ├── requirements.txt      ← Python dependencies
│   ├── Dockerfile            ← Django + Gunicorn container
│   └── .env                  ← Environment variables
│
├── frontend/                 ← React + Vite Frontend
│   ├── src/
│   │   ├── context/          ← AuthContext (JWT)
│   │   ├── components/       ← All UI pages
│   │   └── App.jsx           ← Router + auth gate
│   ├── Dockerfile            ← Node build + Nginx
│   └── nginx.conf            ← SPA routing + API proxy
│
├── docker-compose.yml        ← Full stack orchestration
└── start-dev.bat             ← Windows dev launcher
```

---

## 🛡️ Security

- JWT access tokens (8h) + refresh tokens (7 days, blacklisted on logout)
- CORS restricted to configured origins
- Rate limiting on AI endpoints (30 req/hour)
- Django security middleware + Helmet-equivalent headers
- Prompt injection detection in clinical notes
