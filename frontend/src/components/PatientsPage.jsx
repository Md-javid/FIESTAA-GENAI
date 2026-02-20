/**
 * PatientsPage.jsx
 * Patient management — registry, demographic details, quick access to past sessions.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Filter, ChevronRight, Calendar,
    Phone, Mail, MapPin, Heart, Activity, X, CheckCircle2,
    FileText, Edit3,
} from 'lucide-react';

const SAMPLE_PATIENTS = [
    { id: 'P-2847', name: 'Rajesh Kumar', age: 58, gender: 'Male', phone: '+91 98765 43210', email: 'rajesh.k@hospital.in', location: 'New Delhi', conditions: ['GAD', 'Insomnia'], lastVisit: '2026-02-20', sessions: 12, status: 'Active', riskLevel: 'Low' },
    { id: 'P-2845', name: 'Priya Sharma', age: 34, gender: 'Female', phone: '+91 87654 32109', email: 'priya.s@hospital.in', location: 'Mumbai', conditions: ['MDD', 'Anhedonia'], lastVisit: '2026-02-19', sessions: 8, status: 'Active', riskLevel: 'Moderate' },
    { id: 'P-2840', name: 'Aarav Patel', age: 22, gender: 'Male', phone: '+91 76543 21098', email: 'aarav.p@hospital.in', location: 'Ahmedabad', conditions: ['OCD'], lastVisit: '2026-02-18', sessions: 5, status: 'Active', riskLevel: 'Low' },
    { id: 'P-2838', name: 'Sneha Reddy', age: 45, gender: 'Female', phone: '+91 65432 10987', email: 'sneha.r@hospital.in', location: 'Hyderabad', conditions: ['Bipolar II', 'Anxiety'], lastVisit: '2026-02-17', sessions: 15, status: 'Active', riskLevel: 'High' },
    { id: 'P-2835', name: 'Vikram Singh', age: 62, gender: 'Male', phone: '+91 54321 09876', email: 'vikram.s@hospital.in', location: 'Jaipur', conditions: ['Type 2 DM', 'Hypertension'], lastVisit: '2026-02-16', sessions: 20, status: 'Active', riskLevel: 'Moderate' },
    { id: 'P-2830', name: 'Ananya Iyer', age: 28, gender: 'Female', phone: '+91 43210 98765', email: 'ananya.i@hospital.in', location: 'Chennai', conditions: ['PTSD'], lastVisit: '2026-02-14', sessions: 3, status: 'Inactive', riskLevel: 'High' },
];

const riskColor = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };

function AddPatientModal({ onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel-strong"
                style={{ width: 500, borderRadius: 20, padding: 28 }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Add New Patient</h2>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.6)' }}>
                        <X size={18} />
                    </motion.button>
                </div>
                {[
                    ['Full Name', 'text', 'Enter patient full name'],
                    ['Age', 'number', 'Enter age'],
                    ['Gender', 'text', 'Male / Female / Other'],
                    ['Phone', 'tel', '+91 XXXXX XXXXX'],
                    ['Email', 'email', 'patient@example.com'],
                    ['Location', 'text', 'City, State'],
                    ['Primary Condition', 'text', 'e.g. Major Depressive Disorder'],
                ].map(([label, type, ph]) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.6)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {label}
                        </label>
                        <input type={type} placeholder={ph} className="glass-input"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter' }} />
                    </div>
                ))}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="btn-generate"
                    style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter', marginTop: 8 }}>
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} /> Register Patient
                    </span>
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

export default function PatientsPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const filtered = SAMPLE_PATIENTS.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.conditions.some(c => c.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
            <AnimatePresence>{showModal && <AddPatientModal onClose={() => setShowModal(false)} />}</AnimatePresence>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text">Patient Registry</span></h1>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>{SAMPLE_PATIENTS.length} patients • {SAMPLE_PATIENTS.filter(p => p.status === 'Active').length} active</p>
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowModal(true)} className="btn-generate"
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={15} /> Add Patient
                    </span>
                </motion.button>
            </motion.div>

            {/* Search & Filter bar */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-panel" style={{ padding: '12px 16px', borderRadius: 14, marginBottom: 20, display: 'flex', gap: 12 }}>
                <div className="glass-input" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10 }}>
                    <Search size={14} color="rgba(148,163,184,0.5)" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, ID, or condition…"
                        style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, width: '100%', fontFamily: 'Inter' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>
                    <Filter size={13} /> Filter
                </button>
            </motion.div>

            {/* Patient Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '1fr 380px' : '1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map((p, i) => (
                        <motion.div key={p.id}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ scale: 1.01, x: 4 }}
                            onClick={() => setSelectedPatient(p)}
                            className="glass-panel"
                            style={{
                                padding: '16px 20px', borderRadius: 14, cursor: 'pointer',
                                border: selectedPatient?.id === p.id ? '1px solid rgba(0,212,255,0.3)' : undefined,
                                background: selectedPatient?.id === p.id ? 'rgba(0,212,255,0.06)' : undefined,
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(139,92,246,0.15))',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, fontWeight: 700, color: '#00d4ff',
                                    }}>{p.name.split(' ').map(n => n[0]).join('')}</div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{p.name}</p>
                                        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{p.id} • {p.age}y • {p.gender} • {p.location}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {p.conditions.map(c => (
                                        <span key={c} className="pill-badge pill-teal" style={{ fontSize: 10 }}>{c}</span>
                                    ))}
                                    <span className="pill-badge" style={{
                                        background: `${riskColor[p.riskLevel]}15`,
                                        border: `1px solid ${riskColor[p.riskLevel]}40`,
                                        color: riskColor[p.riskLevel],
                                    }}>{p.riskLevel} Risk</span>
                                    <ChevronRight size={14} color="rgba(148,163,184,0.4)" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Patient Detail Sidebar */}
                <AnimatePresence>
                    {selectedPatient && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="glass-panel-strong"
                            style={{ borderRadius: 18, padding: 24, alignSelf: 'flex-start', position: 'sticky', top: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Patient Details</h3>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedPatient(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.5)' }}>
                                    <X size={16} />
                                </motion.button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, fontWeight: 800, color: 'white',
                                }}>{selectedPatient.name.split(' ').map(n => n[0]).join('')}</div>
                                <div>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{selectedPatient.name}</p>
                                    <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{selectedPatient.id}</p>
                                </div>
                            </div>

                            {[
                                { icon: Calendar, label: 'Age / Gender', value: `${selectedPatient.age} years • ${selectedPatient.gender}` },
                                { icon: Phone, label: 'Phone', value: selectedPatient.phone },
                                { icon: Mail, label: 'Email', value: selectedPatient.email },
                                { icon: MapPin, label: 'Location', value: selectedPatient.location },
                                { icon: Activity, label: 'Sessions', value: `${selectedPatient.sessions} total` },
                                { icon: Calendar, label: 'Last Visit', value: selectedPatient.lastVisit },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <Icon size={13} color="rgba(148,163,184,0.5)" />
                                    <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', minWidth: 70 }}>{label}</span>
                                    <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{value}</span>
                                </div>
                            ))}

                            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {selectedPatient.conditions.map(c => (
                                    <span key={c} className="pill-badge pill-purple">{c}</span>
                                ))}
                            </div>

                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="btn-generate"
                                style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', marginTop: 18 }}>
                                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <FileText size={14} /> Generate Codes for Patient
                                </span>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
