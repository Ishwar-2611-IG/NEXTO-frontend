import { StoreImage } from './StoreImage';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import type { Product } from '../../types';
import { formatPrice } from '../../utils/format';
import { FiHeart } from 'react-icons/fi';
import { IoHeart } from 'react-icons/io5';

export type ProductCardVariant = 'default' | 'compact';

interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
  badge?: string;
  showColors?: boolean;
  addLabel?: string;
  wishlisted: boolean;
  onAdd: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
}

const STYLES = {
  default: {
    heart: 'top-3 right-3 p-2',
    info: 'p-3 sm:p-4 space-y-2',
    name: 'text-xs sm:text-sm',
    price: 'text-xs font-mono text-[#66645F]',
  },
  compact: {
    heart: 'top-2 right-2 p-1.5',
    info: 'p-3',
    name: 'text-xs',
    price: 'text-xs font-mono text-[#7E7C77] mt-1',
  },
} as const;

export function ProductCard({
  product,
  variant = 'default',
  badge,
  showColors = false,
  addLabel = '+ Quick Add',
  wishlisted,
  onAdd,
  onToggleWishlist,
}: ProductCardProps) {
  const s = STYLES[variant];
  const to = ROUTES.product(product.slug ?? product.id);
  const label = badge ?? product.badge;
  const inStock = !product.variants || product.variants.some((item) => item.stock > 0);

  return (
    <article className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-lg border border-[#7E7C77]/20 bg-[#FFFCF7] shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)] transition-shadow duration-300 hover:shadow-[0_14px_36px_-12px_rgba(46,45,43,0.12)]">
      <div className="product-card-media relative aspect-[3/4] overflow-hidden bg-[#F0EBE2]">
        <Link to={to} aria-label={`View ${product.name}`} className="block w-full h-full">
          <StoreImage
            src={product.img}
            alt={product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>
        <button
          type="button"
          disabled={!inStock}
          aria-label={inStock ? `Quick add ${product.name} to bag` : `${product.name} is out of stock`}
          onClick={() => onAdd(product)}
          className={`product-card-add absolute inset-x-3 bottom-3 z-10 inline-flex min-h-11 items-center justify-center rounded-full bg-[#526457] px-4 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white shadow-[0_8px_22px_-8px_rgba(0,0,0,0.35)] transition-[transform,opacity,background-color] duration-300 ease-out hover:bg-[#445549] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7B6E] translate-y-[calc(100%+0.75rem)] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none`}
        >
          {inStock ? addLabel : 'Out of Stock'}
        </button>
        {label && (
          <span className="absolute top-3 left-3 rounded-full bg-[#F9F6F0]/95 text-[#2E2D2B] text-[9px] font-extrabold tracking-[0.12em] px-3 py-1.5 uppercase pointer-events-none">
            {label}
          </span>
        )}
        <button
          type="button"
          onClick={() => onToggleWishlist(product)}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className={`absolute ${s.heart} grid place-items-center rounded-full border border-[#7E7C77]/20 bg-[#F9F6F0]/95 text-[#2E2D2B] shadow-sm transition duration-200 hover:scale-105 active:scale-90 ${wishlisted ? "text-[#6B7B6E]" : ""}`}
        >
          {wishlisted ? <IoHeart aria-hidden="true" className="size-[18px] animate-[heart-pop_.28s_ease-out]" /> : <FiHeart aria-hidden="true" className="size-[18px]" />}
        </button>
      </div>

      <Link to={to} className={`block ${s.info}`}>
        <h4 className={`${s.name} font-sans font-bold text-[#2E2D2B]`}>{product.name}</h4>
        <p className={s.price}>{formatPrice(product.price)}</p>
        {showColors && product.colors && (
          <div className="flex items-center space-x-2 pt-1">
            {product.colors.map((color) => (
              <span key={color} className="w-3 h-3 rounded-full border border-[#7E7C77]/25" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
      </Link>

    </article>
  );
}
