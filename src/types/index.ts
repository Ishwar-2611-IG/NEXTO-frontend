export type Size = string | number;

export interface Product {
  id: string | number;
  backendId?: string;
  slug?: string;
  audience?: 'men' | 'women' | 'unisex' | 'accessories';
  featured?: boolean;
  newArrival?: boolean;
  colorNames?: string[];
  variants?: Array<{ sku: string; size: string; color: string; stock: number; pricePaise?: number; images?: Array<{ url: string; alt?: string }> }>;
  averageRating?: number;
  reviewCount?: number;
  name: string;
  /** Price in INR (whole rupees). */
  price: number;
  category: string;
  img: string;
  colors?: string[];
  sizes?: Size[];
  badge?: string;
  originalPrice?: number;
  discount?: string;
  desc?: string;
}

/** The minimum a thing needs to be put in the bag (products, curated looks, ...). */
export interface Purchasable {
  id?: string | number;
  backendId?: string;
  slug?: string;
  variants?: Product['variants'];
  name: string;
  price: number;
  img: string;
}

export interface CartItem {
  id: string;
  backendId?: string;
  sku?: string;
  backendCartItemId?: string;
  name: string;
  variant: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  qty: number;
  img: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type SortKey = 'featured' | 'price-asc' | 'price-desc';
