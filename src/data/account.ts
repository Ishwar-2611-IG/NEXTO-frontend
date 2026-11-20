import { IMG, unsplash } from '../constants/images';
import { ROUTES } from '../constants/routes';

/** Fallback display details retained for offline preview; signed-in account data comes from the API. */
export const DEMO_USER = {
  firstName: 'Ishwar',
  name: 'Ishwar Gosavi',
  email: 'ishwar.gosavi@example.com',
  avatar: unsplash(IMG.avatar, 200),
};

export const ACCOUNT_MENU = [
  { label: 'Dashboard', icon: 'layout-dashboard', to: ROUTES.account },
  { label: 'Orders', icon: 'package' },
  { label: 'Wishlist', icon: 'heart', to: ROUTES.wishlist },
  { label: 'Addresses', icon: 'map-pin' },
  { label: 'Profile Details', icon: 'user-round' },
  { label: 'Payment Methods', icon: 'credit-card' },
  { label: 'Notifications', icon: 'bell' },
  { label: 'NEXTO Rewards', icon: 'sparkles' },
  { label: 'Settings', icon: 'settings' },
] as const;

export const ACCOUNT_STATS = [
  { title: 'Total Orders', count: '3', action: 'View Orders →' },
  { title: 'Wishlist Items', count: null, action: 'View Wishlist →', to: ROUTES.wishlist },
  { title: 'Saved Addresses', count: '2', action: 'Manage →' },
  { title: 'NEXTO Rewards', count: 'Silver', action: 'View Benefits →' },
] as const;

export const RECENT_ORDERS = [
  { id: 'NX325680', date: '23 Sep 2025', items: '3 Items', price: '₹8,497', status: 'Delivered', statusColor: 'bg-[#6B7B6E]/15 text-[#6B7B6E]', img: unsplash(IMG.editorialStreetwear, 200) },
  { id: 'NX324901', date: '12 Sep 2025', items: '1 Item', price: '₹4,999', status: 'In Transit', statusColor: 'bg-blue-500/20 text-blue-400', img: unsplash(IMG.footwearEditorial, 200) },
  { id: 'NX320478', date: '02 Sep 2025', items: '2 Items', price: '₹2,598', status: 'Cancelled', statusColor: 'bg-red-500/20 text-red-400', img: unsplash(IMG.cap, 200) },
];
