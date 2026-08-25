# Fyther Footer Background and Sales Rail Design

**Date:** 2026-08-25  
**Status:** Approved for implementation

## Objective

Reduce the visual and scroll cost of the final home-page sequence while improving conversion. Replace the oversized human-led editorial section with a compact animated sales rail, and turn the existing product campaign image into the footer's full background. Principal imagery must continue to show products only, without people or faces.

## Scope

- Home-page editorial section currently titled "Tu rutina tambien vive en los detalles."
- Global footer presentation on desktop, tablet, and mobile.
- Responsive behavior, motion preferences, keyboard interaction, and visual regression coverage for both areas.
- No changes to catalog data, Supabase, BilBildin, cart, checkout, payments, or order flows.

## Sales Rail

The existing tall `EditorialStory` image section will become a compact commercial band placed before the FAQ/footer sequence.

### Content

- Primary message: **Tu proximo favorito ya esta aqui.**
- Supporting value: **Prendas y accesorios originales, con SINPE y opcion de apartado.**
- Primary action: **Ver la coleccion**, linking to `/catalogo`.

### Layout and Motion

- Desktop uses a 112 px minimum height and must stay below 144 px at the 1280 px reference viewport.
- Mobile uses a 144 px minimum height and content-driven growth; at 390 px wide it must stay below 192 px while allowing the message and CTA to wrap without crowding.
- A restrained horizontal ticker repeats short value phrases such as "Productos originales", "SINPE", "Apartados" and "Correos de Costa Rica".
- Motion is slow and continuous, pauses on hover or keyboard focus, and must never block the CTA.
- With `prefers-reduced-motion: reduce`, the ticker becomes static and remains fully readable.
- The CTA keeps a minimum 44 px touch target and visible focus state.

## Footer Background

The existing `/editorial/footer-product-campaign-v3.webp` remains the campaign asset but changes from a separate media column to an optimized full-footer background using `next/image` with `fill`.

### Composition

- Product arrangement remains visible as the footer's first visual signal.
- Layered dark scrims create readable contrast without placing the footer content inside a floating card.
- Cyan rules and indicators retain Fyther's identity; pink is reserved for small conversion accents.
- Footer brand, trust points, store links, information links, contact email, copyright, and country remain available.
- Desktop places the information in a constrained content zone while preserving a clear portion of the campaign image.
- Mobile uses a stronger lower scrim and a single-column information flow. Links retain 44 px touch targets and the email wraps without overflow.

## Component Boundaries

- Replace `EditorialStory` with a focused `SalesRail` component responsible only for commercial messaging, ticker content, and catalog CTA.
- Refactor `Footer` markup so the background media is decorative and the semantic navigation remains independent.
- Keep content in component-level constants only when reuse improves readability; no new data layer is needed.
- Remove obsolete editorial image imports, classes, and unused animation hooks after replacement.

## Accessibility and Resilience

- The decorative footer background uses empty alternative text and does not duplicate surrounding content for screen readers.
- The sales band has an accessible heading and a real link, not a click handler on a container.
- Text contrast targets WCAG AA over every responsive crop.
- Keyboard focus remains visible across the CTA, footer navigation, and contact link.
- Motion respects reduced-motion settings and never causes horizontal page overflow.
- The layout remains useful if the background image is delayed or unavailable because the footer has a solid dark fallback.

## Verification

- Update unit tests for the sales rail copy, CTA destination, footer navigation, and decorative image semantics.
- Update end-to-end expectations that currently reference the removed editorial section.
- Add responsive visual checks at representative mobile, tablet, and desktop viewports.
- Verify no horizontal overflow, readable contrast, 44 px interactive targets, paused/reduced motion behavior, and stable footer background crop.
- Run lint, typecheck, unit tests, production build, dead-code analysis, and the relevant Playwright suite before integration.

## Acceptance Criteria

- The former editorial section no longer consumes most of a viewport and contains no human imagery.
- The compact band clearly communicates purchase value and links to `/catalogo`.
- The footer campaign image reads as a full background rather than a separate card or column.
- Footer content is legible and easy to use on mobile and desktop.
- No dead `EditorialStory` assets, imports, selectors, or tests remain.
- Existing commerce and BilBildin behavior is unchanged.
