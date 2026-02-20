# MediCode AI — NAMASTE & ICD-11 EHR Middleware

> A production-ready GenAI-powered middleware that translates raw clinical notes into
> standardized **ICD-11 TM2** and **NAMASTE** diagnostic codes — built for India's
> **ABDM-compliant EHR** ecosystem.

---

## ✨ Features

| Feature | Detail |
|---|---|
| 🧠 GenAI Engine | Google Gemini 1.5 Pro |
| 📋 Clinical Standards | ICD-11 TM2 (WHO), NAMASTE (Indian EHR) |
| 🏥 EHR Compliance | ABDM v3, FHIR R4, HL7 v2.5 |
| 📡 Streaming | Server-Sent Events real-time typewriter output |
| 🛡️ Security | Helmet, CORS allowlist, rate limiting, input sanitisation |
| 🎨 UI | iOS 18 Liquid Glass — Glassmorphism + Framer Motion |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A free [Google Gemini API key](https://aistudio.google.com/)

### Step 1 — Add your API key
```bash
# Open backend/.env and replace the placeholder:
GEMINI_API_KEY=your_actual_key_here
```

### Step 2 — Start the Backend
```bash
cd backend
npm install   # (already done if you ran setup)
npm run dev
# → Server starts at http://localhost:5001
```

### Step 3 — Start the Frontend
```bash
cd frontend
npm run dev
# → UI opens at http://localhost:5173
```

---

## 📁 Project Structure

```
fiestaa/
├── frontend/                  # React + Vite + Tailwind v4 + Framer Motion
│   ├── src/
│   │   ├── App.jsx            # Root — ambient orb background
│   │   ├── index.css          # Glassmorphism utilities & animations
│   │   └── components/
│   │       └── Dashboard.jsx  # Main split-screen workstation UI
│   ├── vite.config.js         # Vite + API proxy to :5001
│   └── index.html
│
└── backend/                   # Node.js + Express middleware
    ├── server.js              # Hardened Express entry point
    ├── systemPrompt.js        # 🔑 Master Gemini system prompt
    ├── controllers/
    │   └── medicalCodesController.js  # Standard + SSE handlers
    ├── routes/
    │   └── medicalCodes.js    # Route definitions + validation
    └── .env                   # 🔐 API keys (never commit this)
```

---

## 🔌 API Reference

### `GET /api/health`
Returns service status and configuration.

### `POST /api/generate-medical-codes`
Standard (blocking) code generation.

**Body:**
```json
{
  "clinicalNote": "Patient presents with...",
  "autoDetect": true
}
```

### `POST /api/generate-medical-codes/stream`
SSE streaming (real-time). Same body as above.
Connect with `fetch()` + `ReadableStream` or `EventSource`.

---

## 🔐 Security

- API keys stored in `.env` — never exposed to frontend
- CORS restricted to `localhost:5173` by default (configure `ALLOWED_ORIGINS`)
- Prompt injection detection in input validation middleware
- Rate limited: 30 AI requests per 15-minute window per IP
- JSON body size capped at 50kb

---

## ⚠️ Medical Disclaimer

AI-generated codes are **clinical decision support tools** only. All outputs
must be **validated by a licensed clinician** before entry into any EHR system.
