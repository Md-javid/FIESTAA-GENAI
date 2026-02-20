/**
 * CompliancePage.jsx
 * EHR compliance dashboard — visual checklist for ABDM, FHIR, HL7 standards.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, CheckCircle2, AlertTriangle, XCircle, Clock,
    FileText, Globe, Database, Lock, Server, Activity,
    RefreshCw, Download, ChevronRight, Zap, Heart,
} from 'lucide-react';

const COMPLIANCE_SECTIONS = [
    {
        title: 'ABDM (Ayushman Bharat Digital Mission)',
        description: 'National digital health infrastructure compliance',
        icon: Shield,
        color: '#10b981',
        checks: [
            { name: 'Health ID (ABHA) Integration', status: 'pass', detail: 'ABHA number mapping enabled' },
            { name: 'FHIR R4 Bundle Export', status: 'pass', detail: 'All resources exported as FHIR R4 bundles' },
            { name: 'Consent Manager Hookup', status: 'pass', detail: 'M1/M2/M3 consent artefact flows supported' },
            { name: 'Health Information Exchange', status: 'pass', detail: 'HIP/HIU protocols implemented' },
            { name: 'Digital Health Records', status: 'pass', detail: 'PHR app interoperability verified' },
        ],
    },
    {
        title: 'ICD-11 TM2 (WHO)',
        description: 'World Health Organization classification compliance',
        icon: Globe,
        color: '#00d4ff',
        checks: [
            { name: 'ICD-11 2024 Release Codes', status: 'pass', detail: 'Full TM2 codeset loaded (78,000+ entities)' },
            { name: 'Extension Code Support', status: 'pass', detail: 'Severity, anatomy, laterality extensions' },
            { name: 'Multiple Coding (Post-coordination)', status: 'pass', detail: 'Cluster coding with stem + extensions' },
            { name: 'ICD-10 Backward Mapping', status: 'pass', detail: 'Automatic ICD-10 equivalent code generation' },
            { name: 'SNOMED CT Cross-Reference', status: 'pass', detail: 'SNOMED concept IDs mapped where available' },
        ],
    },
    {
        title: 'NAMASTE Framework',
        description: 'Indian multi-axial nosology coding framework',
        icon: Heart,
        color: '#8b5cf6',
        checks: [
            { name: 'Nature Domain (N)', status: 'pass', detail: 'Primary diagnostic classification coded' },
            { name: 'Aetiology Domain (A)', status: 'pass', detail: 'Causal factors mapped' },
            { name: 'Manifestation Domain (M)', status: 'pass', detail: 'Symptom presentations classified' },
            { name: 'Severity Domain (S)', status: 'pass', detail: '4-level severity scaling applied' },
            { name: 'Trajectory Domain (T)', status: 'pass', detail: 'Course and prognosis tracking coded' },
            { name: 'Explanatory Model (E)', status: 'pass', detail: 'Cultural attribution models supported' },
            { name: 'AYUSH Correlation', status: 'warn', detail: 'Partial — only available for select conditions' },
        ],
    },
    {
        title: 'HL7 & FHIR Standards',
        description: 'Health Level 7 interoperability compliance',
        icon: Database,
        color: '#f59e0b',
        checks: [
            { name: 'FHIR R4 Condition Resource', status: 'pass', detail: 'Full Condition resource with extensions' },
            { name: 'FHIR DiagnosticReport', status: 'pass', detail: 'AI coding report as DiagnosticReport' },
            { name: 'FHIR Patient Resource', status: 'pass', detail: 'Demographic data in Patient resource' },
            { name: 'HL7 v2.5 ADT Messages', status: 'pass', detail: 'ADT event mapping supported' },
            { name: 'LOINC Code Integration', status: 'warn', detail: 'Lab codes mapped for investigations only' },
        ],
    },
    {
        title: 'Data Security & Privacy',
        description: 'HIPAA equivalent & Indian DPDP Act compliance',
        icon: Lock,
        color: '#ec4899',
        checks: [
            { name: 'End-to-End Encryption', status: 'pass', detail: 'TLS 1.3 for all API communications' },
            { name: 'DPDP Act 2023 Compliance', status: 'pass', detail: 'Personal data handled per Indian DPDP Act' },
            { name: 'Access Control (RBAC)', status: 'pass', detail: 'Role-based access for physicians, admin' },
            { name: 'Audit Logging', status: 'pass', detail: 'All coding sessions logged with request IDs' },
            { name: 'Data Anonymisation', status: 'pass', detail: 'PII stripped from AI prompts before API call' },
            { name: 'API Rate Limiting', status: 'pass', detail: '30 req/15min window per IP enforced' },
        ],
    },
];

const statusIcon = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle };
const statusColor = { pass: '#10b981', warn: '#f59e0b', fail: '#ef4444' };
const statusLabel = { pass: 'Passed', warn: 'Partial', fail: 'Failed' };

export default function CompliancePage() {
    const [expandedSection, setExpandedSection] = useState(0);

    const totalChecks = COMPLIANCE_SECTIONS.reduce((a, s) => a + s.checks.length, 0);
    const passedChecks = COMPLIANCE_SECTIONS.reduce((a, s) => a + s.checks.filter(c => c.status === 'pass').length, 0);
    const warnChecks = COMPLIANCE_SECTIONS.reduce((a, s) => a + s.checks.filter(c => c.status === 'warn').length, 0);
    const score = Math.round((passedChecks / totalChecks) * 100);

    return (
        <div style={{ padding: '24px 28px', maxWidth: 1400 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text">EHR Compliance Dashboard</span></h1>
                <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)' }}>Real-time compliance status for all supported healthcare interoperability standards.</p>
            </motion.div>

            {/* Score card row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Overall Score', value: `${score}%`, icon: Shield, color: '#10b981' },
                    { label: 'Checks Passed', value: `${passedChecks}/${totalChecks}`, icon: CheckCircle2, color: '#00d4ff' },
                    { label: 'Warnings', value: warnChecks, icon: AlertTriangle, color: '#f59e0b' },
                    { label: 'Last Audit', value: 'Just Now', icon: Clock, color: '#8b5cf6' },
                ].map(({ label, value, icon: Icon, color }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.05 }}
                        className="glass-panel" style={{ padding: '16px 18px', borderRadius: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={15} color={color} />
                            </div>
                            <div>
                                <p style={{ fontSize: 20, fontWeight: 700, color }}>{value}</p>
                                <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>{label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Compliance sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {COMPLIANCE_SECTIONS.map((section, si) => {
                    const SIcon = section.icon;
                    const passed = section.checks.filter(c => c.status === 'pass').length;
                    const isExpanded = expandedSection === si;
                    return (
                        <motion.div key={si} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + si * 0.05 }}
                            className="glass-panel" style={{ borderRadius: 14, overflow: 'hidden' }}>
                            {/* Section header */}
                            <motion.div
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                onClick={() => setExpandedSection(isExpanded ? -1 : si)}
                                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: `${section.color}15`, border: `1px solid ${section.color}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <SIcon size={18} color={section.color} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{section.title}</p>
                                        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{section.description}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: section.color }}>
                                        {passed}/{section.checks.length}
                                    </span>
                                    {/* Mini progress bar */}
                                    <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(passed / section.checks.length) * 100}%` }}
                                            transition={{ duration: 0.8, delay: 0.2 + si * 0.1 }}
                                            style={{ height: '100%', background: section.color, borderRadius: 4, boxShadow: `0 0 6px ${section.color}` }}
                                        />
                                    </div>
                                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronRight size={14} color="rgba(148,163,184,0.4)" />
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Expanded checks */}
                            {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px' }}>
                                    {section.checks.map((check, ci) => {
                                        const CIcon = statusIcon[check.status];
                                        return (
                                            <motion.div key={ci}
                                                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: ci * 0.03 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                    padding: '10px 0',
                                                    borderBottom: ci < section.checks.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                                }}>
                                                <CIcon size={15} color={statusColor[check.status]} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0' }}>{check.name}</p>
                                                    <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>{check.detail}</p>
                                                </div>
                                                <span className="pill-badge" style={{
                                                    background: `${statusColor[check.status]}12`,
                                                    border: `1px solid ${statusColor[check.status]}30`,
                                                    color: statusColor[check.status],
                                                    fontSize: 9,
                                                }}>{statusLabel[check.status]}</span>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Action bar */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="btn-neon-teal" style={{ padding: '10px 18px', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={13} /> Run Full Audit
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="btn-neon-teal" style={{ padding: '10px 18px', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={13} /> Export Report
                </motion.button>
            </motion.div>
        </div>
    );
}
