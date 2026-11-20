
import { createContext } from "react";
import type { CartItem, Purchasable } from "../types";

export interface AddToCartOptions {
  color?: string;
  size?: string;
}

export interface CartContextValue {
  // Cart data
  items: CartItem[];
  count: number;
  subtotal: number;
  /** Delivery fee in INR for the current subtotal (0 when delivery is free). */
  shipping: number;

  // Discount state
  discountInput: string;
  setDiscountInput: (value: string) => void;
  appliedCode: string | null;
  discountAmount: number;
  total: number;

  // Cart actions
  addToCart: (
    item: Purchasable,
    options?: AddToCartOptions,
  ) => Promise<boolean>;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => Promise<void>;

  // Discount actions
  applyDiscount: () => Promise<boolean>;
  clearDiscount: () => void;
}

export const CartContext =
  createContext<CartContextValue | null>(null);
