import type { Product } from '../types.ts';

// The last few products a shopper opened, kept in this browser only

const KEY = 'recentlyViewed';
const MAX = 12;

export const getRecentlyViewed = (): Product[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (product: Product) => {
  try {
    const rest = getRecentlyViewed().filter(p => p.id !== product.id);
    localStorage.setItem(KEY, JSON.stringify([product, ...rest].slice(0, MAX)));
  } catch {
    // Storage unavailable: nothing to remember
  }
};
