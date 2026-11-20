import { describe, expect, it } from 'vitest';
import { cartCount, cartItemId, cartSubtotal, cartTotal } from '../utils/cart';
import { applyCatalogFilters, searchProducts, sortProducts, stripCount } from '../utils/catalog';
import { formatPrice, parsePrice } from '../utils/format';
import { isEmailOrPhone, validateContact, validateLogin } from '../utils/validation';
import type { Product } from '../types';

const p = (id: number, price: number, category: string, extra: Partial<Product> = {}): Product => ({
  id, name: `Item ${id}`, price, category, img: '', ...extra,
});

describe('format', () => {
  it('formats rupees with Indian grouping', () => {
    expect(formatPrice(2999)).toBe('₹2,999');
    expect(formatPrice(125000)).toBe('₹1,25,000');
  });
  it('parses price strings', () => {
    expect(parsePrice('₹12,999')).toBe(12999);
    expect(parsePrice('abc')).toBe(0);
  });
});

describe('cart utils', () => {
  const items = [
    { id: 'a', name: 'A', variant: 'v', price: 1000, qty: 2, img: '' },
    { id: 'b', name: 'B', variant: 'v', price: 500, qty: 1, img: '' },
  ];
  it('counts and totals', () => {
    expect(cartCount(items)).toBe(3);
    expect(cartSubtotal(items)).toBe(2500);
  });
  it('never lets the discount exceed the subtotal', () => {
    expect(cartTotal(2500, 1499)).toBe(1001);
    expect(cartTotal(1000, 1499)).toBe(0);
    expect(cartTotal(0, 1499)).toBe(0);
  });
  it('builds stable ids per name+variant', () => {
    expect(cartItemId('Hoodie', 'Black | M')).toBe(cartItemId('Hoodie', 'Black | M'));
    expect(cartItemId('Hoodie', 'Black | M')).not.toBe(cartItemId('Hoodie', 'Black | L'));
  });
});

describe('catalog utils', () => {
  const products = [
    p(1, 3000, 'Hoodies', { colors: ['#000'], sizes: ['M', 'L'] }),
    p(2, 1000, 'T-Shirts', { colors: ['#fff'], sizes: ['S'] }),
    p(3, 2000, 'Hoodies'),
  ];
  const base = { categories: [], maxPrice: 99999, sizes: [], colors: [], sort: 'featured' as const };

  it('filters by category, price, size and colour', () => {
    expect(applyCatalogFilters(products, { ...base, categories: ['Hoodies'] }).map((x) => x.id)).toEqual([1, 3]);
    expect(applyCatalogFilters(products, { ...base, maxPrice: 2000 }).map((x) => x.id)).toEqual([2, 3]);
    expect(applyCatalogFilters(products, { ...base, sizes: ['L'] }).map((x) => x.id)).toEqual([1]);
    expect(applyCatalogFilters(products, { ...base, colors: ['#fff'] }).map((x) => x.id)).toEqual([2]);
  });
  it('sorts without mutating the input', () => {
    expect(sortProducts(products, 'price-asc').map((x) => x.id)).toEqual([2, 3, 1]);
    expect(sortProducts(products, 'price-desc').map((x) => x.id)).toEqual([1, 3, 2]);
    expect(products.map((x) => x.id)).toEqual([1, 2, 3]);
  });
  it('strips counts and searches', () => {
    expect(stripCount('T-Shirts (24)')).toBe('T-Shirts');
    expect(searchProducts(products, 'hood').map((x) => x.id)).toEqual([1, 3]);
    expect(searchProducts(products, '  ')).toEqual([]);
  });
});

describe('validation', () => {
  it('accepts emails and phone numbers', () => {
    expect(isEmailOrPhone('a@b.co')).toBe(true);
    expect(isEmailOrPhone('+91 98765 43210')).toBe(true);
    expect(isEmailOrPhone('nope')).toBe(false);
  });
  it('validates login and contact forms', () => {
    expect(validateLogin('', '', 'signin')).toEqual({ identifier: 'Enter your email address.', password: 'Enter your password.' });
    expect(validateLogin('a@b.co', 'short', 'signup').password).toBeDefined();
    expect(validateLogin('a@b.co', 'longenough1', 'signup')).toEqual({});
    expect(Object.keys(validateContact('', 'bad', 'hi'))).toEqual(['name', 'email', 'message']);
  });
});
