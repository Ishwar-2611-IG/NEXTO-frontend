import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { EmptyState } from '../../components/common/EmptyState';
import { HeroAside, HeroBanner } from '../../components/common/HeroBanner';
import { ProductGrid } from '../../components/common/ProductGrid';
import { PromoBanner } from '../../components/common/PromoBanner';
import { TileGrid } from '../../components/common/TileGrid';
import { CatalogSidebar } from '../../components/catalog/CatalogSidebar';
import { CatalogToolbar } from '../../components/catalog/CatalogToolbar';
import { Pagination } from '../../components/catalog/Pagination';
import { useCatalogFilters } from '../../hooks/useCatalogFilters';
import { useToast } from '../../hooks/useToast';
import type { CatalogPageConfig, TileConfig } from '../../types/catalog';
import { useBackendProducts } from '../../hooks/useBackendProducts';
import { ProductGridSkeleton } from '../../components/common/Skeleton';

const sameCategories = (a: string[], b: string[]) => a.length === b.length && a.every((c) => b.includes(c));

/**
 * One data-driven page for Men, Women, New Arrivals and Accessories.
 * Everything that differs between them (copy, tiles, filters, banners) lives in src/data/catalogs.ts.
 */
export function CatalogPage({ config }: { config: CatalogPageConfig }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { products: apiProducts, loading } = useBackendProducts();
  const audienceProducts = apiProducts.length ? apiProducts.filter((product) => {
    if (config.slug === 'men') return product.audience === 'men' || product.audience === 'unisex';
    if (config.slug === 'women') return product.audience === 'women' || product.audience === 'unisex';
    if (config.slug === 'accessories') return product.audience === 'accessories' || /accessor|cap|bag|shoe|footwear|jewel|sunglass|belt|sock/i.test(product.category);
    return true;
  }) : [];
  const effectiveProducts = config.slug === 'new-arrivals'
    ? (apiProducts.length ? apiProducts.filter((product) => product.newArrival) : config.products)
    : audienceProducts.length ? audienceProducts : config.products;
  const effectiveConfig = { ...config, products: effectiveProducts };
  const filters = useCatalogFilters(effectiveConfig);
  const { hero, tabs, tiles, header } = config;

  const handleTileSelect = (tile: TileConfig) => {
    if (tile.to) navigate(tile.to);
    else filters.setCategories(tile.categories ?? []);
  };

  const subtitle = filters.isFiltered
    ? `${filters.products.length} of ${effectiveProducts.length} products shown`
    : header.countLabel;

  return (
    <div className="space-y-16 pb-20">
      <HeroBanner
        image={hero.img}
        alt={hero.alt}
        eyebrow={hero.eyebrow}
        titleLines={hero.titleLines}
        titleClassName={hero.titleClassName}
        description={hero.description}
        heightClassName={hero.heightClassName}
        aside={hero.aside && <HeroAside lines={hero.aside} />}
      >
        {hero.actions && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {hero.actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size={action.variant === 'primary' ? 'lg' : 'md'}
                className={action.variant === 'ghost' ? 'py-4' : ''}
                onClick={() => showToast(action.toast)}
              >
                {action.icon === 'play' ? (
                  <span className="inline-flex items-center gap-2">
                    <Play size={14} aria-hidden="true" />
                    {action.label}
                  </span>
                ) : action.label}
              </Button>
            ))}
          </div>
        )}
      </HeroBanner>

      {tabs && (
        <Container className="flex items-center space-x-6 border-b border-[#7E7C77]/20 pb-4 overflow-x-auto text-xs font-mono uppercase tracking-widest text-[#7E7C77]">
          {tabs.map((tab) => {
            const active = sameCategories(filters.categories, tab.categories);
            return (
              <button
                key={tab.label}
                type="button"
                aria-pressed={active}
                onClick={() => filters.setCategories(tab.categories)}
                className={`pb-2 whitespace-nowrap ${active ? 'text-[#2E2D2B] border-b-2 border-[#7E7C77]/30' : 'hover:text-[#6B7B6E]'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </Container>
      )}

      {tiles && (
        <TileGrid
          tiles={tiles.items}
          gridClassName={tiles.gridClassName}
          tileClassName={tiles.tileClassName}
          rowClassName={tiles.rowClassName}
          imageClassName={tiles.imgClassName}
          onSelect={handleTileSelect}
        />
      )}

      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <CatalogSidebar config={config.sidebar} filters={filters} />

        <div className="lg:col-span-9 space-y-8">
          <CatalogToolbar
            title={header.title}
            subtitle={subtitle}
            sortOptions={header.sortOptions}
            sortValue={filters.sortLabel}
            onSortChange={filters.setSortLabel}
          />

          {loading && effectiveProducts.length === 0 ? (
            <ProductGridSkeleton count={8} gridClassName="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" />
          ) : filters.products.length > 0 ? (
            <ProductGrid
              products={filters.products}
              showColors={config.showColors}
              badgeFallback={config.badgeFallback}
              gridClassName="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
            />
          ) : (
            <EmptyState message="No products match your filters.">
              <Button onClick={filters.clear}>Clear filters</Button>
            </EmptyState>
          )}

          {config.pagination && <Pagination />}
        </div>
      </Container>

      {config.promo && (
        <PromoBanner
          image={config.promo.img}
          alt={config.promo.alt}
          eyebrow={config.promo.eyebrow}
          title={config.promo.title}
          text={config.promo.text}
          ctaLabel={config.promo.cta}
          onCta={() => showToast(config.promo!.toast)}
        />
      )}
    </div>
  );
}
