import { IMG, unsplash } from '../constants/images';
import { ROUTES } from '../constants/routes';
import type { CatalogPageConfig } from '../types/catalog';
import {
  ACCESSORIES_PRODUCTS,
  MENS_PRODUCTS,
  NEW_ARRIVALS_PRODUCTS,
  WOMENS_PRODUCTS,
} from './products';

const defaultTileImg = 'w-full h-full object-cover filter brightness-50 group-hover:scale-105 transition-transform';

export const MEN_PAGE: CatalogPageConfig = {
  slug: 'men',
  products: MENS_PRODUCTS,
  hero: {
    img: unsplash(IMG.hoodie, 1800),
    alt: "Men's Collection Hero",
    eyebrow: "MEN'S COLLECTION",
    titleLines: ['BUILT', 'DIFFERENT'],
    description: 'Modern essentials for a bolder tomorrow.',
    heightClassName: 'h-[380px] sm:h-[460px]',
    titleClassName: 'text-5xl sm:text-7xl lg:text-8xl',
    aside: ['STREETWEAR', 'CULTURE', 'QUALITY', 'COMMUNITY'],
  },
  tabs: [
    { label: 'All', categories: [] },
    { label: 'Tops (28)', categories: ['T-Shirts', 'Shirts'] },
    { label: 'Bottoms (18)', categories: ['Bottoms'] },
    { label: 'Jackets (12)', categories: ['Jackets'] },
    { label: 'Hoodies (16)', categories: ['Hoodies'] },
    { label: 'Accessories (10)', categories: ['Accessories'] },
  ],
  sidebar: {
    categoryLabels: ['All', 'T-Shirts (28)', 'Hoodies (18)', 'Shirts (12)', 'Jackets (16)', 'Bottoms (20)', 'Accessories (10)'],
    price: { min: 799, max: 6999 },
    sizes: { values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], layout: 'checkbox' },
  },
  header: {
    title: "Men's Collection",
    countLabel: '124 Products',
    sortOptions: ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First'],
  },
  showColors: true,
  pagination: false,
};

export const WOMEN_PAGE: CatalogPageConfig = {
  slug: 'women',
  products: WOMENS_PRODUCTS,
  hero: {
    img: unsplash(IMG.tee, 1800),
    alt: 'Women Hero',
    eyebrow: 'WOMEN’S COLLECTION',
    titleLines: ['BOLD', 'MOVES', 'EVERYDAY.'],
    description: 'Streetwear for women who do things their own way.',
    heightClassName: 'h-[440px] sm:h-[520px]',
    actions: [
      { label: 'Explore Collection →', variant: 'primary', toast: 'Exploring women collection...' },
      { label: 'Watch Campaign', variant: 'ghost', icon: 'play', toast: 'Video is not available right now.' },
    ],
  },
  tiles: {
    items: [
      { title: 'All', img: unsplash(IMG.hoodie, 400), categories: [] },
      { title: 'Tops', img: unsplash(IMG.tee, 400), categories: ['T-Shirts', 'Shirts'] },
      { title: 'Bottoms', img: unsplash(IMG.cargo, 400), categories: ['Bottoms'] },
      { title: 'Jackets', img: unsplash(IMG.denimJacket, 400), categories: ['Jackets'] },
      { title: 'Hoodies', img: unsplash(IMG.greyHoodie, 400), categories: ['Hoodies'] },
      { title: 'Dresses', img: unsplash(IMG.dress, 400), categories: ['Dresses'] },
      { title: 'Accessories', img: unsplash(IMG.sunglasses, 400), categories: ['Accessories'] },
    ],
    gridClassName: 'grid grid-cols-2 sm:grid-cols-7 gap-4',
    tileClassName: 'h-28 flex items-end p-4',
    rowClassName: 'items-end',
    imgClassName: defaultTileImg,
  },
  sidebar: {
    categoryLabels: ['All', 'T-Shirts (24)', 'Hoodies (18)', 'Shirts (16)', 'Jackets (14)', 'Dresses (12)', 'Bottoms (20)', 'Accessories (10)'],
    price: { min: 799, max: 7999 },
    sizes: { values: ['XS', 'S', 'M', 'L', 'XL'], layout: 'grid', gridClass: 'grid-cols-5' },
    colors: {
      values: ['#0f0f0f', '#71717a', '#f5f5f4', '#d4a373', '#f472b6', '#1e3a8a', '#7f1d1d'],
      gridClass: 'grid-cols-6',
      swatchClass: 'w-6 h-6',
    },
    fit: ['Oversized', 'Regular', 'Relaxed', 'Slim'],
    material: ['Cotton', 'Denim', 'Fleece', 'Linen', 'Polyester'],
    promo: {
      img: unsplash(IMG.tee, 600),
      title: 'NEW SEASON FOR HER',
      text: 'Same energy. New essentials.',
      cta: 'Explore →',
      toast: 'Explore clicked',
    },
  },
  header: {
    title: 'Women’s Collection',
    countLabel: '96 Products',
    sortOptions: ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First'],
  },
  showColors: true,
  pagination: true,
  promo: {
    img: unsplash(IMG.tee, 1600),
    alt: 'Made for Her Journey',
    eyebrow: "WOMEN'S EDIT",
    title: 'MADE FOR HER JOURNEY',
    text: 'Confidence looks good on you.',
    cta: 'Explore the Edit',
    toast: 'Exploring Edit...',
  },
};

export const NEW_ARRIVALS_PAGE: CatalogPageConfig = {
  slug: 'new-arrivals',
  products: NEW_ARRIVALS_PRODUCTS,
  hero: {
    img: unsplash(IMG.greyHoodie, 1800),
    alt: 'New Arrivals Hero',
    eyebrow: 'NEW ARRIVALS',
    titleLines: ['FRESH', 'DROPS.', 'BIGGER', 'STORIES.'],
    description: 'Latest pieces for a bolder tomorrow.',
    heightClassName: 'h-[440px] sm:h-[520px]',
    actions: [
      { label: 'Shop New Arrivals →', variant: 'primary', toast: 'Browsing new drops...' },
      { label: 'Watch Lookbook', variant: 'ghost', icon: 'play', toast: 'Video is not available right now.' },
    ],
  },
  tiles: {
    items: [
      { title: 'NEW IN MEN', img: unsplash(IMG.hoodie, 600), to: ROUTES.men },
      { title: 'NEW IN WOMEN', img: unsplash(IMG.tee, 600), to: ROUTES.women },
      { title: 'NEW IN FOOTWEAR', img: unsplash(IMG.sneakers, 600), categories: ['Footwear'] },
      { title: 'NEW IN ACCESSORIES', img: unsplash(IMG.sunglasses, 600), categories: ['Accessories'] },
    ],
    gridClassName: 'grid grid-cols-2 lg:grid-cols-4 gap-4',
    tileClassName: 'h-48 flex flex-col justify-end p-5',
    rowClassName: 'items-center',
    imgClassName: 'w-full h-full object-cover filter brightness-60 group-hover:scale-105 transition-transform',
  },
  sidebar: {
    categoryLabels: ['All New Arrivals', 'T-Shirts (12)', 'Hoodies (16)', 'Jackets (10)', 'Pants (14)', 'Footwear (8)', 'Accessories (12)'],
    price: { min: 799, max: 6999 },
    sizes: { values: ['XS', 'S', 'M', 'L', 'XL'], layout: 'grid', gridClass: 'grid-cols-4' },
    colors: {
      values: ['#0f0f0f', '#71717a', '#f5f5f4', '#d4a373', '#1e3a8a', '#7f1d1d'],
      gridClass: 'grid-cols-6',
      swatchClass: 'w-6 h-6',
    },
  },
  header: {
    title: 'New Arrivals',
    countLabel: '48 products',
    sortOptions: ['Newest First', 'Price: Low to High', 'Price: High to Low', 'Featured'],
  },
  badgeFallback: 'NEW',
  showColors: true,
  pagination: true,
  promo: {
    img: unsplash(IMG.greyHoodie, 1600),
    alt: 'New Season Edit',
    eyebrow: 'THE NEW SEASON EDIT',
    title: 'NOT JUST CLOTHES. A NEW PERSPECTIVE.',
    text: 'Fresh silhouettes. Bolder energy. Limited drops, infinite possibilities.',
    cta: 'Explore Now',
    toast: 'Exploring New Season Edit...',
  },
};

export const ACCESSORIES_PAGE: CatalogPageConfig = {
  slug: 'accessories',
  products: ACCESSORIES_PRODUCTS,
  hero: {
    img: unsplash(IMG.sunglasses, 1800),
    alt: 'Accessories Hero',
    eyebrow: 'ACCESSORIES',
    titleLines: ['SMALL', 'DETAILS', 'BIGGER', 'ATTITUDE.'],
    description: 'Caps, bags, eyewear, jewelry and more. Finish your look, your way.',
    heightClassName: 'h-[500px] sm:h-[600px]',
    actions: [{ label: 'Shop Accessories →', variant: 'primary', toast: 'Exploring accessories drop...' }],
  },
  tiles: {
    items: [
      { title: 'CAPS', img: unsplash(IMG.cap, 400), categories: ['Caps'] },
      { title: 'EYEWEAR', img: unsplash(IMG.sunglasses, 400), categories: ['Sunglasses'] },
      { title: 'BAGS', img: unsplash(IMG.bag, 400), categories: ['Bags'] },
      { title: 'JEWELLERY', img: unsplash(IMG.jewellery, 400), categories: ['Jewellery'] },
      { title: 'FOOTWEAR', img: unsplash(IMG.sneakers, 400), categories: ['Footwear'] },
    ],
    gridClassName: 'grid grid-cols-2 sm:grid-cols-5 gap-4',
    tileClassName: 'h-32 flex items-end p-4',
    rowClassName: 'items-end',
    imgClassName: defaultTileImg,
  },
  sidebar: {
    categoryLabels: ['All Accessories', 'Caps (12)', 'Sunglasses (8)', 'Bags (10)', 'Jewellery (14)', 'Footwear (18)', 'Socks (6)', 'Belts (4)'],
    price: { min: 499, max: 12999 },
    colors: {
      values: ['#0f0f0f', '#71717a', '#f5f5f4', '#d4a373', '#3f6212', '#1e3a8a', '#7f1d1d'],
      gridClass: 'grid-cols-5',
      swatchClass: 'w-7 h-7',
    },
  },
  header: {
    title: 'Accessories',
    countLabel: '126 products',
    sortOptions: ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest First'],
  },
  showColors: true,
  pagination: false,
  promo: {
    img: unsplash(IMG.sunglasses, 1600),
    alt: 'Complete the look',
    eyebrow: 'ACCESSORIES EDIT',
    title: 'COMPLETE THE LOOK',
    text: 'Curated pieces. Stronger fits.',
    cta: 'Explore the Edit',
    toast: 'Exploring accessories edit...',
  },
};

export const CATALOG_PAGES = {
  men: MEN_PAGE,
  women: WOMEN_PAGE,
  'new-arrivals': NEW_ARRIVALS_PAGE,
  accessories: ACCESSORIES_PAGE,
} as const;
