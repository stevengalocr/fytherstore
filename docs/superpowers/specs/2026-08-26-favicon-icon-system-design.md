# Fyther Favicon and Icon System Design

**Date:** 2026-08-26
**Status:** Approved direction

## Objective

Create a complete, production-ready browser and installable icon system that remains recognizable from a 16 px tab icon through a 512 px PWA icon. The system must preserve Fyther's approved neon identity without forcing the full `FYTHER STORE` wordmark into unreadable sizes.

## Adaptive Identity

The icon family uses two coordinated marks derived from the approved Fyther lettering:

- **16 and 32 px:** a single `F` monogram in cyan with a small pink accent. The silhouette must remain clear at native size and must not depend on a wide glow.
- **48 through 180 px:** the compact word `FYTHER`, centered without `STORE`.
- **192 and 512 px:** the same compact `FYTHER` wordmark on the Fyther night background, with installable and maskable variants.

All lettering must preserve the approved brand shapes. Generated or processed assets must not invent new letterforms.

## Visual Tokens

- Background: `#050608` (`--color-night`).
- Primary mark: `#6eeff2` (`--color-cyan`).
- Accent: `#f06ccb` (`--color-pink`).
- The smallest icons use crisp outlines and restrained glow so the mark does not blur at 16 px.
- Standard icons keep at least 12.5% clear space on every edge.
- The maskable 512 px icon keeps all essential lettering inside the central 66% safe area.
- Apple, PWA, and browser favicon assets use an opaque night background to remain consistent across light and dark browser chrome.

## Asset Set

- `app/favicon.ico`: multi-size ICO containing 16, 32, and 48 px frames.
- `app/icon.png`: 512 px standard application icon used by Next.js metadata conventions.
- `app/apple-icon.png`: 180 px opaque Apple Touch Icon.
- `public/icons/favicon-16.png`: explicit 16 px monogram.
- `public/icons/favicon-32.png`: explicit 32 px monogram.
- `public/icons/fyther-192.png`: standard PWA icon.
- `public/icons/fyther-512.png`: standard high-resolution PWA icon.
- `public/icons/fyther-maskable-512.png`: maskable icon with expanded safe area.

The 192 and 512 px files use PNG because installable manifests require broadly supported raster assets. Source artwork remains lossless during resizing.

## Next.js Integration

- Add `app/manifest.ts` with name `Fyther Store`, short name `Fyther`, Spanish description, `/` start URL, standalone display, and the night color for both background and browser theme.
- Rely on the App Router metadata-file conventions for `favicon.ico`, `icon.png`, `apple-icon.png`, and `manifest.ts`; do not duplicate these declarations in the root metadata object.
- Export a `Viewport` configuration from `app/layout.tsx` with `themeColor: '#050608'` and `colorScheme: 'dark'`.
- Preserve the existing Open Graph campaign image; this task does not change social sharing artwork.
- Use Next.js metadata-file hashing for cache invalidation and keep manifest icon filenames stable.

## Accessibility and Platform Behavior

- Icon artwork contains no embedded accessibility text; document title and manifest provide the accessible product name.
- The `FYTHER` lettering must be visually legible at every size where it is used.
- The favicon must remain identifiable in both light and dark browser tab bars.
- Maskable cropping must not remove any letter.
- Apple home-screen rendering must not introduce transparent or white corners.

## Verification

- Validate PNG and ICO dimensions, formats, alpha behavior, and file-size budgets.
- Test root metadata and manifest fields in Vitest.
- Build the Next.js application and confirm generated `<link rel>` entries for favicon, icon, Apple Touch Icon, and manifest.
- Verify `/favicon.ico`, `/icon.png`, `/apple-icon.png`, `/manifest.webmanifest`, and all manifest icon URLs return `200`.
- Capture and inspect the icons at native 16, 32, 180, 192, and 512 px.
- Install or emulate the manifest icon crop to verify the maskable safe area.
- Run lint, typecheck, unit tests, production build, dead-code analysis, dependency audit, and relevant Playwright checks.

## Acceptance Criteria

- Browser tabs show a crisp Fyther `F` rather than a generic deployment icon.
- Apple and installable icons display `FYTHER` with the approved cyan/pink/night palette.
- Every declared icon route exists and uses the intended dimensions.
- The manifest is valid and references both standard and maskable 512 px assets.
- Browser metadata contains no duplicate or conflicting icon declarations.
- Existing commerce, BilBildin integration, page design, and Open Graph presentation remain unchanged.
