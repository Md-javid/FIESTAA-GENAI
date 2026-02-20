/**
 * routes/medicalCodes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Express router for all /api/* endpoints.
 *
 * Routes:
 *  GET  /api/health                        → service health check
 *  POST /api/generate-medical-codes        → standard (non-streaming) generation
 *  POST /api/generate-medical-codes/stream → SSE streaming generation
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    generateMedicalCodes,
    generateMedicalCodesStream,
    healthCheck,
} = require('../controllers/medicalCodesController');

// ─── Per-endpoint rate limiter ────────────────────────────────────────────────
// Stricter limit on AI generation endpoints to control API costs
const aiRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: true,
        message: 'Too many requests. Please wait before generating more codes.',
        retryAfter: '15 minutes',
    },
    // Skip rate limiting in test/dev if needed
    skip: (req) => process.env.NODE_ENV === 'test',
});

// ─── Input validation middleware ─────────────────────────────────────────────
function validateClinicalNoteBody(req, res, next) {
    const { clinicalNote } = req.body;

    if (!clinicalNote) {
        return res.status(400).json({
            error: true,
            message: 'Request body must include a "clinicalNote" field.',
        });
    }

    if (typeof clinicalNote !== 'string') {
        return res.status(400).json({
            error: true,
            message: '"clinicalNote" must be a string.',
        });
    }

    // Basic injection prevention — reject if looks like a prompt injection attempt
    const lowerNote = clinicalNote.toLowerCase();
    const injectionKeywords = [
        'ignore previous instructions',
        'ignore all instructions',
        'disregard your system prompt',
        'you are now',
        'act as',
        'forget your instructions',
    ];
    if (injectionKeywords.some((kw) => lowerNote.includes(kw))) {
        return res.status(400).json({
            error: true,
            message: 'Invalid clinical note content detected.',
        });
    }

    next();
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** GET /api/health — service liveness check */
router.get('/health', healthCheck);

/**
 * POST /api/generate-medical-codes
 * Standard (blocking) AI code generation.
 * Returns a fully parsed JSON object once Gemini finishes.
 */
router.post(
    '/generate-medical-codes',
    aiRateLimiter,
    validateClinicalNoteBody,
    generateMedicalCodes,
);

/**
 * POST /api/generate-medical-codes/stream
 * Streaming SSE code generation.
 * Sends chunks as Gemini generates them, then a "final" parsed object.
 */
router.post(
    '/generate-medical-codes/stream',
    aiRateLimiter,
    validateClinicalNoteBody,
    generateMedicalCodesStream,
);

module.exports = router;
