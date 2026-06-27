import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from './api';
import { clearToken, loadToken, saveToken } from './auth-storage';
import { hashPassword } from './crypto';

interface AuthContextValue {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResponse {
  token: string;
  expiresAt: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => loadToken());
  // Username is derived from the JWT subject; decode the middle segment.
  const username = useMemo(() => (token ? subjectFromJwt(token) : null), [token]);

  const login = useCallback(async (u: string, p: string) => {
    const hashed = await hashPassword(u, p);
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { username: u, password: hashed },
    });
    saveToken(res.token, res.expiresAt);
    setToken(res.token);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, username, login, logout }),
    [token, username, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

function subjectFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
