# Fyther Store V1 Final Delivery Plan

**Goal:** Ship a complete editorial storefront whose commercial operation is backed exclusively by BilBildin.

## Architecture

1. Validate public and server environment variables without eager Supabase initialization.
2. Return no commercial records when configuration is incomplete.
3. Read visible products and variants from BilBildin with `business_id` isolation.
4. Persist the cart locally using only records selected from the live catalog.
5. Validate business status, products, variants, stock and server prices during checkout.
6. Create tenant-scoped customers, orders, order items, inventory changes and tracking events.
7. Read confirmation and tracking on the server without exposing cross-tenant order existence.

## Delivery Surfaces

- Editorial home and campaign media.
- Searchable and sortable catalog.
- Product detail with variants, stock and quantity controls.
- Persistent cart and configured payment checkout.
- Order confirmation and chronological tracking.
- Privacy, terms, shipping and changes pages.
- Metadata, sitemap, robots, loading, empty and error states.

## Verification

- Unit tests cover configuration, mapping, checkout validation, cart and critical components.
- Playwright checks final unconfigured rendering on desktop and mobile without fictional records.
- Production build proves all routes compile without environment credentials.
- A local live smoke test uses credentials inherited in memory from the ignored `.env.local` file.
- `npm audit` must report zero vulnerabilities before publication.
