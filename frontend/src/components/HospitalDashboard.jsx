/**
 * HospitalDashboard.jsx — Hospital-Level Analytics, Doctor Management,
 * Data Requests, and Insurance Overview
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { X, RefreshCw, Check, XCircle, Plus, Mail, AlertTriangle } from 'lucide-react';

/* ── Tiny icon primitives ─────────────────────────────────────────────────── */
const Icon = ({ d, size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const icons = {
    hospital: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    doctors: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    patients: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8',
    codes: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 12h6 M9 16h4',
    ai: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    trend: 'M23 6l-9.5 9.5-5-5L1 18',
    check: 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',
    refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    warning: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
    pill: 'M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v3',
    share: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8 M16 6l-4-4-4 4 M12 2v13',
};

/* ── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, gradient, sub, badge }) {
    return (
        <div className="hosp-stat-card" style={{ background: gradient }}>
            <div className="hosp-stat-top">
                <span className="hosp-stat-icon"><Icon d={icons[icon]} size={22} /></span>
                <span className="hosp-stat-label">{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div className="hosp-stat-value">{value ?? '—'}</div>
                {badge > 0 && (
                    <span style={{ marginBottom: 4, padding: '2px 7px', borderRadius: 5, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', fontSize: 11, fontWeight: 700 }}>
                        {badge} pending
                    </span>
                )}
            </div>
            {sub && <div className="hosp-stat-sub">{sub}</div>}
        </div>
    );
}

/* ── Mini Bar Chart ───────────────────────────────────────────────────────── */
function MiniBarChart({ data, valueKey, color }) {
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <div className="hosp-barchart">
            {data.map((d, i) => (
                <div key={i} className="hosp-bar-col">
                    <div className="hosp-bar-wrap">
                        <div
                            className="hosp-bar-fill"
                            style={{ height: `${Math.max((d[valueKey] / max) * 100, 4)}%`, background: color }}
                        />
                    </div>
                    <span className="hosp-bar-label">{d.date}</span>
                </div>
            ))}
        </div>
    );
}

/* ── Donut Chart (CSS-based) ──────────────────────────────────────────────── */
function DonutChart({ male, female, other }) {
    const total = male + female + other || 1;
    const pM = Math.round((male / total) * 100);
    const pF = Math.round((female / total) * 100);
    const pO = 100 - pM - pF;
    const gradient = `conic-gradient(#38bdf8 0% ${pM}%, #f472b6 ${pM}% ${pM + pF}%, #a78bfa ${pM + pF}% 100%)`;
    return (
        <div className="hosp-donut-wrap">
            <div className="hosp-donut" style={{ background: gradient }}>
                <div className="hosp-donut-hole">
                    <span className="hosp-donut-total">{male + female + other}</span>
                    <span className="hosp-donut-sub">patients</span>
                </div>
            </div>
            <div className="hosp-donut-legend">
                <span style={{ color: '#38bdf8' }}>● Male {pM}%</span>
                <span style={{ color: '#f472b6' }}>● Female {pF}%</span>
                <span style={{ color: '#a78bfa' }}>● Other {pO}%</span>
            </div>
        </div>
    );
}

/* ── Add Doctor Modal ─────────────────────────────────────────────────────── */
function AddDoctorModal({ onClose, onAdded }) {
    const { authFetch } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await authFetch('/api/hospital/doctors/', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed.'); return; }
            setSuccess(data.message || 'Doctor added!');
            onAdded && onAdded();
            setTimeout(onClose, 1500);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
        >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel-strong"
                style={{ width: 420, borderRadius: 20, padding: 28 }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>Add Doctor to Hospital</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.6)' }}>
                        <X size={18} />
                    </button>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', marginBottom: 18 }}>
                    Enter the email of a registered doctor to link them to your hospital.
                </p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.6)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doctor's Email *</label>
                        <input type="email" value={email} required onChange={e => setEmail(e.target.value)} placeholder="doctor@example.com"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter', outline: 'none' }} />
                    </div>
                    {error && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</div>}
                    {success && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 12, marginBottom: 12 }}>✅ {success}</div>}
                    <button type="submit" disabled={loading} className="btn-generate"
                        style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter', opacity: loading ? 0.7 : 1 }}>
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Mail size={15} /> {loading ? 'Linking…' : 'Link Doctor'}
                        </span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

/* ── Data Request Modal ───────────────────────────────────────────────────── */
function DataRequestModal({ hospitals, onClose, onSent }) {
    const { authFetch } = useAuth();
    const [form, setForm] = useState({ target_hospital: '', patient_name: '', patient_id_hint: '', reason: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await authFetch('/api/data-requests/', { method: 'POST', body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) { setError(data.error || Object.values(data).flat().join(' ')); return; }
            onSent && onSent(data);
            onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const inputStyle = {
        width: '100%', padding: '9px 13px', borderRadius: 9,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter', outline: 'none',
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
        >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel-strong"
                style={{ width: 480, borderRadius: 20, padding: 28 }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>Request Patient Data</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.6)' }}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    {[
                        ['Patient Name', 'patient_name', 'text', 'Full name of patient', true],
                        ['Known Patient ID / DOB', 'patient_id_hint', 'text', 'e.g. P-12345 or 1990-05-20', false],
                    ].map(([label, key, type, ph, req]) => (
                        <div key={key} style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.6)', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label} {req && '*'}</label>
                            <input type={type} value={form[key]} onChange={set(key)} placeholder={ph} required={req} style={inputStyle} />
                        </div>
                    ))}
                    <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.6)', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Hospital *</label>
                        <select value={form.target_hospital} onChange={set('target_hospital')} required style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">Select hospital…</option>
                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name || h.full_name} {h.city ? `— ${h.city}` : ''}</option>)}
                        </select>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.6)', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reason for Request *</label>
                        <textarea value={form.reason} onChange={set('reason')} placeholder="Clinical reason for requesting patient data…" rows={3} required style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    {error && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</div>}
                    <button type="submit" disabled={loading} className="btn-generate"
                        style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter', opacity: loading ? 0.7 : 1 }}>
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                            {loading ? 'Sending…' : '📤 Send Secure Request'}
                        </span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════════ */
export default function HospitalDashboard() {
    const { authFetch, user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [showDataRequest, setShowDataRequest] = useState(false);
    const [hospitals, setHospitals] = useState([]);
    const [dataRequests, setDataRequests] = useState([]);
    const [respondingId, setRespondingId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await authFetch('/api/hospital/dashboard/');
            if (!res.ok) throw new Error(await res.text());
            const json = await res.json();
            setData(json);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [authFetch]);

    const fetchHospitals = useCallback(async () => {
        try {
            const res = await authFetch('/api/hospitals/');
            const json = await res.json();
            setHospitals((json.hospitals || []).filter(h => h.id !== user?.id));
        } catch { }
    }, [authFetch, user]);

    const fetchDataRequests = useCallback(async () => {
        try {
            const res = await authFetch('/api/data-requests/');
            const json = await res.json();
            setDataRequests(Array.isArray(json) ? json : (json.results || []));
        } catch { }
    }, [authFetch]);

    useEffect(() => {
        fetchData();
        fetchHospitals();
        fetchDataRequests();
    }, [fetchData, fetchHospitals, fetchDataRequests]);

    const handleRespond = async (requestId, newStatus) => {
        setRespondingId(requestId);
        try {
            const res = await authFetch(`/api/data-requests/${requestId}/respond/`, {
                method: 'POST',
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setDataRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
            }
        } catch { }
        finally { setRespondingId(null); }
    };

    /* ── Loading ── */
    if (loading) return (
        <div className="hosp-loading">
            <div className="hosp-spinner" />
            <p>Loading Hospital Dashboard…</p>
        </div>
    );

    /* ── Error ── */
    if (error) return (
        <div className="hosp-error">
            <Icon d={icons.warning} size={32} color="#f87171" />
            <h3>Failed to load dashboard</h3>
            <p>{error}</p>
            <button className="hosp-btn-primary" onClick={fetchData}>Retry</button>
        </div>
    );

    const { hospital, overview, daily_activity, doctor_stats, gender_distribution } = data;
    const incomingRequests = dataRequests.filter(r => r.target_hospital === user?.id || r.target_hospital_name);
    const outgoingRequests = dataRequests.filter(r => r.requesting_hospital === user?.id || r.requesting_hospital_name);
    const pendingIncoming = dataRequests.filter(r => r.status === 'pending');

    return (
        <div className="hosp-root">
            <AnimatePresence>
                {showAddDoctor && <AddDoctorModal onClose={() => setShowAddDoctor(false)} onAdded={fetchData} />}
                {showDataRequest && <DataRequestModal hospitals={hospitals} onClose={() => setShowDataRequest(false)} onSent={() => fetchDataRequests()} />}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="hosp-header">
                <div className="hosp-header-left">
                    <div className="hosp-avatar">
                        <Icon d={icons.hospital} size={26} />
                    </div>
                    <div>
                        <h1 className="hosp-title">{hospital.name}</h1>
                        <p className="hosp-subtitle">
                            {hospital.type || 'Hospital'} &nbsp;·&nbsp;
                            {hospital.city}{hospital.state ? `, ${hospital.state}` : ''}
                            {hospital.facility_id && <> &nbsp;·&nbsp; ID: <code>{hospital.facility_id}</code></>}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setShowDataRequest(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>
                        <Icon d={icons.share} size={14} /> Request Patient Data
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setShowAddDoctor(true)}
                        className="btn-generate"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={14} /> Add Doctor
                        </span>
                    </motion.button>
                    <button className="hosp-refresh-btn" onClick={fetchData} title="Refresh">
                        <Icon d={icons.refresh} size={16} />
                    </button>
                </div>
            </div>

            {/* ── KPI Stats ── */}
            <div className="hosp-stats-grid">
                <StatCard label="Total Doctors" value={overview.total_doctors} icon="doctors" gradient="linear-gradient(135deg,#1e3a5f,#1e40af)" sub="Affiliated staff" />
                <StatCard label="Total Patients" value={overview.total_patients} icon="patients" gradient="linear-gradient(135deg,#14532d,#15803d)" sub={`+${overview.new_patients_week} this week`} />
                <StatCard label="Codes Generated" value={overview.total_codes} icon="codes" gradient="linear-gradient(135deg,#4c1d95,#7c3aed)" sub={`${overview.codes_this_month} this month`} />
                <StatCard label="AI Queries" value={overview.total_ai_queries} icon="ai" gradient="linear-gradient(135deg,#7c2d12,#c2410c)" sub="Across all doctors" />
                <StatCard label="Success Rate" value={`${overview.success_rate}%`} icon="check" gradient="linear-gradient(135deg,#164e63,#0891b2)" sub="Code generation accuracy" />
                <StatCard label="Data Requests" value={overview.pending_data_requests} icon="share" gradient="linear-gradient(135deg,#1a1a2e,#16213e)" sub="Incoming requests" badge={overview.pending_data_requests} />
            </div>

            {/* ── Tab Nav ── */}
            <div className="hosp-tabs">
                {[
                    { id: 'overview', label: '📊 Overview' },
                    { id: 'doctors', label: `👨‍⚕️ Doctors (${doctor_stats.length})` },
                    { id: 'activity', label: '📈 Activity' },
                    { id: 'requests', label: `🔒 Data Requests${pendingIncoming.length > 0 ? ` (${pendingIncoming.length})` : ''}` },
                ].map(t => (
                    <button
                        key={t.id}
                        className={`hosp-tab ${activeTab === t.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Overview ── */}
            {activeTab === 'overview' && (
                <div className="hosp-tab-content">
                    <div className="hosp-two-col">
                        <div className="hosp-card">
                            <h3 className="hosp-card-title">Patient Gender Distribution</h3>
                            <DonutChart male={gender_distribution.male} female={gender_distribution.female} other={gender_distribution.other} />
                        </div>
                        <div className="hosp-card">
                            <h3 className="hosp-card-title">Hospital Info</h3>
                            <div className="hosp-info-list">
                                <InfoRow label="Hospital Name" value={hospital.name} />
                                <InfoRow label="Type" value={hospital.type || 'N/A'} />
                                <InfoRow label="Facility ID" value={hospital.facility_id || 'N/A'} />
                                <InfoRow label="Hospital Code" value={hospital.hospital_code || 'N/A'} />
                                <InfoRow label="Location" value={[hospital.city, hospital.state].filter(Boolean).join(', ') || 'N/A'} />
                                <InfoRow label="Total Doctors" value={overview.total_doctors} />
                                <InfoRow label="Total Patients" value={overview.total_patients} />
                                <InfoRow label="Total Medicines" value={overview.total_medicines} />
                            </div>
                        </div>
                    </div>
                    <div className="hosp-card hosp-card-full">
                        <h3 className="hosp-card-title">7-Day Codes Generated (Hospital-wide)</h3>
                        <MiniBarChart data={daily_activity} valueKey="codes" color="linear-gradient(180deg,#7c3aed,#4f46e5)" />
                    </div>
                </div>
            )}

            {/* ── Tab: Doctors ── */}
            {activeTab === 'doctors' && (
                <div className="hosp-tab-content">
                    <div className="hosp-card hosp-card-full">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 className="hosp-card-title" style={{ marginBottom: 0 }}>Affiliated Doctors ({doctor_stats.length})</h3>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => setShowAddDoctor(true)}
                                className="btn-generate"
                                style={{ padding: '7px 14px', borderRadius: 9, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>
                                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Plus size={13} /> Add Doctor
                                </span>
                            </motion.button>
                        </div>
                        {doctor_stats.length === 0 ? (
                            <div className="hosp-empty">
                                <Icon d={icons.doctors} size={48} color="#4b5563" />
                                <p>No doctors affiliated yet. Click "Add Doctor" to link one.</p>
                            </div>
                        ) : (
                            <div className="hosp-table-wrap">
                                <table className="hosp-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Specialty</th>
                                            <th>Patients</th>
                                            <th>Codes</th>
                                            <th>AI Queries</th>
                                            <th>Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doctor_stats.map(doc => (
                                            <tr key={doc.id}>
                                                <td><strong>{doc.name}</strong></td>
                                                <td><span className="hosp-subtle">{doc.email}</span></td>
                                                <td>{doc.specialty || <span className="hosp-subtle">General</span>}</td>
                                                <td><span className="hosp-badge-blue">{doc.patients}</span></td>
                                                <td><span className="hosp-badge-purple">{doc.codes_generated}</span></td>
                                                <td><span className="hosp-badge-teal">{doc.ai_queries}</span></td>
                                                <td>
                                                    <span className="hosp-subtle">
                                                        {doc.last_login
                                                            ? new Date(doc.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : 'Never'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Activity ── */}
            {activeTab === 'activity' && (
                <div className="hosp-tab-content">
                    <div className="hosp-two-col">
                        <div className="hosp-card">
                            <h3 className="hosp-card-title">Daily Codes Generated</h3>
                            <MiniBarChart data={daily_activity} valueKey="codes" color="linear-gradient(180deg,#7c3aed,#4f46e5)" />
                        </div>
                        <div className="hosp-card">
                            <h3 className="hosp-card-title">Daily New Patients</h3>
                            <MiniBarChart data={daily_activity} valueKey="patients" color="linear-gradient(180deg,#059669,#10b981)" />
                        </div>
                    </div>
                    <div className="hosp-card hosp-card-full">
                        <h3 className="hosp-card-title">Last 7 Days Detail</h3>
                        <div className="hosp-table-wrap">
                            <table className="hosp-table">
                                <thead><tr><th>Day</th><th>Codes Generated</th><th>New Patients</th></tr></thead>
                                <tbody>
                                    {daily_activity.map((d, i) => (
                                        <tr key={i}>
                                            <td><strong>{d.date}</strong></td>
                                            <td><span className="hosp-badge-purple">{d.codes}</span></td>
                                            <td><span className="hosp-badge-blue">{d.patients}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Data Requests ── */}
            {activeTab === 'requests' && (
                <div className="hosp-tab-content">
                    {/* Incoming requests */}
                    <div className="hosp-card hosp-card-full" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 className="hosp-card-title" style={{ marginBottom: 0 }}>
                                📥 Incoming Data Requests
                                {pendingIncoming.length > 0 && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 5, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 11 }}>{pendingIncoming.length} pending</span>}
                            </h3>
                        </div>
                        {dataRequests.filter(r => r.target_hospital_name).length === 0 ? (
                            <div className="hosp-empty"><p>No incoming data requests yet.</p></div>
                        ) : (
                            <div className="hosp-table-wrap">
                                <table className="hosp-table">
                                    <thead><tr><th>From</th><th>Patient</th><th>Reason</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {dataRequests.filter(r => r.target_hospital_name).map(r => (
                                            <tr key={r.id}>
                                                <td><strong>{r.requesting_hospital_name}</strong></td>
                                                <td>{r.patient_name} {r.patient_id_hint && <span className="hosp-subtle">({r.patient_id_hint})</span>}</td>
                                                <td><span className="hosp-subtle">{r.reason?.slice(0, 40)}{r.reason?.length > 40 ? '…' : ''}</span></td>
                                                <td><span className="hosp-subtle">{new Date(r.created_at).toLocaleDateString()}</span></td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                                                        background: r.status === 'approved' ? 'rgba(16,185,129,0.15)' : r.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                        color: r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                                    }}>{r.status}</span>
                                                </td>
                                                <td>
                                                    {r.status === 'pending' && (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <motion.button whileHover={{ scale: 1.1 }}
                                                                onClick={() => handleRespond(r.id, 'approved')}
                                                                disabled={respondingId === r.id}
                                                                style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter' }}>
                                                                ✓ Approve
                                                            </motion.button>
                                                            <motion.button whileHover={{ scale: 1.1 }}
                                                                onClick={() => handleRespond(r.id, 'rejected')}
                                                                disabled={respondingId === r.id}
                                                                style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter' }}>
                                                                ✕ Reject
                                                            </motion.button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Outgoing requests */}
                    <div className="hosp-card hosp-card-full">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 className="hosp-card-title" style={{ marginBottom: 0 }}>📤 Outgoing Data Requests</h3>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => setShowDataRequest(true)}
                                style={{ padding: '7px 14px', borderRadius: 9, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>
                                + New Request
                            </motion.button>
                        </div>
                        {dataRequests.filter(r => r.requesting_hospital_name === undefined || r.requesting_hospital === user?.id).length === 0 ? (
                            <div className="hosp-empty"><p>No outgoing requests yet. Click "+ New Request" to request patient data from another hospital.</p></div>
                        ) : (
                            <div className="hosp-table-wrap">
                                <table className="hosp-table">
                                    <thead><tr><th>To Hospital</th><th>Patient</th><th>Reason</th><th>Date</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {dataRequests.filter(r => r.requesting_hospital_name === undefined || r.requesting_hospital === user?.id).map(r => (
                                            <tr key={r.id}>
                                                <td><strong>{r.target_hospital_name}</strong></td>
                                                <td>{r.patient_name}</td>
                                                <td><span className="hosp-subtle">{r.reason?.slice(0, 40)}{r.reason?.length > 40 ? '…' : ''}</span></td>
                                                <td><span className="hosp-subtle">{new Date(r.created_at).toLocaleDateString()}</span></td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                                                        background: r.status === 'approved' ? 'rgba(16,185,129,0.15)' : r.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                        color: r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                                    }}>{r.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Helper ── */
function InfoRow({ label, value }) {
    return (
        <div className="hosp-info-row">
            <span className="hosp-info-label">{label}</span>
            <span className="hosp-info-value">{value ?? 'N/A'}</span>
        </div>
    );
}
