import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ButtonLink } from '../../components/common/Button';
import { Container } from '../../components/common/Container';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductGrid } from '../../components/common/ProductGrid';
import { ROUTES } from '../../constants/routes';
import { ALL_PRODUCTS } from '../../data/products';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Product } from '../../types';
import { searchProducts } from '../../utils/catalog';

/** The same product can appear in several catalogues; show each name once. */
const uniqueByName = (products: Product[]) => {
  const seen = new Set<string>();
  return products.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));
};

export function SearchPage() {
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').slice(0, 100);
  usePageTitle(query ? `Search: ${query}` : 'Search');

  const results = useMemo(() => uniqueByName(searchProducts(ALL_PRODUCTS, query)), [query]);

  return (
    <Container className="py-12 space-y-8 min-h-[50vh]">
      <div className="border-b border-[#7E7C77]/20 pb-5">
        <span className="text-xs font-mono text-[#7E7C77] uppercase tracking-widest block mb-1">SEARCH</span>
        <h1 className="text-3xl font-semibold uppercase text-[#2E2D2B]">{query ? `Results for “${query}”` : 'Search NEXTO'}</h1>
        {query && <p className="text-xs text-[#7E7C77] font-mono mt-1">{results.length} products found</p>}
      </div>

      {results.length > 0 ? (
        <ProductGrid products={results} showColors gridClassName="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" />
      ) : (
        <EmptyState message={query ? 'No products matched your search.' : 'Type something into the search bar to get started.'}>
          <ButtonLink to={ROUTES.newArrivals}>Browse new arrivals</ButtonLink>
        </EmptyState>
      )}
    </Container>
  );
}
