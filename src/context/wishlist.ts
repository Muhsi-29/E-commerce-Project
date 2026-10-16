import { createContext, useContext } from 'react';

export interface WishlistContextValue {
  ids: Set<number>;
  has: (productId: number) => boolean;
  toggle: (productId: number) => Promise<boolean>; // Resolves to true when the product is now saved
}

export const WishlistContext = createContext<WishlistContextValue | null>(null);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return context;
};
