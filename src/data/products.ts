import { IMG, unsplash } from '../constants/images';
import type { Product } from '../types';

/** Men's collection. */
export const MENS_PRODUCTS: Product[] = [
  { id: 201, name: 'Oversized Graphic Hoodie', price: 2999, category: 'Hoodies', badge: 'BEST SELLER', img: unsplash(IMG.editorialStreetwear, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 202, name: 'Boxy Fit Essential Tee', price: 1799, category: 'T-Shirts', img: unsplash(IMG.fashionBasics, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 203, name: 'Washed Denim Jacket', price: 3499, category: 'Jackets', img: unsplash(IMG.denimDetail, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 204, name: 'Relaxed Cargo Pants', price: 2999, category: 'Bottoms', img: unsplash(IMG.mensStreetwear, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 205, name: 'Abstract Print Shirt', price: 2499, category: 'Shirts', badge: 'NEW', img: unsplash(IMG.casualShirt, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 206, name: 'Classic Oversized Hoodie', price: 2799, category: 'Hoodies', img: unsplash(IMG.croppedHoodie, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 207, name: 'Utility Denim Jeans', price: 2999, category: 'Bottoms', img: unsplash(IMG.minimalistWardrobe, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 208, name: 'Core Polo Tee', price: 1999, category: 'T-Shirts', img: unsplash(IMG.tee, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 209, name: 'Varsity Jacket', price: 4999, category: 'Jackets', img: unsplash(IMG.streetwearModel, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 210, name: 'Waffle Knit Sweater', price: 2499, category: 'Hoodies', img: unsplash(IMG.clothingRack, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 211, name: 'Parachute Pants', price: 2799, category: 'Bottoms', badge: 'NEW', img: unsplash(IMG.streetwearLook, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { id: 212, name: 'Graphic Oversized Tee', price: 1999, category: 'T-Shirts', img: unsplash(IMG.croppedTop, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
];

/** Women's collection. */
export const WOMENS_PRODUCTS: Product[] = [
  { id: 301, name: 'Oversized Logo Hoodie', price: 2999, category: 'Hoodies', badge: 'BEST SELLER', img: unsplash(IMG.womensStreetwear, 800), colors: ['#0f0f0f', '#d4a373', '#f472b6'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 302, name: 'Cropped Essential Tee', price: 1799, category: 'T-Shirts', img: unsplash(IMG.croppedTop, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4', '#d4a373'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 303, name: 'Varsity Jacket', price: 4999, category: 'Jackets', img: unsplash(IMG.womensStyle, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 304, name: 'Parachute Cargo Pants', price: 2999, category: 'Bottoms', img: unsplash(IMG.fashionPortrait, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 305, name: 'Ribbed Crop Top', price: 1499, category: 'T-Shirts', badge: 'NEW', img: unsplash(IMG.fashionBasics, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 306, name: 'Essential Hoodie', price: 2799, category: 'Hoodies', img: unsplash(IMG.greyHoodie, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 307, name: 'Wide Leg Denim Jeans', price: 3499, category: 'Bottoms', img: unsplash(IMG.denimJacket, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 308, name: 'Bodycon Dress', price: 2499, category: 'Dresses', img: unsplash(IMG.dress, 800), colors: ['#0f0f0f', '#d4a373', '#f472b6'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 309, name: 'Oversized Shirt', price: 2299, category: 'Shirts', img: unsplash(IMG.casualShirt, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 310, name: 'Cutout Sleeve Top', price: 1999, category: 'T-Shirts', img: unsplash(IMG.womensStreetwear, 800), colors: ['#0f0f0f', '#71717a', '#52525b'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 311, name: 'Relaxed Fit Sweatpants', price: 2499, category: 'Bottoms', img: unsplash(IMG.womensStyle, 800), colors: ['#0f0f0f', '#71717a', '#71717a', '#d4a373'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 312, name: 'Cropped Denim Jacket', price: 3299, category: 'Jackets', badge: 'NEW', img: unsplash(IMG.denimDetail, 800), colors: ['#0f0f0f', '#71717a', '#d4a373', '#f472b6'], sizes: ['XS', 'S', 'M', 'L', 'XL'] },
];

/** Accessories. */
export const ACCESSORIES_PRODUCTS: Product[] = [
  { id: 401, name: 'NEXTO Logo Cap', price: 1299, category: 'Caps', img: unsplash(IMG.cap, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'] },
  { id: 402, name: 'Essential Dad Cap', price: 1299, category: 'Caps', img: unsplash(IMG.clothingRack, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
  { id: 403, name: 'Urban Frame Sunglasses', price: 1999, category: 'Sunglasses', img: unsplash(IMG.sunglasses, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
  { id: 404, name: 'Sport Shield Sunglasses', price: 2499, category: 'Sunglasses', img: unsplash(IMG.fashionPortrait, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'] },
  { id: 405, name: 'Utility Crossbody Bag', price: 2499, category: 'Bags', img: unsplash(IMG.bag, 800), colors: ['#0f0f0f', '#71717a'] },
  { id: 406, name: 'Street Backpack', price: 3999, category: 'Bags', img: unsplash(IMG.apparelEditorial, 800), colors: ['#0f0f0f', '#71717a'] },
  { id: 407, name: 'Chunky Chain Necklace', price: 1499, category: 'Jewellery', img: unsplash(IMG.jewellery, 800), colors: ['#0f0f0f', '#71717a'] },
  { id: 408, name: 'Signature Ring Set', price: 999, category: 'Jewellery', img: unsplash(IMG.minimalistWardrobe, 800), colors: ['#0f0f0f', '#71717a'] },
  { id: 409, name: 'Street Runner Sneakers', price: 4999, category: 'Footwear', img: unsplash(IMG.footwearEditorial, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
  { id: 410, name: 'Cloud Slides', price: 1999, category: 'Footwear', img: unsplash(IMG.sneakers, 800), colors: ['#0f0f0f', '#71717a'] },
  { id: 411, name: 'Crew Socks (3 Pack)', price: 799, category: 'Socks', img: unsplash(IMG.socks, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'] },
  { id: 412, name: 'Classic Belt', price: 1299, category: 'Belts', img: unsplash(IMG.clothingRack, 800), colors: ['#0f0f0f', '#71717a'] },
];

/** New arrivals drop. */
export const NEW_ARRIVALS_PRODUCTS: Product[] = [
  { id: 501, name: 'Orbit Graphic Hoodie', price: 2999, category: 'Hoodies', img: unsplash(IMG.editorialStreetwear, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
  { id: 502, name: 'Essential Crop Tee', price: 1799, category: 'T-Shirts', img: unsplash(IMG.fashionBasics, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'] },
  { id: 503, name: 'Parachute Cargo Pants', price: 2999, category: 'Pants', img: unsplash(IMG.mensStreetwear, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
  { id: 504, name: 'Street Runner Sneakers', price: 4999, category: 'Footwear', img: unsplash(IMG.footwearEditorial, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'] },
  { id: 505, name: 'Varsity Street Jacket', price: 4999, category: 'Jackets', img: unsplash(IMG.streetwearModel, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
  { id: 506, name: 'Textured Oversized Tee', price: 1999, category: 'T-Shirts', img: unsplash(IMG.croppedTop, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'] },
  { id: 507, name: 'Ribbed Crop Top', price: 1499, category: 'T-Shirts', img: unsplash(IMG.womensStreetwear, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'] },
  { id: 508, name: 'Minimal Logo Hoodie', price: 2799, category: 'Hoodies', img: unsplash(IMG.croppedHoodie, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
  { id: 509, name: 'Utility Crossbody Bag', price: 2499, category: 'Accessories', img: unsplash(IMG.apparelEditorial, 800), colors: ['#0f0f0f', '#71717a'] },
  { id: 510, name: 'NEXTO Logo Cap', price: 1299, category: 'Accessories', img: unsplash(IMG.cap, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'] },
  { id: 511, name: 'Urban Frame Sunglasses', price: 1999, category: 'Accessories', img: unsplash(IMG.sunglasses, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
  { id: 512, name: 'Relaxed Fit Denim Jeans', price: 3499, category: 'Pants', img: unsplash(IMG.denimDetail, 800), colors: ['#0f0f0f', '#71717a', '#d4a373'] },
];

/** Items the demo wishlist starts with. */
export const INITIAL_WISHLIST: Product[] = [
  { id: 1, name: 'Oversized Logo Hoodie', price: 2999, category: 'Hoodies', img: unsplash(IMG.editorialStreetwear, 800), colors: ['#0f0f0f', '#71717a', '#f5f5f4'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 2, name: 'Essential Crop Tee', price: 1799, category: 'T-Shirts', img: unsplash(IMG.fashionBasics, 800), colors: ['#0f0f0f', '#f5f5f4', '#d4d4d8'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 3, name: 'Parachute Cargo Pants', price: 2999, category: 'Pants', img: unsplash(IMG.mensStreetwear, 800), colors: ['#0f0f0f', '#52525b', '#3f6212'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 4, name: 'Street Runner Sneakers', price: 4999, category: 'Sneakers', img: unsplash(IMG.sneakers, 800), colors: ['#e4e4e7', '#0f0f0f'], sizes: [7, 8, 9, 10] },
  { id: 5, name: 'Urban Frame Sunglasses', price: 1999, category: 'Accessories', img: unsplash(IMG.sunglasses, 800), colors: ['#0f0f0f', '#d4a373'], sizes: ['One Size'] },
];

/** Home page "Best Sellers" rail (ids renumbered from 1–6 to avoid clashing with wishlist ids). */
export const BEST_SELLERS: Product[] = [
  { id: 601, name: 'Oversized Graphic Hoodie', price: 2999, category: 'Hoodies', badge: 'NEW', img: unsplash(IMG.editorialStreetwear, 600) },
  { id: 602, name: 'Boxy Fit Essential Tee', price: 1799, category: 'T-Shirts', img: unsplash(IMG.fashionBasics, 600) },
  { id: 603, name: 'Cargo Utility Pants', price: 2999, category: 'Bottoms', img: unsplash(IMG.mensStreetwear, 600) },
  { id: 604, name: 'Washed Denim Jacket', price: 3499, category: 'Jackets', badge: 'BEST SELLER', img: unsplash(IMG.denimDetail, 600) },
  { id: 605, name: 'Cropped Street Hoodie', price: 2499, category: 'Hoodies', img: unsplash(IMG.croppedHoodie, 600) },
  { id: 606, name: 'Street Runner Sneakers', price: 4999, category: 'Footwear', img: unsplash(IMG.footwearEditorial, 600) },
];

/** "You might also like" rail used on the cart and order-confirmation pages. */
export const SUGGESTED_PRODUCTS: Product[] = [
  { id: 701, name: 'Street Runner Sneakers', price: 4999, category: 'Footwear', img: unsplash(IMG.footwearEditorial, 600) },
  { id: 702, name: 'Minimal Logo Cap', price: 1299, category: 'Caps', img: unsplash(IMG.cap, 600) },
  { id: 703, name: 'Urban Frame Sunglasses', price: 1999, category: 'Sunglasses', img: unsplash(IMG.sunglasses, 600) },
  { id: 704, name: 'Chunky Chain Necklace', price: 1499, category: 'Jewellery', img: unsplash(IMG.jewellery, 600) },
  { id: 705, name: 'Utility Crossbody Bag', price: 2499, category: 'Bags', img: unsplash(IMG.bag, 600) },
];

/** Every product that can be opened at /product/:productId. */
export const ALL_PRODUCTS: Product[] = [
  ...MENS_PRODUCTS,
  ...WOMENS_PRODUCTS,
  ...ACCESSORIES_PRODUCTS,
  ...NEW_ARRIVALS_PRODUCTS,
  ...INITIAL_WISHLIST,
  ...BEST_SELLERS,
  ...SUGGESTED_PRODUCTS,
];

export const getProductById = (id: number): Product | undefined =>
  ALL_PRODUCTS.find((p) => p.id === id);
