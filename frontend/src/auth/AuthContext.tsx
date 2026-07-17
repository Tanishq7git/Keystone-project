import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../api/endpoints';
import type { CurrentUser } from '../types';

interface StoredUser {
  userId: number;
  name: string;
  email: string;
  role: CurrentUser['role'];
  customerId: number | null;
}

interface AuthContextValue {
  user: StoredUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => {
    const raw = localStorage.getItem('keystone_user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('keystone_token');
    if (token && !user) {
      // token exists but no cached profile - clear to be safe
      localStorage.removeItem('keystone_token');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      const stored: StoredUser = {
        userId: res.userId,
        name: res.name,
        email: res.email,
        role: res.role,
        customerId: res.customerId,
      };
      localStorage.setItem('keystone_token', res.token);
      localStorage.setItem('keystone_user', JSON.stringify(stored));
      setUser(stored);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('keystone_token');
    localStorage.removeItem('keystone_user');
    setUser(null);
    window.location.href = '/login';
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
