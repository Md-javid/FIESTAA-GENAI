/**
 * LoginPage.jsx — Beautiful dual-mode (Doctor / Hospital) Login & Register page
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ── Floating particles background ────────────────────────────────────────── */
function FloatingParticles() {
    return (
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="auth-particle" style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 8}s`,
                    animationDuration: `${6 + Math.random() * 6}s`,
                    width: `${4 + Math.random() * 8}px`,
                    height: `${4 + Math.random() * 8}px`,
                    opacity: 0.3 + Math.random() * 0.4,
                }} />
            ))}
        </div>
    );
}

/* ── Role Selector ─────────────────────────────────────────────────────────── */
function RoleSelector({ role, onChange }) {
    return (
        <div className="role-selector">
            {['doctor', 'hospital'].map(r => (
                <button
                    key={r}
                    type="button"
                    className={`role-btn ${role === r ? 'active' : ''}`}
                    onClick={() => onChange(r)}
                    id={`role-${r}`}
                >
                    <span className="role-icon">{r === 'doctor' ? '🩺' : '🏥'}</span>
                    <span>{r === 'doctor' ? 'Doctor' : 'Hospital System'}</span>
                </button>
            ))}
        </div>
    );
}

/* ── Input Field ───────────────────────────────────────────────────────────── */
function Field({ label, id, type = 'text', value, onChange, placeholder, required }) {
    return (
        <div className="auth-field">
            <label htmlFor={id}>{label} {required && <span style={{ color: 'var(--clr-accent)' }}>*</span>}</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="auth-input"
                autoComplete={type === 'password' ? 'current-password' : 'on'}
            />
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function LoginPage({ onSuccess }) {
    const { saveAuth } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [role, setRole] = useState('doctor');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ── form state ─────────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        email: '', password: '', password2: '', full_name: '',
        specialty: '', license_number: '', registration_id: '',
        hospital_name: '', hospital_type: '', facility_id: '',
        phone: '', city: '',
    });

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    // ── submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        try {
            const endpoint = mode === 'login'
                ? `${API_BASE}/api/auth/login/`
                : `${API_BASE}/api/auth/register/`;

            const payload = mode === 'login'
                ? { email: form.email, password: form.password }
                : { ...form, role };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = typeof data === 'object'
                    ? Object.values(data).flat().join(' ')
                    : 'Something went wrong.';
                setError(msg);
                return;
            }

            saveAuth(data.user, { access: data.access, refresh: data.refresh });
            setSuccess(mode === 'login' ? 'Welcome back!' : 'Account created!');
            setTimeout(() => onSuccess(data.user), 800);

        } catch (err) {
            setError(err.message || 'Network error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-root">
            <FloatingParticles />

            {/* ── Left panel — branding ──────────────────────────────────────────── */}
            <div className="auth-brand-panel">
                <div className="auth-brand-content">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="auth-logo">
                            <span className="auth-logo-icon">⚕️</span>
                            <span className="auth-logo-text">MediCode AI</span>
                        </div>
                        <h1 className="auth-brand-headline">
                            AI-Powered Medical<br />
                            <span className="auth-gradient-text">Coding & Compliance</span>
                        </h1>
                        <p className="auth-brand-desc">
                            Instantly generate ICD-11, CPT &amp; SNOMED codes from clinical notes.
                            Built for doctors and hospital systems — ABDM &amp; FHIR R4 compliant.
                        </p>

                        <div className="auth-features">
                            {[
                                { icon: '🧠', text: 'Gemini AI-powered code generation' },
                                { icon: '📋', text: 'ICD-11 TM2 + CPT + SNOMED CT' },
                                { icon: '🏥', text: 'ABDM v3 & HL7 FHIR R4 ready' },
                                { icon: '🔒', text: 'Secure JWT authentication' },
                            ].map(({ icon, text }) => (
                                <div key={text} className="auth-feature-item">
                                    <span>{icon}</span>
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Right panel — form ────────────────────────────────────────────── */}
            <div className="auth-form-panel">
                <motion.div
                    className="auth-card"
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Mode toggle */}
                    <div className="auth-mode-toggle">
                        <button
                            id="btn-login-mode"
                            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); setError(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            id="btn-register-mode"
                            className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => { setMode('register'); setError(''); }}
                        >
                            Register
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.form
                            key={mode}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                            onSubmit={handleSubmit}
                            className="auth-form"
                        >
                            {mode === 'register' && (
                                <>
                                    <div className="auth-section-label">Select your role</div>
                                    <RoleSelector role={role} onChange={setRole} />
                                </>
                            )}

                            <Field id="auth-email" label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@hospital.org" required />
                            {mode === 'register' && (
                                <Field id="auth-name" label="Full Name" value={form.full_name} onChange={set('full_name')} placeholder="Dr. Priya Sharma" required />
                            )}
                            <Field id="auth-password" label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />

                            {mode === 'register' && (
                                <>
                                    <Field id="auth-password2" label="Confirm Password" type="password" value={form.password2} onChange={set('password2')} placeholder="••••••••" required />

                                    {role === 'doctor' ? (
                                        <>
                                            <div className="auth-section-label">🩺 Doctor Details</div>
                                            <Field id="auth-specialty" label="Specialty" value={form.specialty} onChange={set('specialty')} placeholder="Cardiology" />
                                            <Field id="auth-license" label="License Number" value={form.license_number} onChange={set('license_number')} placeholder="MCI-12345" required />
                                            <Field id="auth-abdm" label="ABDM Reg. ID" value={form.registration_id} onChange={set('registration_id')} placeholder="ABDM-XXXX" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="auth-section-label">🏥 Hospital Details</div>
                                            <Field id="auth-hospital-name" label="Hospital Name" value={form.hospital_name} onChange={set('hospital_name')} placeholder="Apollo Hospitals" required />
                                            <Field id="auth-hospital-type" label="Hospital Type" value={form.hospital_type} onChange={set('hospital_type')} placeholder="Multi-Specialty" />
                                            <Field id="auth-facility-id" label="Facility ID" value={form.facility_id} onChange={set('facility_id')} placeholder="ABDM-FAC-XXXX" />
                                        </>
                                    )}

                                    <div className="auth-row">
                                        <Field id="auth-phone" label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
                                        <Field id="auth-city" label="City" value={form.city} onChange={set('city')} placeholder="Mumbai" />
                                    </div>
                                </>
                            )}

                            {error && <div className="auth-alert error">{error}</div>}
                            {success && <div className="auth-alert success">✅ {success}</div>}

                            <button id="auth-submit" type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? <span className="spinner" /> : (mode === 'login' ? 'Sign In →' : 'Create Account →')}
                            </button>

                            {mode === 'login' && (
                                <p className="auth-switch">
                                    Don't have an account?{' '}
                                    <button type="button" className="auth-link" onClick={() => setMode('register')}>
                                        Register here
                                    </button>
                                </p>
                            )}
                        </motion.form>
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
