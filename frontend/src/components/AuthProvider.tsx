'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from '@/lib/api';
import { loadSession, saveSession } from '@/lib/session';
import type { RegisterPending, Session, User } from '@/lib/types';

/** Motivo del último cierre de sesión: manual (botón) o expirado (401 del servidor). */
export type LogoutReason = 'manual' | 'expired';

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  logoutReason: LogoutReason | null;
  login: (username: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<RegisterPending>;
  verifyEmail: (username: string, code: string) => Promise<User>;
  resendCode: (username: string) => Promise<void>;
  logout: (reason?: LogoutReason) => void;
}

type RegisterData = { name: string; username: string; email: string; password: string };

const AuthContext = createContext<AuthContextValue | null>(null);

/** Sesión JWT persistida en localStorage y compartida con el cliente HTTP. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null);

  const apply = useCallback((next: Session | null) => {
    api.setAuthToken(next?.token ?? null);
    saveSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(
    (reason: LogoutReason = 'manual') => {
      setLogoutReason(reason);
      apply(null);
    },
    [apply],
  );

  useEffect(() => {
    api.setUnauthorizedHandler(() => logout('expired'));
    const stored = loadSession();
    apply(stored);
    setReady(true);
    // Refresca los datos del usuario; si el token expiró, el 401 cierra la sesión
    if (stored) api.getMe().then((user) => apply({ ...stored, user })).catch(() => {});
    return () => api.setUnauthorizedHandler(null);
  }, [apply, logout]);

  const login = useCallback(
    async (username: string, password: string) => {
      const next = await api.login(username, password);
      setLogoutReason(null);
      apply(next);
      return next.user;
    },
    [apply],
  );

  // El registro no inicia sesión: primero hay que verificar el código enviado por email
  const register = useCallback((data: RegisterData) => api.register(data), []);

  const verifyEmail = useCallback(
    async (username: string, code: string) => {
      const next = await api.verifyEmail(username, code);
      setLogoutReason(null);
      apply(next);
      return next.user;
    },
    [apply],
  );

  const resendCode = useCallback((username: string) => api.resendCode(username), []);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, ready, logoutReason, login, register, verifyEmail, resendCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
