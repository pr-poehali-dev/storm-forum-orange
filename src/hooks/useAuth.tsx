import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  bio?: string;
  posts_count?: number;
  avatar_url?: string;
  created_at?: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const session = localStorage.getItem('session_id');
    if (!session) { setLoading(false); return; }
    try {
      const data = await api.auth.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem('session_id');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (username: string, password: string) => {
    const data = await api.auth.login(username, password);
    localStorage.setItem('session_id', data.session_id);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await api.auth.register(username, email, password);
    localStorage.setItem('session_id', data.session_id);
    setUser(data.user);
  };

  const logout = async () => {
    await api.auth.logout();
    localStorage.removeItem('session_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
