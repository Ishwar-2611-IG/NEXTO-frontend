import { createContext } from 'react';
import type { Product } from '../types';

export interface WishlistContextValue {
  items: Product[];
  has: (id: string | number) => boolean;
  toggle: (product: Product) => void;
  remove: (id: string | number) => void;
  add: (product: Product) => void;
}

export const WishlistContext = createContext<WishlistContextValue | null>(null);
