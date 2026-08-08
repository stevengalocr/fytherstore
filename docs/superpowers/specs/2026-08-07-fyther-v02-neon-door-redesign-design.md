# Fyther Store V0.2 Neon Door Redesign

## Status

Approved design specification for the complete Fyther Store visual refactor.

This document supersedes the visual direction in `2026-08-08-fyther-store-v1-design.md`. The existing live-only commerce contract remains valid and must not be weakened.

## Objective

Refactor the complete storefront into a distinctive nocturnal sports boutique for a primarily feminine audience that exercises, socializes and shops through trusted personal networks. The experience must feel warm, modern, curated and energetic without becoming aggressive, cyberpunk, gamer-like or nightclub-like.

Fyther owns brand, narrative, interface and presentation. BilBildin remains the only source of truth for products, variants, prices, availability, payment methods, checkout, orders and tracking.

## Source Precedence

When sources conflict, use this order:

1. Fyther Identity V0.2 and Web V2 Notion specifications.
2. The approved Neon Door visual companion decisions from this design session.
3. The live-only BilBildin commerce contract already implemented in the repository.
4. Existing code patterns where they do not conflict with the sources above.

The old Bone, Obsidian and Volt visual system, green `#B8FF3D`, `MOVE DIFFERENT.` hero and dominant rectangular card grids are retired.

## Audience And Voice

### Audience

- Women and their friends, relatives and acquaintances who exercise or want active clothing for everyday movement.
- Mobile-first shoppers who need confidence, clarity and a comfortable purchasing flow.
- People who may discover the store through a personal recommendation rather than a large marketplace.

### Brand Character

Warm, active, curated, confident and companionable.

### Writing Rules

- Use inviting Spanish and short sentences.
- Speak about movement, feeling well, sharing and personal rhythm.
- Avoid commands, intimidation, elite-performance language and English slogans when a natural Spanish phrase is clearer.
- Never expose technical configuration, endpoints, credentials or internal BilBildin terminology in customer-facing errors.
- Never describe editorial assets as purchasable inventory.

Primary hero copy:

- Eyebrow: `PARA MOVERTE, COMPARTIR Y SENTIRTE BIEN`
- H1: `Muévete a tu manera.`
- Body: `Una selección de ropa activa para entrenar, caminar o disfrutar el día con las personas que te impulsan.`
- Primary action: `Ver la colección`
- Secondary action: `Conocer Fyther`

## Scope

Apply the design system to every current customer-facing route:

- `/`
- `/catalogo`
- `/catalogo/[slug]`
- `/carrito`
- `/checkout`
- `/confirmacion/[orderId]`
- `/tracking/[orderId]`
- `/envios-cambios`
- `/privacidad`
- `/terminos`
- Global loading, error and not-found states

The home is the most expressive route. Motion and visual complexity decrease as purchase intent increases, so catalog, product, cart and checkout prioritize speed and clarity.

## Visual System

### Palette

- Night `#050608`: dominant page and media surface, approximately 65-75% of the experience.
- Neon Cyan `#6EEFF2`: identity, focus, primary actions and directional current.
- Neon Pink `#F06CCB`: small signs, endpoints, selected accents and emotional punctuation.
- Ice `#EAFBFB`: primary text on Night.
- Mist `#A8B4B8`: secondary text and restrained metadata.
- Warm Stone `#B69C79`: rare contextual warmth only where it harmonizes with photography.

Glow is reserved for the real logo, focus feedback and one or two signature moments per viewport. Paragraph text never glows. Surfaces use solid and translucent colors rather than decorative gradients.

### Typography

- Display: Barlow Semi Condensed or the closest available Barlow condensed variant, with moderate weights to keep the tone athletic but friendly.
- Body and UI: Manrope, retained for clarity and warmth.
- Hero headings use fluid sizing; operational pages use a smaller fixed hierarchy.
- Letter spacing remains `0`.
- Body lines are capped near 65-75 characters.

### Shape And Composition

- Build scenes and rails, not a collection of generic cards.
- Use full-bleed media, asymmetry, overlap and generous negative space on the home.
- Use large curved masks only for photography and editorial media. Operational cards and panels remain at 8px radius or less.
- Use pill controls for actions, filters and compact trust chips.
- Do not nest cards.
- Product presentation is image-led and unframed where possible.
- Stable aspect ratios and grid tracks prevent layout shift.

### Real Assets

Use the supplied assets from the project `public` directory:

- `home.jpeg`: hero poster and boutique atmosphere.
- `video-presentacion.mp4`: hero motion when device preferences permit.
- `logo1.png` and `logo2.png`: official logo variants. Do not recreate the wordmark in text.
- `modelo1.png` and `modelo2.png`: editorial movement scenes only.
- `ropa.png`: editorial still life only, never a product record.

Preserve original files. Optimized or cropped derivatives may be added for performance and header fit, but originals must remain unchanged.

## Global Navigation

The header is a subtle floating capsule centered near the top of the viewport.

- Maximum width: approximately 1180-1280px.
- Night background at 70-85% opacity with restrained blur.
- Subtle Ice/Cyan border, no constant strong glow.
- Official logo centered on desktop.
- Desktop links: `Descubrir`, `Colección`, `Nosotras` or the final approved equivalent.
- Mobile: menu icon, official logo and cart icon/count.
- Cart and menu targets are at least 44px.
- Mobile menu supports Escape, focus visibility, body scroll lock and route-close behavior.

The footer is a minimal Final Glow scene with official logo, collection action, contact links and legal links.

## Home Experience

### Scene 01: Neon Door

- 92-100svh full-bleed `home.jpeg` poster with optional supplied video.
- Solid translucent scrims maintain text contrast without a decorative gradient.
- Approved warm hero copy and two pill actions.
- Video pauses outside the viewport and is not mounted for reduced-motion or data-saver users.

### Scene 02: Fyther Current Rail

- Calm phrase: `MOVERSE · SENTIRSE BIEN · COMPARTIR · FYTHER`.
- Cyan current with a restrained pink endpoint.
- Scroll-local animation, no aggressive infinite marquee and no scroll hijacking.

### Scene 03: Shop By Movement

- Horizontal, touch-friendly media rail.
- Categories come only from real BilBildin products.
- Varied media proportions and editorial overlap replace uniform rectangular category cards.
- The scene is omitted or adapted when no real categories exist.

### Scene 04: Featured Selection

- Prefer one featured live product plus two secondary live products.
- Fall back to the first live products when none are marked featured.
- If inventory is empty or unconfigured, render the approved editorial empty scene instead of fabricated products.

### Scene 05: Why Fyther

Present the three verified value statements:

- `Calidad seleccionada`
- `Originalidad verificable`
- `Lista para moverte`

Desktop may arrange these around editorial media or the official mark. Mobile stacks them vertically and connects them with a restrained cyan line.

### Scene 06: Editorial Media

- Near-full-bleed use of `modelo1.png` or `modelo2.png` inside a curved media frame.
- Small translucent Night copy island with minimal blur.
- Copy emphasizes confidence, personal rhythm and companionship.
- Avoid a rigid 60/40 split.

### Scene 07: Trust And FAQ

- Compact trust chips for shipping, changes and support.
- Accessible FAQ accordion with visible focus, clear summaries and calm microcopy.
- No unsupported operational claims.

### Scene 08: Final Glow

- Night field, official logo with controlled glow, final collection action and minimal footer.
- This is the final high-impact brand moment.

## Commerce Routes

### Catalog

- Compact search, category filter and sort controls.
- Categories derive from live products only.
- Results update with a polite live region.
- Product media leads; names, categories, prices and availability remain immediately scannable.
- No-results filtering state explains how to recover without implying the store is empty.

### Product Detail

- Large stable gallery, direct back navigation and restrained supporting surfaces.
- Variant selection exposes real options and stock.
- Disabled and sold-out states are unmistakable.
- Add-to-cart feedback is immediate and accessible.

### Cart

- Direct quantity editing and removal.
- Clear totals and next action.
- Friendly empty state with a collection action.
- No decorative motion that delays edits.

### Checkout

- Calm single flow with delivery fields and a persistent order summary on desktop.
- Inline validation uses helpful Spanish, preserves entered values and focuses the first invalid field when appropriate.
- Payment methods and shipping information are rendered only from live configuration.
- Submissions protect against repeat activation and provide a visible pending state.

### Confirmation And Tracking

- Use the shared order presentation and verified live order data.
- Explain current status, next steps and available contact route.
- Preserve tenant-scoped order reads.

### Legal And Recovery Pages

- Use a quiet reading layout with the same typography and palette.
- Error and not-found pages offer one clear recovery action.
- Do not expose stack traces, environment names or integration details.

## Commerce States

### Live With Products

Render mapped BilBildin products and only their live names, images, prices, variants and stock.

### Live Empty

Show the approved editorial message: `La colección vuelve pronto.` Keep brand storytelling and routes available without rendering product-shaped placeholders.

### Unconfigured

Show a customer-safe preparation message. Technical configuration guidance belongs in documentation and server logs, not the storefront.

### Fetch Error

Show `No pudimos cargar la colección.`, an `Intentar de nuevo` action and a route back to the home. The state uses `role="alert"` where appropriate.

### Checkout Error

Keep customer input, describe the recoverable issue and avoid duplicate orders. Server-side price and stock validation remains authoritative.

## Motion System: Fyther Current

Motion is a brand system with four layers:

1. **Neon Wake**: the official logo enters from approximately 0.7 opacity to full presence over 500-700ms. No flashing.
2. **Current Line**: a cyan line progresses through selected home scenes and ends in a pink point. It is local to content and never controls scrolling.
3. **Soft Drift**: editorial media and products reveal with 12-20px of travel and 40-60ms stagger. Hover scale never exceeds 1.02.
4. **Responsive Feedback**: buttons, filters, menu, cart and forms respond in approximately 120-220ms, with exits faster than entrances.

Implementation rules:

- Prefer CSS transitions and keyframes for predetermined motion.
- Use `IntersectionObserver` for one-time scene entry.
- Animate only transform, opacity and carefully bounded filter effects.
- Do not animate width, height, padding, margin, top or left.
- Do not block interaction while an entrance animation is running.
- Hover effects are gated behind hover-capable pointers.
- `prefers-reduced-motion` removes current, drift and camera movement while retaining fast opacity or color feedback under 150ms.

## Technical Architecture

- Keep `lib/commerce/*`, server-only credential boundaries and tenant filters behaviorally unchanged unless a verified integration bug is discovered.
- Recompose `app/page.tsx` from focused scene components.
- Refactor `components/site/*` around Neon Door, Fyther Current, category rail, editorial selection, Why Fyther, trust/FAQ and Final Glow responsibilities.
- Refactor `Header`, `Footer`, `ProductCard` and commerce state presentation to consume shared visual tokens.
- Expand the existing `RevealInit` pattern rather than adding a heavy animation dependency.
- Keep server components for data loading and client components only where interaction requires them.
- Maintain the current cart provider and checkout actions.
- Centralize palette, spacing, type, focus, motion and surface tokens in the global stylesheet. Route-specific class groups may remain in the same stylesheet to match the repository pattern.
- Add the four supplied PNG assets to the tracked worktree.

## Accessibility And Responsive Behavior

- Maintain WCAG AA text contrast.
- Every icon-only control has an accessible name and tooltip where its meaning is not familiar.
- Focus is always visible against Night surfaces.
- Controls are keyboard operable and touch targets are at least 44px.
- Decorative media is hidden from assistive technology; meaningful product and editorial images use accurate Spanish alternatives.
- Accordions preserve native semantics or equivalent keyboard behavior.
- No horizontal page overflow at mobile, tablet or desktop widths.
- Text never overlaps controls, media or adjacent sections.
- Fixed-format elements use explicit aspect ratios and responsive bounds.

Target visual verification widths include at minimum:

- 390px mobile
- 768px tablet
- 1440px desktop

## Performance

- Use `next/image` with accurate `sizes` for raster media.
- Load only the hero poster eagerly.
- Lazy-load below-the-fold imagery.
- Mount and play hero video only when motion and data preferences allow it.
- Pause video outside the viewport.
- Avoid new animation dependencies.
- Validate that animations remain smooth and do not cause layout shift.
- Keep browser console free of runtime and hydration errors.

## Testing Strategy

### Unit And Component Tests

- Update hero assertions to the approved Spanish copy and actions.
- Verify the official logo and accessible navigation.
- Verify live-empty, unconfigured and error commerce messages without product articles.
- Keep product availability, image fallback, cart stock limits, checkout validation, tenant order filters and mapping tests.
- Add focused tests for any new interactive menu, retry or accordion behavior.

### End-To-End Tests

- Home renders the new hero, all applicable scenes and no simulated commercial content.
- Catalog unconfigured/empty state remains honest.
- Header navigation and mobile menu work.
- Cart and checkout retain functional flows under available test fixtures.
- Legal pages, not-found and global errors remain recoverable.
- No Next.js error dialog, browser console error or horizontal overflow.
- Reduced-motion mode suppresses signature movement.

### Visual Verification

- Capture desktop, tablet and mobile screenshots.
- Inspect hero framing, official logo rendering, media crops, header behavior, product grids, checkout layout and footer.
- Check text wrapping, overlap, focus states, loading states and empty states.
- Confirm that animation does not shift stable layout dimensions.

## Acceptance Criteria

- The complete route set uses the approved Neon Door visual system and warm Spanish voice.
- The supplied logos, editorial images and video are integrated according to their approved roles.
- BilBildin remains the exclusive source of commercial truth.
- No demo mode, fictional product, fictional price, fictional stock or simulated order is introduced.
- The storefront remains intentional when live products are empty, unavailable or unconfigured.
- Fyther Current is present, purposeful, performant and reduced-motion safe.
- Mobile, tablet and desktop layouts are polished and free of incoherent overlap or horizontal overflow.
- Accessibility checks, lint, TypeScript, unit tests, Playwright tests, production build and dependency audit pass.
- The finished implementation is committed and pushed to the configured GitHub repository only after all verification succeeds.

## Out Of Scope

- Changing BilBildin database schemas or business ownership.
- Creating or seeding products, prices, variants, inventory or orders.
- Adding customer accounts or authentication.
- Replacing the checkout payment architecture.
- Publishing production credentials.
- Recreating the Fyther logo as text, SVG or a new AI-generated mark.
