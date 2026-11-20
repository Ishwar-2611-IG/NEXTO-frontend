import { StoreImage } from '../../components/common/StoreImage';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { Container } from '../../components/common/Container';
import { ProductCard } from '../../components/common/ProductCard';
import { ROUTES } from '../../constants/routes';
import type { Product } from '../../types';

interface NewArrivalsRailProps {
  products: Product[];
}

/**
 * An accessible, continuously moving product rail. Only the first group is
 * interactive; the repeated group is decorative so keyboard users do not hit
 * duplicate links and actions while the animation loops.
 */
export function NewArrivalsRail({ products }: NewArrivalsRailProps) {
  const { addToCart } = useCart();
  const wishlist = useWishlist();

  return (
    <section aria-labelledby="new-arrivals-heading" className="space-y-7 overflow-hidden py-4 sm:py-8">
      <Container>
        <div className="flex flex-col gap-4 border-b border-[#7E7C77]/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7B6E]">JUST LANDED · THE LATEST DROP</p>
            <h2 id="new-arrivals-heading" className="font-serif text-4xl font-semibold tracking-tight text-[#2E2D2B] sm:text-5xl">New arrivals<span className="text-[#6B7B6E]">.</span></h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7E7C77]">Fresh silhouettes, considered details, and pieces made to move with you.</p>
          </div>
          <Link to={ROUTES.newArrivals} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-[#7E7C77]/25 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2E2D2B] transition-colors hover:border-[#6B7B6E] hover:bg-[#F0EBE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E] sm:self-auto">
            Explore the drop <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </Container>

      <div role="region" className="new-arrivals-viewport group/arrivals" aria-label="Continuously scrolling new arrivals. Hover or focus to pause.">
        <div className="new-arrivals-track">
          <div className="new-arrivals-group" aria-label="New arrival products">
            {products.map((product) => (
              <div className="new-arrivals-card" key={product.id}>
                <ProductCard
                  product={product}
                  variant="default"
                  addLabel="Add to bag"
                  badge={product.badge || 'JUST IN'}
                  wishlisted={wishlist.has(product.id)}
                  onAdd={addToCart}
                  onToggleWishlist={wishlist.toggle}
                />
              </div>
            ))}
          </div>
          <div className="new-arrivals-group" aria-hidden="true">
            {products.map((product) => (
              <article className="new-arrivals-card flex flex-col overflow-hidden rounded-lg border border-[#7E7C77]/20 bg-[#FFFCF7] shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)]" key={`visual-${product.id}`}>
                <div className="relative aspect-[3/4] overflow-hidden bg-[#F0EBE2]">
                  <StoreImage src={product.img} alt="" sizes="(max-width: 640px) 68vw, 270px" loading="lazy" decoding="async" className="size-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-[#F9F6F0]/95 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#2E2D2B]">{product.badge || 'JUST IN'}</span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-[#2E2D2B]">{product.name}</p>
                  <p className="mt-2 text-xs text-[#66645F]">₹{product.price.toLocaleString('en-IN')}</p>
                </div>
                <div className="mt-auto bg-[#526457] px-4 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.13em] text-white">New season</div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <Container>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#7E7C77]">Moving at its own pace · <span className="text-[#6B7B6E]">Pause by hovering or tabbing into the rail</span></p>
      </Container>
    </section>
  );
}
