import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth.ts';
import PageState from './PageState.tsx';

// Wraps pages that need a logged-in user. Guests are sent to log in, then brought back to the page they wanted.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageState loading />;

  if (!user) {
    const back = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${back}`} replace />;
  }

  return children;
}
