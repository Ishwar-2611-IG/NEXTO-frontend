import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CartContext, type AddToCartOptions } from '../../context/cartContext';
import { DEFAULT_COLOR, DEFAULT_SIZE, shippingFeeFor } from '../../constants/commerce';
import { useToast } from '../../hooks/useToast';
import { AuthContext } from '../../context/authContext';
import type { CartItem, Product, Purchasable } from '../../types';
import { cartCount, cartItemId, cartSubtotal, cartTotal } from '../../utils/cart';
import { api } from '../../services/api';
import { chooseVariant, type BackendProduct, type BackendVariant } from '../../services/storeApi';

const MAX_QTY = 10;
const GUEST_CART_KEY = 'ishwar-nexto-guest-cart';
interface ApiCartItem { _id: string; productId: BackendProduct | string; sku: string; quantity: number }
interface ApiCart { items: ApiCartItem[] }
function normalizeOption(value: string | undefined, fallback: string) { return (value?.trim() || fallback).slice(0, 100); }
function readGuestCart(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_CART_KEY) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => Boolean(item && typeof item === 'object' && typeof (item as CartItem).id === 'string' && typeof (item as CartItem).name === 'string' && Number.isFinite((item as CartItem).price) && Number.isSafeInteger((item as CartItem).qty) && (item as CartItem).qty > 0));
  } catch { return []; }
}
function mapApiCart(cart: ApiCart): CartItem[] {
  return (cart.items ?? []).flatMap((item) => {
    if (!item.productId || typeof item.productId === 'string') return [];
    const product = item.productId;
    const variant = (product.variants ?? []).find((v: BackendVariant) => v.sku.toUpperCase() === item.sku.toUpperCase());
    const image = variant?.images?.[0]?.url || product.images?.[0]?.url || '/images/fashion-fallback.svg';
    const now = Date.now();
    const saleStarted = !product.saleStartsAt || new Date(product.saleStartsAt).getTime() <= now;
    const saleNotEnded = !product.saleEndsAt || new Date(product.saleEndsAt).getTime() >= now;
    const effectiveProductPrice = product.salePricePaise !== undefined && saleStarted && saleNotEnded ? product.salePricePaise : product.price;
    const pricePaise = variant?.pricePaise ?? effectiveProductPrice ?? 0;
    return [{
      id: item._id, backendCartItemId: item._id, backendId: product._id, sku: item.sku,
      name: product.name, variant: `${variant?.color ?? 'Default'} | ${variant?.size ?? 'One Size'}`,
      price: pricePaise / 100, qty: item.quantity, img: image,
    }];
  });
}
function validPurchasable(item: Purchasable) { return typeof item.name === 'string' && item.name.trim().length > 0 && typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 && typeof item.img === 'string'; }

export function CartProvider({ children, initialItems }: { children: ReactNode; initialItems?: CartItem[] }) {
  const { showToast } = useToast();
  const auth = useContext(AuthContext);
  const isLoggedIn = auth?.isLoggedIn ?? false;
  const [items, setItems] = useState<CartItem[]>(() => initialItems ?? readGuestCart());
  const itemsRef = useRef(items);
  const [discountInput, setDiscountInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [validatedDiscountAmount, setValidatedDiscountAmount] = useState(0);
  const validatedSubtotalRef = useRef<number | null>(null);
  const commitItems = useCallback((update: (current: CartItem[]) => CartItem[]) => {
    const next = update(itemsRef.current); itemsRef.current = next; setItems(next);
  }, []);

  const syncRemoteCart = useCallback(async () => {
    const toSync = itemsRef.current.filter((item) => item.backendId && item.sku && !item.backendCartItemId);
    for (const item of toSync) {
      try {
        await api.post('/cart/items', { productId: item.backendId, sku: item.sku, quantity: item.qty });
      } catch (error) {
        showToast(error instanceof Error ? error.message : `Could not sync ${item.name} to your account cart.`);
      }
    }
    const result = await api.get<{ cart: ApiCart }>('/cart');
    const remoteItems = mapApiCart(result.cart);
    const remoteKeys = new Set(remoteItems.map((item) => `${item.backendId}:${item.sku}`));
    // Keep local items the server cart does not already represent. Items that
    // failed to sync (or have no backend id) must not be silently dropped.
    const preserved = itemsRef.current.filter((item) => {
      if (!item.backendId || !item.sku) return true;
      if (item.backendCartItemId) return false;
      return !remoteKeys.has(`${item.backendId}:${item.sku}`);
    });
    commitItems(() => [...remoteItems, ...preserved]);
  }, [commitItems, showToast]);

  useEffect(() => {
    if (isLoggedIn) {
      void syncRemoteCart().catch((error) => showToast(error instanceof Error ? error.message : 'Could not load your saved cart.'));
    } else {
      commitItems((current) => current.filter((item) => !item.backendCartItemId));
    }
  }, [isLoggedIn, syncRemoteCart, commitItems, showToast]);

  useEffect(() => {
    try { localStorage.setItem(GUEST_CART_KEY, JSON.stringify(itemsRef.current.filter((item) => !item.backendCartItemId))); } catch { /* Storage may be unavailable in private browsing. */ }
  }, [items]);

  useEffect(() => {
    const currentSubtotalPaise = Math.round(cartSubtotal(items) * 100);
    if (appliedCode && validatedSubtotalRef.current !== null && currentSubtotalPaise !== validatedSubtotalRef.current) {
      setAppliedCode(null); setValidatedDiscountAmount(0); validatedSubtotalRef.current = null;
      showToast('Your cart changed, so please validate the coupon again.');
    }
    if (!isLoggedIn && appliedCode) { setAppliedCode(null); setValidatedDiscountAmount(0); validatedSubtotalRef.current = null; }
  }, [items, isLoggedIn, appliedCode, showToast]);

  const addToCart = useCallback(async (item: Purchasable, options: AddToCartOptions = {}) => {
    if (!validPurchasable(item)) { showToast('Unable to add this product.'); return false; }
    const color = normalizeOption(options.color, DEFAULT_COLOR);
    const size = normalizeOption(options.size, DEFAULT_SIZE);
    const backendProduct = item as Purchasable & { backendId?: string; variants?: BackendVariant[] };
    const chosen = chooseVariant(backendProduct as unknown as Product, options.color, options.size);
    if (backendProduct.backendId && !chosen) { showToast('That size and colour combination is currently unavailable.'); return false; }
    if (isLoggedIn && backendProduct.backendId && chosen) {
      try {
        const result = await api.post<{ cart: ApiCart }>('/cart/items', { productId: backendProduct.backendId, sku: chosen.sku, quantity: 1 });
        commitItems(() => [...mapApiCart(result.cart), ...itemsRef.current.filter((entry) => !entry.backendId)]);
        showToast(`Added ${item.name} to your bag.`);
        return true;
      } catch (error) { showToast(error instanceof Error ? error.message : 'Could not add this item to your bag.'); return false; }
    }
    const variant = chosen ? `${chosen.color} | ${chosen.size}` : `${color} | ${size}`;
    const sku = chosen?.sku;
    const id = backendProduct.backendId && sku ? `${backendProduct.backendId}:${sku}` : cartItemId(item.name.trim(), variant);
    const existing = itemsRef.current.find((entry) => entry.id === id || (entry.backendId === backendProduct.backendId && entry.sku === sku && Boolean(sku)));
    if (existing && existing.qty >= MAX_QTY) { showToast(`Maximum ${MAX_QTY} per item reached.`); return false; }
    commitItems((current) => {
      const match = current.find((entry) => entry.id === id || (entry.backendId === backendProduct.backendId && entry.sku === sku && Boolean(sku)));
      if (match) return current.map((entry) => entry === match ? { ...entry, qty: Math.min(MAX_QTY, entry.qty + 1) } : entry);
      return [...current, { id, ...(backendProduct.backendId ? { backendId: backendProduct.backendId } : {}), ...(sku ? { sku } : {}), name: item.name.trim(), variant, price: chosen?.pricePaise !== undefined ? chosen.pricePaise / 100 : item.price, qty: 1, img: item.img }];
    });
    showToast(`Added ${item.name} to your bag.`);
    return true;
  }, [commitItems, isLoggedIn, showToast]);

  const updateQty = useCallback(async (id: string, delta: number) => {
    if (!id || !Number.isSafeInteger(delta) || delta === 0) return;
    const existing = itemsRef.current.find((item) => item.id === id);
    if (!existing) return;
    const quantity = existing.qty + delta;
    if (quantity > MAX_QTY) { showToast(`Maximum ${MAX_QTY} per item reached.`); return; }
    if (existing.backendCartItemId) {
      try {
        if (quantity <= 0) {
          const result = await api.delete<{ cart: ApiCart }>(`/cart/items/${existing.backendCartItemId}`);
          commitItems(() => [...mapApiCart(result.cart), ...itemsRef.current.filter((item) => !item.backendId)]);
        } else {
          const result = await api.patch<{ cart: ApiCart }>(`/cart/items/${existing.backendCartItemId}`, { quantity });
          commitItems(() => [...mapApiCart(result.cart), ...itemsRef.current.filter((item) => !item.backendId)]);
        }
      } catch (error) { showToast(error instanceof Error ? error.message : 'Could not update quantity.'); }
      return;
    }
    commitItems((current) => current.flatMap((item) => item.id !== id ? [item] : quantity > 0 ? [{ ...item, qty: quantity }] : []));
  }, [commitItems, showToast]);

  const removeItem = useCallback(async (id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item) return;
    if (item.backendCartItemId) {
      try {
        const result = await api.delete<{ cart: ApiCart }>(`/cart/items/${item.backendCartItemId}`);
        commitItems(() => [...mapApiCart(result.cart), ...itemsRef.current.filter((entry) => !entry.backendId)]);
      } catch (error) { showToast(error instanceof Error ? error.message : 'Could not remove this item.'); return; }
    } else commitItems((current) => current.filter((entry) => entry.id !== id));
    showToast('Item removed from your bag.');
  }, [commitItems, showToast]);


  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
      try { await api.delete('/cart'); }
      catch (error) { showToast(error instanceof Error ? error.message : 'Could not clear the server cart.'); }
    }
    commitItems(() => []);
  }, [commitItems, isLoggedIn, showToast]);

  const applyDiscount = useCallback(async () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) { showToast('Enter a coupon code first.'); return false; }
    if (!isLoggedIn) { showToast('Sign in before validating a coupon.'); return false; }
    try {
      const result = await api.post<{ code: string; discount: number }>('/coupons/validate', { code, subtotal: Math.round(cartSubtotal(items) * 100) });
      setAppliedCode(result.code);
      validatedSubtotalRef.current = Math.round(cartSubtotal(items) * 100);
      setValidatedDiscountAmount(result.discount / 100);
      setDiscountInput(result.code);
      showToast('Coupon validated and applied.');
      return true;
    } catch (error) { setAppliedCode(null); setValidatedDiscountAmount(0); validatedSubtotalRef.current = null; showToast(error instanceof Error ? error.message : 'Coupon could not be validated.'); return false; }
  }, [discountInput, isLoggedIn, items, showToast]);
  const clearDiscount = useCallback(() => { setAppliedCode(null); setValidatedDiscountAmount(0); validatedSubtotalRef.current = null; setDiscountInput(''); }, []);
  const value = useMemo(() => {
    const subtotal = cartSubtotal(items);
    const discountAmount = Math.min(validatedDiscountAmount, Math.max(0, subtotal));
    const shipping = shippingFeeFor(subtotal);
    return { items, count: cartCount(items), subtotal, shipping, discountInput, setDiscountInput, appliedCode, discountAmount, total: cartTotal(subtotal, discountAmount) + shipping, addToCart, updateQty, removeItem, clearCart, applyDiscount, clearDiscount };
  }, [items, discountInput, appliedCode, validatedDiscountAmount, addToCart, updateQty, removeItem, clearCart, applyDiscount, clearDiscount]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
