/**
 * AuthContext.jsx — JWT Auth state, stored in localStorage
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('medicode_user')); } catch { return null; }
    });
    const [tokens, setTokens] = useState(() => ({
        access: localStorage.getItem('medicode_access'),
        refresh: localStorage.getItem('medicode_refresh'),
    }));

    const saveAuth = useCallback((userData, tokenData) => {
        setUser(userData);
        setTokens(tokenData);
        localStorage.setItem('medicode_user', JSON.stringify(userData));
        localStorage.setItem('medicode_access', tokenData.access);
        localStorage.setItem('medicode_refresh', tokenData.refresh);
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/api/auth/logout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access}` },
                body: JSON.stringify({ refresh: tokens.refresh }),
            });
        } catch { }
        setUser(null);
        setTokens({ access: null, refresh: null });
        localStorage.removeItem('medicode_user');
        localStorage.removeItem('medicode_access');
        localStorage.removeItem('medicode_refresh');
    }, [tokens]);

    // Authenticated fetch helper — auto-attaches Bearer token
    const authFetch = useCallback(async (url, options = {}) => {
        const res = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokens.access}`,
                ...(options.headers || {}),
            },
        });

        if (res.status === 401) {
            logout();
            throw new Error('Session expired. Please log in again.');
        }
        return res;
    }, [tokens.access, logout]);

    return (
        <AuthContext.Provider value={{ user, tokens, saveAuth, logout, authFetch, API_BASE }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
