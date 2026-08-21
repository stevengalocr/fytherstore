# Branded Hero And Mobile Footer Design

## Goal

Preserve the approved open-suitcase hero while restoring the Fyther "F" plaque from the original reference, then make the footer substantially easier to scan and operate on mobile without changing the store's information architecture.

## Design Context

- Audience: primarily women in Costa Rica shopping for original athletic clothing and accessories from familiar premium brands.
- Use case: discover the two store categories, understand service guarantees, browse products, track an order, and contact Fyther quickly from a phone.
- Brand tone: warm, feminine, active, close-knit, refined, and calm rather than aggressive.
- Visual direction: nocturnal sports boutique with dark teal, leather, cyan and pink identity accents; rounded editorial framing and restrained movement.

## Hero Asset

The current desktop and mobile compositions remain unchanged: an open dark-teal vintage suitcase inside the boutique, filled with coordinated apparel and accessories. A rectangular warm-brown leather plaque is physically attached to the center of the quilted lid. The plaque carries the stylized white/cyan Fyther "F" with its small star, matching the supplied reference and rendered as part of the photographed scene.

Deliverables are optimized WebP images at 1920x1080 and 1200x1500. The plaque must remain clearly visible beneath the fixed header and must not compete with the lower-left headline. No video, canvas, DOM overlay, or scroll-driven hero behavior returns.

## Footer Experience

Desktop retains the current image/content split. Mobile becomes a compact sequence: editorial image, compact wordmark/tagline, two-by-two service guarantees, two balanced navigation groups, direct email contact, and the legal/location row. Link targets remain at least 48px high on touch screens, text remains at least 14px, and the email wraps safely at 320px.

The alternate square footer mark is replaced with the horizontal wordmark so the brand no longer consumes a large empty square. Existing routes and copy remain truthful: original products, Correos de Costa Rica, Sinpe and layaway, and replies within 24 hours.

## Engineering Boundaries

- Reuse `BrandMark`, `Footer`, `HeroMedia`, Next Image, and existing design tokens.
- Do not add client state, new dependencies, duplicated navigation, or hover-only functionality.
- Update component, asset, CSS, and browser contracts test-first.
- Run dead-code and reference scans; delete only artifacts proven unreferenced.
- Verify lint, TypeScript, unit tests, production build, dependency audit, Playwright desktop/tablet/mobile flows, and the production deployment.

## Success Criteria

1. Both hero sources show the recognizable Fyther F plaque at native dimensions.
2. The hero remains static and responsive, with no video element.
3. At 320-430px, footer content has no horizontal overflow, all links meet the touch target, and the footer is materially shorter than the current implementation.
4. Footer information and routes remain complete and keyboard accessible.
5. No unused function, import, component, or obsolete hero runtime remains in the touched surface.
