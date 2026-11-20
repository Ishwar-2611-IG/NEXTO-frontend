---
name: ui-ux-pro-max
description: Apply the UI/UX Pro Max design workflow to NEXTO storefront UI, including page structure, visual systems, interactions, accessibility, responsive behavior, and final quality checks.
---

# UI/UX Pro Max — NEXTO project adapter

This project-level skill adapter follows the workflow and priorities of the upstream open-source UI/UX Pro Max skill by Next Level Builder. It keeps NEXTO's warm, minimalist, premium-fashion direction consistent instead of creating a second design system.

Upstream repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
Upstream license: MIT. See `LICENSE-UI-UX-PRO-MAX.txt` in the project root for the upstream license text.

## When to apply

Use this workflow whenever changing a page, component, layout, typography, color, animation, form, icon, responsive behavior, or user interaction. Inspect the existing React + TypeScript + Vite + Tailwind stack before implementation. Preserve business logic and routing unless a confirmed defect requires a change.

## Required workflow

1. Read `design-system/nexto/MASTER.md` and the page/component code before editing.
2. Reuse the existing semantic color, typography, spacing, radius, shadow, and focus tokens. Avoid adding a competing palette or random hard-coded styles.
3. Prefer real, consistent SVG icon components (Lucide or the existing icon library); do not use emoji as functional UI icons.
4. Design mobile-first. Verify narrow phones (~320–375px), tablet (~768px), laptop (~1024px), and wide desktop (~1440px). Prevent horizontal overflow and let headings, labels, prices, and buttons wrap safely.
5. Make controls keyboard accessible with visible focus, clear accessible names, semantic elements, and practical touch targets (aim for at least 44px for primary controls).
6. Forms need persistent labels, field-level validation, correct autocomplete/input types, clear error messaging, and honest status feedback. Do not pretend an unconnected provider/payment/backend action succeeded.
7. Use motion only when it communicates state or adds editorial polish. Pause continuous motion on hover/focus and honor `prefers-reduced-motion`.
8. Preserve image aspect ratios, lazy-load below-the-fold media, and avoid layout shifts.
9. Check every route affected by the change, not only the homepage. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` when the environment supports them. Record unavailable checks honestly.
10. Before delivery, inspect changed files for dead imports, broken links, misleading placeholder actions, contrast issues, sharp inconsistent corners, text clipping, and regressions in cart/wishlist/auth/routing.

## NEXTO visual direction

- Brand: quiet streetwear / warm minimalist luxury; editorial but easy to shop.
- Canvas: almond `#F9F6F0`; primary surface: warm ivory `#FFFCF7`; secondary surface: `#F0EBE2`.
- Main text: espresso `#2E2D2B`; secondary text: stone `#7E7C77` (avoid small low-contrast text); accent: eucalyptus `#6B7B6E`; primary CTA: deeper sage `#526457` with white text; hover CTA: `#445549`.
- Typography: Cormorant Garamond for editorial headings; Plus Jakarta Sans for UI/body text. Use readable line-height and reserve tiny uppercase tracking for metadata only.
- Shape: rounded-xl/2xl for panels and major cards; rounded-full for pills and primary CTA; consistent small radii for fields. Avoid sharp, boxy UI unless an intentional editorial element requires it.
- Icons: consistent stroke-weight, size, alignment, and semantic meaning. Never rely on color alone to communicate order status.
- Interaction: visible focus, hover/focus feedback, comfortable spacing, reduced-motion support, clear empty/loading/error/success states.

## Scope note

This adapter is a project-specific workflow file, not the full upstream searchable style/palette database. To install the full upstream skill data and scripts for Codex CLI in a network-enabled environment, run:

```bash
npx ui-ux-pro-max-cli init --ai codex
```

Then reconcile any generated skill files with this project adapter rather than overwriting NEXTO's design system.
