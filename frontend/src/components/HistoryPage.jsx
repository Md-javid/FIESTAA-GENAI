/**
 * HistoryPage.jsx
 * Coding session history — timeline view of past AI coding sessions.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    History as HistoryIcon, Search, Calendar, Clock, ChevronDown, Download,
    Activity, BrainCircuit, Shield, CheckCircle2, AlertTriangle,
    FileText, Eye, Trash2, Filter, ArrowUpDown,
} from 'lucide-react';

const SESSIONS = [
    { id: 'S-10247', patient: 'Rajesh Kumar', patientId: 'P-2847', date: '2026-02-20 14:32', note: 'Patient: 58M presenting with progressive anxiety, sleep disturbance, and somatic complaints including palpitations...', icdCodes: ['6A70', '7A01.0'], namasteCodes: ['N1.2', 'M2.4', 'S2'], confidence: 92, status: 'Validated', duration: '3.2s' },
    { id: 'S-10246', patient: 'Priya Sharma', patientId: 'P-2845', date: '2026-02-19 11:15', note: 'Patient: 34F with 6-month history of low mood, anhedonia, fatigue, and poor concentration...', icdCodes: ['6A70.1', '6A70.2'], namasteCodes: ['N2.1', 'M1.3', 'S3'], confidence: 88, status: 'Validated', duration: '2.8s' },
    { id: 'S-10245', patient: 'Aarav Patel', patientId: 'P-2840', date: '2026-02-18 16:45', note: 'Patient: 22M with 2-year history of recurrent intrusive thoughts about contamination...', icdCodes: ['6B20', '6B20.0'], namasteCodes: ['N3.1', 'M3.1', 'S4'], confidence: 95, status: 'Validated', duration: '2.5s' },
    { id: 'S-10244', patient: 'Sneha Reddy', patientId: 'P-2838', date: '2026-02-17 09:20', note: 'Patient: 45F with cyclical mood episodes over 3 years, current depressive episode...', icdCodes: ['6A61', '6A61.1'], namasteCodes: ['N4.2', 'M2.1', 'S3'], confidence: 84, status: 'Pending Review', duration: '4.1s' },
    { id: 'S-10243', patient: 'Vikram Singh', patientId: 'P-2835', date: '2026-02-16 13:50', note: 'Patient: 62M with uncontrolled Type 2 DM, HbA1c 9.2%, with peripheral neuropathy...', icdCodes: ['5A11', '8C10.0'], namasteCodes: ['N5.1', 'M4.2', 'S3'], confidence: 90, status: 'Validated', duration: '3.0s' },
    { id: 'S-10242', patient: 'Ananya Iyer', patientId: 'P-2830', date: '2026-02-14 10:30', note: 'Patient: 28F with history of sexual assault, presenting with flashbacks, hypervigilance...', icdCodes: ['6B40', '6B41'], namasteCodes: ['N6.1', 'M5.1', 'S4'], confidence: 87, status: 'Validated', duration: '3.5s' },
];

export default function HistoryPage() {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);

    const filtered = SESSIONS.filter(s =>
        s.patient.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.note.toLowerCase().includes(search.toLowerCase())
    );

    const confColor = (c) => c >= 90 ? '#10b981' : c >= 75 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text">Coding History</span></h1>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>{SESSIONS.length} sessions • All time</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        className="btn-neon-teal" style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Download size={13} /> Export All
                    </motion.button>
                </div>
            </motion.div>

            {/* Search & filters */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-panel" style={{ padding: '12px 16px', borderRadius: 14, marginBottom: 20, display: 'flex', gap: 12 }}>
                <div className="glass-input" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10 }}>
                    <Search size={14} color="rgba(148,163,184,0.5)" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by patient, session ID, or clinical note…"
                        style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, width: '100%', fontFamily: 'Inter' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>
                    <Calendar size={13} /> Date Range
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>
                    <ArrowUpDown size={13} /> Sort
                </button>
            </motion.div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Total Sessions', value: SESSIONS.length, icon: HistoryIcon, color: '#00d4ff' },
                    { label: 'Validated', value: SESSIONS.filter(s => s.status === 'Validated').length, icon: CheckCircle2, color: '#10b981' },
                    { label: 'Pending Review', value: SESSIONS.filter(s => s.status === 'Pending Review').length, icon: AlertTriangle, color: '#f59e0b' },
                    { label: 'Avg Confidence', value: `${Math.round(SESSIONS.reduce((a, s) => a + s.confidence, 0) / SESSIONS.length)}%`, icon: Activity, color: '#8b5cf6' },
                ].map(({ label, value, icon: Icon, color }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="glass-panel" style={{ padding: '14px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={15} color={color} />
                        </div>
                        <div>
                            <p style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
                            <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>{label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Timeline list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map((s, i) => (
                    <motion.div key={s.id}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="glass-panel"
                        style={{ borderRadius: 14, overflow: 'hidden' }}>
                        {/* Main row */}
                        <motion.div
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                            style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: s.status === 'Validated' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                    border: `1px solid ${s.status === 'Validated' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {s.status === 'Validated' ? <CheckCircle2 size={16} color="#10b981" /> : <AlertTriangle size={16} color="#f59e0b" />}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.patient}</span>
                                        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>({s.patientId})</span>
                                        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>• {s.id}</span>
                                    </div>
                                    <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2, maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {s.note}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {s.icdCodes.map(c => <span key={c} className="pill-badge pill-teal" style={{ fontSize: 9 }}>{c}</span>)}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: confColor(s.confidence) }}>{s.confidence}%</p>
                                    <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)' }}>{s.duration}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Clock size={12} color="rgba(148,163,184,0.4)" />
                                    <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{s.date}</span>
                                </div>
                                <motion.div animate={{ rotate: expanded === s.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown size={14} color="rgba(148,163,184,0.4)" />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Expanded detail */}
                        {expanded === s.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clinical Note</p>
                                        <p style={{ fontSize: 12, color: 'rgba(226,232,240,0.8)', lineHeight: 1.6 }}>{s.note}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Generated Codes</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div>
                                                <span style={{ fontSize: 10, color: '#00d4ff', fontWeight: 600 }}>ICD-11 TM2:</span>
                                                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                                    {s.icdCodes.map(c => <span key={c} className="pill-badge pill-teal">{c}</span>)}
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600 }}>NAMASTE:</span>
                                                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                                    {s.namasteCodes.map(c => <span key={c} className="pill-badge pill-purple">{c}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                className="btn-neon-teal" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <Eye size={12} /> View Full
                                            </motion.button>
                                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                className="btn-neon-teal" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <Download size={12} /> Export
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
