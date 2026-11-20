import { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { AccordionItem } from '../../components/common/AccordionItem';
import { Button } from '../../components/common/Button';
import { TrustPoints } from '../../components/common/TrustPoints';
import { PDP_ACCORDION, PDP_COLORS, PDP_DEFAULTS, PDP_SIZES } from '../../constants/commerce';
import { useWishlist } from '../../hooks/useWishlist';
import type { Product } from '../../types';
import { formatPrice } from '../../utils/format';
import { chooseVariant } from '../../services/storeApi';

interface ProductPurchasePanelProps {
  product: Product;
  onAddToBag: (options: { color: string; size: string }) => void;
  onBuyNow: (options: { color: string; size: string }) => void;
  onSizeGuide: () => void;
}

export function ProductPurchasePanel({ product, onAddToBag, onBuyNow, onSizeGuide }: ProductPurchasePanelProps) {
  const [color, setColor] = useState<string>(product.colorNames?.[0] ?? PDP_COLORS[0].name);
  const [size, setSize] = useState<string>(String(product.sizes?.[0] ?? 'M'));
  const [openSection, setOpenSection] = useState<string | null>('details');
  const wishlist = useWishlist();
  const wishlisted = wishlist.has(product.id);
  const availableColors = product.backendId ? (product.colorNames ?? []) : PDP_COLORS.map((entry) => entry.name);
  const colorOptions = availableColors.map((name, index) => ({ name, hex: product.backendId ? (product.colors?.[index] ?? '#a6a29b') : (PDP_COLORS.find((entry) => entry.name === name)?.hex ?? '#a6a29b') }));
  const availableSizes = product.backendId ? (product.sizes ?? []).map(String) : PDP_SIZES;
  const inStock = product.variants ? Boolean(chooseVariant(product, color, size)) : true;

  return (
    <div className="lg:col-span-5 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <span className="rounded-full bg-[#6B7B6E]/12 text-[#526457] font-mono text-[9px] font-extrabold tracking-[0.12em] px-3 py-1.5 uppercase">{product.badge ?? 'NEXTO ESSENTIAL'}</span>
          {(product.averageRating || product.reviewCount) ? <span className="inline-flex items-center gap-1.5 text-xs text-[#7E7C77]"><Star size={13} className="fill-[#C5A880] text-[#C5A880]" aria-hidden="true" /> {product.averageRating?.toFixed(1) ?? '—'} <span>({product.reviewCount ?? 0} reviews)</span></span> : null}
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight uppercase text-[#2E2D2B]">{product.name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
          <span className="text-2xl font-mono font-bold text-[#2E2D2B]">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && <><span className="text-sm font-mono text-[#7E7C77] line-through">{formatPrice(product.originalPrice)}</span><span className="bg-[#6B7B6E]/15 text-[#6B7B6E] text-xs font-mono px-2 py-0.5">Sale</span></>}
        </div>
        <p className="text-xs text-[#66645F] leading-relaxed max-w-md pt-2">{product.desc ?? PDP_DEFAULTS.desc}</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-xs font-bold text-[#2E2D2B] uppercase tracking-wider mb-3">
          Select Color: <span className="font-normal text-[#7E7C77] ml-1">{color}</span>
        </legend>
        <div className="flex items-center space-x-3">
          {colorOptions.map((c) => (
            <button
              key={c.name}
              type="button"
              aria-label={c.name}
              aria-pressed={color === c.name}
              onClick={() => setColor(c.name)}
              className={`w-8 h-8 rounded-full border-2 ${color === c.name ? 'border-[#6B7B6E] ring-2 ring-[#6B7B6E]/15' : 'border-transparent'} cursor-pointer`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="flex justify-between w-full text-xs font-bold text-[#2E2D2B] uppercase tracking-wider mb-3">
          <span>Select Size</span>
          <button type="button" onClick={onSizeGuide} className="text-[#7E7C77] hover:text-[#6B7B6E] underline">
            Size Guide
          </button>
        </legend>
        <div className="grid grid-cols-6 gap-2">
          {availableSizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              className={`py-3 border text-xs font-mono ${
                size === s ? 'rounded-full bg-[#526457] text-white border-[#526457] font-bold' : 'rounded-full bg-[#F0EBE2] border-[#7E7C77]/20 text-[#66645F] hover:border-[#6B7B6E]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-3 pt-4">
        <div className="grid grid-cols-5 gap-3">
          <Button size="lg" className="col-span-4 py-4" disabled={!inStock} onClick={() => onAddToBag({ color, size })}>
            {inStock ? 'Add to Bag' : 'Out of Stock'}
          </Button>
          <button
            type="button"
            onClick={() => wishlist.toggle(product)}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="col-span-1 grid min-h-12 place-items-center rounded-xl border border-[#7E7C77]/25 bg-[#F0EBE2] text-[#526457] transition-colors hover:bg-[#E8EDE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E]"
          >
            <Heart size={20} strokeWidth={1.7} className={wishlisted ? 'fill-[#526457] text-[#526457]' : 'text-[#526457]'} aria-hidden="true" />
          </button>
        </div>
        <Button variant="ghost" size="lg" className="w-full" onClick={() => onBuyNow({ color, size })}>
          Buy It Now
        </Button>
      </div>

      <TrustPoints className="gap-4" textClassName="text-[11px]" />

      <div className="space-y-2 pt-4">
        {PDP_ACCORDION.map((section) => (
          <AccordionItem
            key={section.key}
            title={section.title}
            open={openSection === section.key}
            onToggle={() => setOpenSection((cur) => (cur === section.key ? null : section.key))}
          >
            {section.content}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}
