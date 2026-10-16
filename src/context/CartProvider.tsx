import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api.ts';
import type { Cart, CartItem, Product, StoreConfig } from '../types.ts';
import { useAuth } from './auth.ts';
import { CartContext } from './cart.ts';
import { deliveryFeeFor, useStoreConfig } from './storeConfig.ts';

const GUEST_CART_KEY = 'guestCart';
const MAX_PER_PRODUCT = 100;

const readGuestCart = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const writeGuestCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode): the cart just won't survive a refresh
  }
};

// Totals for the guest cart, worked out in the browser with the store's delivery rules
const summarize = (items: CartItem[], config: StoreConfig): Cart => {
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100) / 100;
  const deliveryFee = deliveryFeeFor(subtotal, config);
  return {
    items,
    savedItems: [],
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  };
};

// Logged-in users: the cart lives on the server (/api/v1/cart), so it follows them across devices.
// Guests: the cart lives in localStorage, and is merged into their account when they log in.
export default function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const config = useStoreConfig();
  const [guestItems, setGuestItemsState] = useState<CartItem[]>(readGuestCart);
  const [serverCart, setServerCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const setGuestItems = useCallback((items: CartItem[]) => {
    writeGuestCart(items);
    setGuestItemsState(items);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setGuestItemsState(readGuestCart());
      return;
    }
    const res = await api.get('/cart');
    setServerCart(res.data.data);
  }, [user]);

  // Switch between the guest cart and the account cart when the user logs in or out
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setServerCart(null);
      setGuestItemsState(readGuestCart());
      return;
    }

    let cancelled = false;
    const loadAccountCart = async () => {
      setLoading(true);
      try {
        const pending = readGuestCart();
        const res = pending.length > 0
          ? await api.post('/cart/merge', { items: pending.map(({ productId, quantity }) => ({ productId, quantity })) })
          : await api.get('/cart');
        if (pending.length > 0) setGuestItems([]);
        if (!cancelled) setServerCart(res.data.data);
      } catch {
        // Leave the cart as it was; the cart page shows errors when the user acts on it
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAccountCart();
    return () => { cancelled = true; };
  }, [user, authLoading, setGuestItems]);

  const addItem = useCallback(async (product: Product, quantity = 1) => {
    if (user) {
      const res = await api.post('/cart/items', { productId: product.id, quantity });
      setServerCart(res.data.data);
      return;
    }
    const items = readGuestCart();
    const existing = items.find(item => item.productId === product.id);
    const newQuantity = (existing?.quantity ?? 0) + quantity;
    if (product.stock === 0) throw new Error(`"${product.title}" is out of stock.`);
    if (newQuantity > Math.min(product.stock, MAX_PER_PRODUCT)) {
      throw new Error(`Only ${Math.min(product.stock, MAX_PER_PRODUCT)} of "${product.title}" can be added.`);
    }
    setGuestItems(existing
      ? items.map(item => (item.productId === product.id ? { ...item, quantity: newQuantity, product } : item))
      : [...items, { productId: product.id, quantity, product }]);
  }, [user, setGuestItems]);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    if (user) {
      const res = await api.put(`/cart/items/${productId}`, { quantity });
      setServerCart(res.data.data);
      return;
    }
    setGuestItems(readGuestCart().map(item => (item.productId === productId ? { ...item, quantity } : item)));
  }, [user, setGuestItems]);

  const removeItem = useCallback(async (productId: number) => {
    if (user) {
      const res = await api.delete(`/cart/items/${productId}`);
      setServerCart(res.data.data);
      return;
    }
    setGuestItems(readGuestCart().filter(item => item.productId !== productId));
  }, [user, setGuestItems]);

  const saveForLater = useCallback(async (productId: number, saved: boolean) => {
    if (!user) throw new Error('Log in to save items for later.');
    const res = await api.patch(`/cart/items/${productId}/save-for-later`, { saved });
    setServerCart(res.data.data);
  }, [user]);

  const cart = useMemo(
    () => (user && serverCart ? serverCart : summarize(user ? [] : guestItems, config)),
    [user, serverCart, guestItems, config],
  );
  const value = useMemo(
    () => ({ ...cart, loading, addItem, updateQuantity, removeItem, saveForLater, refresh }),
    [cart, loading, addItem, updateQuantity, removeItem, saveForLater, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
