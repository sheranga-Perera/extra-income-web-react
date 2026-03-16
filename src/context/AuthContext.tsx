import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginUser, registerUser, type RegisterPayload } from '../api/auth';
import { setAuthToken } from '../api/http';

export type Role = 'INDIVIDUAL' | 'COMPANY' | 'ADMIN';
export type IdentifierType = 'EMAIL' | 'PHONE';

export interface UserSummary {
  id: string;
  username: string;
  role: Role;
  identifierType: IdentifierType;
}

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<UserSummary | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const data = await fetchCurrentUser(token);
      setUser(data);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      setAuthToken(null);
    }
  }, [token]);

  useEffect(() => {
    refresh().catch(() => setUser(null));
  }, [refresh]);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const newToken = await loginUser(username, password);
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setAuthToken(newToken);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const newToken = await registerUser(payload);
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setAuthToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    login,
    register,
    refresh,
    logout
  }), [user, token, login, register, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
