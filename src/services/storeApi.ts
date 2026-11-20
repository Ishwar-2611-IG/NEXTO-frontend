import { api, setAccessToken } from './api';
import type { Product, Size } from '../types';

export interface StoreUser { id: string; name: string; email: string; role: string; isActive: boolean; mustChangePassword?: boolean }
export interface AuthResponse { user: StoreUser; accessToken: string; tokenType: 'Bearer'; expiresIn: string }
export interface BackendVariant { sku: string; size: string; color: string; stock: number; pricePaise?: number; images?: { url: string; alt?: string }[]; weightGrams?: number }
export interface BackendProduct {
  _id: string; id?: string; name: string; slug: string; description: string; price: number; basePrice?: number;
  salePricePaise?: number; saleStartsAt?: string; saleEndsAt?: string; compareAtPrice?: number; category: string; images?: { url: string; alt?: string }[];
  variants: BackendVariant[]; audience?: 'men' | 'women' | 'unisex' | 'accessories'; averageRating?: number; reviewCount?: number; isActive?: boolean; createdAt?: string;
  featured?: boolean; newArrival?: boolean;
}

export function mapBackendProduct(raw: BackendProduct): Product {
  const images = raw.images ?? [];
  const variants = raw.variants ?? [];
  const colors = [...new Set(variants.map((variant) => variant.color))];
  const sizes = [...new Set(variants.map((variant) => variant.size))] as Size[];
  const effectivePaise = raw.price ?? raw.basePrice ?? 0;
  const basePaise = raw.basePrice ?? effectivePaise;
  return {
    id: raw._id,
    audience: raw.audience ?? 'unisex',
    featured: raw.featured ?? false,
    newArrival: raw.newArrival ?? false,
    backendId: raw._id,
    slug: raw.slug,
    name: raw.name,
    price: effectivePaise / 100,
    category: raw.category,
    img: images[0]?.url || variants.find((variant) => variant.images?.[0]?.url)?.images?.[0]?.url || '/images/fashion-fallback.svg',
    colors: colors.map(colorToSwatch),
    colorNames: colors,
    sizes,
    variants,
    averageRating: raw.averageRating,
    reviewCount: raw.reviewCount,
    desc: raw.description,
    originalPrice: raw.compareAtPrice ? raw.compareAtPrice / 100 : basePaise > effectivePaise ? basePaise / 100 : undefined,
    badge: basePaise > effectivePaise ? 'SALE' : undefined,
  };
}

function colorToSwatch(color: string): string {
  const normalized = color.trim().toLowerCase();
  const known: Record<string, string> = {
    black: '#222222', white: '#f8f6f0', cream: '#e9dfca', ivory: '#f4efe4', beige: '#d8c4a7',
    sand: '#c6b59b', brown: '#795548', navy: '#253650', blue: '#486a8a', grey: '#858585', gray: '#858585',
    green: '#667c68', olive: '#70754c', red: '#9e3d36', pink: '#d89ca9', charcoal: '#444444',
  };
  return known[normalized] || '#a6a29b';
}

export async function listProducts(params: Record<string, string | number | undefined> = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  Object.entries({ limit: 100, sortBy: 'newest', ...params }).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const result = await api.get<{ products: BackendProduct[] }>(`/products?${query.toString()}`);
  return (result.products ?? []).map(mapBackendProduct);
}

export async function getProduct(slug: string): Promise<Product> {
  const result = await api.get<{ product: BackendProduct }>(`/products/slug/${encodeURIComponent(slug)}`);
  return mapBackendProduct(result.product);
}

export const authApi = {
  async login(email: string, password: string) {
    const result = await api.post<AuthResponse>('/auth/login', { email, password }, { skipRefresh: true });
    setAccessToken(result.accessToken);
    return result;
  },
  async register(name: string, email: string, password: string) {
    const result = await api.post<AuthResponse>('/auth/register', { name, email, password }, { skipRefresh: true });
    setAccessToken(result.accessToken);
    return result;
  },
  googleLogin: (idToken: string) => api.post<AuthResponse>('/auth/google', { idToken }, { skipRefresh: true }),
  appleLogin: (identityToken: string, user?: { name?: { firstName?: string; lastName?: string } }) =>
    api.post<AuthResponse>('/auth/apple', { identityToken, user }, { skipRefresh: true }),
  providers: () => api.get<{ google: boolean; apple: boolean }>('/auth/providers'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }, { skipRefresh: true }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }, { skipRefresh: true }),
  acceptStaffInvite: (token: string, name: string, password: string) => api.post<AuthResponse>('/auth/accept-staff-invite', { token, name, password }, { skipRefresh: true }),
  me: () => api.get<{ user: StoreUser }>('/auth/me'),
  async logout() {
    try { await api.post('/auth/logout', undefined, { skipRefresh: true, headers: { 'X-Nexto-CSRF': '1' } }); }
    finally { setAccessToken(null); }
  },
};

export function chooseVariant(product: Product, color?: string, size?: string): BackendVariant | undefined {
  const variants = (product.variants ?? []) as BackendVariant[];
  if (!variants.length) return undefined;
  const swatches = product.colors ?? [];
  const colorNames = product.colorNames ?? [];
  const selectedSwatchIndex = color ? swatches.findIndex((swatch) => swatch.toLowerCase() === color.toLowerCase()) : -1;
  const normalizedColor = selectedSwatchIndex >= 0 ? colorNames[selectedSwatchIndex] : color;
  const matches = variants.filter((variant) =>
    (!size || variant.size.toLowerCase() === size.toLowerCase()) &&
    (!normalizedColor || variant.color.toLowerCase() === normalizedColor.toLowerCase())
  );
  if (color || size) return matches.find((variant) => variant.stock > 0);
  return variants.find((variant) => variant.stock > 0);
}
