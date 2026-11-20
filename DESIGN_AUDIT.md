# NEXTO Warm Luxury UI Audit

## Design system

The storefront has been moved from the original near-black streetwear palette to the warm minimalist palette requested for NEXTO.

| Token | Value | Use |
|---|---|---|
| Almond cream | `#F9F6F0` | Global page canvas and navigation |
| Warm surface | `#FFFCF7` | Cards, drawers, form surfaces |
| Stone / structure | `#7E7C77` | Borders, dividers, captions |
| Espresso | `#2E2D2B` | Main copy and headings |
| Secondary copy | `#66645F` | Descriptions and supporting copy |
| Eucalyptus | `#6B7B6E` | Focus rings, active states, icons |
| Accessible deep sage | `#526457` | Primary buttons and active controls |
| Deep-sage hover | `#445549` | CTA hover state |
| Warm neutral | `#F0EBE2` | Secondary panels, input backgrounds |

Cormorant Garamond is used for editorial headings; Plus Jakarta Sans is the base UI family. Product names and controls remain sans-serif where that improves scanability.

## Page-by-page pass

- **Global shell:** replaced the dark canvas with almond cream, aligned selection/focus colors, added reduced-motion handling, and applied the global type system.
- **Announcement + header:** added a dismissible delivery/returns announcement with a labeled close control, made navigation consistently sticky/frosted, recolored active navigation, and aligned search, account, wishlist, and cart controls with the palette.
- **Home:** changed the hero messaging to a calmer editorial direction, added a continuously sliding New Arrivals product rail (not the deprecated `<marquee>` element), preserved the Quiet Favourites grid, refined category tiles, and used React Icons for trust features. The rail pauses on hover/focus and switches to a manual horizontal rail for reduced-motion users.
- **Catalog / Men / Women / Accessories / New Arrivals:** migrated old dark surfaces and gray text, updated filters and range controls to sage, converted size chips to pills, refined sorting and pagination states, and retained existing catalog/filter behavior.
- **Product detail:** updated product metadata, color and size states, product gallery framing, wishlist interaction, accordion surfaces, and trust indicators.
- **Collections:** refined the featured collection panel, lookbook tiles, promo banners, labels, and card borders.
- **Cart:** updated the hero, line-item surfaces, quantity controls, order summary, discount entry, and checkout CTA.
- **Wishlist:** updated the hero, filters, sorting controls, product cards, active heart styling, and add-to-bag actions.
- **Search:** aligned the result heading, metadata, empty states, and result cards with the new typography and neutral surfaces.
- **Login:** rebuilt the layout around a refined editorial panel, semantic Lucide icons, labeled rounded fields, password visibility toggle, better spacing, and responsive two-column perks. Google/Apple and password reset now clearly state they are not connected instead of falsely signing the user in or claiming a reset was sent.
- **Account:** restructured the dashboard with consistent Lucide icons, rounded-2xl surfaces, readable type hierarchy, soft icon wells, consistent status pills, clearer member navigation, and responsive spacing.
- **Order confirmation:** aligned status indicators, tracking steps, summary cards, shipping/payment panels, and the image-backed editorial panel; unconnected invoice/address actions no longer claim a file was downloaded or an address was edited.
- **Support:** updated the hero/search form, FAQ accordions, support cards, image-backed topic tiles, replaced emoji icons with Lucide icons, made quick links search and scroll to relevant FAQs, and clarified the unconnected live-chat placeholder. Return-policy copy now consistently states 7 days.
- **About:** updated the hero, stats, brand-pillar cards, image-backed philosophy panels, and timeline surfaces.
- **Not found / error states / AI stylist:** aligned typography, buttons, overlay, and surface colors to the shared system; AI Stylist controls and product-detail wishlist/review icons use consistent vector icons.
- **Shared components:** revised `Button`, `ProductCard`, `WishlistCard`, `HeroBanner`, `PromoBanner`, `SectionHeading`, `TileGrid`, `CatalogSidebar`, `CatalogToolbar`, `Pagination`, `FormField`, `AccordionItem`, `TrustPoints`, `Footer`, and search/announcement controls.

## Accessibility and implementation checks

- Focus-visible states use the eucalyptus accent.
- The announcement can be dismissed with a keyboard-accessible, screen-reader-labeled close button.
- New-arrivals duplication is decorative and non-interactive, preventing duplicate keyboard stops. Reduced-motion users receive a manually scrollable rail instead of auto-motion.
- Primary CTA text uses deeper sage (`#526457`) instead of the lighter accent so white text reaches stronger contrast.
- Below-the-fold product and editorial images use lazy loading where appropriate; product image frames keep stable aspect ratios.
- Motion respects `prefers-reduced-motion`.
- Product wishlist hearts use outline/filled React Icons and a restrained pop animation.
- Account/About page landmarks were corrected to avoid nested `<main>` landmarks inside the layout's main region.

## Validation

- `npm run typecheck`: **passed**.
- `npm run lint`: **passed with zero errors and zero warnings** after the social-platform helper was moved to a non-component module.
- Tailwind CLI CSS generation: **passed**.
- Relative import-path audit: **passed**, 322 relative imports checked with zero missing paths.
- Responsive and imagery details are documented in [`RESPONSIVE_AUDIT.md`](./RESPONSIVE_AUDIT.md).
- `npm test` and `npm run build` could not complete in this environment because the available dependency snapshot has Windows-native esbuild binaries and lacks the Linux Rollup native package. npm registry DNS was unavailable, preventing repair here. The final project ZIP excludes `node_modules`; install dependencies on the target machine with `npm ci` before running the full checks.

Before deployment, run `npm ci`, then `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Also perform browser checks at 320px, 375px, 390px, 768px, 1024px, and 1440px.

## Scope note

This pass focuses on the frontend theme, page styling, component consistency, accessibility, and visual hierarchy. It does not claim that demo checkout, newsletter submission, stock, or order-tracking flows are connected to a live commerce backend; those require backend/API integration and end-to-end verification.
