import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { CartProvider } from '../app/providers/CartProvider';
import { ToastProvider } from '../app/providers/ToastProvider';
import { useCart } from '../hooks/useCart';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <CartProvider>{children}</CartProvider>
  </ToastProvider>
);
const item = { name: 'Test Tee', price: 1000, img: '' };

describe('CartProvider', () => {
  it('merges the same product+variant and separates different sizes', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const start = result.current.items.length;
    await act(async () => { await result.current.addToCart(item, { color: 'Sand', size: 'M' }); });
    await act(async () => { await result.current.addToCart(item, { color: 'Sand', size: 'M' }); });
    await act(async () => { await result.current.addToCart(item, { color: 'Sand', size: 'L' }); });
    expect(result.current.items.length).toBe(start + 2);
    expect(result.current.items.find((i) => i.variant === 'Sand | M')?.qty).toBe(2);
  });

  it('removes a line when quantity drops to zero', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await act(async () => { await result.current.addToCart(item); });
    const id = result.current.items.at(-1)!.id;
    await act(async () => { await result.current.updateQty(id, -1); });
    expect(result.current.items.some((i) => i.id === id)).toBe(false);
  });

  it('does not apply a coupon before an authenticated server validation', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.setDiscountInput('WELCOME15'));
    let applied = true;
    await act(async () => { applied = await result.current.applyDiscount(); });
    expect(applied).toBe(false);
    expect(result.current.appliedCode).toBe(null);
    expect(result.current.discountAmount).toBe(0);
  });
});
