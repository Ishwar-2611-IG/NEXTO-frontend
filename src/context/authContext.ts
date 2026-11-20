import { createContext } from 'react';
import type { StoreUser } from '../services/storeApi';

export interface AuthContextValue {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: StoreUser | null;
  login: (email: string, password: string) => Promise<StoreUser>;
  register: (name: string, email: string, password: string) => Promise<StoreUser>;
  socialLogin: (provider: 'google' | 'apple', identityToken: string, profile?: { firstName?: string; lastName?: string }) => Promise<StoreUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
