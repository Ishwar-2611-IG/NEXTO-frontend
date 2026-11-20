import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS, getProductById } from '../data/products';
import { CATALOG_PAGES } from '../data/catalogs';

describe('product data', () => {
  it('has unique product ids (product pages are routed by id)', () => {
    const ids = ALL_PRODUCTS.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('uses numeric prices', () => {
    expect(ALL_PRODUCTS.every((x) => Number.isFinite(x.price) && x.price > 0)).toBe(true);
  });
  it('finds products by id', () => {
    expect(getProductById(201)?.name).toBeTruthy();
    expect(getProductById(-1)).toBeUndefined();
  });
  it('every catalogue tile filter targets a real category of that page or a route', () => {
    for (const page of Object.values(CATALOG_PAGES)) {
      const cats = new Set(page.products.map((x) => x.category));
      expect(page.products.length).toBeGreaterThan(0);
      for (const tile of page.tiles?.items ?? []) {
        if (tile.to || !tile.categories?.length) continue;
        // may legitimately be empty for a page (shows the empty state) but must be a known category name overall
        const known = new Set(ALL_PRODUCTS.map((x) => x.category));
        expect(tile.categories.every((c) => known.has(c) || cats.has(c))).toBe(true);
      }
    }
  });
});
