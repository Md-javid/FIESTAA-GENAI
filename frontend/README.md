# MediCode AI -- Frontend

React 19 + Vite 7 single-page application for the MediCode AI platform.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| HTTP | Axios |
| Auth | JWT (stored in localStorage) |

---

## Project Layout

`
frontend/
 src/
    App.jsx               # Root router + auth gate
    main.jsx
    context/
       AuthContext.jsx   # JWT auth state (login/logout/refresh)
    components/
        LoginPage.jsx         # Login & register
        Dashboard.jsx         # Main AI workstation
        PatientsPage.jsx      # Patient management
        HistoryPage.jsx       # Code generation history
        AnalyticsDashboard.jsx
        FhirExplorer.jsx      # FHIR R4 compliance checker
        CompliancePage.jsx
        HospitalDashboard.jsx
        SettingsPage.jsx
        Sidebar.jsx
 public/
 Dockerfile
 nginx.conf         # SPA routing + /api proxy to backend:8000
 vite.config.js     # Dev proxy to localhost:8000
 package.json
`

---

## Local Setup

`ash
cd frontend
npm install
npm run dev
`

App runs at **http://localhost:5173**. Proxies /api/* to http://localhost:8000.

> Make sure the Django backend is running on port 8000 first.

---

## Scripts

| Command | Description |
|---------|-------------|
| pm run dev\ | Vite dev server with hot-reload |
| pm run build\ | Production build to dist/ |
| pm run preview\ | Preview production build |
| pm run lint\ | ESLint |

---

## Docker

`ash
docker compose up --build
`

Served via Nginx at **http://localhost:3000**
