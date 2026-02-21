/**
 * HistoryPage.jsx — Coding history timeline with:
 * - Live data from backend
 * - Working search, date range, sort
 * - Working Export All (CSV download)
 * - Working assign code to patient
 * - Session detail expansion
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Search, Download, ChevronDown, ChevronUp, CheckCircle2,
    AlertCircle, FileText, RefreshCw, Filter, Calendar, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },
    error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
    partial: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
};

function CodeBadge({ code, type }) {
    const colors = {
        icd11: { bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)', text: '#00d4ff' },
        cpt: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
        snomed: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#34d399' },
    };
    const c = colors[type] || colors.icd11;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            marginRight: 4, marginBottom: 4,
        }}>{code}</span>
    );
}

function HistoryItem({ session, onAssign, patients }) {
    const [expanded, setExpanded] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [assignPatientId, setAssignPatientId] = useState('');
    const { authFetch } = useAuth();

    const codes = session.generated_codes || {};
    const icdCodes = codes.icd_codes || [];
    const cptCodes = codes.cpt_codes || [];
    const s = STATUS_COLORS[session.status] || STATUS_COLORS.success;

    const handleAssign = async () => {
        if (!assignPatientId) return;
        setAssigning(true);
        try {
            const res = await authFetch('/api/assign-code-to-patient/', {
                method: 'POST',
                body: JSON.stringify({ historyId: session.id, patientId: assignPatientId }),
            });
            const data = await res.json();
            if (res.ok) {
                onAssign && onAssign(session.id, assignPatientId);
                setExpanded(false);
            } else {
                alert(data.error || 'Failed to assign.');
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setAssigning(false);
        }
    };

    return (
        <motion.div
            layout
            className="glass-panel"
            style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}
        >
            {/* Row header */}
            <div
                onClick={() => setExpanded(e => !e)}
                style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: 14 }}
            >
                <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: s.bg, border: `1px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {session.status === 'success'
                        ? <CheckCircle2 size={16} color={s.text} />
                        : <AlertCircle size={16} color={s.text} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                            {session.patient_name ? `Patient: ${session.patient_name}` : 'Unassigned Session'}
                        </p>
                        <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
                            {session.status}
                        </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>
                        {new Date(session.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {icdCodes.length > 0 && ` • ${icdCodes.length} code(s) generated`}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {icdCodes.slice(0, 2).map(c => <CodeBadge key={c.code} code={c.code} type="icd11" />)}
                    {icdCodes.length > 2 && <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>+{icdCodes.length - 2}</span>}
                    {expanded ? <ChevronUp size={14} color="rgba(148,163,184,0.5)" /> : <ChevronDown size={14} color="rgba(148,163,184,0.5)" />}
                </div>
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            {/* Clinical note */}
                            <div style={{ margin: '14px 0 10px' }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Clinical Note</p>
                                <p style={{ fontSize: 12, color: 'rgba(226,232,240,0.7)', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px' }}>
                                    {session.clinical_note?.slice(0, 400)}{session.clinical_note?.length > 400 ? '…' : ''}
                                </p>
                            </div>

                            {/* ICD codes */}
                            {icdCodes.length > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>ICD-11 / NAMASTE Codes</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {icdCodes.map(c => (
                                            <span key={c.code} title={c.description} style={{ display: 'inline-flex', flexDirection: 'column', padding: '4px 8px', borderRadius: 6, background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.15)' }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff' }}>{c.code}</span>
                                                <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>{c.description?.slice(0, 30)}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CPT/NAMASTE codes */}
                            {cptCodes.length > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>CPT / NAMASTE Codes</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {cptCodes.map(c => <CodeBadge key={c.code} code={c.code} type="cpt" />)}
                                    </div>
                                </div>
                            )}

                            {/* Assign to patient */}
                            {!session.patient_name && (
                                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 8 }}>Assign to Patient</p>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <select
                                            value={assignPatientId}
                                            onChange={e => setAssignPatientId(e.target.value)}
                                            style={{ flex: 1, padding: '7px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter', outline: 'none' }}
                                        >
                                            <option value="">Select patient…</option>
                                            {patients.map(p => (
                                                <option key={p.patient_id} value={p.patient_id}>{p.name} ({p.patient_id})</option>
                                            ))}
                                        </select>
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={handleAssign}
                                            disabled={!assignPatientId || assigning}
                                            style={{ padding: '7px 14px', borderRadius: 7, background: assignPatientId ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${assignPatientId ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.08)'}`, color: assignPatientId ? '#a78bfa' : 'rgba(148,163,184,0.4)', fontSize: 12, cursor: assignPatientId ? 'pointer' : 'not-allowed', fontFamily: 'Inter' }}>
                                            {assigning ? '…' : 'Assign'}
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Main HistoryPage ───────────────────────────────────────────────────────────
export default function HistoryPage() {
    const { authFetch } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sort, setSort] = useState('-created_at');
    const [exporting, setExporting] = useState(false);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo) params.set('date_to', dateTo);
            if (sort) params.set('sort', sort);
            const res = await authFetch(`/api/coding-history/?${params.toString()}`);
            const data = await res.json();
            setSessions(Array.isArray(data) ? data : (data.results || []));
        } catch { }
        finally { setLoading(false); }
    }, [authFetch, search, dateFrom, dateTo, sort]);

    const fetchPatients = useCallback(async () => {
        try {
            const res = await authFetch('/api/patients/');
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : (data.results || []));
        } catch { }
    }, [authFetch]);

    useEffect(() => { fetchSessions(); fetchPatients(); }, [fetchSessions, fetchPatients]);

    const handleExportAll = async () => {
        setExporting(true);
        try {
            const res = await authFetch('/api/coding-history/export/');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'coding_history_export.csv'; a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Export failed: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    const handleAssign = (sessionId, patientId) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId
                ? { ...s, patient_name: patients.find(p => p.patient_id === patientId)?.name || patientId }
                : s
        ));
    };

    const successCount = sessions.filter(s => s.status === 'success').length;
    const totalCodes = sessions.reduce((acc, s) => acc + (s.generated_codes?.icd_codes?.length || 0), 0);

    return (
        <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text">Coding History</span></h1>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>
                        {sessions.length} sessions • {successCount} successful • {totalCodes} codes
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={handleExportAll}
                    disabled={exporting}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                        borderRadius: 10, fontSize: 13, cursor: exporting ? 'not-allowed' : 'pointer',
                        fontFamily: 'Inter', background: 'rgba(0,212,255,0.08)',
                        border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', opacity: exporting ? 0.6 : 1,
                    }}
                >
                    <Download size={14} />
                    {exporting ? 'Exporting…' : 'Export All CSV'}
                </motion.button>
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-panel" style={{ padding: '14px 16px', borderRadius: 14, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div className="glass-input" style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10 }}>
                        <Search size={13} color="rgba(148,163,184,0.5)" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search notes or patient name…"
                            style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 12, width: '100%', fontFamily: 'Inter' }} />
                    </div>

                    {/* Date range */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="rgba(148,163,184,0.5)" />
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            style={{ padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter', outline: 'none', colorScheme: 'dark' }} />
                        <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: 12 }}>to</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            style={{ padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter', outline: 'none', colorScheme: 'dark' }} />
                        {(dateFrom || dateTo) && (
                            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.5)', padding: 4 }}>
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Sort */}
                    <select value={sort} onChange={e => setSort(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', fontSize: 12, fontFamily: 'Inter', outline: 'none', cursor: 'pointer' }}>
                        <option value="-created_at">Newest First</option>
                        <option value="created_at">Oldest First</option>
                        <option value="status">By Status</option>
                    </select>

                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={fetchSessions}
                        style={{ padding: '7px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <RefreshCw size={12} /> Apply
                    </motion.button>
                </div>
            </motion.div>

            {/* Sessions list */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'rgba(148,163,184,0.4)' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>Loading history…</p>
                </div>
            ) : sessions.length === 0 ? (
                <div className="glass-panel" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
                    <Clock size={40} color="rgba(148,163,184,0.3)" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.5)' }}>No coding sessions found</p>
                    <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.3)', marginTop: 6 }}>Generate some medical codes to see them here</p>
                </div>
            ) : (
                <div>
                    {sessions.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                            <HistoryItem session={s} patients={patients} onAssign={handleAssign} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
