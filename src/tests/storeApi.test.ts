import { describe, expect, it } from 'vitest';
import { chooseVariant, mapBackendProduct, type BackendProduct } from '../services/storeApi';

const product: BackendProduct = {
  _id: '65a123456789abcdef123456', name: 'Orbit Hoodie', slug: 'orbit-hoodie', description: 'A test product',
  price: 299900, basePrice: 349900, category: 'Hoodies', audience: 'men', averageRating: 4.5, reviewCount: 12,
  images: [{ url: 'https://images.example/hoodie.jpg', alt: 'Hoodie' }],
  variants: [
    { sku: 'ORBIT-BLACK-M', size: 'M', color: 'Black', stock: 3 },
    { sku: 'ORBIT-IVORY-L', size: 'L', color: 'Ivory', stock: 0 },
  ],
};

describe('store API adapter', () => {
  it('converts paise to rupees and preserves backend identifiers and variants', () => {
    const mapped = mapBackendProduct(product);
    expect(mapped.backendId).toBe(product._id);
    expect(mapped.slug).toBe('orbit-hoodie');
    expect(mapped.price).toBe(2999);
    expect(mapped.originalPrice).toBe(3499);
    expect(mapped.audience).toBe('men');
    expect(mapped.variants?.[0].sku).toBe('ORBIT-BLACK-M');
  });

  it('chooses the requested available size and color variant', () => {
    const mapped = mapBackendProduct(product);
    expect(chooseVariant(mapped, 'Black', 'M')?.sku).toBe('ORBIT-BLACK-M');
    expect(chooseVariant(mapped, 'Ivory', 'L')).toBeUndefined();
  });
});
