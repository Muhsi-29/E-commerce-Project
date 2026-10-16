import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api.ts';
import type { User } from '../types.ts';
import { clearToken, getToken, saveToken } from '../utils/session.ts';
import { AuthContext } from './auth.ts';

// Keeps track of who is logged in. The token is saved in the browser (see utils/session.ts) so a refresh
// keeps you logged in; on page load it is checked against GET /auth/me.
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.data);
  }, []);

  // Restore a saved login
  useEffect(() => {
    if (!getToken()) return;
    refreshUser()
      .catch(() => clearToken()) // Expired or invalid
      .finally(() => setLoading(false));
  }, [refreshUser]);

  // api.ts fires this when a request fails because the token expired
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const startSession = useCallback((token: string, loggedIn: User, remember: boolean) => {
    saveToken(token, remember);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const login = useCallback(async (email: string, password: string, remember = true) => {
    const res = await api.post('/auth/login', { email, password });
    return startSession(res.data.token, res.data.data, remember);
  }, [startSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password });
    return login(email, password); // Log straight in after signing up
  }, [login]);

  const value = useMemo(
    () => ({ user, loading, login, register, refreshUser, logout }),
    [user, loading, login, register, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
