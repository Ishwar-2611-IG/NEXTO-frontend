import { StoreImage } from '../common/StoreImage';
import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { CatalogFilterState } from '../../hooks/useCatalogFilters';
import type { SidebarConfig } from '../../types/catalog';
import { formatPrice } from '../../utils/format';
import { stripCount } from '../../utils/catalog';
import { FilterGroup } from './FilterGroup';

interface CatalogSidebarProps {
  config: SidebarConfig;
  filters: CatalogFilterState;
}

const checkboxLabel = 'flex items-center space-x-3 text-xs text-[#66645F] cursor-pointer';
const checkbox = 'w-4 h-4 accent-[#6B7B6E] bg-[#F0EBE2] border-[#7E7C77]/30 rounded-sm';

/** Fit / material have no matching product data yet, so they are remembered locally but do not filter. */
function CheckboxList({ title, values }: { title: string; values: string[] }) {
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <FilterGroup title={title}>
      {values.map((value) => (
        <label key={value} className={checkboxLabel}>
          <input
            type="checkbox"
            className={checkbox}
            checked={checked.includes(value)}
            onChange={() => setChecked((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))}
          />
          <span>{value}</span>
        </label>
      ))}
    </FilterGroup>
  );
}

export function CatalogSidebar({ config, filters }: CatalogSidebarProps) {
  const { showToast } = useToast();
  const { sizes, colors } = config;

  const handleClear = () => {
    filters.clear();
    showToast('Filters cleared');
  };

  return (
    <aside
      key={filters.resetCount}
      aria-label="Filters"
      className="lg:col-span-3 space-y-8 rounded-lg bg-[#FFFCF7] p-6 border border-[#7E7C77]/20 h-fit shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)]"
    >
      <div className="flex items-center justify-between border-b border-[#7E7C77]/20 pb-4">
        <span className="text-sm font-bold uppercase tracking-wider text-[#2E2D2B]">Filters</span>
        <button type="button" onClick={handleClear} className="text-xs text-[#7E7C77] hover:text-[#6B7B6E] underline">
          Clear All
        </button>
      </div>

      <FilterGroup title="Category">
        {config.categoryLabels.map((label, index) => {
          const isAll = index === 0;
          const checked = isAll ? filters.categories.length === 0 : filters.categories.includes(stripCount(label));
          return (
            <label key={label} className={checkboxLabel}>
              <input
                type="checkbox"
                className={checkbox}
                checked={checked}
                onChange={() => filters.toggleCategoryLabel(label, isAll)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </FilterGroup>

      <FilterGroup title="Price">
        <input
          type="range"
          aria-label="Maximum price"
          min={config.price.min}
          max={config.price.max}
          value={filters.maxPrice}
          onChange={(e) => filters.setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#6B7B6E] bg-[#F0EBE2]"
        />
        <div className="flex justify-between text-[11px] font-mono text-[#7E7C77]">
          <span>{formatPrice(config.price.min)}</span>
          <span>{formatPrice(filters.maxPrice)}</span>
        </div>
      </FilterGroup>

      {sizes && (
        <FilterGroup title="Size">
          {sizes.layout === 'grid' ? (
            <div className={`grid ${sizes.gridClass ?? 'grid-cols-5'} gap-2`}>
              {sizes.values.map((size) => {
                const active = filters.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={active}
                    onClick={() => filters.toggleSize(size)}
                    className={`py-2 border text-xs font-mono hover:border-[#7E7C77]/30 ${
                      active ? 'rounded-full bg-[#526457] text-white border-[#6B7B6E]' : 'rounded-full bg-[#F0EBE2] border-[#7E7C77]/20 text-[#66645F]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          ) : (
            sizes.values.map((size) => (
              <label key={size} className={checkboxLabel}>
                <input
                  type="checkbox"
                  className={checkbox}
                  checked={filters.sizes.includes(size)}
                  onChange={() => filters.toggleSize(size)}
                />
                <span>{size}</span>
              </label>
            ))
          )}
        </FilterGroup>
      )}

      {colors && (
        <FilterGroup title="Color">
          <div className={`grid ${colors.gridClass} gap-2`}>
            {colors.values.map((hex) => {
              const active = filters.colors.includes(hex);
              return (
                <button
                  key={hex}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Colour ${hex}`}
                  onClick={() => filters.toggleColor(hex)}
                  className={`${colors.swatchClass} rounded-full border ${active ? 'border-[#7E7C77]/30 ring-2 ring-[#6B7B6E]/30' : 'border-[#7E7C77]/25'} cursor-pointer`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
        </FilterGroup>
      )}

      {config.fit && <CheckboxList title="Fit" values={config.fit} />}
      {config.material && <CheckboxList title="Material" values={config.material} />}

      {config.promo && (
        <div className="relative aspect-[4/5] rounded-lg bg-[#F0EBE2] border border-[#7E7C77]/20 overflow-hidden flex flex-col justify-end p-4">
          <StoreImage src={config.promo.img} alt="" sizes="(max-width: 1024px) 100vw, 25vw" className="absolute inset-0 w-full h-full object-cover filter brightness-50" />
          <div className="relative z-10 space-y-1">
            <h4 className="text-xs font-semibold uppercase text-white">{config.promo.title}</h4>
            <p className="text-[10px] text-white/85">{config.promo.text}</p>
            <button
              type="button"
              onClick={() => showToast(config.promo!.toast)}
              className="mt-2 rounded-full bg-[#526457] text-white px-4 py-2 font-extrabold uppercase text-[9px] tracking-[0.14em] hover:bg-[#445549]"
            >
              {config.promo.cta}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
