/**
 * SettingsPage.jsx
 * Application settings — API config, appearance, notification preferences.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, Key, Palette, Bell, Globe, Shield, Database,
    Save, RefreshCw, ChevronRight, CheckCircle2, Info,
    Eye, EyeOff, Server, Zap, Monitor, Moon,
} from 'lucide-react';

function SettingGroup({ title, icon: Icon, color, children }) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel" style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{title}</span>
            </div>
            <div style={{ padding: '16px 20px' }}>{children}</div>
        </motion.div>
    );
}

function SettingRow({ label, desc, children }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
            <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{label}</p>
                {desc && <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>{desc}</p>}
            </div>
            {children}
        </div>
    );
}

function Toggle({ checked, onChange, id }) {
    return (
        <label className="ios-toggle" htmlFor={id}>
            <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="ios-slider" />
        </label>
    );
}

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [model, setModel] = useState('gemini-1.5-pro');
    const [temp, setTemp] = useState(0.2);
    const [autoDetect, setAutoDetect] = useState(true);
    const [streaming, setStreaming] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [riskAlerts, setRiskAlerts] = useState(true);
    const [complianceAlerts, setComplianceAlerts] = useState(true);
    const [auditLog, setAuditLog] = useState(true);
    const [anonymise, setAnonymise] = useState(true);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div style={{ padding: '24px 28px', maxWidth: 900 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text">Settings</span></h1>
                    <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>Configure API, appearance, and security preferences.</p>
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    className="btn-generate"
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {saved ? <><CheckCircle2 size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
                    </span>
                </motion.button>
            </motion.div>

            {/* API Configuration */}
            <SettingGroup title="API Configuration" icon={Key} color="#00d4ff">
                <SettingRow label="Gemini API Key" desc="Your Google AI Studio API key for clinical code generation">
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className="glass-input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, width: 280 }}>
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                style={{ background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 12, width: '100%', fontFamily: 'monospace' }}
                            />
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setShowKey(!showKey)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.5)' }}>
                                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </motion.button>
                        </div>
                    </div>
                </SettingRow>
                <SettingRow label="AI Model" desc="Select the Gemini model variant for code generation">
                    <select value={model} onChange={e => setModel(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8, padding: '6px 12px', color: '#e2e8f0', fontSize: 12,
                            fontFamily: 'Inter', outline: 'none', cursor: 'pointer', minWidth: 200,
                        }}>
                        <option value="gemini-1.5-pro" style={{ background: '#0a0a0f' }}>Gemini 1.5 Pro (Recommended)</option>
                        <option value="gemini-1.5-flash" style={{ background: '#0a0a0f' }}>Gemini 1.5 Flash (Faster)</option>
                        <option value="gemini-2.0-flash" style={{ background: '#0a0a0f' }}>Gemini 2.0 Flash (Latest)</option>
                    </select>
                </SettingRow>
                <SettingRow label="Temperature" desc={`Controls randomness: ${temp} (lower = more deterministic)`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
                        <input type="range" min="0" max="1" step="0.1" value={temp}
                            onChange={e => setTemp(parseFloat(e.target.value))}
                            style={{ flex: 1, accentColor: '#00d4ff' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#00d4ff', minWidth: 24 }}>{temp}</span>
                    </div>
                </SettingRow>
            </SettingGroup>

            {/* AI Behavior */}
            <SettingGroup title="AI Behavior" icon={Zap} color="#8b5cf6">
                <SettingRow label="Auto-Detect Symptoms" desc="AI extracts symptoms from unstructured clinical prose">
                    <Toggle id="set-autodetect" checked={autoDetect} onChange={setAutoDetect} />
                </SettingRow>
                <SettingRow label="Live Streaming" desc="Stream AI output in real-time via SSE">
                    <Toggle id="set-streaming" checked={streaming} onChange={setStreaming} />
                </SettingRow>
            </SettingGroup>

            {/* Appearance */}
            <SettingGroup title="Appearance" icon={Palette} color="#f59e0b">
                <SettingRow label="Dark Mode" desc="Premium obsidian dark theme (recommended for clinical use)">
                    <Toggle id="set-darkmode" checked={darkMode} onChange={setDarkMode} />
                </SettingRow>
            </SettingGroup>

            {/* Notifications */}
            <SettingGroup title="Notifications" icon={Bell} color="#ec4899">
                <SettingRow label="Push Notifications" desc="Receive alerts for completed coding sessions">
                    <Toggle id="set-notifications" checked={notifications} onChange={setNotifications} />
                </SettingRow>
                <SettingRow label="Risk Flag Alerts" desc="Alert when high-risk flags are detected (e.g. suicide risk)">
                    <Toggle id="set-risk" checked={riskAlerts} onChange={setRiskAlerts} />
                </SettingRow>
                <SettingRow label="Compliance Warnings" desc="Notify on EHR compliance standard changes">
                    <Toggle id="set-compliance" checked={complianceAlerts} onChange={setComplianceAlerts} />
                </SettingRow>
            </SettingGroup>

            {/* Security & Privacy */}
            <SettingGroup title="Security & Privacy" icon={Shield} color="#10b981">
                <SettingRow label="Audit Logging" desc="Log all coding sessions with request IDs for review">
                    <Toggle id="set-audit" checked={auditLog} onChange={setAuditLog} />
                </SettingRow>
                <SettingRow label="PII Anonymisation" desc="Strip patient identifiers before sending to AI API">
                    <Toggle id="set-anonymise" checked={anonymise} onChange={setAnonymise} />
                </SettingRow>
            </SettingGroup>

            {/* System Info */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Info size={14} color="rgba(0,212,255,0.6)" />
                <div>
                    <p style={{ fontSize: 12, color: 'rgba(226,232,240,0.8)' }}>
                        <strong>MediCode AI v2.0</strong> • EHR Middleware Platform
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>
                        Powered by Gemini 1.5 Pro • ABDM v3 / FHIR R4 / ICD-11 TM2 / NAMASTE
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
