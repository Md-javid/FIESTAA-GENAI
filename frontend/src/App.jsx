/**
 * App.jsx — Root component with JWT auth gate + Sidebar + Router layout
 * Role-based routing: hospital → HospitalDashboard, doctor → AnalyticsDashboard
 */
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Auth ─────────────────────────────────────────────────────────────────── */
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';

/* ── Pages ────────────────────────────────────────────────────────────────── */
import Sidebar from './components/Sidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Dashboard from './components/Dashboard';
import PatientsPage from './components/PatientsPage';
import HistoryPage from './components/HistoryPage';
import FhirExplorer from './components/FhirExplorer';
import CompliancePage from './components/CompliancePage';
import SettingsPage from './components/SettingsPage';
import HospitalDashboard from './components/HospitalDashboard';

/* ── Ambient floating neon orbs ──────────────────────────────────────────── */
function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <div className="orb orb-teal" />
      <div className="orb orb-purple" />
      <div className="orb orb-pink" />
    </div>
  );
}

/* ── Page transition wrapper ─────────────────────────────────────────────── */
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

/* ── Protected layout (requires login) ──────────────────────────────────── */
function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const isHospital = user.role === 'hospital';

  return (
    <>
      <AmbientBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          user={user}
          onLogout={logout}
        />
        <AnimatePresence mode="wait">
          <Routes>
            {/* ── Root: role-based home ── */}
            <Route
              path="/"
              element={
                <PageWrapper>
                  {isHospital ? <HospitalDashboard /> : <AnalyticsDashboard />}
                </PageWrapper>
              }
            />
            {/* ── Hospital-specific ── */}
            <Route path="/hospital" element={
              <PageWrapper>
                {isHospital ? <HospitalDashboard /> : <Navigate to="/" replace />}
              </PageWrapper>
            } />
            {/* ── Common pages ── */}
            <Route path="/generate" element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/patients" element={<PageWrapper><PatientsPage /></PageWrapper>} />
            <Route path="/history" element={<PageWrapper><HistoryPage /></PageWrapper>} />
            <Route path="/fhir" element={<PageWrapper><FhirExplorer /></PageWrapper>} />
            <Route path="/compliance" element={<PageWrapper><CompliancePage /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthGate />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

/* ── Auth gate — if already logged in, redirect to app ──────────────────── */
function AuthGate() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <LoginPage onSuccess={() => { }} />;
}
