import type { Product } from './index';

export interface TileConfig {
  title: string;
  img: string;
  /** Filters the current catalogue to these categories ([] = show all). */
  categories?: string[];
  /** Or navigates to another page instead. */
  to?: string;
}

export interface HeroAction {
  label: string;
  variant: 'primary' | 'ghost';
  icon?: 'play';
  toast: string;
}

export interface SidebarConfig {
  /** First entry is the "All" option; the others are "Label (count)". */
  categoryLabels: string[];
  price: { min: number; max: number };
  sizes?: { values: string[]; layout: 'grid' | 'checkbox'; gridClass?: string };
  colors?: { values: string[]; gridClass: string; swatchClass: string };
  fit?: string[];
  material?: string[];
  promo?: { img: string; title: string; text: string; cta: string; toast: string };
}

export interface PromoConfig {
  img: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  toast: string;
}

export interface CatalogPageConfig {
  slug: 'men' | 'women' | 'new-arrivals' | 'accessories';
  products: Product[];
  hero: {
    img: string;
    alt: string;
    eyebrow: string;
    titleLines: string[];
    description: string;
    heightClassName: string;
    titleClassName?: string;
    aside?: string[];
    actions?: HeroAction[];
  };
  /** Tab row shown under the hero (men). */
  tabs?: { label: string; categories: string[] }[];
  tiles?: {
    items: TileConfig[];
    gridClassName: string;
    tileClassName: string;
    rowClassName: string;
    imgClassName: string;
  };
  sidebar: SidebarConfig;
  header: { title: string; countLabel: string; sortOptions: string[] };
  /** Shown on every card that has no badge of its own. */
  badgeFallback?: string;
  showColors: boolean;
  pagination: boolean;
  promo?: PromoConfig;
}
