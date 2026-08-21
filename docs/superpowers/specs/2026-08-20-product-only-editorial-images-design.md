# Fyther Product-Only Editorial Images

## Objective

Replace the two principal landing-page photographs with a coherent product-only campaign. The imagery must communicate original, high-quality sportswear and accessories for a primarily female audience without showing faces, people, hands, skin, silhouettes, or mannequins.

## Approved Direction

The selected direction is **Product absolute**. Both scenes use premium editorial product photography with Fyther's existing dark, cyan, pink, and warm-metal palette. The images remain calm and feminine through styling, material detail, lighting, and composition rather than through human models.

## Hero Image

- Preserve the open vintage suitcase concept and the recognizable Fyther F-and-star plaque.
- Increase the visibility and variety of merchandise: leggings, sports bra, technical top, sneakers, gym bag, bottle, resistance bands, towel, cap, and small training accessories.
- Keep the merchandise realistic, carefully arranged, and free of invented third-party logos or unreadable text.
- Reserve dark negative space on the left and lower-left for the existing hero heading, description, and buttons.
- Produce a 1920x1080 desktop source and a separately composed 1200x1500 mobile source. The mobile version must keep the Fyther plaque and the principal products visible behind the interface content.

## Footer Image

- Replace the current photograph of three women with a product-only preparation scene.
- Show folded activewear, an open gym bag, sneakers, bottle, resistance bands, towel, and compact accessories in a premium locker-room or studio setting.
- Use a composition distinct from the suitcase while retaining matching materials, cyan highlights, restrained pink accents, and warm practical light.
- Keep the center and important product edges safe for the current responsive `object-fit: cover` behavior.
- Produce a 1920x1080 source suitable for the existing 16:9 mobile presentation.

## Content Rules

- No faces, people, bodies, hands, skin, reflections of people, silhouettes, or mannequins.
- No third-party brand logos, generated labels, slogans, or watermarks.
- The Fyther F-and-star plaque remains the sole prominent brand mark in the hero.
- Products must read clearly as women's activewear and practical training accessories.

## Integration

- Add new versioned WebP assets rather than silently overwriting the previous campaign files.
- Update `HeroMedia`, `Footer`, and Open Graph metadata to use the new sources.
- Give both images accurate Spanish alternative text describing products rather than people.
- Preserve the current landing-page layout, responsive behavior, interaction model, and BilBildin commerce integration.

## Verification

1. Inspect all generated sources visually at full size for forbidden human elements and malformed products.
2. Validate exact dimensions, WebP format, file-size limits, and absence of alpha.
3. Verify desktop, tablet, 390px, and 320px compositions with Playwright screenshots.
4. Confirm hero copy and controls remain legible and do not cover the Fyther plaque.
5. Confirm the footer crop keeps the principal products visible on desktop and mobile.
6. Run lint, type checking, unit tests, production build, dead-code audit, accessibility/responsive E2E checks, and the dependency security audit.

## Success Criteria

- The landing page contains no visible faces or human forms in its two principal editorial images.
- Both images show a clear, varied mix of sportswear and accessories.
- The hero retains the approved Fyther F-and-star identity.
- Desktop and mobile crops feel intentionally composed rather than mechanically resized.
- Production behavior and commerce functionality remain unchanged.
