import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthResponse } from '../types/auth';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSessionWarning, setShowSessionWarning] = useState(false);

    // Decode JWT to get expiration time
    const getTokenExpiration = (jwtToken: string): number | null => {
        try {
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            return payload.exp * 1000; // Convert to milliseconds
        } catch (error) {
            console.error('Failed to decode token:', error);
            return null;
        }
    };

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        setShowSessionWarning(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
    }, []);

    // Check token expiration and auto-logout
    useEffect(() => {
        if (!token) return;

        const expirationTime = getTokenExpiration(token);
        if (!expirationTime) return;

        const now = Date.now();
        const timeUntilExpiration = expirationTime - now;

        // If already expired, logout immediately
        if (timeUntilExpiration <= 0) {
            console.log('Token expired, logging out');
            logout();
            alert('Your session has expired. Please sign in again.');
            return;
        }

        // Show warning 2 minutes before expiration
        const warningTime = timeUntilExpiration - (2 * 60 * 1000);
        let warningTimer: number | undefined;

        if (warningTime > 0) {
            warningTimer = window.setTimeout(() => {
                setShowSessionWarning(true);
            }, warningTime);
        } else {
            // Already within 2 minutes of expiration
            setShowSessionWarning(true);
        }

        // Auto-logout at expiration
        const logoutTimer = window.setTimeout(() => {
            console.log('Token expired, logging out');
            logout();
            alert('Your session has expired. Please sign in again.');
        }, timeUntilExpiration);

        return () => {
            if (warningTimer) clearTimeout(warningTimer);
            if (logoutTimer) clearTimeout(logoutTimer);
        };
    }, [token, logout]);

    useEffect(() => {
        // Load token and user from localStorage on mount
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            // Check if token is still valid
            const expirationTime = getTokenExpiration(storedToken);
            if (expirationTime && expirationTime > Date.now()) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } else {
                // Token expired, clear storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                localStorage.removeItem('loginTime');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (authResponse: AuthResponse) => {
        setToken(authResponse.token);
        setUser(authResponse.user);
        setShowSessionWarning(false);
        localStorage.setItem('authToken', authResponse.token);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
        localStorage.setItem('loginTime', Date.now().toString());
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            {showSessionWarning && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 10000,
                    maxWidth: '400px'
                }}>
                    <strong>⏰ Session Expiring Soon</strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                        Your session will expire in less than 2 minutes. Please save your work.
                    </p>
                </div>
            )}
        </AuthContext.Provider>
    );
};
