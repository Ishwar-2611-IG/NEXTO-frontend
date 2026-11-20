# NEXTO — Warm Luxury Edition

The UI has been refined around a warm minimalist palette, editorial serif headings, rounded-but-architectural cards, sage conversion controls, and consistent warm surfaces. See [`DESIGN_AUDIT.md`](./DESIGN_AUDIT.md) for the styling audit and [`RESPONSIVE_AUDIT.md`](./RESPONSIVE_AUDIT.md) for the mobile/tablet/desktop and imagery review.

## Project overview

A responsive streetwear storefront refactored from a single 2,900-line `nexto_streetwear_e_commerce.tsx` file into a component-based Vite application.

## Features
- Home, About, Men, Women, Accessories, New Arrivals, Collections, Support pages
- Product detail pages (`/product/:id`) with colour/size selection, responsive gallery and accordion details
- Responsive product imagery with `srcSet` variants and a local fallback image when remote photography fails
- Quick-add buttons that rise into view on hover/focus and remain visible on touch/mobile layouts
- Working **catalogue filters** (category, max price, size, colour), sorting, empty states, tabs and tiles that filter
- **Bag** with guest cart persistence, server cart variants/SKUs, server-validated coupons, inventory-aware checkout and order summary
- **Wishlist** (heart on any card), global **search**, **mobile navigation**
- Backend sign-in / account registration with an HttpOnly refresh cookie, in-memory access token, and protected `/account` page
- **AI Stylist** chat drawer (Gemini) with timeout + cancellation
- Support page: searchable FAQ accordion and persisted backend contact tickets
- Custom 404 page, route-level code splitting, error boundary, accessible toasts

## Stack
React 18 · TypeScript · Vite · React Router 6 · Tailwind CSS 3 · Vitest + Testing Library · ESLint (flat config)

## Getting started
For the complete stack, follow [`../README.md`](../README.md) and [`../docs/INTEGRATION_GUIDE.md`](../docs/INTEGRATION_GUIDE.md). With the API running, start the frontend:
```bash
cp .env.example .env.local
npm ci
npm run dev                  # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit + component tests) |

## Environment variables
| Variable | Description |
| --- | --- |
| `VITE_AI_STYLIST_PROXY_URL` | **Recommended.** Your backend endpoint that forwards Gemini `generateContent` requests and holds the key |
| `VITE_API_BASE_URL` | Defaults to `/api/v1`; Vite proxies API calls to `http://127.0.0.1:5000` in development |

Without a server-side AI proxy, the stylist replies with a clear "not connected" message instead of failing. Client-side provider API keys are deliberately unsupported. The commerce API uses `VITE_API_BASE_URL` (defaults to `/api/v1` and is proxied to localhost:5000 by Vite).

## Folder structure
```
src/
├── app/            App shell, route table, providers (Toast, Auth, Cart, Wishlist)
├── components/
│   ├── common/     Button, HeroBanner, PromoBanner, TileGrid, ProductCard/Grid, AccordionItem, FormField, ErrorBoundary…
│   ├── catalog/    CatalogSidebar, CatalogToolbar, Pagination, FilterGroup
│   └── layout/     Layout, Header (+ mobile menu), Footer, Toast, ScrollToTop
├── features/       account/AddressBookDialog, checkout/CheckoutDialog, product/ProductReviews, auth, cart, support, wishlist
├── pages/          One folder per route; Catalog/ is a single data-driven page used by 4 routes
├── context/        Context objects (no JSX)       hooks/  useCart, useWishlist, useAuth, useToast, useCatalogFilters…
├── data/           Product catalogues, page configs (catalogs.ts), seed data, copy
├── services/       api.ts (auth/session-aware API client), storeApi.ts (backend adapters), aiStylist.ts
├── utils/          format, cart maths, catalogue filtering, validation (all unit-tested)
├── constants/ config/ types/ styles/ tests/
```

## Architecture notes
- **One `CatalogPage`, four routes.** Men/Women/New Arrivals/Accessories were near-identical copies; their differences are now config in `src/data/catalogs.ts`.
- **State** lives in small context providers; pure logic (totals, filters, validation) lives in `utils/` so it can be tested without React.
- **Currency boundary:** the backend stores prices in integer paise; `services/storeApi.ts` converts to INR for display. Order totals and stock are recalculated by the backend.
- **Routing**: real URLs via React Router (the original used a `currentView` variable). Pages are lazy-loaded.
- **Tailwind** is kept as the styling system. `brightness-40/60/85` are registered in `tailwind.config.js` because they are not in Tailwind's default scale.

## Integration boundaries
- Product, authentication, cart, wishlist, coupon, checkout/order, account activity and support-ticket flows use the backend API when configured.
- The local curated product catalogue remains a fallback for offline visual preview. Preview-only products cannot be checked out until corresponding products and variants exist in MongoDB; run the optional backend demo seed for a connected sample catalogue.
- Razorpay online payment requires real test credentials and provider setup. COD can be exercised with local development placeholders.
- Forgot-password and social-login providers are not implemented by the supplied backend and remain explicitly unavailable; the UI must not claim that those flows succeeded.
- The AI Stylist remains a separate optional integration controlled by `VITE_AI_STYLIST_PROXY_URL`; direct client-side provider keys are disabled.
- Some filter controls and marketing counts still reflect the curated UI configuration rather than server pagination; see `../docs/INTEGRATION_GUIDE.md` for API boundaries.

## Deployment
`npm run build` outputs static files to `dist/`. Host on any static host (Netlify, Vercel, Cloudflare Pages, S3+CDN) with an SPA fallback that rewrites unknown paths to `index.html`, e.g. Netlify `_redirects`: `/* /index.html 200`.


## UI/UX Pro Max workflow

This project includes a NEXTO-specific UI/UX Pro Max adapter at `.agents/skills/ui-ux-pro-max/SKILL.md` and the shared design system at `design-system/nexto/MASTER.md`. Read those before changing layouts, typography, colors, icons, responsive behavior, or motion.

The adapter is based on the open-source [UI/UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) and its MIT license is included as `LICENSE-UI-UX-PRO-MAX.txt`. The adapter keeps the project's design rules in the repository; the upstream searchable style/palette database and scripts are not bundled. To install the full upstream skill for Codex CLI in a network-enabled development environment, run:

```bash
npx ui-ux-pro-max-cli init --ai codex
```

Review any generated files before merging them with the NEXTO-specific adapter and design tokens.

## UI quality checks

The intended delivery checks are `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. They require dependencies from `package-lock.json` to be installed first. See `DESIGN_AUDIT.md` for the latest changes and validation notes.
