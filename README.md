# MediCode AI

> AI-Powered Medical Coding & EHR Compliance Platform
> ICD-11 TM2 · CPT · SNOMED CT · ABDM v3 · HL7 FHIR R4

Built with **Django 5** · **React 19** · **Gemini AI** · **Docker**

---

## One-Command Quick Start

### Windows
```bat
start-dev.bat
```

### Linux / macOS
```bash
bash start-dev.sh
```

### Docker (production-like, any OS)
```bash
bash deploy.sh     # Linux/Mac
deploy.bat         # Windows
```

> **First run:** copy `backend\.env.example` to `backend\.env` and add your Gemini API key.
> See [QUICKSTART.md](QUICKSTART.md) for the full walkthrough.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  React 19 + Vite 7  (dev :5173 / prod :3000)            │
│  Tailwind CSS · Framer Motion · React Router v7          │
└────────────────────────┬─────────────────────────────────┘
                         │ JWT Bearer Token
┌────────────────────────▼─────────────────────────────────┐
│  Django 5 + DRF  (port 8000)                             │
│  ├── /api/auth/   JWT register / login / logout          │
│  ├── /api/        Medical codes + AI assistant           │
│  └── /admin/      Django admin UI                        │
└────────────────────────┬─────────────────────────────────┘
                         │ google-generativeai SDK
┌────────────────────────▼─────────────────────────────────┐
│  Google Gemini 2.0 Flash                                 │
└──────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
medicode-ai/
├── backend/                  Django REST API
│   ├── medicode_backend/     Settings, root URLs, WSGI
│   ├── accounts/             Custom User model + JWT auth
│   ├── api/                  Medical API + Gemini service
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example          <-- copy to .env, fill in keys
│   └── README.md
│
├── frontend/                 React + Vite SPA
│   ├── src/
│   │   ├── context/          AuthContext (JWT state)
│   │   └── components/       All UI pages
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
│
├── docker-compose.yml        Full-stack Docker orchestration
├── start-dev.bat             Windows one-command local dev
├── start-dev.sh              Linux/Mac one-command local dev
├── deploy.bat                Windows Docker production deploy
├── deploy.sh                 Linux/Mac Docker production deploy
├── QUICKSTART.md             Step-by-step setup guide
└── README.md                 (you are here)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 20+ |
| Docker + Compose | Latest |
| Gemini API key | Free — [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## AI Features

| Feature | Endpoint |
|---------|----------|
| ICD-11 + CPT + SNOMED generation | `POST /api/generate-medical-codes/` |
| Clinical note summary (SOAP) | `POST /api/generate-summary/` |
| AI medical Q&A | `POST /api/ai-assistant/` |
| HL7 FHIR R4 validation | `POST /api/fhir-compliance/` |
| Patient risk stratification | `POST /api/patient-risk/` |

All AI endpoints require a Bearer JWT token.

---

## Security

- JWT access tokens (8 h) + refresh tokens (7 days, blacklisted on logout)
- `.env` is **never committed** — template at `backend/.env.example`
- CORS restricted to configured origins
- Rate limiting: 30 AI requests / hour per user
- Django security middleware enabled

---

## Contributing

1. Fork, then `git checkout -b feature/my-feature`
2. Make changes, `git commit -m "feat: ..."`
3. `git push origin feature/my-feature` and open a PR

---

## License

MIT
