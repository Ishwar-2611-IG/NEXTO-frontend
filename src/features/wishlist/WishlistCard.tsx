import { StoreImage } from '../../components/common/StoreImage';
import { Link } from 'react-router-dom';
import { IoHeart } from 'react-icons/io5';
import { DEFAULT_WISHLIST_SIZES } from '../../constants/commerce';
import { ROUTES } from '../../constants/routes';
import type { Product } from '../../types';
import { formatPrice } from '../../utils/format';

interface WishlistCardProps {
  product: Product;
  onRemove: (product: Product) => void;
  onAdd: (product: Product) => void;
}

export function WishlistCard({ product, onRemove, onAdd }: WishlistCardProps) {
  const to = ROUTES.product(product.slug ?? product.id);
  return (
    <article className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-lg border border-[#7E7C77]/20 bg-[#FFFCF7] shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)] transition-shadow duration-300 hover:shadow-[0_14px_36px_-12px_rgba(46,45,43,0.12)]">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F0EBE2]">
        <Link to={to} aria-label={`View ${product.name}`} className="block w-full h-full">
          <StoreImage src={product.img} alt={product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        </Link>
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="product-card-add absolute inset-x-3 bottom-3 z-10 inline-flex min-h-11 items-center justify-center rounded-full bg-[#526457] px-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_8px_22px_-8px_rgba(0,0,0,0.35)] transition-[transform,opacity,background-color] duration-300 ease-out hover:bg-[#445549] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7B6E] translate-y-[calc(100%+0.75rem)] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none"
        >
          Add to Bag
        </button>
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-[#F9F6F0]/95 text-[#2E2D2B] text-[9px] font-extrabold tracking-[0.12em] px-3 py-1.5 uppercase pointer-events-none">
            {product.badge}
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(product)}
          aria-label={`Remove ${product.name} from wishlist`}
          className="absolute top-3 right-3 grid size-10 place-items-center rounded-full border border-[#7E7C77]/20 bg-[#F9F6F0]/95 text-[#C05B55] shadow-sm transition hover:scale-105"
        >
          <IoHeart aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="min-w-0 p-3 sm:p-4 space-y-2">
        <h4 className="break-words font-sans text-xs font-bold text-[#2E2D2B] sm:text-sm">{product.name}</h4>
        <p className="text-xs font-mono text-[#66645F]">{formatPrice(product.price)}</p>
        {product.colors && (
          <div className="flex items-center space-x-2 pt-1">
            {product.colors.map((color) => (
              <span key={color} className="w-3 h-3 rounded-full border border-[#7E7C77]/25" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
        <div className="pt-2 text-[10px] font-mono text-[#7E7C77] flex space-x-2">
          {(product.sizes ?? DEFAULT_WISHLIST_SIZES).map((size) => (
            <span key={size}>{size}</span>
          ))}
        </div>
      </div>

    </article>
  );
}
