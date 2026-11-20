import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import type { Product } from '../../types';
import { ProductCard, type ProductCardVariant } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  gridClassName: string;
  variant?: ProductCardVariant;
  showColors?: boolean;
  addLabel?: string;
  badgeFallback?: string;
}

/** Wires product cards to the cart and wishlist. */
export function ProductGrid({ products, gridClassName, variant, showColors, addLabel, badgeFallback }: ProductGridProps) {
  const { addToCart } = useCart();
  const wishlist = useWishlist();

  return (
    <div className={`grid ${gridClassName}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          variant={variant}
          showColors={showColors}
          addLabel={addLabel}
          badge={product.badge || badgeFallback}
          wishlisted={wishlist.has(product.id)}
          onAdd={(p) => addToCart(p)}
          onToggleWishlist={wishlist.toggle}
        />
      ))}
    </div>
  );
}
