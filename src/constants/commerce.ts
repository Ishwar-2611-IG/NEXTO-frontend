
import type { IconType } from "react-icons";
import {
  FiPackage,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";

import { IMG, unsplash } from "./images";

// ============================================================
// PRODUCT DEFAULTS
// ============================================================

/**
 * Fallback selections used when a product has no saved selection.
 * Product-specific availability should come from the product data.
 */
export const DEFAULT_COLOR = "Jet Black";
export const DEFAULT_SIZE = "M";

export const DEFAULT_WISHLIST_SIZES = [
  "S",
  "M",
  "L",
  "XL",
] as const;

// ============================================================
// SHIPPING
// ============================================================

/**
 * Free delivery applies once the item subtotal reaches ₹999. Orders below
 * that threshold pay a flat ₹99 delivery fee. Keep these values in sync with
 * the backend (`backend/src/modules/orders/shipping.ts`).
 */
export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 99;

export function shippingFeeFor(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
}

// ============================================================
// PRODUCT DETAIL PAGE — VARIANTS
// ============================================================

export type ProductColorOption = {
  readonly name: string;
  readonly hex: `#${string}`;
};

export const PDP_COLORS = [
  { name: "Jet Black", hex: "#0F0F0F" },
  { name: "Ash Grey", hex: "#71717A" },
  { name: "Sand", hex: "#D4A373" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Burgundy", hex: "#7F1D1D" },
] as const satisfies readonly ProductColorOption[];

export const PDP_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
] as const;

export type ProductDetailSize = (typeof PDP_SIZES)[number];

// ============================================================
// PRODUCT DETAIL PAGE — FALLBACK CONTENT
// ============================================================

export const PDP_DEFAULTS = {
  originalPrice: 4499,

  // Keep the existing display label until the actual discount
  // calculation is confirmed against the product's real price.
  discount: "33% OFF",

  desc:
    "A statement hoodie designed for everyday movement. " +
    "Crafted from premium heavyweight cotton with a relaxed, " +
    "oversized fit and bold back graphic.",
} as const;

// ============================================================
// PRODUCT DETAIL PAGE — GALLERY FALLBACKS
// ============================================================

export const PDP_EXTRA_IMAGES = [
  unsplash(IMG.croppedHoodie, 800),
  unsplash(IMG.streetwearModel, 800),
  unsplash(IMG.minimalistWardrobe, 800),
] as const;

// ============================================================
// PRODUCT DETAIL PAGE — ACCORDION CONTENT
// ============================================================

export const PDP_ACCORDION = [
  {
    key: "details",
    title: "Product Details",
    content:
      "Crafted from 100% premium combed cotton (420 GSM). " +
      "Pre-shrunk to help maintain its fit. Finished with a " +
      "direct-to-garment archival back graphic print.",
  },
  {
    key: "material",
    title: "Material & Care",
    content:
      "Machine wash cold with like colors. Do not bleach. " +
      "Tumble dry low. Warm iron if needed.",
  },
  {
    key: "shipping",
    title: "Shipping & Returns",
    content:
      "Standard delivery in 3–5 business days. " +
      "Hassle-free 7-day returns and exchanges, subject to " +
      "the applicable return policy.",
  },
] as const;

// ============================================================
// STORE TRUST MESSAGES
// ============================================================

export type TrustPoint = {
  readonly id: "shipping" | "returns" | "payments";
  readonly icon: IconType;
  readonly title: string;
  readonly description: string;
};

export const TRUST_POINTS = [
  {
    id: "shipping",
    icon: FiPackage,
    title: "Complimentary Shipping",
    description: "On orders above ₹999",
  },
  {
    id: "returns",
    icon: FiRefreshCw,
    title: "Easy Returns",
    description: "Within 7 days, subject to policy",
  },
  {
    id: "payments",
    icon: FiShield,
    title: "Secure Checkout",
    description: "Payments protected by our payment provider",
  },
] as const satisfies readonly TrustPoint[];
