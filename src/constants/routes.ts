export const ROUTES = {
  home: '/',
  about: '/about',
  men: '/men',
  women: '/women',
  accessories: '/accessories',
  newArrivals: '/new-arrivals',
  collections: '/collections',
  login: '/login',
  account: '/account',
  cart: '/cart',
  wishlist: '/wishlist',
  orderConfirmation: '/order-confirmation',
  support: '/support',
  search: '/search',
  product: (id: number | string) => `/product/${id}`,
} as const;

export const MAIN_NAV = [
  { label: 'Men', to: ROUTES.men },
  { label: 'Women', to: ROUTES.women },
  { label: 'Collections', to: ROUTES.collections },
  { label: 'New Arrivals', to: ROUTES.newArrivals },
  { label: 'Accessories', to: ROUTES.accessories },
  { label: 'About', to: ROUTES.about },
] as const;
