
import type { CartItem } from "../types";

export const cartItemId = (
  productId: string,
  variant: string,
): string =>
  `${productId}|${variant}`.trim().toLowerCase().replace(/\s+/g, "-");

export const cartCount = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.qty, 0);

export const cartSubtotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0);

/**
 * A discount cannot exceed the subtotal.
 * An empty cart always has a total of zero.
 */
export const cartTotal = (
  subtotal: number,
  discount: number,
): number => {
  const safeSubtotal =
    Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;

  const safeDiscount =
    Number.isFinite(discount) ? Math.max(0, discount) : 0;

  return Math.max(
    0,
    safeSubtotal - Math.min(safeDiscount, safeSubtotal),
  );
};
