import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { listProducts } from '../services/storeApi';

let cachedProducts: Product[] | null = null;
let cacheExpiresAt = 0;
let requestInFlight: Promise<Product[]> | null = null;

async function loadProducts() {
  if (cachedProducts && Date.now() < cacheExpiresAt) return cachedProducts;
  if (!requestInFlight) {
    requestInFlight = listProducts({ limit: 100, sortBy: 'newest' })
      .then((products) => { cachedProducts = products; cacheExpiresAt = Date.now() + 30_000; return products; })
      .finally(() => { requestInFlight = null; });
  }
  return requestInFlight;
}
export function invalidateProductCache() { cachedProducts = null; cacheExpiresAt = 0; }
export function useBackendProducts() {
  const [products, setProducts] = useState<Product[]>(() => cachedProducts ?? []);
  const [loading, setLoading] = useState(() => !cachedProducts);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    loadProducts().then((items) => { if (active) { setProducts(items); setError(null); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Product service is unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { products, loading, error, isUsingBackend: products.length > 0 };
}
