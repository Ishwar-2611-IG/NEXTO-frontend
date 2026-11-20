import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Heart, Tag } from 'lucide-react';
import { Button, ButtonLink } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { EmptyState } from '../../components/common/EmptyState';
import { HeroBanner } from '../../components/common/HeroBanner';
import { SortDropdown } from '../../components/common/SortDropdown';
import { IMG, unsplash } from '../../constants/images';
import { ROUTES } from '../../constants/routes';
import { WishlistCard } from '../../features/wishlist/WishlistCard';
import { useCart } from '../../hooks/useCart';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { useWishlist } from '../../hooks/useWishlist';
import { sortProducts } from '../../utils/catalog';
import type { Product, SortKey } from '../../types';

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Recently Added', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
];

export function WishlistPage() {
  usePageTitle('Wishlist');
  const { items, remove } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('featured');

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return [...counts.entries()];
  }, [items]);

  const visible = useMemo(
    () => sortProducts(items.filter((p) => !hiddenCategories.includes(p.category)), sort),
    [items, hiddenCategories, sort],
  );

  const toggleCategory = (category: string) =>
    setHiddenCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));

  const handleRemove = (product: Product) => { void remove(product.id); };

  return (
    <div className="space-y-16 pb-20">
      <HeroBanner
        image={unsplash(IMG.womensStreetwear, 1800)}
        alt="Wishlist Hero"
        eyebrow="YOUR WISHLIST"
        titleLines={['YOUR FAVOURITES']}
        accent={{ text: 'stay closer.', className: 'text-[#66645F] font-serif italic normal-case' }}
        titleClassName="text-4xl sm:text-6xl lg:text-7xl"
        description="Save what you love. Come back when you're ready."
        heightClassName="h-[360px] sm:h-[420px]"
        overlayClassName="from-[#F9F6F0]/94 via-[#F9F6F0]/70 to-[#F9F6F0]/12"
      />

      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside aria-label="Wishlist filters" className="lg:col-span-3 space-y-6 rounded-2xl bg-[#FFFCF7] p-6 border border-[#7E7C77]/20 h-fit shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)]">
          <div className="space-y-2 border-b border-[#7E7C77]/20 pb-6 text-xs font-mono">
            <div className="flex items-center justify-between p-3 bg-[#FFFCF7] text-[#2E2D2B] font-bold">
              <span className="inline-flex items-center gap-2"><Heart size={15} aria-hidden="true" /> My Wishlist</span>
              <span>{items.length}</span>
            </div>
            <button type="button" onClick={() => showToast('Opening recently viewed items...')} className="w-full flex items-center justify-between p-3 text-[#66645F] hover:bg-[#6B7B6E]/5 hover:text-[#6B7B6E]">
              <span className="inline-flex items-center gap-2"><Clock3 size={15} aria-hidden="true" /> Recently Viewed</span>
              <span>12</span>
            </button>
            <button type="button" onClick={() => showToast('Opening price drops...')} className="w-full flex items-center justify-between p-3 text-[#66645F] hover:bg-[#6B7B6E]/5 hover:text-[#6B7B6E]">
              <span className="inline-flex items-center gap-2"><Tag size={15} aria-hidden="true" /> Price Drops</span>
              <span>2</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase text-[#2E2D2B] tracking-wider">Filters</span>
              <button type="button" onClick={() => setHiddenCategories([])} className="text-[#7E7C77] hover:text-[#6B7B6E] underline">
                Clear All
              </button>
            </div>
            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-wider text-[#2E2D2B] mb-2">Category</legend>
              {categoryCounts.map(([category, count]) => (
                <label key={category} className="flex items-center space-x-3 text-xs text-[#66645F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hiddenCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 accent-[#6B7B6E] bg-[#F0EBE2] border-[#7E7C77]/30 rounded-sm"
                  />
                  <span>{category} ({count})</span>
                </label>
              ))}
            </fieldset>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl bg-[#FFFCF7] p-6 border border-[#7E7C77]/20">
            <div>
              <h2 className="text-xl font-semibold text-[#2E2D2B]">My Wishlist ({items.length})</h2>
              <p className="text-xs text-[#7E7C77] mt-0.5">Items you saved for later.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <SortDropdown
                options={SORT_OPTIONS}
                value={sort}
                onChange={setSort}
              />
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState message="Your wishlist is empty. Tap the heart on anything you love.">
              <ButtonLink to={ROUTES.newArrivals}>Browse new arrivals</ButtonLink>
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState message="No saved items match the selected categories.">
              <Button onClick={() => setHiddenCategories([])}>Show all</Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {visible.map((product) => (
                <WishlistCard key={product.id} product={product} onRemove={handleRemove} onAdd={(p) => addToCart(p)} />
              ))}
            </div>
          )}

          <p className="text-center text-xs font-mono text-[#7E7C77]">
            Looking for more? <Link to={ROUTES.collections} className="text-[#2E2D2B] underline">Explore collections →</Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
