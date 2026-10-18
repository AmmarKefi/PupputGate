import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from '@/lib/api';
import { saveToken, getToken, clearToken } from '@/lib/storage';
import type { PublicUser } from '@/types';

type Status = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  status: Status;
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: 'CUSTOMER' | 'MERCHANT';
    locale?: string;
  }) => Promise<PublicUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUserState] = useState<PublicUser | null>(null);

  const doLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore network/logout errors */
    }
    setAuthToken(null);
    await clearToken();
    setUserState(null);
    setStatus('guest');
  }, []);

  // Restore a session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null);
      void clearToken();
      setUserState(null);
      setStatus('guest');
    });
    (async () => {
      const token = await getToken();
      if (!token) {
        setStatus('guest');
        return;
      }
      setAuthToken(token);
      try {
        const { user: u } = await api.me();
        setUserState(u);
        setStatus('authed');
      } catch {
        setAuthToken(null);
        await clearToken();
        setStatus('guest');
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    await saveToken(res.token);
    setUserState(res.user);
    setStatus('authed');
    return res.user;
  }, []);

  const register = useCallback(
    async (body: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      role?: 'CUSTOMER' | 'MERCHANT';
      locale?: string;
    }) => {
      const res = await api.register(body);
      setAuthToken(res.token);
      await saveToken(res.token);
      setUserState(res.user);
      setStatus('authed');
      return res.user;
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await api.me();
      setUserState(u);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout: doLogout, refresh, setUser: setUserState }),
    [status, user, login, register, doLogout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
