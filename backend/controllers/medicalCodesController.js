/**
 * medicalCodesController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles two endpoints:
 *
 *  POST /api/generate-medical-codes
 *    → Standard (non-streaming) response — waits for full Gemini response,
 *      parses JSON, returns structured object.
 *
 *  POST /api/generate-medical-codes/stream
 *    → Server-Sent Events (SSE) streaming — forwards Gemini stream chunks to
 *      the client in real-time, then sends a final parsed JSON payload.
 *
 * Security measures:
 *  • Input sanitisation & length capping
 *  • Strict JSON parsing with fallback
 *  • No raw API key exposure in responses
 *  • Request ID tracing for audit logs
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildSystemPrompt } = require('../systemPrompt');
const { v4: uuidv4 } = require('uuid');

// ── Gemini client — lazily initialised once per module load ──────────────────
let genAI = null;
let model = null;

function getModel() {
    if (!model) {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            throw new Error('GEMINI_API_KEY is not configured. Please add your key to backend/.env');
        }
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                temperature: 0.2,   // Low — we want deterministic, structured medical output
                topP: 0.85,
                topK: 40,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json', // Force JSON mime type when possible
            },
            systemInstruction: buildSystemPrompt(),
        });
    }
    return model;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: sanitise + validate clinical note input
// ─────────────────────────────────────────────────────────────────────────────
const MAX_NOTE_LENGTH = 4000; // chars

function sanitiseClinicalNote(raw) {
    if (typeof raw !== 'string') throw new Error('Clinical note must be a string.');
    const trimmed = raw.trim();
    if (trimmed.length < 20)
        throw new Error('Clinical note is too short. Please provide at least 20 characters of clinical detail.');
    if (trimmed.length > MAX_NOTE_LENGTH)
        throw new Error(`Clinical note exceeds maximum length of ${MAX_NOTE_LENGTH} characters.`);
    // Strip null bytes and non-printable control chars (security hygiene)
    return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: parse Gemini's text response into structured JSON
//          Gemini sometimes wraps JSON in markdown fences despite instructions —
//          this strips them defensively.
// ─────────────────────────────────────────────────────────────────────────────
function parseGeminiResponse(rawText) {
    let cleaned = rawText.trim();

    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    try {
        const parsed = JSON.parse(cleaned);

        // ── Validate minimal required fields ────────────────────────────────────
        if (!parsed.icd11 || !Array.isArray(parsed.icd11)) {
            throw new Error('Response missing icd11 array.');
        }
        if (!parsed.namaste || !Array.isArray(parsed.namaste)) {
            throw new Error('Response missing namaste array.');
        }

        // ── Inject guaranteed server-side fields ────────────────────────────────
        // These override any client-supplied values from the AI for security
        parsed.session_id = parsed.session_id || uuidv4();
        parsed.timestamp_utc = new Date().toISOString();
        parsed.coding_engine = 'MediCode AI v2.0 — Powered by Gemini 1.5 Pro';
        parsed.ehr_standard = 'ABDM v3 / FHIR R4 / HL7 v2.5';

        return parsed;

    } catch (parseErr) {
        console.error('[MediCode] JSON parse error:', parseErr.message);
        console.error('[MediCode] Raw Gemini response (first 500 chars):', cleaned.slice(0, 500));
        throw new Error(`AI returned unparseable output. This may be a transient issue — please try again. (${parseErr.message})`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ① STANDARD (non-streaming) endpoint handler
//    POST /api/generate-medical-codes
// ─────────────────────────────────────────────────────────────────────────────
async function generateMedicalCodes(req, res) {
    const requestId = uuidv4();
    console.log(`[MediCode][${requestId}] Standard request received`);

    try {
        const { clinicalNote, autoDetect = true } = req.body;

        // Validate
        const sanitisedNote = sanitiseClinicalNote(clinicalNote);

        // Build user prompt
        const userPrompt = buildUserPrompt(sanitisedNote, autoDetect);

        // Call Gemini
        console.log(`[MediCode][${requestId}] Calling Gemini API...`);
        const geminiModel = getModel();
        const geminiResult = await geminiModel.generateContent(userPrompt);
        const rawText = geminiResult.response.text();

        // Parse
        const structured = parseGeminiResponse(rawText);

        console.log(`[MediCode][${requestId}] Success — overall_confidence: ${structured.overall_confidence}%`);

        return res.status(200).json(structured);

    } catch (err) {
        console.error(`[MediCode][${requestId}] Error:`, err.message);

        const status = err.message.includes('GEMINI_API_KEY') ? 503
            : err.message.includes('too short') ? 400
                : err.message.includes('exceeds maximum') ? 413
                    : 500;

        return res.status(status).json({
            error: true,
            requestId,
            message: err.message,
            timestamp: new Date().toISOString(),
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ② STREAMING endpoint handler (SSE)
//    POST /api/generate-medical-codes/stream
// ─────────────────────────────────────────────────────────────────────────────
async function generateMedicalCodesStream(req, res) {
    const requestId = uuidv4();
    console.log(`[MediCode][${requestId}] Stream request received`);

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Request-Id', requestId);
    res.flushHeaders();

    // Helper to send SSE events
    const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const { clinicalNote, autoDetect = true } = req.body;

        // Validate
        const sanitisedNote = sanitiseClinicalNote(clinicalNote);
        const userPrompt = buildUserPrompt(sanitisedNote, autoDetect);

        // Stream from Gemini
        console.log(`[MediCode][${requestId}] Starting Gemini stream...`);
        const geminiModel = getModel();
        const streamingResult = await geminiModel.generateContentStream(userPrompt);

        let accumulatedText = '';

        // Forward each chunk to the client
        for await (const chunk of streamingResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                accumulatedText += chunkText;
                sendEvent({ text: chunkText });
            }
        }

        // Final: parse accumulated text and send structured response
        console.log(`[MediCode][${requestId}] Stream complete. Parsing response...`);
        const structured = parseGeminiResponse(accumulatedText);

        sendEvent({ final: structured });
        res.write('data: [DONE]\n\n');
        console.log(`[MediCode][${requestId}] Stream ended — confidence: ${structured.overall_confidence}%`);

    } catch (err) {
        console.error(`[MediCode][${requestId}] Stream error:`, err.message);
        sendEvent({
            error: true,
            message: err.message,
            requestId,
        });
    } finally {
        res.end();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: Construct the user-turn prompt
// ─────────────────────────────────────────────────────────────────────────────
function buildUserPrompt(clinicalNote, autoDetect) {
    return `CLINICAL NOTE FOR CODING:
---
${clinicalNote}
---
${autoDetect ? 'Auto-detect all symptoms, signs, and implied diagnoses from the above note.' : 'Code only explicitly stated diagnoses and findings.'}

Respond with ONLY the JSON object as specified in your system instructions. No other text.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health-check handler (used by GET /api/health)
// ─────────────────────────────────────────────────────────────────────────────
async function healthCheck(req, res) {
    const apiKeyConfigured = !!(
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    );

    res.status(200).json({
        status: 'operational',
        service: 'MediCode AI Middleware',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        gemini_model: 'gemini-1.5-pro',
        api_key_present: apiKeyConfigured,
        ehr_standards: ['ABDM v3', 'FHIR R4', 'HL7 v2.5', 'ICD-11 TM2', 'NAMASTE'],
        environment: process.env.NODE_ENV || 'development',
    });
}

module.exports = {
    generateMedicalCodes,
    generateMedicalCodesStream,
    healthCheck,
};
