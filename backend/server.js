/**
 * server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * MediCode AI — Express Backend Entry Point
 *
 * Security hardening:
 *  • Helmet (HTTP security headers)
 *  • CORS with strict origin allowlist
 *  • express-rate-limit (global + per-route)
 *  • JSON body size limit
 *  • Global error handler
 *
 * Architecture:
 *  ┌─────────────────────────────────────────┐
 *  │  React Frontend (Vite, :5173)           │
 *  │  → proxies /api/* to :5001              │
 *  └────────────────┬────────────────────────┘
 *                   │ HTTP / SSE
 *  ┌────────────────▼────────────────────────┐
 *  │  Express Server (:5001)                 │
 *  │  ├── /api/health                        │
 *  │  ├── /api/generate-medical-codes        │
 *  │  └── /api/generate-medical-codes/stream │
 *  └────────────────┬────────────────────────┘
 *                   │ @google/generative-ai SDK
 *  ┌────────────────▼────────────────────────┐
 *  │  Google Gemini 1.5 Pro API              │
 *  └─────────────────────────────────────────┘
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ── Import routes ─────────────────────────────────────────────────────────────
const medicalCodesRouter = require('./routes/medicalCodes');

// ── App instance ──────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5001;

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE STACK
// ══════════════════════════════════════════════════════════════════════════════

// 1. Security headers (Helmet)
app.use(
    helmet({
        // Allow cross-origin requests from localhost for development
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false, // CSP is handled by the frontend
    })
);

// 2. CORS — only allow listed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. curl, Postman, mobile clients)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: Origin "${origin}" not allowed.`));
            }
        },
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
        exposedHeaders: ['X-Request-Id'],
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

// 3. JSON body parser — cap at 50kb (clinical notes should never be huge)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// 4. Global rate limiter (broad protection — per-endpoint limiter is stricter)
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: true,
        message: 'Too many requests from this IP. Please slow down.',
    },
});
app.use(globalLimiter);

// 5. Request logger (lightweight, no external dependency)
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Mount all /api routes
app.use('/api', medicalCodesRouter);

// Root ping — quick liveness check
app.get('/', (_req, res) => {
    res.json({
        service: 'MediCode AI Middleware',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        docs: 'POST /api/generate-medical-codes | POST /api/generate-medical-codes/stream | GET /api/health',
    });
});

// 404 handler — catches unmatched routes
app.use((_req, res) => {
    res.status(404).json({
        error: true,
        message: 'Route not found.',
        hint: 'Available: POST /api/generate-medical-codes, POST /api/generate-medical-codes/stream, GET /api/health',
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ══════════════════════════════════════════════════════════════════════════════
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[Global Error Handler]', err.message);

    // CORS errors
    if (err.message && err.message.startsWith('CORS:')) {
        return res.status(403).json({ error: true, message: err.message });
    }

    // JSON parse errors
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: true, message: 'Invalid JSON in request body.' });
    }

    // JSON body too large
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: true, message: 'Request body too large.' });
    }

    res.status(500).json({
        error: true,
        message: process.env.NODE_ENV === 'production'
            ? 'An internal server error occurred.'
            : err.message,
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║         MediCode AI — EHR Middleware Backend             ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  🟢 Server online at   http://localhost:${PORT}           ║`);
    console.log(`║  📋 Health check:      http://localhost:${PORT}/api/health ║`);
    console.log(`║  🧠 Gemini Model:      gemini-1.5-pro                    ║`);
    console.log(`║  🛡️  Standards:         ICD-11 TM2 | NAMASTE | ABDM v3   ║`);
    console.log(`║  🌍 Environment:       ${(process.env.NODE_ENV || 'development').padEnd(33)}║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn('⚠️  WARNING: GEMINI_API_KEY is not set in backend/.env');
        console.warn('   → Get your free key at https://aistudio.google.com/');
        console.warn('   → Add it to backend/.env as GEMINI_API_KEY=...\n');
    } else {
        console.log('✅ Gemini API key detected and ready.\n');
    }
});

module.exports = app; // for testing
