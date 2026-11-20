# NEXTO — Master Design System

## Product intent
A polished, easy-to-shop streetwear storefront with warm minimalist luxury styling. Editorial presentation should support product discovery, trust, and clear commerce actions—not distract from them.

## Design tokens

| Role | Token | Usage |
|---|---|---|
| Canvas | `#F9F6F0` | Page background |
| Surface | `#FFFCF7` | Cards, forms, panels |
| Surface muted | `#F0EBE2` | Inputs, icon wells, quiet banners |
| Text | `#2E2D2B` | Main copy and headings |
| Text muted | `#7E7C77` | Secondary copy; avoid for tiny text on muted backgrounds |
| Border | `rgb(126 124 119 / 24%)` | Quiet separators and outlines |
| Accent | `#6B7B6E` | Focus, small highlights, selected state |
| Primary action | `#526457` | Filled buttons with white text |
| Action hover | `#445549` | Hover state for filled actions |
| Soft accent surface | `#E8EDE6` | Selected menu items and gentle highlights |

Global CSS variables are defined in `src/styles/globals.css`. Reuse those variables or the matching established Tailwind values; do not introduce a parallel theme.

## Typography
- Editorial display/headings: Cormorant Garamond, weight 500–600, close but readable tracking.
- UI, body, labels, buttons: Plus Jakarta Sans.
- Body copy: aim for 14–16px with line-height around 1.5–1.7. Tiny uppercase tracking is reserved for short metadata, not paragraphs or critical instructions.
- Maintain clear hierarchy: page title → section title → body/description → metadata.

## Layout and shape
- Use a consistent centered `Container` and mobile-first breakpoints.
- Main panels/cards: rounded-xl or rounded-2xl; pill controls: rounded-full; form fields: rounded-xl.
- Use generous breathing room, 16–24px gaps for major sections, and warm subtle shadows rather than hard outlines.
- Product imagery uses consistent aspect ratios and avoids layout shifts.

## Interaction and accessibility
- Use semantic HTML and descriptive accessible names for icon-only controls.
- Keep visible `:focus-visible` styles and ensure all actions work with keyboard input.
- Aim for at least 44px touch targets for primary interactive controls.
- Keep contrast legible; do not rely on color alone for statuses.
- Validate forms beside the relevant field and do not claim remote sign-in, password reset, checkout, or notifications work unless integrated.
- Continuous animation must pause on hover/focus and stop for `prefers-reduced-motion`.
- Provide descriptive alt text for meaningful product images and empty alt text for decorative imagery.

## Page review checklist
- [ ] Home: clear hero CTA, product discovery, new-arrivals rail pause/reduced-motion, no obstructive announcement.
- [ ] Login: consistent icons, visible labels, password visibility control, honest demo-provider behavior, mobile-friendly form.
- [ ] Account: rounded cards, semantic icons, consistent text hierarchy, clear active nav, truthful placeholders.
- [ ] Catalog/product/search/collections: filters, product cards, price labels, empty states, focus and responsive wrapping.
- [ ] Cart/wishlist/order confirmation: quantities and totals remain clear; actions have accurate feedback.
- [ ] Support/about/not-found: typography and links follow the same system.
- [ ] Typecheck, lint, tests, production build, and manual visual route checks are recorded honestly.
