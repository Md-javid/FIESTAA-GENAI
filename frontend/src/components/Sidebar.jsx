/**
 * Sidebar.jsx
 * Premium glassmorphism sidebar navigation with icon labels,
 * active-state indicators, and liquid hover animations.
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, BrainCircuit, History as HistoryIcon, Shield, Users,
    FileText, Settings, Activity, Sparkles, HeartPulse,
    ChevronLeft, ChevronRight, Search,
} from 'lucide-react';

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/generate', label: 'Code Generator', icon: BrainCircuit },
    { path: '/patients', label: 'Patients', icon: Users },
    { path: '/history', label: 'History', icon: HistoryIcon },
    { path: '/fhir', label: 'FHIR Explorer', icon: FileText },
    { path: '/compliance', label: 'EHR Compliance', icon: Shield },
    { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
    const location = useLocation();

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
                width: collapsed ? 68 : 230,
                minHeight: '100vh',
                background: 'rgba(8,8,14,0.85)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(30px)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1)',
                position: 'sticky',
                top: 0,
                alignSelf: 'flex-start',
                zIndex: 50,
                flexShrink: 0,
            }}
        >
            {/* Logo */}
            <div style={{
                padding: collapsed ? '20px 12px' : '20px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', gap: 10,
                overflow: 'hidden',
            }}>
                <div style={{
                    width: 36, height: 36, minWidth: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(0,212,255,0.3)',
                }}>
                    <BrainCircuit size={18} color="white" />
                </div>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 style={{
                            fontSize: 16, fontWeight: 800,
                            background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            whiteSpace: 'nowrap',
                        }}>MediCode AI</h1>
                        <p style={{ fontSize: 9, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                            EHR MIDDLEWARE v2.0
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Search (expanded only) */}
            {!collapsed && (
                <div style={{ padding: '12px 14px' }}>
                    <div className="glass-input" style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', borderRadius: 10,
                    }}>
                        <Search size={13} color="rgba(148,163,184,0.5)" />
                        <input
                            type="text"
                            placeholder="Search…"
                            style={{
                                background: 'none', border: 'none', outline: 'none',
                                color: '#e2e8f0', fontSize: 12, width: '100%',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                    const isActive = location.pathname === path;
                    return (
                        <NavLink
                            key={path}
                            to={path}
                            style={{ textDecoration: 'none' }}
                        >
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 11,
                                    padding: collapsed ? '11px 0' : '11px 14px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
                                    border: isActive
                                        ? '1px solid rgba(0,212,255,0.2)'
                                        : '1px solid transparent',
                                    position: 'relative',
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        style={{
                                            position: 'absolute',
                                            left: collapsed ? '50%' : 0,
                                            top: collapsed ? 'auto' : '50%',
                                            bottom: collapsed ? 0 : 'auto',
                                            transform: collapsed ? 'translateX(-50%)' : 'translateY(-50%)',
                                            width: collapsed ? 20 : 3,
                                            height: collapsed ? 3 : 20,
                                            borderRadius: 3,
                                            background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                                            boxShadow: '0 0 8px rgba(0,212,255,0.5)',
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon
                                    size={18}
                                    color={isActive ? '#00d4ff' : 'rgba(148,163,184,0.6)'}
                                    style={{ transition: 'color 0.2s ease', minWidth: 18 }}
                                />
                                {!collapsed && (
                                    <span style={{
                                        fontSize: 13,
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? '#e2e8f0' : 'rgba(148,163,184,0.7)',
                                        whiteSpace: 'nowrap',
                                        transition: 'color 0.2s ease',
                                    }}>
                                        {label}
                                    </span>
                                )}
                            </motion.div>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div style={{
                padding: '12px 8px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'center',
            }}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onToggle}
                    style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'rgba(148,163,184,0.5)',
                    }}
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </motion.button>
            </div>

            {/* Status card (expanded only) */}
            {!collapsed && (
                <div style={{ padding: '0 14px 16px' }}>
                    <div style={{
                        padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(16,185,129,0.06)',
                        border: '1px solid rgba(16,185,129,0.15)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <div className="pulse-dot" style={{
                                width: 6, height: 6, borderRadius: '50%', background: '#10b981'
                            }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981' }}>System Online</span>
                        </div>
                        <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', lineHeight: 1.5 }}>
                            ABDM Gateway Connected<br />
                            Gemini 1.5 Pro Ready
                        </p>
                    </div>
                </div>
            )}
        </motion.aside>
    );
}
