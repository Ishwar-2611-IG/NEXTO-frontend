import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { CartProvider } from './CartProvider';
import { ToastProvider } from './ToastProvider';
import { WishlistProvider } from './WishlistProvider';

/** Order matters: Cart and Wishlist show toasts, so ToastProvider wraps them. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
