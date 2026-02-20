/**
 * App.jsx
 * Root component — Sidebar + Router layout with ambient background.
 */
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Pages ────────────────────────────────────────────────────────────── */
import Sidebar from './components/Sidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Dashboard from './components/Dashboard';
import PatientsPage from './components/PatientsPage';
import HistoryPage from './components/HistoryPage';
import FhirExplorer from './components/FhirExplorer';
import CompliancePage from './components/CompliancePage';
import SettingsPage from './components/SettingsPage';

/* ── Ambient floating neon orbs ──────────────────────────────────────── */
function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Teal orb */}
      <div className="orb orb-teal" />
      {/* Purple orb */}
      <div className="orb orb-purple" />
      {/* Subtle pink orb */}
      <div className="orb orb-pink" />
    </div>
  );
}

/* ── Page transition wrapper ─────────────────────────────────────────── */
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ flex: 1, minWidth: 0, overflowY: 'auto', minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <AmbientBackground />

      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        minHeight: '100vh',
      }}>
        {/* Permanent sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />

        {/* Page area */}
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageWrapper><AnalyticsDashboard /></PageWrapper>} />
            <Route path="/generate" element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/patients" element={<PageWrapper><PatientsPage /></PageWrapper>} />
            <Route path="/history" element={<PageWrapper><HistoryPage /></PageWrapper>} />
            <Route path="/fhir" element={<PageWrapper><FhirExplorer /></PageWrapper>} />
            <Route path="/compliance" element={<PageWrapper><CompliancePage /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
