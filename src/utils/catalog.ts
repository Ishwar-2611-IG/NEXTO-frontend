
import type { Product, SortKey } from "../types";

export interface CatalogFilters {
  /** Selected category values. Empty = all. */
  categories: string[];
  maxPrice: number;
  /** Selected sizes. Empty = no size filtering. */
  sizes: string[];
  /** Selected colour hex values. Empty = no colour filtering. */
  colors: string[];
  sort: SortKey;
}

export const applyCatalogFilters = (
  products: Product[],
  filters: CatalogFilters,
): Product[] => {
  const filtered = products.filter((product) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(product.category)
    ) {
      return false;
    }

    if (product.price > filters.maxPrice) {
      return false;
    }

    if (
      filters.sizes.length > 0 &&
      !(product.sizes ?? []).some((size) =>
        filters.sizes.includes(String(size)),
      )
    ) {
      return false;
    }

    if (
      filters.colors.length > 0 &&
      !(product.colors ?? []).some((color) =>
        filters.colors.includes(color),
      )
    ) {
      return false;
    }

    return true;
  });

  return sortProducts(filtered, filters.sort);
};

export const sortProducts = (
  products: Product[],
  sort: SortKey,
): Product[] => {
  const result = [...products];

  switch (sort) {
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);

    case "price-desc":
      return result.sort((a, b) => b.price - a.price);

    default:
      return result;
  }
};

/** Converts "T-Shirts (24)" into "T-Shirts". */
export const stripCount = (label: string): string =>
  label.replace(/\s*\(\d+\)\s*$/, "");

export const searchProducts = (
  products: Product[],
  query: string,
): Product[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery),
  );
};
