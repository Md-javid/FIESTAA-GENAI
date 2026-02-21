/**
 * AnalyticsDashboard.jsx
 * Home page — KPI cards, donut charts, recent activity feed,
 * compliance gauge, and trending diagnoses. Now with live backend data.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Activity, BrainCircuit, Shield, Users, TrendingUp,
    Clock, FileText, Sparkles, ArrowUpRight, AlertTriangle,
    CheckCircle2, Heart, Stethoscope, Zap, BarChart3,
    History as HistoryIcon, RefreshCw,
} from 'lucide-react';

const fadeUp = (i = 0) => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
});

/* ── Mini SVG Donut ──────────────────────────── */
function MiniDonut({ value, color, size = 48 }) {
    const r = (size - 8) / 2;
    const c = 2 * Math.PI * r;
    const off = c - (value / 100) * c;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
                strokeLinecap="round" strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: off }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                style={{ transformOrigin: `${size / 2}px ${size / 2}px`, transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 4px ${color})` }}
            />
            <text x={size / 2} y={size / 2} dominantBaseline="middle" textAnchor="middle" fill={color}
                fontSize={size > 48 ? 13 : 11} fontWeight="700" fontFamily="Inter">{value}%</text>
        </svg>
    );
}

/* ── Animated Bar Chart (pure SVG) ────────────── */
function BarChart({ data }) {
    const max = Math.max(...data.map(d => d.value));
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, padding: '0 4px' }}>
            {data.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.value / max) * 60}px` }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                        style={{
                            width: '100%', maxWidth: 28, borderRadius: 4,
                            background: `linear-gradient(to top, ${d.color}60, ${d.color})`,
                            boxShadow: `0 0 8px ${d.color}40`,
                        }}
                    />
                    <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)' }}>{d.label}</span>
                </div>
            ))}
        </div>
    );
}

/* ── Sparkline (pure SVG) ──────────────────────── */
function Sparkline({ data, color, width = 100, height = 30 }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
    ).join(' ');
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <motion.polyline
                points={points}
                fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
            />
        </svg>
    );
}

/* ── Trending Diagnosis Pill ───────────────────── */
function TrendPill({ rank, name, count, trend, color }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, x: 4 }}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', transition: 'all 0.2s ease',
            }}
        >
            <span style={{
                width: 24, height: 24, borderRadius: 6,
                background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color,
            }}>{rank}</span>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0' }}>{name}</p>
                <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>{count} codes generated</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <TrendingUp size={12} color="#10b981" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981' }}>+{trend}%</span>
            </div>
        </motion.div>
    );
}

/* ── Activity Item ─────────────────────────────── */
function ActivityItem({ time, title, desc, icon: Icon, color }) {
    return (
        <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
            <div style={{
                width: 30, height: 30, minWidth: 30, borderRadius: 8,
                background: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={13} color={color} />
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{desc}</p>
            </div>
            <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', whiteSpace: 'nowrap' }}>{time}</span>
        </div>
    );
}

/* ══════════════════════════════════════════════════ */
export default function AnalyticsDashboard() {
    const navigate = useNavigate();
    const { authFetch, user } = useAuth();
    const [greeting, setGreeting] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);

    useEffect(() => {
        const hr = new Date().getHours();
        setGreeting(hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening');
    }, []);

    const fetchAnalytics = useCallback(async () => {
        setLoadingAnalytics(true);
        try {
            const res = await authFetch('/api/analytics/');
            if (res.ok) {
                const json = await res.json();
                setAnalytics(json);
            }
        } catch (e) { }
        finally { setLoadingAnalytics(false); }
    }, [authFetch]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const ov = analytics?.overview || {};
    const dailyActivity = analytics?.daily_activity || [];

    const KPI = [
        { label: 'Total Sessions', value: ov.total_codes_generated ?? '—', change: `+${ov.codes_this_month ?? 0} this month`, icon: Activity, color: '#00d4ff', sparkData: dailyActivity.length > 0 ? dailyActivity.map(d => d.codes || 0) : [0, 1, 0, 2, 1, 3, 2] },
        { label: 'Codes Generated', value: ov.total_codes_generated ?? '—', change: `${ov.success_rate ?? 100}% success`, icon: BrainCircuit, color: '#8b5cf6', sparkData: dailyActivity.length > 0 ? dailyActivity.map(d => d.codes || 0) : [0, 1, 2, 1, 3, 2, 4] },
        { label: 'My Patients', value: ov.total_patients ?? '—', change: 'All time', icon: Users, color: '#10b981', sparkData: [1, 1, 2, 2, 3, 3, ov.total_patients || 0] },
        { label: 'Success Rate', value: ov.success_rate != null ? `${ov.success_rate}%` : '—', change: 'AI accuracy', icon: Sparkles, color: '#f59e0b', sparkData: [80, 85, 82, 88, 86, 90, ov.success_rate || 90] },
    ];

    const weeklyBars = dailyActivity.length > 0
        ? dailyActivity.map((d, i) => ({ label: d.date, value: d.codes || 0, color: i < 4 ? '#00d4ff' : '#8b5cf6' }))
        : [
            { label: 'Mon', value: 0, color: '#00d4ff' },
            { label: 'Tue', value: 0, color: '#00d4ff' },
            { label: 'Wed', value: 0, color: '#00d4ff' },
            { label: 'Thu', value: 0, color: '#8b5cf6' },
            { label: 'Fri', value: 0, color: '#8b5cf6' },
            { label: 'Sat', value: 0, color: '#8b5cf6' },
            { label: 'Sun', value: 0, color: '#8b5cf6' },
        ];

    const isNewDoctor = !loadingAnalytics && ov.total_codes_generated === 0;

    return (
        <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
            {/* Header */}
            <motion.div variants={fadeUp(0)} initial="hidden" animate="visible"
                style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
                        <span className="gradient-text">{greeting}, {user?.full_name?.split(' ')[0] || 'Doctor'}</span> 👋
                    </h1>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>
                        {isNewDoctor
                            ? "Welcome! Start by generating your first medical codes."
                            : "Here's your clinical coding analytics overview for today."}
                    </p>
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={fetchAnalytics}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>
                    <RefreshCw size={13} /> Refresh
                </motion.button>
            </motion.div>

            {/* New Doctor Welcome Card */}
            {isNewDoctor && (
                <motion.div variants={fadeUp(1)} initial="hidden" animate="visible"
                    className="glass-panel"
                    style={{ padding: '20px 24px', borderRadius: 16, marginBottom: 24, border: '1px solid rgba(0,212,255,0.15)', background: 'rgba(0,212,255,0.035)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#00d4ff', marginBottom: 10 }}>🚀 Get started with MediCode AI</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {[
                            { num: '1', title: 'Register Your First Patient', desc: 'Go to Patients → Add Patient', path: '/patients', color: '#10b981' },
                            { num: '2', title: 'Generate Medical Codes', desc: 'Paste a clinical note on the Workstation', path: '/generate', color: '#8b5cf6' },
                            { num: '3', title: 'View Your History', desc: 'Review all past coding sessions', path: '/history', color: '#f59e0b' },
                        ].map(s => (
                            <motion.div key={s.num} whileHover={{ scale: 1.03 }} onClick={() => navigate(s.path)}
                                style={{ padding: '14px 16px', borderRadius: 12, background: `${s.color}08`, border: `1px solid ${s.color}20`, cursor: 'pointer' }}>
                                <span style={{ display: 'block', fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.num}</span>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{s.title}</p>
                                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}


            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {KPI.map(({ label, value, change, icon: Icon, color, sparkData }, i) => (
                    <motion.div key={label} variants={fadeUp(i + 1)} initial="hidden" animate="visible"
                        className="glass-panel" whileHover={{ scale: 1.03, y: -4 }}
                        style={{ padding: '18px 20px', borderRadius: 16, cursor: 'pointer', transition: 'box-shadow 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: `${color}15`, border: `1px solid ${color}25`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}><Icon size={16} color={color} /></div>
                            <Sparkline data={sparkData} color={color} />
                        </div>
                        <p style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', marginBottom: 2 }}>{value}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ArrowUpRight size={11} />{change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main grid — 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>

                {/* Weekly Activity */}
                <motion.div variants={fadeUp(5)} initial="hidden" animate="visible"
                    className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BarChart3 size={14} color="#00d4ff" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Weekly Activity</span>
                        </div>
                        <span className="pill-badge pill-teal">This Week</span>
                    </div>
                    <BarChart data={weeklyBars} />
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>313 total sessions</span>
                        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>+23% vs last week</span>
                    </div>
                </motion.div>

                {/* Coding Distribution */}
                <motion.div variants={fadeUp(6)} initial="hidden" animate="visible"
                    className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Activity size={14} color="#8b5cf6" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Code Distribution</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                        <MiniDonut value={62} color="#00d4ff" size={70} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'ICD-11 TM2', pct: '62%', color: '#00d4ff' },
                                { label: 'NAMASTE', pct: '28%', color: '#8b5cf6' },
                                { label: 'SNOMED CT', pct: '10%', color: '#f59e0b' },
                            ].map(d => (
                                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                                    <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)' }}>{d.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: d.color, marginLeft: 'auto' }}>{d.pct}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* EHR Compliance Score */}
                <motion.div variants={fadeUp(7)} initial="hidden" animate="visible"
                    className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Shield size={14} color="#10b981" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>EHR Compliance</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                        <MiniDonut value={96} color="#10b981" size={90} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                            { label: 'ABDM v3', ok: true },
                            { label: 'FHIR R4', ok: true },
                            { label: 'HL7 v2.5', ok: true },
                            { label: 'NHP 2022', ok: true },
                        ].map(c => (
                            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                <CheckCircle2 size={12} color="#10b981" />
                                <span style={{ color: 'rgba(226,232,240,0.8)' }}>{c.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom row — 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Trending Diagnoses */}
                <motion.div variants={fadeUp(8)} initial="hidden" animate="visible"
                    className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <TrendingUp size={14} color="#f59e0b" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Trending Diagnoses</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <TrendPill rank={1} name="Major Depressive Disorder" count={182} trend={24} color="#00d4ff" />
                        <TrendPill rank={2} name="Generalized Anxiety Disorder" count={156} trend={18} color="#8b5cf6" />
                        <TrendPill rank={3} name="Type 2 Diabetes Mellitus" count={134} trend={12} color="#10b981" />
                        <TrendPill rank={4} name="Essential Hypertension" count={121} trend={8} color="#f59e0b" />
                        <TrendPill rank={5} name="Obsessive-Compulsive Disorder" count={89} trend={15} color="#ec4899" />
                    </div>
                </motion.div>

                {/* Recent Activity Feed */}
                <motion.div variants={fadeUp(9)} initial="hidden" animate="visible"
                    className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={14} color="#00d4ff" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Recent Activity</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(0,212,255,0.6)', cursor: 'pointer' }}>View All</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <ActivityItem time="2m ago" title="ICD-11 codes generated" desc="Patient #P-2847 — Anxiety Disorder"
                            icon={Sparkles} color="#00d4ff" />
                        <ActivityItem time="15m ago" title="NAMASTE mapping complete" desc="Patient #P-2845 — Depression"
                            icon={BrainCircuit} color="#8b5cf6" />
                        <ActivityItem time="1h ago" title="EHR compliance validated" desc="Batch #B-1082 passed ABDM v3"
                            icon={Shield} color="#10b981" />
                        <ActivityItem time="2h ago" title="Risk flag raised" desc="Patient #P-2840 — Suicide Risk: Moderate"
                            icon={AlertTriangle} color="#f59e0b" />
                        <ActivityItem time="3h ago" title="New patient registered" desc="Patient #P-2839 assigned"
                            icon={Users} color="#ec4899" />
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div variants={fadeUp(10)} initial="hidden" animate="visible"
                style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {[
                    { label: 'Generate Codes', icon: Sparkles, color: '#00d4ff', path: '/generate' },
                    { label: 'Add Patient', icon: Users, color: '#8b5cf6', path: '/patients' },
                    { label: 'View History', icon: HistoryIcon, color: '#10b981', path: '/history' },
                    { label: 'FHIR Explorer', icon: FileText, color: '#f59e0b', path: '/fhir' },
                ].map(({ label, icon: Icon, color, path }) => (
                    <motion.button key={label} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(path)}
                        className="btn-neon-teal" style={{
                            flex: 1, padding: '14px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 8, borderColor: `${color}40`, color,
                            background: `${color}10`,
                        }}>
                        <Icon size={15} />{label}
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
}
