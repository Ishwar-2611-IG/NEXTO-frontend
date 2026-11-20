import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { WishlistContext } from '../../context/wishlistContext';
import { useToast } from '../../hooks/useToast';
import { AuthContext } from '../../context/authContext';
import type { Product } from '../../types';
import { api } from '../../services/api';
import { mapBackendProduct, type BackendProduct } from '../../services/storeApi';

const GUEST_WISHLIST_KEY = 'ishwar-nexto-guest-wishlist';
interface ApiWishlistItem { productId: BackendProduct | string }
function readGuestWishlist(): Product[] {
  try { const value = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) ?? '[]') as unknown; return Array.isArray(value) ? value as Product[] : []; }
  catch { return []; }
}
export function WishlistProvider({ children, initialItems }: { children: ReactNode; initialItems?: Product[] }) {
  const { showToast } = useToast();
  const auth = useContext(AuthContext);
  const isLoggedIn = auth?.isLoggedIn ?? false;
  const [items, setItems] = useState<Product[]>(() => initialItems ?? readGuestWishlist());
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const has = useCallback((id: string | number) => items.some((product) => String(product.id) === String(id) || product.backendId === String(id)), [items]);

  const loadRemote = useCallback(async () => {
    const guestBackendProducts = itemsRef.current.filter((product) => product.backendId);
    for (const product of guestBackendProducts) {
      await api.post('/wishlist', { productId: product.backendId }).catch(() => undefined);
    }
    const result = await api.get<{ items: ApiWishlistItem[] }>('/wishlist');
    const remote = (result.items ?? []).flatMap((entry) => typeof entry.productId === 'string' ? [] : [mapBackendProduct(entry.productId)]);
    setItems((current) => [...remote, ...current.filter((product) => !product.backendId)]);
  }, []);

  useEffect(() => {
    if (isLoggedIn) void loadRemote().catch((error) => showToast(error instanceof Error ? error.message : 'Could not load your wishlist.'));
    else setItems((current) => current.filter((product) => !product.backendId));
  }, [isLoggedIn, loadRemote, showToast]);
  useEffect(() => { try { localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items.filter((product) => !product.backendId))); } catch { /* Storage can be disabled. */ } }, [items]);

  const add = useCallback(async (product: Product) => {
    if (items.some((entry) => entry.id === product.id || (product.backendId && entry.backendId === product.backendId))) return;
    if (isLoggedIn && product.backendId) {
      try { await api.post('/wishlist', { productId: product.backendId }); }
      catch (error) { showToast(error instanceof Error ? error.message : 'Could not save this item.'); return; }
    }
    setItems((current) => current.some((entry) => entry.id === product.id) ? current : [...current, product]);
    showToast('Added to wishlist');
  }, [isLoggedIn, items, showToast]);

  const remove = useCallback(async (id: string | number) => {
    const product = items.find((entry) => String(entry.id) === String(id) || entry.backendId === String(id));
    if (!product) return;
    if (isLoggedIn && product.backendId) {
      try { await api.delete(`/wishlist/${product.backendId}`); }
      catch (error) { showToast(error instanceof Error ? error.message : 'Could not remove this item.'); return; }
    }
    setItems((current) => current.filter((entry) => entry.id !== id && entry.backendId !== String(id)));
    showToast('Removed from wishlist');
  }, [isLoggedIn, items, showToast]);

  const toggle = useCallback((product: Product) => {
    if (has(product.id)) void remove(product.id);
    else void add(product);
  }, [add, has, remove]);
  const value = useMemo(() => ({ items, has, toggle, remove, add }), [items, has, toggle, remove, add]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
