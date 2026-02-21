# MediCode AI — Backend

Django 5 + Django REST Framework API powering the MediCode AI platform.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Django 5 + Django REST Framework |
| Auth | JWT via `djangorestframework-simplejwt` |
| AI | Google Gemini (via `google-generativeai`) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Server | Gunicorn (production) |

---

## Project Layout

```
backend/
├── medicode_backend/      # Django project settings & URL root
│   ├── settings.py        # All configuration (reads from .env)
│   ├── urls.py            # Root URL dispatcher
│   └── wsgi.py
│
├── accounts/              # Custom User model + JWT auth endpoints
│   ├── models.py          # User (doctor / hospital roles)
│   ├── serializers.py
│   ├── views.py           # register / login / logout / me
│   └── urls.py
│
├── api/                   # Medical API + Gemini AI service
│   ├── gemini_service.py  # Gemini integration with fallback chain
│   ├── models.py          # Patient, CodingHistory
│   ├── serializers.py
│   ├── views.py           # All AI + CRUD endpoints
│   └── urls.py
│
├── requirements.txt       # Python dependencies
├── Dockerfile             # Django + Gunicorn container
├── manage.py
└── .env.example           # Environment variable template
```

---

## Local Setup

### 1. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
# Linux/Mac
cp .env.example .env

# Windows
copy .env.example .env
```

Edit `.env` and set your **Gemini API key**:

```env
GEMINI_API_KEY=your_key_from_aistudio.google.com
```

### 4. Migrate & run

```bash
python manage.py migrate
python manage.py createsuperuser   # optional
python manage.py runserver 8000
```

API base URL: `http://localhost:8000`

---

## API Reference

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register/` | Public | Create account |
| POST | `/api/auth/login/` | Public | Get JWT tokens |
| POST | `/api/auth/logout/` | Bearer | Blacklist refresh token |
| POST | `/api/auth/token/refresh/` | Refresh token | Rotate access token |
| GET/PATCH | `/api/auth/me/` | Bearer | View / update profile |
| GET | `/api/auth/health/` | Public | Health check |

### AI Endpoints (Bearer token required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/generate-medical-codes/` | ICD-11 + CPT + SNOMED from clinical note |
| POST | `/api/generate-summary/` | SOAP-format clinical note summary |
| POST | `/api/ai-assistant/` | Medical Q&A |
| POST | `/api/fhir-compliance/` | HL7 FHIR R4 resource validation |
| POST | `/api/patient-risk/` | Patient risk stratification |
| GET | `/api/analytics/` | Dashboard metrics |
| CRUD | `/api/patients/` | Patient management |
| GET | `/api/coding-history/` | Code generation history |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model to use |
| `DJANGO_SECRET_KEY` | **Yes (prod)** | insecure default | Django secret key |
| `DEBUG` | No | `True` | Debug mode |
| `ALLOWED_HOSTS` | No | `localhost,...` | Comma-separated hosts |
| `ALLOWED_ORIGINS` | No | `localhost:5173,...` | CORS allowed origins |
| `DATABASE_URL` | No | SQLite | PostgreSQL URL for production |

---

## Docker

```bash
# From project root:
docker compose up --build
```

See [../docker-compose.yml](../docker-compose.yml) for the full configuration.
