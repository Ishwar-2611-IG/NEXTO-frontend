import { useCallback, useMemo, useState } from 'react';
import type { CatalogPageConfig } from '../types/catalog';
import type { SortKey } from '../types';
import { applyCatalogFilters, stripCount } from '../utils/catalog';

export const SORT_LABEL_TO_KEY = (label: string): SortKey => {
  if (label === 'Price: Low to High') return 'price-asc';
  if (label === 'Price: High to Low') return 'price-desc';
  return 'featured';
};

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/** Filter + sort state for a catalogue page, and the resulting product list. */
export function useCatalogFilters(config: CatalogPageConfig) {
  const sizeConfig = config.sidebar.sizes;
  const allSizes = useMemo(() => sizeConfig?.values ?? [], [sizeConfig]);
  // Men's size list starts fully ticked (= no size restriction); the grid layouts start empty.
  const initialSizes = useMemo(() => (sizeConfig?.layout === 'checkbox' ? allSizes : []), [sizeConfig, allSizes]);
  const maxPriceLimit = config.sidebar.price.max;
  const defaultSort = config.header.sortOptions[0];

  const [categories, setCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(maxPriceLimit);
  const [sizes, setSizes] = useState<string[]>(initialSizes);
  const [colors, setColors] = useState<string[]>([]);
  const [sortLabel, setSortLabel] = useState(defaultSort);
  const [resetCount, setResetCount] = useState(0);

  const effectiveSizes = useMemo(() => (sizes.length === allSizes.length ? [] : sizes), [sizes, allSizes]);

  const products = useMemo(
    () =>
      applyCatalogFilters(config.products, {
        categories,
        maxPrice,
        sizes: effectiveSizes,
        colors,
        sort: SORT_LABEL_TO_KEY(sortLabel),
      }),
    [config.products, categories, maxPrice, effectiveSizes, colors, sortLabel],
  );

  const isFiltered =
    categories.length > 0 || maxPrice < maxPriceLimit || effectiveSizes.length > 0 || colors.length > 0;

  /** Toggles one sidebar category label ("All" – index 0 – clears the selection). */
  const toggleCategoryLabel = useCallback(
    (label: string, isAll: boolean) => {
      if (isAll) setCategories([]);
      else setCategories((prev) => toggleIn(prev, stripCount(label)));
    },
    [],
  );

  const toggleSize = useCallback((size: string) => setSizes((prev) => toggleIn(prev, size)), []);
  const toggleColor = useCallback((color: string) => setColors((prev) => toggleIn(prev, color)), []);

  const clear = useCallback(() => {
    setCategories([]);
    setMaxPrice(maxPriceLimit);
    setSizes(initialSizes);
    setColors([]);
    setSortLabel(defaultSort);
    setResetCount((n) => n + 1);
  }, [maxPriceLimit, initialSizes, defaultSort]);

  return {
    products,
    isFiltered,
    categories,
    setCategories,
    maxPrice,
    setMaxPrice,
    sizes,
    toggleSize,
    colors,
    toggleColor,
    toggleCategoryLabel,
    sortLabel,
    setSortLabel,
    clear,
    resetCount,
  };
}

export type CatalogFilterState = ReturnType<typeof useCatalogFilters>;
