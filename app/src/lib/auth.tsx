import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api } from './api';
import { getAttribution, track } from './analytics';
import type { User } from './types';

type Status = 'loading' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  status: Status;
  user: User | null;
  requiresOnboarding: boolean;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  markOnboarded(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);

  useEffect(() => {
    const off = api.onAuthChange(({ user: u, requiresOnboarding: r }) => {
      setUser(u);
      setRequiresOnboarding(r);
      setStatus(u ? 'authenticated' : 'anonymous');
    });
    // Restore a session from the refresh cookie / stored token.
    (async () => {
      const ok = await api.refresh();
      if (!ok) setStatus('anonymous');
    })();
    return () => { off(); };
  }, []);

  const login = useCallback(async (email: string, password: string) => { await api.login(email, password); }, []);
  const register = useCallback(async (name: string, email: string, password: string) => { await api.register(name, email, password, getAttribution() as Record<string, string | undefined> | undefined); track('sign_up'); }, []);
  const logout = useCallback(async () => { await api.logout(); }, []);
  const markOnboarded = useCallback(() => setRequiresOnboarding(false), []);

  return (
    <AuthContext.Provider value={{ status, user, requiresOnboarding, login, register, logout, markOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
