import { createContext, useContext } from 'react';
import type { CartItem, Product } from '../types.ts';

export interface CartContextValue {
  items: CartItem[];       // In the order
  savedItems: CartItem[];  // "Saved for later" (logged-in users)
  count: number;           // Total number of units in the order
  subtotal: number;
  deliveryFee: number;
  total: number;
  loading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  saveForLater: (productId: number, saved: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export const CartContext = createContext<CartContextValue | null>(null);

// The cart and its actions, from any component
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};
