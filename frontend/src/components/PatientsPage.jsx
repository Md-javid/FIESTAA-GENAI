/**
 * PatientsPage.jsx — Full patient management with:
 * - Working register patient form (connected to backend)
 * - Medicine prescription feature
 * - Patient report download
 * - Patient detail sidebar with full info
 * - Insurance info
 * - Generate codes assignment
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, Search, Filter, ChevronRight, Calendar,
    Phone, Mail, MapPin, Heart, Activity, X, CheckCircle2,
    FileText, Edit3, Download, Pill, Shield, RefreshCw,
    AlertTriangle, Droplets, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const riskColor = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };

// ── Add Patient Modal ──────────────────────────────────────────────────────────
function AddPatientModal({ onClose, onAdded }) {
    const { authFetch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '', age: '', gender: 'M', dob: '',
        phone: '', email: '', address: '',
        diagnosis: '', allergies: '', medications: '',
        blood_group: '', insurance_id: '', insurance_provider: '',
    });

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await authFetch('/api/patients/', {
                method: 'POST',
                body: JSON.stringify({ ...form, age: parseInt(form.age) || 0 }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(Object.values(data).flat().join(' '));
                return;
            }
            onAdded(data);
            onClose();
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '9px 13px', borderRadius: 9,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter',
        outline: 'none',
    };
    const labelStyle = {
        fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.6)',
        marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em',
    };
    const selectStyle = {
        ...inputStyle,
        cursor: 'pointer',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel-strong"
                style={{ width: '100%', maxWidth: 600, borderRadius: 20, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Register New Patient</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.6)' }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input value={form.name} onChange={set('name')} placeholder="Patient full name" required style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Age *</label>
                            <input type="number" value={form.age} onChange={set('age')} placeholder="e.g. 35" required style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Gender *</label>
                            <select value={form.gender} onChange={set('gender')} required style={selectStyle}>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="O">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Date of Birth</label>
                            <input type="date" value={form.dob} onChange={set('dob')} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input type="email" value={form.email} onChange={set('email')} placeholder="patient@example.com" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Blood Group</label>
                            <select value={form.blood_group} onChange={set('blood_group')} style={selectStyle}>
                                <option value="">Select</option>
                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Insurance Policy ID</label>
                            <input value={form.insurance_id} onChange={set('insurance_id')} placeholder="INS-XXXXXX" style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Insurance Provider</label>
                        <input value={form.insurance_provider} onChange={set('insurance_provider')} placeholder="e.g. Star Health, LIC" style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Address</label>
                        <input value={form.address} onChange={set('address')} placeholder="City, State" style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Primary Diagnosis</label>
                        <textarea value={form.diagnosis} onChange={set('diagnosis')} placeholder="e.g. Major Depressive Disorder, Type 2 Diabetes..." rows={2}
                            style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Known Allergies</label>
                        <input value={form.allergies} onChange={set('allergies')} placeholder="e.g. Penicillin, Sulfa drugs" style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <label style={labelStyle}>Current Medications</label>
                        <input value={form.medications} onChange={set('medications')} placeholder="e.g. Metformin 500mg, Atorvastatin 20mg" style={inputStyle} />
                    </div>

                    {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, marginBottom: 14 }}>{error}</div>}

                    <button type="submit" disabled={loading}
                        className="btn-generate"
                        style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter', opacity: loading ? 0.7 : 1 }}>
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <CheckCircle2 size={16} /> {loading ? 'Registering...' : 'Register Patient'}
                        </span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

// ── Add Medicine Modal ─────────────────────────────────────────────────────────
function AddMedicineModal({ patient, onClose, onAdded }) {
    const { authFetch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', dosage: '', frequency: '', duration: '', notes: '' });

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await authFetch('/api/medicines/', {
                method: 'POST',
                body: JSON.stringify({ ...form, patient: patient.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(Object.values(data).flat().join(' '));
                return;
            }
            onAdded(data);
            onClose();
        } catch (err) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '9px 13px', borderRadius: 9,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter', outline: 'none',
    };
    const labelStyle = {
        fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.6)',
        marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="glass-panel-strong"
                style={{ width: 460, borderRadius: 20, padding: 28 }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Prescribe Medicine</h2>
                        <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>For: {patient?.name}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.6)' }}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {[
                        ['Medicine Name', 'name', 'e.g. Metformin', true],
                        ['Dosage', 'dosage', 'e.g. 500mg'],
                        ['Frequency', 'frequency', 'e.g. Twice daily'],
                        ['Duration', 'duration', 'e.g. 30 days'],
                    ].map(([label, key, ph, req]) => (
                        <div key={key} style={{ marginBottom: 12 }}>
                            <label style={labelStyle}>{label} {req && '*'}</label>
                            <input value={form[key]} onChange={set(key)} placeholder={ph} required={req} style={inputStyle} />
                        </div>
                    ))}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Notes</label>
                        <textarea value={form.notes} onChange={set('notes')} placeholder="Additional instructions..." rows={2}
                            style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    {error && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</div>}
                    <button type="submit" disabled={loading} className="btn-generate"
                        style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter', opacity: loading ? 0.7 : 1 }}>
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Pill size={14} /> {loading ? 'Prescribing...' : 'Add Prescription'}
                        </span>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

// ── Patient Card ───────────────────────────────────────────────────────────────
function PatientCard({ p, selected, onClick }) {
    const genderLabel = { M: 'Male', F: 'Female', O: 'Other' };
    const riskLevel = p.riskLevel || 'Low';
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.005, x: 3 }}
            onClick={onClick}
            className="glass-panel"
            style={{
                padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
                border: selected ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(255,255,255,0.04)',
                background: selected ? 'rgba(0,212,255,0.05)' : undefined,
                transition: 'all 0.2s ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(139,92,246,0.18))',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700, color: '#00d4ff',
                    }}>{p.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>
                            {p.patient_id} • {p.age}y • {genderLabel[p.gender] || p.gender}
                            {p.address ? ` • ${p.address}` : ''}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.diagnosis && (
                        <span className="pill-badge pill-teal" style={{ fontSize: 10 }}>
                            {p.diagnosis.slice(0, 20)}{p.diagnosis.length > 20 ? '…' : ''}
                        </span>
                    )}
                    {p.insurance_id && <Shield size={13} color="#10b981" title="Has Insurance" />}
                    <ChevronRight size={14} color="rgba(148,163,184,0.4)" />
                </div>
            </div>
        </motion.div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PatientsPage() {
    const { authFetch } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedPatient, setSelected] = useState(null);
    const [showMedModal, setShowMedModal] = useState(false);
    const [patientMeds, setPatientMeds] = useState([]);
    const [downloading, setDownloading] = useState(false);

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/patients/?search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : (data.results || []));
        } catch { }
        finally { setLoading(false); }
    }, [authFetch, search]);

    useEffect(() => { fetchPatients(); }, [fetchPatients]);

    const fetchMedicines = useCallback(async (patient) => {
        try {
            const res = await authFetch(`/api/medicines/?patient=${patient.id}`);
            const data = await res.json();
            setPatientMeds(Array.isArray(data) ? data : (data.results || []));
        } catch { setPatientMeds([]); }
    }, [authFetch]);

    const handleSelectPatient = (p) => {
        setSelected(p);
        fetchMedicines(p);
    };

    const handleDownloadReport = async (patient) => {
        setDownloading(true);
        try {
            const res = await authFetch(`/api/patients/${patient.id}/report/`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `patient_report_${patient.patient_id}.txt`; a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download report: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    const handleExportAll = async () => {
        try {
            const res = await authFetch('/api/patients/export_all/');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'patients_export.csv'; a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Export failed: ' + err.message);
        }
    };

    const genderLabel = { M: 'Male', F: 'Female', O: 'Other' };

    return (
        <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
            <AnimatePresence>
                {showModal && (
                    <AddPatientModal
                        onClose={() => setShowModal(false)}
                        onAdded={(p) => { setPatients(prev => [p, ...prev]); setSelected(p); }}
                    />
                )}
                {showMedModal && selectedPatient && (
                    <AddMedicineModal
                        patient={selectedPatient}
                        onClose={() => setShowMedModal(false)}
                        onAdded={(m) => setPatientMeds(prev => [m, ...prev])}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text">Patient Registry</span></h1>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>
                        {patients.length} patients registered
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={handleExportAll}
                        style={{ padding: '9px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.7)' }}>
                        <Download size={13} /> Export CSV
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowModal(true)} className="btn-generate"
                        style={{ padding: '9px 18px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={15} /> Add Patient
                        </span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Search bar */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-panel" style={{ padding: '10px 14px', borderRadius: 14, marginBottom: 20, display: 'flex', gap: 10 }}>
                <div className="glass-input" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10 }}>
                    <Search size={14} color="rgba(148,163,184,0.5)" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, ID, or diagnosis…"
                        style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, width: '100%', fontFamily: 'Inter' }} />
                </div>
                <motion.button whileHover={{ scale: 1.04 }} onClick={fetchPatients}
                    style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <RefreshCw size={13} /> Refresh
                </motion.button>
            </motion.div>

            {/* Main layout */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '1fr 400px' : '1fr', gap: 16 }}>
                {/* Patient list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(148,163,184,0.4)' }}>
                            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                            <p style={{ fontSize: 13 }}>Loading patients…</p>
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', borderRadius: 16 }}>
                            <Users size={40} color="rgba(148,163,184,0.3)" style={{ marginBottom: 12 }} />
                            <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.5)' }}>No patients found</p>
                            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.3)', marginTop: 6 }}>Click "Add Patient" to register one</p>
                        </div>
                    ) : (
                        patients.map((p, i) => (
                            <motion.div key={p.id || p.patient_id} transition={{ delay: i * 0.03 }}>
                                <PatientCard p={p} selected={selectedPatient?.id === p.id} onClick={() => handleSelectPatient(p)} />
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Patient Detail Sidebar */}
                <AnimatePresence>
                    {selectedPatient && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="glass-panel-strong"
                            style={{ borderRadius: 18, padding: 22, alignSelf: 'flex-start', position: 'sticky', top: 24, maxHeight: '85vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Patient Details</h3>
                                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.5)' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                                <div style={{
                                    width: 54, height: 54, borderRadius: 14,
                                    background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, fontWeight: 800, color: 'white',
                                }}>{selectedPatient.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                <div>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{selectedPatient.name}</p>
                                    <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{selectedPatient.patient_id}</p>
                                </div>
                            </div>

                            {/* Info rows */}
                            {[
                                { icon: Calendar, label: 'Age / Gender', value: `${selectedPatient.age}y • ${genderLabel[selectedPatient.gender] || selectedPatient.gender}` },
                                { icon: Phone, label: 'Phone', value: selectedPatient.phone || 'N/A' },
                                { icon: Mail, label: 'Email', value: selectedPatient.email || 'N/A' },
                                { icon: MapPin, label: 'Address', value: selectedPatient.address || 'N/A' },
                                { icon: Droplets, label: 'Blood Group', value: selectedPatient.blood_group || 'N/A' },
                                { icon: Shield, label: 'Insurance', value: selectedPatient.insurance_provider ? `${selectedPatient.insurance_provider} (${selectedPatient.insurance_id || '—'})` : 'N/A' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <Icon size={12} color="rgba(148,163,184,0.5)" style={{ marginTop: 2 }} />
                                    <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', minWidth: 72 }}>{label}</span>
                                    <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500, flex: 1 }}>{value}</span>
                                </div>
                            ))}

                            {/* Diagnosis */}
                            {selectedPatient.diagnosis && (
                                <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)' }}>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: '#00d4ff', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Diagnosis</p>
                                    <p style={{ fontSize: 12, color: 'rgba(226,232,240,0.8)', lineHeight: 1.5 }}>{selectedPatient.diagnosis}</p>
                                </div>
                            )}

                            {/* Allergies */}
                            {selectedPatient.allergies && (
                                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: '#ef4444', marginBottom: 4, textTransform: 'uppercase' }}>Allergies</p>
                                    <p style={{ fontSize: 12, color: 'rgba(226,232,240,0.8)' }}>{selectedPatient.allergies}</p>
                                </div>
                            )}

                            {/* Medicines */}
                            <div style={{ marginTop: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Prescribed Medicines ({patientMeds.length})
                                    </p>
                                    <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
                                        onClick={() => setShowMedModal(true)}
                                        style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Plus size={11} /> Add
                                    </motion.button>
                                </div>
                                {patientMeds.length === 0 ? (
                                    <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.3)', textAlign: 'center', padding: '8px 0' }}>No medicines prescribed yet</p>
                                ) : (
                                    patientMeds.map(m => (
                                        <div key={m.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa' }}>{m.name}</span>
                                                <span style={{ fontSize: 10, color: m.is_active ? '#10b981' : 'rgba(148,163,184,0.4)' }}>
                                                    {m.is_active ? '● Active' : '● Inactive'}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>
                                                {[m.dosage, m.frequency, m.duration].filter(Boolean).join(' • ')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Action buttons */}
                            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => handleDownloadReport(selectedPatient)}
                                    disabled={downloading}
                                    className="btn-neon-teal"
                                    style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                    <Download size={14} /> {downloading ? 'Generating...' : 'Download Full Report'}
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="btn-generate"
                                    style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter' }}>
                                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                                        <FileText size={14} /> Generate Codes for Patient
                                    </span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
