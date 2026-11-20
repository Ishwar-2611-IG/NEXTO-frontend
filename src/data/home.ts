import { ROUTES } from '../constants/routes';
import { IMG, unsplash } from '../constants/images';

export const HOME_CATEGORIES = [
  { title: 'MEN', subtitle: 'Everyday essentials with an edge.', img: unsplash(IMG.mensStreetwear, 800), to: ROUTES.men },
  { title: 'WOMEN', subtitle: 'Street style without limits.', img: unsplash(IMG.womensStyle, 800), to: ROUTES.women },
  { title: 'ACCESSORIES', subtitle: 'The details complete the look.', img: unsplash(IMG.sunglasses, 800), to: ROUTES.accessories },
];

export const TRUST_BADGES = [
  { icon: 'package', title: 'Free Shipping', desc: 'On all orders above ₹999' },
  { icon: 'refresh-cw', title: 'Easy Returns', desc: 'Hassle-free within 7 days' },
  { icon: 'shield-check', title: 'Secure Payments', desc: '100% protected checkout' },
  { icon: 'sparkles', title: 'Premium Quality', desc: 'Built for everyday wear' },
];
