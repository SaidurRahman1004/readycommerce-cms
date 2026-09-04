'use client';

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {authService, AuthUser} from '@/services/api-service';

type AuthContextValue = {user: AuthUser | null; loading: boolean; refreshUser: () => Promise<AuthUser | null>; logout: () => Promise<void>};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<AuthUser | null>(null); const [loading, setLoading] = useState(true);
  const refreshUser = async () => { try {const result = await authService.me(); setUser(result.user); return result.user;} catch (error: unknown) {if ((error as {status?: number})?.status === 401) {try {const result = await authService.refresh(); setUser(result.user); return result.user;} catch {setUser(null);}} else setUser(null); return null;} };
  useEffect(() => {const task = window.setTimeout(() => {refreshUser().finally(() => setLoading(false));}, 0); return () => window.clearTimeout(task);}, []);
  const value = useMemo(() => ({user, loading, refreshUser, logout: async () => {await authService.logout(); setUser(null);}}), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context; }
