# Fyther Store V0.2 Neon Door

## North Star

Fyther is a warm, modern and curated nocturnal sports boutique: energetic without feeling aggressive, cyberpunk, gamer-like or nightclub-like. Night carries the experience while Neon Cyan and Neon Pink create a restrained directional current. V0.1 Bone, Obsidian, Volt, green `#B8FF3D` and the `MOVE DIFFERENT.` direction are retired. Use the supplied official logo assets; the Fyther wordmark is never recreated as text.

## Audience

The store serves primarily women and the friends, relatives and acquaintances who exercise or want active clothing for everyday movement. It is mobile first and designed for shoppers arriving through trusted personal recommendations. Spanish copy is inviting, concise and centered on movement, feeling well, sharing and personal rhythm rather than commands or elite-performance language.

## Palette

- Night `#050608`: dominant page and media surface, approximately 65-75% of the experience.
- Night Raised `#0B0D10`: solid elevated surfaces and operational panels.
- Neon Cyan `#6EEFF2`: identity, focus, primary actions and directional current.
- Neon Pink `#F06CCB`: small signs, endpoints, selected accents and emotional punctuation.
- Ice `#EAFBFB`: primary text on Night.
- Mist `#A8B4B8`: secondary text and restrained metadata.
- Warm Stone `#B69C79`: rare contextual warmth where it harmonizes with photography.

Use solid and translucent approved colors, never gradients. Glow belongs only to the real logo, focus feedback and one or two signature moments per viewport; paragraph text never glows.

## Typography

Display typography is Barlow Semi Condensed at weights `500`, `600` or `700`. Body and UI typography is Manrope. Letter spacing is always `0`. Hero headings may use fluid sizing; operational routes use a smaller fixed hierarchy. Keep body lines near `65-75ch`.

## Shape

Build scenes, rails and image-led unframed product presentation instead of generic card grids. Large curved masks are reserved for photography and editorial media. Operational cards and panels use at most `8px` radius; pills are reserved for actions, filters and compact trust chips. Never nest cards. Use stable aspect ratios, grid tracks and responsive bounds to prevent layout shift.

## Motion

Fyther Current has four layers: a logo Neon Wake from about `0.7` opacity over `500-700ms`; a cyan Current Line ending in a pink point; Soft Drift reveals traveling `12-20px` with `40-60ms` stagger; and responsive control feedback lasting about `120-220ms`. Hover scale never exceeds `1.02`.

Prefer CSS transforms and opacity plus `IntersectionObserver` for one-time reveals. Do not animate layout dimensions or block interaction. Gate hover effects behind hover-capable pointers. Under `prefers-reduced-motion`, remove current, drift and camera movement while retaining opacity or color feedback under `150ms`.

## Commerce Truth

BilBildin is the sole source of truth for products, categories, variants, prices, availability, payment methods, checkout, orders and tracking. Never invent demo inventory, prices, stock, reviews, shipping promises or order states. Fyther owns only brand, narrative, interface and presentation, and customer-facing errors never expose BilBildin configuration details.

## Responsive Rules

Design mobile first with touch targets of at least `44px`, no horizontal page overflow and no overlap between text, controls, media or adjacent sections. Preserve explicit aspect ratios and responsive constraints. Visually verify at `390px` mobile, `768px` tablet and `1440px` desktop; inspect media crops, wrapping, navigation, forms, loading and empty states at each target.

## Quality Gates

Maintain WCAG AA contrast, visible Cyan focus against Night, keyboard operation, accurate Spanish image alternatives and hidden decorative media. Use `next/image` with accurate sizes, eagerly load only the hero poster, lazy-load later imagery, avoid new animation dependencies and keep runtime/hydration consoles clean. Unit, type, lint and route checks must preserve honest empty/error commerce states and all existing customer flows; visual checks must cover responsive and reduced-motion modes.
