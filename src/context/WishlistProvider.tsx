import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.ts';
import { useAuth } from './auth.ts';
import { WishlistContext } from './wishlist.ts';

// Which products the logged-in user has saved, so every heart icon shows the right state.
// Guests who tap a heart are sent to log in.
export default function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ids, setIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    api.get('/wishlist')
      .then(res => setIds(new Set(res.data.data.map((item: { productId: number }) => item.productId))))
      .catch(() => {});
  }, [user]);

  const toggle = useCallback(async (productId: number) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    const saved = ids.has(productId);
    const res = saved
      ? await api.delete(`/wishlist/${productId}`)
      : await api.post('/wishlist', { productId });
    setIds(new Set(res.data.data.map((item: { productId: number }) => item.productId)));
    return !saved;
  }, [user, ids, navigate]);

  const value = useMemo(() => ({ ids, has: (id: number) => ids.has(id), toggle }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
