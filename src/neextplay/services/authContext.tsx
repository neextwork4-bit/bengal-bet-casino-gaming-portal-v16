/**
 * NeextPlay Authentication Context & User Service
 * REAL MySQL Database Engine (neextplay_db via Master API & Backend)
 * Manages 2 distinct enterprise roles:
 * 1. COMPANY_ADMIN (Platform Control)
 * 2. DEVELOPER (Developer & Operator API Integration)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { platform } from './platformStore';

export type UserRole = 'COMPANY_ADMIN' | 'DEVELOPER';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName: string;
  operatorId: string;
  country?: string;
  currency?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  apiKey?: string;
  apiSecret?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: UserAccount | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerDeveloper: (data: {
    companyName: string;
    email: string;
    password: string;
    country: string;
    currency: string;
  }) => Promise<{ success: boolean; error?: string }>;
  quickLoginAs: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'neextplay_auth_session_user_v3';

// Helper to normalize user account from MySQL columns
function normalizeUserAccount(raw: any): UserAccount {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name || raw.company_name || 'User',
    role: raw.role === 'COMPANY_ADMIN' ? 'COMPANY_ADMIN' : 'DEVELOPER',
    companyName: raw.company_name || raw.companyName || raw.name || 'Enterprise',
    operatorId: raw.operator_id || raw.operatorId || 'op_bengalbet',
    country: raw.country || 'Bangladesh',
    currency: raw.currency || 'BDT',
    status: raw.status || 'ACTIVE',
    apiKey: raw.api_key || raw.apiKey,
    apiSecret: raw.api_secret || raw.apiSecret,
    createdAt: raw.created_at || raw.createdAt,
    lastLogin: raw.last_login || raw.lastLogin
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncPlatformContext = (userAccount: UserAccount) => {
    if (userAccount.role === 'COMPANY_ADMIN') {
      platform.currentRole = 'SUPER_ADMIN';
    } else {
      platform.currentRole = 'OPERATOR';
      if (userAccount.operatorId) {
        platform.selectedOperatorId = userAccount.operatorId;
      }
    }
  };

  const refreshUser = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/v1/auth/me?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const normalized = normalizeUserAccount(data.user);
          setUser(normalized);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
          syncPlatformContext(normalized);
        }
      }
    } catch (e) {
      console.warn('Failed to refresh user from MySQL:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession) as UserAccount;
          // Verify against real MySQL database
          try {
            const res = await fetch(`/api/v1/auth/me?email=${encodeURIComponent(parsed.email)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.user) {
                const normalized = normalizeUserAccount(data.user);
                setUser(normalized);
                syncPlatformContext(normalized);
                return;
              }
            }
          } catch {}
          // Fallback to parsed if network glitch
          setUser(parsed);
          syncPlatformContext(parsed);
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass })
      });

      const data = await resp.json();
      if (!resp.ok || !data.success || !data.user) {
        return { success: false, error: data.error || 'Invalid credentials or account suspended' };
      }

      const normalized = normalizeUserAccount(data.user);
      setUser(normalized);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
      syncPlatformContext(normalized);

      return { success: true };
    } catch (err: any) {
      console.error('MySQL Login error:', err);
      return { success: false, error: err.message || 'Database connection error during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerDeveloper = async (data: {
    companyName: string;
    email: string;
    password: string;
    country: string;
    currency: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.companyName + ' Developer',
          companyName: data.companyName,
          email: data.email.trim(),
          password: data.password,
          country: data.country,
          currency: data.currency,
          role: 'DEVELOPER'
        })
      });

      const resData = await resp.json();
      if (!resp.ok || !resData.success || !resData.user) {
        return { success: false, error: resData.error || 'Registration failed' };
      }

      const normalized = normalizeUserAccount(resData.user);
      setUser(normalized);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
      syncPlatformContext(normalized);

      return { success: true };
    } catch (err: any) {
      console.error('MySQL Registration error:', err);
      return { success: false, error: err.message || 'Database error during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/v1/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await resp.json();
      if (data.success && data.user) {
        const normalized = normalizeUserAccount(data.user);
        setUser(normalized);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
        syncPlatformContext(normalized);
      }
    } catch (e) {
      console.error('Quick login error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        registerDeveloper,
        quickLoginAs,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
