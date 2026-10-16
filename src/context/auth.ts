import { createContext, useContext } from 'react';
import type { User } from '../types.ts';

export interface AuthContextValue {
  user: User | null;
  loading: boolean; // True while checking a saved login on page load
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  refreshUser: () => Promise<void>; // Reload the user (e.g. after applying to sell)
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// The logged-in user and the login/logout actions, from any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
