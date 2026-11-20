# NEXTO responsive and imagery audit

Date: 24 October 2026

## Shared component changes

- `ProductCard` and `WishlistCard`: quick-add buttons rise from below the image on hover and keyboard focus. On narrow viewports and touch devices the button remains visible because touchscreens do not have reliable hover states.
- Product cards use two columns on mobile and compact mobile typography/spacing. Tablet and desktop columns expand at Tailwind breakpoints.
- `StoreImage`: a shared image wrapper adds responsive Unsplash `srcSet` candidates, async decoding, lazy loading by default, and a local SVG fallback when a remote image fails. Hero images explicitly opt into eager loading.
- Product imagery: product catalogue entries, best sellers, suggested products, category tiles, lookbook, account/order seed data, and page hero imagery have been diversified to reduce repeated photos and better match the item or page context.
- Announcement bar wraps on small screens so the dismiss button and return link do not force horizontal overflow.
- Product detail thumbnails form a horizontally scrollable strip on phones and a vertical strip on larger screens; product prices and breadcrumbs can wrap.
- Catalog, search, wishlist, and suggested-product grids use two columns on mobile, then expand at tablet/desktop breakpoints.
- Catalog hero actions, cart heading, support search, FAQ heading/actions, order invoice header, and 404 buttons can wrap on narrow screens.
- Order summary sticky positioning is limited to desktop; the floating AI Stylist button has smaller mobile offsets.
- Reduced-motion settings remain respected for card transitions and the New Arrivals rail.

## Page-by-page responsive review

| Page / route family | Mobile | Tablet | Desktop | Main responsive considerations |
|---|---|---|---|---|
| Home | Reviewed | Reviewed | Reviewed | Stacked hero/category tiles, two-column Quiet Favourites, touch-visible quick add, continuous arrivals rail |
| Men / Women | Reviewed | Reviewed | Reviewed | Wrapping hero actions, scrollable category tabs, two-column mobile catalogue, filter sidebar stacking |
| New Arrivals | Reviewed | Reviewed | Reviewed | Responsive product rail, touch-visible quick add, two-column catalogue |
| Accessories | Reviewed | Reviewed | Reviewed | Category tiles wrap to two columns; filters and catalogue stack |
| Product detail | Reviewed | Reviewed | Reviewed | One-column phone layout, scrollable thumbnails, wrapping price/breadcrumb, responsive purchase controls |
| Collections | Reviewed | Reviewed | Reviewed | Two-column collection tiles, stacked feature panel, responsive lookbook/outfit grids |
| Cart | Reviewed | Reviewed | Reviewed | Stacked cart lines, wrapping heading, non-sticky mobile order summary |
| Wishlist | Reviewed | Reviewed | Reviewed | Two-column product cards, wrapping sort controls, stacked filters |
| Search | Reviewed | Reviewed | Reviewed | Two-column result cards and wrapped query heading |
| Login | Reviewed | Reviewed | Reviewed | Stacked editorial/form panels until large breakpoint; responsive perks and form fields |
| Account | Reviewed | Reviewed | Reviewed | Stacked profile/navigation, breakable email/order references, responsive order rows |
| Order confirmation | Reviewed | Reviewed | Reviewed | Two-column mobile metadata, wrapping invoice header and item details, stacked summary panels |
| Support | Reviewed | Reviewed | Reviewed | Flexible search form, two-column quick links, stacked FAQ/contact panels, responsive topic cards |
| About | Reviewed | Reviewed | Reviewed | Stacked introduction/statistics, responsive philosophy cards and timeline |
| Not found | Reviewed | Reviewed | Reviewed | Heading wraps and action buttons can wrap at narrow widths |
| Shared header/footer/overlays | Reviewed | Reviewed | Reviewed | Mobile menu/search row, wrapped announcement, two-column footer, responsive AI Stylist drawer/button |

## Validation performed in this environment

- `npm run typecheck`: **passed**.
- Added `src/tests/productCard.test.tsx` to verify the quick-add control is present and calls the add-to-cart callback; the suite could not execute in this environment due the native dependency issue below.
- `npm run lint`: **passed with zero errors and zero warnings** after moving the social-platform helper out of the React component module.
- Tailwind CLI CSS generation: **passed**; custom quick-add transform and hover/focus states are present in generated CSS.
- Relative import audit: **passed**, 322 relative imports checked and zero missing paths found.
- TypeScript/JSX source count reviewed: 120 files, including the new quick-add component test.
- Remote image load failures are handled by `public/images/fashion-fallback.svg`.

## Environment limitations

The complete Vitest suite and Vite production build could not run here because the available `node_modules` snapshot contains Windows-native optional binaries (`@esbuild/win32-x64`) and is missing the Linux Rollup native package (`@rollup/rollup-linux-x64-gnu`). Network DNS access to the npm registry was unavailable, so those platform-specific dependencies could not be installed. This is an environment/dependency issue rather than a TypeScript or lint failure. The final ZIP excludes `node_modules` so the package manager can install the correct binaries on the user's operating system.

A full real-device/browser visual certification was not possible in this run. Before deployment, run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`, then manually verify at 320px, 375px, 390px, 768px, 1024px, and 1440px. Confirm remote Unsplash images load in the deployment environment; if a URL fails, the local NEXTO fallback image will display.
