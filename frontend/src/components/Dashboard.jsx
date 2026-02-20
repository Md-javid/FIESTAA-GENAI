/**
 * Dashboard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The primary workstation UI — split-screen physician canvas (left) +
 * GenAI output terminal (right).
 *
 * Libraries: Framer Motion (animations), Lucide React (icons), Axios (HTTP)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Stethoscope, Zap, Activity, Shield, ChevronRight, Copy,
    Download, RefreshCw, BrainCircuit, Sparkles, FileText,
    CheckCircle2, AlertTriangle, Info, X,
} from 'lucide-react';
import axios from 'axios';

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
};

const fadeInLeft = {
    hidden: { opacity: 0, x: -24 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
};

const fadeInRight = {
    hidden: { opacity: 0, x: 24 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
    },
};

// ─── SAMPLE clinical notes for quick demo ─────────────────────────────────────
const SAMPLE_NOTES = [
    `Patient: 58M presenting with progressive anxiety, sleep disturbance (initial insomnia), and somatic complaints including palpitations and epigastric discomfort. Reports 3-month history of excessive worry about health and finances. PHQ-9 score 12, GAD-7 score 16. No prior psychiatric history. No substance use. Vital signs normal.`,
    `Patient: 34F with 6-month history of low mood, anhedonia, fatigue, and poor concentration. Reports crying spells daily. Appetite decreased by ~30%. Weight loss 4kg over 3 months. Denies suicidal ideation. Family history of depression (mother). Currently not on any medications.`,
    `Patient: 22M, college student, presenting with 2-year history of recurrent intrusive thoughts about contamination and compulsive hand-washing (>30 times/day). Significant functional impairment. YBOCS score 28. No medical comorbidities. Requesting pharmacotherapy.`,
];

// ─── iOS Toggle Switch Component ────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, id, label, sublabel }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 }}>
                    {label}
                </p>
                {sublabel && (
                    <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)' }}>{sublabel}</p>
                )}
            </div>
            <label className="ios-toggle" htmlFor={id} aria-label={label}>
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="ios-slider" />
            </label>
        </div>
    );
}

// ─── Confidence Ring Component ───────────────────────────────────────────────
function ConfidenceRing({ value, label }) {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
                {/* Track */}
                <circle
                    cx="40" cy="40" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="6"
                />
                {/* Progress */}
                <motion.circle
                    className="confidence-ring"
                    cx="40" cy="40" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    style={{
                        transformOrigin: '40px 40px',
                        transform: 'rotate(-90deg)',
                        filter: `drop-shadow(0 0 6px ${color})`,
                    }}
                />
                {/* Value text */}
                <text
                    x="40" y="40"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill={color}
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="Inter, sans-serif"
                >
                    {value}%
                </text>
            </svg>
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)', fontWeight: 500 }}>
                {label}
            </span>
        </div>
    );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonLoader() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                    {/* Header skeleton */}
                    <div className="skeleton" style={{ height: 18, width: '40%', borderRadius: 6 }} />
                    {/* Content lines */}
                    <div className="skeleton" style={{ height: 14, width: '90%' }} />
                    <div className="skeleton" style={{ height: 14, width: '75%' }} />
                    <div className="skeleton" style={{ height: 14, width: '60%' }} />
                </motion.div>
            ))}
        </div>
    );
}

// ─── Code Badge ───────────────────────────────────────────────────────────────
function CodeBadge({ code, type }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 8,
                background: type === 'icd'
                    ? 'rgba(0,212,255,0.12)'
                    : 'rgba(139,92,246,0.12)',
                border: `1px solid ${type === 'icd' ? 'rgba(0,212,255,0.25)' : 'rgba(139,92,246,0.25)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            title="Click to copy"
        >
            <span style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'monospace',
                color: type === 'icd' ? '#00d4ff' : '#a78bfa',
                letterSpacing: '0.05em',
            }}>
                {code}
            </span>
            <motion.span
                key={copied ? 'check' : 'copy'}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
            >
                {copied
                    ? <CheckCircle2 size={11} color="#10b981" />
                    : <Copy size={11} color={type === 'icd' ? 'rgba(0,212,255,0.6)' : 'rgba(167,139,250,0.6)'} />
                }
            </motion.span>
        </motion.div>
    );
}

// ─── Result Card Component ────────────────────────────────────────────────────
function ResultCard({ data, streamingText, isStreaming }) {
    if (!data && !isStreaming) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ICD-11 Section */}
            {(data?.icd11 || isStreaming) && (
                <motion.div
                    className="code-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{ padding: 20 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'rgba(0,212,255,0.1)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <Activity size={13} color="#00d4ff" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.08em' }}>
                                ICD-11 TM2
                            </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>
                            WHO Clinical Codes
                        </span>
                    </div>

                    {isStreaming && !data?.icd11 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                            <div className="pulse-dot" style={{
                                width: 6, height: 6, borderRadius: '50%', background: '#00d4ff',
                            }} />
                            <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.8)' }}>
                                Generating ICD-11 codes
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {data?.icd11?.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <CodeBadge code={item.code} type="icd" />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                                            {item.description}
                                        </span>
                                    </div>
                                    {item.notes && (
                                        <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', paddingLeft: 4, lineHeight: 1.5 }}>
                                            {item.notes}
                                        </p>
                                    )}
                                    {/* Mini confidence bar */}
                                    {item.confidence != null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden',
                                            }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.confidence}%` }}
                                                    transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: 'easeOut' }}
                                                    style={{
                                                        height: '100%',
                                                        borderRadius: 3,
                                                        background: item.confidence >= 80 ? '#10b981'
                                                            : item.confidence >= 60 ? '#f59e0b'
                                                                : '#ef4444',
                                                        boxShadow: `0 0 6px ${item.confidence >= 80 ? '#10b981' : '#f59e0b'}`,
                                                    }}
                                                />
                                            </div>
                                            <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', minWidth: 28 }}>
                                                {item.confidence}%
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* NAMASTE Section */}
            {(data?.namaste || isStreaming) && (
                <motion.div
                    className="code-card-purple"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    style={{ padding: 20 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'rgba(139,92,246,0.1)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <BrainCircuit size={13} color="#a78bfa" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em' }}>
                                NAMASTE
                            </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>
                            Indian EHR Standard Codes
                        </span>
                    </div>

                    {isStreaming && !data?.namaste ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                            <div className="pulse-dot" style={{
                                width: 6, height: 6, borderRadius: '50%', background: '#a78bfa',
                            }} />
                            <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.8)' }}>
                                Mapping to NAMASTE framework
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {data?.namaste?.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <CodeBadge code={item.code} type="namaste" />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                                            {item.description}
                                        </span>
                                    </div>
                                    {item.ayush_correlation && (
                                        <p style={{ fontSize: 11, color: 'rgba(167,139,250,0.7)', paddingLeft: 4 }}>
                                            AYUSH correlation: {item.ayush_correlation}
                                        </p>
                                    )}
                                    {item.notes && (
                                        <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.75)', paddingLeft: 4, lineHeight: 1.5 }}>
                                            {item.notes}
                                        </p>
                                    )}
                                    {item.confidence != null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                flex: 1, height: 3, background: 'rgba(255,255,255,0.07)',
                                                borderRadius: 3, overflow: 'hidden',
                                            }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.confidence}%` }}
                                                    transition={{ duration: 0.8, delay: 0.4 + idx * 0.1, ease: 'easeOut' }}
                                                    style={{
                                                        height: '100%',
                                                        borderRadius: 3,
                                                        background: item.confidence >= 80 ? '#10b981'
                                                            : item.confidence >= 60 ? '#f59e0b'
                                                                : '#ef4444',
                                                        boxShadow: `0 0 6px ${item.confidence >= 80 ? '#10b981' : '#f59e0b'}`,
                                                    }}
                                                />
                                            </div>
                                            <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', minWidth: 28 }}>
                                                {item.confidence}%
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Clinical Summary */}
            {data?.clinical_summary && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <FileText size={13} color="rgba(148,163,184,0.7)" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.8)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Clinical Summary
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(226,232,240,0.85)', lineHeight: 1.65 }}>
                        {data.clinical_summary}
                    </p>
                </motion.div>
            )}

            {/* EHR Compliance flags */}
            {data?.ehr_compliance && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.45 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                    {data.ehr_compliance.map((flag, i) => (
                        <motion.span
                            key={i}
                            className="pill-badge pill-green"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                        >
                            <CheckCircle2 size={10} />
                            {flag}
                        </motion.span>
                    ))}
                </motion.div>
            )}

            {/* Disclaimer */}
            {data && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        display: 'flex', gap: 8, padding: '10px 14px',
                        borderRadius: 8,
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.15)',
                    }}
                >
                    <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: 'rgba(245,158,11,0.85)', lineHeight: 1.55 }}>
                        AI-generated codes require clinical validation before EHR entry. Verify against official
                        WHO ICD-11 and NAMASTE coding manuals.
                    </p>
                </motion.div>
            )}
        </div>
    );
}

// ─── HEADER COMPONENT ─────────────────────────────────────────────────────────
function Header() {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
                padding: '0 32px',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(5,5,8,0.8)',
                backdropFilter: 'blur(20px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(0,212,255,0.3)',
                }}>
                    <BrainCircuit size={18} color="white" />
                </div>
                <div>
                    <h1 style={{
                        fontSize: 17, fontWeight: 800,
                        background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                    }}>
                        MediCode AI
                    </h1>
                    <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', letterSpacing: '0.05em' }}>
                        NAMASTE & ICD-11 EHR MIDDLEWARE
                    </p>
                </div>
            </div>

            {/* Status pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="pill-badge pill-green">
                    <span className="pulse-dot" style={{
                        display: 'inline-block', width: 5, height: 5,
                        borderRadius: '50%', background: '#10b981',
                    }} />
                    API Online
                </span>
                <span className="pill-badge pill-teal">
                    <Shield size={9} />
                    ABDM Compliant
                </span>
                <span className="pill-badge pill-purple">
                    <Zap size={9} />
                    Gemini 1.5 Pro
                </span>
            </div>
        </motion.header>
    );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
    const [clinicalNote, setClinicalNote] = useState('');
    const [result, setResult] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | loading | streaming | done | error
    const [errorMsg, setErrorMsg] = useState('');
    const [autoDetect, setAutoDetect] = useState(true);
    const [liveStreaming, setLiveStreaming] = useState(true);
    const [streamedText, setStreamedText] = useState('');
    const [overallConfidence, setOverallConf] = useState(0);
    const [charCount, setCharCount] = useState(0);

    const textareaRef = useRef(null);
    const outputRef = useRef(null);

    const MAX_CHARS = 2000;

    // Auto-scroll output panel
    useEffect(() => {
        if (outputRef.current && (status === 'streaming' || status === 'done')) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [streamedText, result, status]);

    // Character count
    const handleNoteChange = useCallback((e) => {
        const val = e.target.value;
        if (val.length <= MAX_CHARS) {
            setClinicalNote(val);
            setCharCount(val.length);
        }
    }, []);

    // Insert sample note
    const insertSample = useCallback((idx) => {
        const note = SAMPLE_NOTES[idx];
        setClinicalNote(note);
        setCharCount(note.length);
        textareaRef.current?.focus();
    }, []);

    // Copy all output JSON
    const copyJSON = useCallback(() => {
        if (result) {
            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        }
    }, [result]);

    // Download as JSON
    const downloadJSON = useCallback(() => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medicode-output-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [result]);

    // ─── Main API Call ──────────────────────────────────────────────────────────
    const generateCodes = useCallback(async () => {
        if (!clinicalNote.trim()) return;

        setStatus('loading');
        setResult(null);
        setStreamedText('');
        setErrorMsg('');
        setOverallConf(0);

        try {
            if (liveStreaming) {
                // ── Streaming Mode ──────────────────────────────────────────────────
                setStatus('streaming');

                const response = await fetch('/api/generate-medical-codes/stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clinicalNote,
                        autoDetect,
                    }),
                });

                if (!response.ok) throw new Error(`Server error: ${response.status}`);

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    // SSE format: lines starting with "data: "
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const payload = line.slice(6);
                            if (payload === '[DONE]') break;
                            try {
                                const parsed = JSON.parse(payload);
                                if (parsed.text) {
                                    accumulated += parsed.text;
                                    setStreamedText(accumulated);
                                }
                                if (parsed.final) {
                                    setResult(parsed.final);
                                    const conf = parsed.final.overall_confidence ?? 0;
                                    setOverallConf(conf);
                                    setStatus('done');
                                }
                            } catch (_) { /* partial chunk, keep going */ }
                        }
                    }
                }
                if (status !== 'done') setStatus('done');

            } else {
                // ── Non-Streaming Mode ───────────────────────────────────────────────
                const { data } = await axios.post('/api/generate-medical-codes', {
                    clinicalNote,
                    autoDetect,
                });
                setResult(data);
                setOverallConf(data.overall_confidence ?? 0);
                setStatus('done');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || 'Failed to reach the AI backend. Please try again.');
            setStatus('error');
        }
    }, [clinicalNote, autoDetect, liveStreaming, status]);

    const resetAll = useCallback(() => {
        setClinicalNote('');
        setResult(null);
        setStatus('idle');
        setStreamedText('');
        setErrorMsg('');
        setCharCount(0);
        setOverallConf(0);
    }, []);

    const isProcessing = status === 'loading' || status === 'streaming';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            {/* ── Stats bar ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 32,
                    padding: '12px 32px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    overflowX: 'auto',
                }}
            >
                {[
                    { label: 'ICD-11 TM2 Codes', value: '78,000+', icon: Activity, color: '#00d4ff' },
                    { label: 'NAMASTE Domains', value: '8', icon: BrainCircuit, color: '#a78bfa' },
                    { label: 'EHR Standard', value: 'ABDM v3', icon: Shield, color: '#10b981' },
                    { label: 'Avg Confidence', value: '91.4%', icon: Sparkles, color: '#f59e0b' },
                ].map(({ label, value, icon: Icon, color }, i) => (
                    <motion.div
                        key={label}
                        custom={i}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
                    >
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: `${color}15`,
                            border: `1px solid ${color}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Icon size={14} color={color} />
                        </div>
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color }}>{value}</p>
                            <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', whiteSpace: 'nowrap' }}>{label}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── SPLIT SCREEN WORKSTATION ── */}
            <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 0,
                padding: '24px 24px 24px 24px',
                maxWidth: 1600,
                margin: '0 auto',
                width: '100%',
            }}>

                {/* ════════════════════════════════════════
            LEFT PANEL — PHYSICIAN'S CANVAS
            ════════════════════════════════════════ */}
                <motion.div
                    variants={fadeInLeft}
                    initial="hidden"
                    animate="visible"
                    style={{
                        display: 'flex', flexDirection: 'column', gap: 16,
                        paddingRight: 12,
                    }}
                >
                    {/* Panel header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Stethoscope size={16} color="#00d4ff" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                                PHYSICIAN'S CANVAS
                            </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>
                            {charCount} / {MAX_CHARS}
                        </span>
                    </div>

                    {/* Glass text editor container */}
                    <div
                        className="glass-panel-strong"
                        style={{ borderRadius: 20, padding: 4, flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                        <textarea
                            ref={textareaRef}
                            id="clinical-note-input"
                            className="glass-input"
                            value={clinicalNote}
                            onChange={handleNoteChange}
                            placeholder="Type or paste your clinical notes here…

Example:
Patient presents with 3 weeks of low mood, insomnia, decreased appetite, poor concentration, and anhedonia. Reports feeling hopeless. PHQ-9 score 18. No suicidal ideation. No prior psychiatric history."
                            style={{
                                width: '100%',
                                minHeight: 340,
                                padding: '20px 22px',
                                fontSize: 14,
                                lineHeight: 1.7,
                                color: '#e2e8f0',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 16,
                                resize: 'vertical',
                                fontFamily: 'Inter, sans-serif',
                                caretColor: '#00d4ff',
                            }}
                        />
                    </div>

                    {/* Quick sample notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Quick Load Sample
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {['Anxiety + GAD', 'Major Depression', 'OCD'].map((label, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => insertSample(i)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 8,
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(148,163,184,0.8)',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        fontFamily: 'Inter, sans-serif',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="glass-panel" style={{ borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <ToggleSwitch
                            id="auto-detect"
                            checked={autoDetect}
                            onChange={setAutoDetect}
                            label="Auto-Detect Symptoms"
                            sublabel="AI extracts symptoms from raw prose"
                        />
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                        <ToggleSwitch
                            id="live-streaming"
                            checked={liveStreaming}
                            onChange={setLiveStreaming}
                            label="Live AI Streaming"
                            sublabel="See codes appear in real-time"
                        />
                    </div>

                    {/* Generate button */}
                    <motion.button
                        id="generate-codes-btn"
                        className="btn-generate"
                        onClick={generateCodes}
                        disabled={isProcessing || !clinicalNote.trim()}
                        whileHover={!isProcessing && clinicalNote.trim() ? { scale: 1.02 } : {}}
                        whileTap={!isProcessing && clinicalNote.trim() ? { scale: 0.98 } : {}}
                        style={{
                            width: '100%',
                            padding: '16px 24px',
                            borderRadius: 14,
                            fontSize: 15,
                            cursor: isProcessing || !clinicalNote.trim() ? 'not-allowed' : 'pointer',
                            opacity: isProcessing || !clinicalNote.trim() ? 0.5 : 1,
                            fontFamily: 'Inter, sans-serif',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                            {isProcessing ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <RefreshCw size={18} />
                                    </motion.div>
                                    <span>{liveStreaming ? 'Streaming AI Response…' : 'Generating Codes…'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>Generate Standardized Codes</span>
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </span>
                    </motion.button>

                    {/* Processing progress bar */}
                    <AnimatePresence>
                        {isProcessing && (
                            <motion.div
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ height: 2, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}
                            >
                                <div className="status-processing" style={{ height: '100%', borderRadius: 2 }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ════════════════════════════════════════
            RIGHT PANEL — GenAI BRAIN / OUTPUT
            ════════════════════════════════════════ */}
                <motion.div
                    variants={fadeInRight}
                    initial="hidden"
                    animate="visible"
                    style={{
                        display: 'flex', flexDirection: 'column', gap: 16,
                        paddingLeft: 12,
                    }}
                >
                    {/* Panel header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BrainCircuit size={16} color="#a78bfa" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                                GENAI BRAIN — OUTPUT TERMINAL
                            </span>
                        </div>
                        {status === 'done' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={copyJSON}
                                    className="btn-neon-teal"
                                    style={{
                                        padding: '5px 12px', borderRadius: 8, fontSize: 12,
                                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                    }}
                                    title="Copy JSON"
                                >
                                    <Copy size={12} /> Copy
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={downloadJSON}
                                    className="btn-neon-teal"
                                    style={{
                                        padding: '5px 12px', borderRadius: 8, fontSize: 12,
                                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                    }}
                                    title="Download JSON"
                                >
                                    <Download size={12} /> Export
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={resetAll}
                                    style={{
                                        padding: '5px 12px', borderRadius: 8, fontSize: 12,
                                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(148,163,184,0.7)',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        transition: 'all 0.2s ease',
                                    }}
                                    title="Reset"
                                >
                                    <RefreshCw size={12} /> Reset
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* Output terminal glass container */}
                    <div
                        ref={outputRef}
                        className="glass-panel-strong"
                        style={{
                            borderRadius: 20,
                            padding: '24px',
                            flex: 1,
                            minHeight: 420,
                            maxHeight: 600,
                            overflowY: 'auto',
                            position: 'relative',
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {/* ── IDLE state ── */}
                            {status === 'idle' && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        height: '100%', minHeight: 360,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        gap: 16, textAlign: 'center', padding: '24px',
                                    }}
                                >
                                    <div style={{
                                        width: 72, height: 72, borderRadius: 20,
                                        background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(139,92,246,0.12))',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <BrainCircuit size={32} color="rgba(139,92,246,0.6)" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(148,163,184,0.6)', marginBottom: 6 }}>
                                            Awaiting Clinical Input
                                        </p>
                                        <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.4)', maxWidth: 280, lineHeight: 1.6 }}>
                                            Enter a clinical note on the left panel and click{' '}
                                            <span style={{ color: 'rgba(0,212,255,0.7)' }}>"Generate Standardized Codes"</span>{' '}
                                            to begin.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                                        <span className="pill-badge pill-teal"><Activity size={9} />ICD-11 TM2</span>
                                        <span className="pill-badge pill-purple"><BrainCircuit size={9} />NAMASTE</span>
                                        <span className="pill-badge pill-green"><Shield size={9} />ABDM</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── LOADING skeleton ── */}
                            {status === 'loading' && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <RefreshCw size={16} color="#a78bfa" />
                                        </motion.div>
                                        <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500 }}>
                                            Initialising GenAI pipeline…
                                        </span>
                                    </div>
                                    <SkeletonLoader />
                                </motion.div>
                            )}

                            {/* ── STREAMING ── */}
                            {(status === 'streaming' || status === 'done') && (
                                <motion.div
                                    key="output"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                                >
                                    {/* Overall confidence + status */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                        {status === 'streaming' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <motion.div
                                                    animate={{ scale: [1, 1.3, 1] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                >
                                                    <Sparkles size={14} color="#00d4ff" />
                                                </motion.div>
                                                <span style={{ fontSize: 13, color: '#00d4ff', fontWeight: 600 }}>
                                                    AI generating codes
                                                    <span className="typewriter-cursor" />
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <CheckCircle2 size={15} color="#10b981" />
                                                <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                                                    Codes generated successfully
                                                </span>
                                            </div>
                                        )}

                                        {overallConfidence > 0 && (
                                            <ConfidenceRing
                                                value={overallConfidence}
                                                label="Overall Confidence"
                                            />
                                        )}
                                    </div>

                                    {/* Streaming raw text (before parse) */}
                                    {streamedText && status === 'streaming' && !result && (
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: 10,
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid rgba(0,212,255,0.1)',
                                            fontFamily: 'monospace',
                                            fontSize: 11,
                                            color: 'rgba(0,212,255,0.8)',
                                            lineHeight: 1.6,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                        }}>
                                            {streamedText}
                                            <span className="typewriter-cursor" />
                                        </div>
                                    )}

                                    {/* Parsed result cards */}
                                    <ResultCard
                                        data={result}
                                        streamingText={streamedText}
                                        isStreaming={status === 'streaming' && !result}
                                    />
                                </motion.div>
                            )}

                            {/* ── ERROR ── */}
                            {status === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        height: '100%', minHeight: 300,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        gap: 14, textAlign: 'center', padding: 24,
                                    }}
                                >
                                    <div style={{
                                        width: 56, height: 56, borderRadius: 16,
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <X size={24} color="#ef4444" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>
                                            Generation Failed
                                        </p>
                                        <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', maxWidth: 300, lineHeight: 1.6 }}>
                                            {errorMsg}
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={resetAll}
                                        style={{
                                            padding: '8px 20px', borderRadius: 8,
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.25)',
                                            color: '#ef4444', fontSize: 13,
                                            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                    >
                                        <RefreshCw size={13} /> Try Again
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* EHR interoperability info bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: 'rgba(0,212,255,0.04)',
                            border: '1px solid rgba(0,212,255,0.1)',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}
                    >
                        <Info size={13} color="rgba(0,212,255,0.6)" style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', lineHeight: 1.55 }}>
                            Outputs are structured as FHIR R4-compatible JSON, ready for ingestion
                            into ABDM-compliant EHR systems. Supports HL7 v2/v3 and SNOMED CT mapping.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
