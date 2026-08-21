# Branded Hero And Mobile Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the recognizable Fyther F plaque to the approved static hero and deliver a shorter, clearer, fully accessible mobile footer.

**Architecture:** Keep the hero as a responsive server-rendered `<picture>` and replace only its optimized bitmap sources. Refine the existing semantic footer and token-based CSS without client state or duplicated markup, then enforce the new responsive and asset contracts with Vitest and Playwright.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, Next Image, Sharp, Vitest, Testing Library, Playwright, Vercel.

---

### Task 1: Branded Hero Assets

**Files:**
- Create: `public/editorial/hero-open-suitcase-branded.webp`
- Create: `public/editorial/hero-open-suitcase-branded-mobile.webp`
- Test: `tests/assets.test.ts`
- Test: `tests/components/hero-media.test.tsx`

- [ ] **Step 1: Strengthen the asset contracts**

Require the desktop image to remain 1920x1080, the mobile image to remain 1200x1500, both to be WebP, and both to stay within the existing performance budget.

- [ ] **Step 2: Run the focused tests and record the expected failure**

Run: `npm test -- --run tests/assets.test.ts tests/components/hero-media.test.tsx`

Expected: FAIL until the new branded asset paths or fingerprints are present.

- [ ] **Step 3: Create and optimize the two edited images**

Use the current hero as the edit target and the supplied suitcase screenshot as the plaque reference. Preserve composition, lighting, apparel, suitcase geometry, and safe text areas; integrate the leather F plaque in the quilted lid. Export exact WebP dimensions through Sharp.

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- --run tests/assets.test.ts tests/components/hero-media.test.tsx`

Expected: PASS.

### Task 2: Mobile Footer Information Architecture

**Files:**
- Modify: `components/Footer.tsx`
- Modify: `app/globals.css`
- Test: `tests/components/header.test.tsx`

- [ ] **Step 1: Write failing footer contracts**

Require the compact primary wordmark, semantic footer navigation, a dedicated contact action, a 2x2 mobile trust grid, 48px mobile links, safe email wrapping, and a compact mobile footer rhythm.

- [ ] **Step 2: Run the footer test and verify failure**

Run: `npm test -- --run tests/components/header.test.tsx`

Expected: FAIL against the square alternate mark and current mobile spacing.

- [ ] **Step 3: Implement the semantic footer refinement**

Use `BrandMark` primary in the footer, wrap grouped routes in `<nav>`, identify the email block with `footer-contact`, and keep every current route and guarantee. Refine desktop and mobile CSS using existing spacing, color, radius, and motion tokens.

- [ ] **Step 4: Run the footer tests**

Run: `npm test -- --run tests/components/header.test.tsx`

Expected: PASS.

### Task 3: Responsive Browser Contract

**Files:**
- Modify: `e2e/store.spec.ts`

- [ ] **Step 1: Add failing mobile footer checks**

At 390px and the existing mobile project, assert no horizontal overflow, all footer links are at least 48px high, grouped links stay inside the viewport, the wordmark uses the compact source, and footer height stays within the agreed compact budget.

- [ ] **Step 2: Run the focused browser scenario and verify failure**

Run: `npx playwright test e2e/store.spec.ts --project=mobile-configured --grep "footer"`

Expected: FAIL before the CSS refinement is complete.

- [ ] **Step 3: Complete responsive CSS adjustments**

Tune image ratio, gaps, trust columns, contact wrapping, and bottom-row alignment for 320px, 390px, 768px, and desktop without changing the information architecture.

- [ ] **Step 4: Re-run the focused browser scenario**

Run: `npx playwright test e2e/store.spec.ts --project=mobile-configured --grep "footer"`

Expected: PASS with no browser errors.

### Task 4: Dead-Code And Release Verification

**Files:**
- Modify only files proven dead by reference and compiler scans.

- [ ] **Step 1: Scan code and assets**

Run `npx knip`, `rg` for removed hero-video identifiers, and `git grep` for touched asset consumers. Classify findings before deleting anything.

- [ ] **Step 2: Remove confirmed dead artifacts**

Delete only unreferenced code or assets within the hero/footer surface; preserve generated asset scripts and operational commerce code.

- [ ] **Step 3: Run release verification**

Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --audit-level=high`, and `npm run test:e2e`.

Expected: all commands exit 0; project-specific Playwright skips are allowed.

- [ ] **Step 4: Visually verify and publish**

Capture desktop, tablet, 390px, and 320px screenshots; inspect hero plaque, footer hierarchy, touch targets, wrapping, and overflow. Fast-forward the verified commit into `main`, push, wait for Vercel `Ready`, and confirm the production HTML references the new hero sources.
