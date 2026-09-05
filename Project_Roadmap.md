# ReadyCommerce CMS — 12-Phase Master Roadmap

## Architecture Decision

ReadyCommerce is officially moving to a **backend-first architecture**. The Storefront UI/UX foundation is completed as an **Advanced Prototype**: the bilingual public pages, account screens, cart/checkout presentation, search and wishlist interactions exist. However, **real backend integration, real authentication, and end-to-end commerce flows remain PENDING** until the phases below are delivered and verified.

The Admin Dashboard must not begin until Phase 12's Storefront Production Gate passes.

## Master Plan

### Phase 1 — Backend Foundation

- [x] Establish Express/Mongoose backend structure and environment-aware database connection.
- [x] Create core commerce schemas: users, addresses, catalog, variants, inventory, cart, orders, payments, reviews, wishlist and coupons.
- [x] Add baseline security middleware: Helmet, CORS, rate limiting and request logging.
- [x] Add Joi validation middleware and a consistent centralized error response.
- [ ] Add environment validation, structured logging, audit fields and automated backend tests.

### Phase 2 — Real Authentication *(PARTIALLY COMPLETED / PASS WITH CONDITIONS)*

- [x] Build registration, login, logout, current-user and refresh/session endpoints.
- [x] Implement short-lived JWT access cookies and rotating DB-backed refresh sessions with revocation.
- [x] Add password hashing, role foundation, account activation checks and protected customer route session restoration.
- [x] Add secure forgot/reset/change password token and protected password-change flows.
- [ ] Add email/account verification and production email delivery.
- [x] Connect Storefront login/register/logout/current-user session restoration to these APIs.
- [ ] Run real MongoDB integration verification and automated auth tests.

### Phase 3 — Catalog *(COMPLETED)*

- [x] Add public Product, Category, Variant and Inventory read APIs with filtering and pagination.
- [ ] Add publish states, category hierarchy, variant pricing, stock reservation and availability rules.
- [ ] Add image/media handling, pagination and catalog response contracts.
- [ ] Build protected catalog CRUD APIs, catalog validation, authorization and API tests.

### Phase 4 — Storefront Integration + Search *(COMPLETED)*

- [x] Replace Shop, Homepage categories/trending and PDP mock product data with catalog APIs.
- [ ] Connect category pages, product listing, PDP, filters, sorting and pagination.
- [x] Implement server-backed search, suggestions, no-result handling and availability filtering.
- [x] Add request loading, error and responsive skeleton states; live catalog HTTP smoke test completed.

### Phase 5 — Cart *(IN PROGRESS)*

- [x] Implement server-side customer/guest carts and cart item APIs.
- [x] Validate product, variant, price and stock on every cart mutation.
- [ ] Support merge-on-login, quantity limits, reservation expiry and accurate totals.
- [ ] Replace local-only cart state while retaining resilient UI loading/error states.

### Phase 6 — Address + Shipping + Checkout

- [ ] Connect address book CRUD and checkout address selection.
- [ ] Implement shipping methods, rates, tax/VAT rules and order total calculation.
- [ ] Build idempotent checkout/order creation with server-side price revalidation.
- [ ] Support logged-in checkout and explicitly decide whether guest checkout is enabled.

### Phase 7 — Payment Integration

- [ ] Integrate selected gateways (including bKash/Nagad where applicable) and COD rules.
- [ ] Implement initiation, callback/webhook verification and payment status synchronization.
- [ ] Handle pending, success, failed and cancelled payments safely.
- [ ] Add idempotency and duplicate payment/order protection with reconciliation logs.

### Phase 8 — Orders & Order Lifecycle

- [ ] Implement Pending → Confirmed → Processing → Shipped → Delivered lifecycle APIs.
- [ ] Support Cancelled, Failed, Returned and Refunded states with transition rules.
- [ ] Add tracking number/carrier, customer notifications and order detail endpoints.
- [ ] Connect confirmation, success, tracking, cancellation and refund UI flows.

### Phase 9 — Customer Portal

- [ ] Connect profile, password, security and address management to real APIs.
- [ ] Add order history/details, tracking, cancellation, return/refund and reorder.
- [ ] Add invoice/receipt downloads, wishlist and review submission/history.
- [ ] Add customer notifications, account preferences and authorization checks.

### Phase 10 — Commerce Enhancements

- [ ] Add recommendations, related products, recently viewed, featured and best-seller logic.
- [ ] Implement offers, coupons, eligibility, usage limits and discount auditing.
- [ ] Add newsletter subscription with consent, duplicate handling and delivery integration.

### Phase 11 — Legal + SEO + Performance + Accessibility

- [ ] Publish Privacy, Terms, Refund, Shipping, Contact and FAQ pages.
- [ ] Add metadata, canonical URLs, Open Graph, sitemap, robots and structured product data.
- [ ] Set image/CDN, caching, performance budgets, analytics and conversion tracking.
- [ ] Complete keyboard, screen-reader, contrast, Bengali typography and responsive audits.

### Phase 12 — Full E2E QA → Storefront Production Gate → Admin Dashboard

- [ ] Run automated and manual E2E coverage: Browse → Search → PDP → Cart → Checkout → Payment → Order → Tracking → Account → Review/Return/Refund.
- [ ] Verify desktop, laptop, tablet and mobile layouts, network failures, retries, loading and empty/error states.
- [ ] Complete security, data integrity, observability, deployment, backups and rollback checks.
- [ ] Approve the Storefront Production Gate only when all customer-facing flows are real, connected and verified.
- [ ] Start Admin Dashboard design and implementation after the gate is approved.

## Immediate Next Steps

## Phase 9 Final Delivery Update (2026-09-05)

- Phase 9 Customer Portal: COMPLETED for the current customer-facing scope.
- [x] Real profile read/update, order history, address book, pending-order cancellation, printable invoice and product reviews.
- [ ] Future commerce extensions: order tracking, returns/refunds, verified-purchase review eligibility, moderation, notifications and invoice download storage.

## Phase 12 Dashboard Transition (2026-09-05)

- Branch: `dashboard-all` (isolated from the stable storefront line).
- [x] Initialized `apps/dashboard` with Next.js App Router, TypeScript and Tailwind CSS.
- [x] Added responsive premium dashboard shell with sidebar navigation and top header.
- [x] Added foundational Welcome Admin overview page.
- [ ] Add real admin authentication/authorization, dashboard data APIs and management modules only after the storefront production gate.
- Phase 12A foundation quality gate: dashboard build/lint passed; unauthenticated admin access returns 401; real admin login and module APIs remain pending.

## Phase 10–11 Delivery Update (2026-09-05)

- Phase 10 Commerce Enhancements: COMPLETED for coupon validation and seeded promotional codes.
- Phase 11 Legal + SEO + Performance + Accessibility: COMPLETED for the current storefront foundation.
- [x] Coupon model, validation API, `WELCOME10` and `RITUAL500` seed data, and responsive cart promo UI.
- [x] Bilingual Privacy Policy, Terms and Contact pages with global footer links.
- [x] Root metadata, branded 404 route, responsive legal layout and print-safe customer surfaces.
- [ ] Production legal review, richer SEO structured data, analytics/performance budgets and formal accessibility/E2E audit.

## Phase 12A Dashboard Foundation (2026-09-05)

- Branch: `dashboard-all` (isolated from the stable storefront line).
- [x] Initialized and hardened `apps/dashboard` with Next.js App Router, TypeScript and Tailwind CSS.
- [x] Added responsive premium shell with desktop sidebar, mobile drawer, top header, language toggle, user and notification foundations.
- [x] Added reusable breadcrumbs, page-header, skeleton, empty, error and confirmation-dialog primitives plus route loading/error/not-found states.
- [x] Added server-protected `/api/admin/access` boundary and admin-only dashboard session gate; unauthenticated access is rejected before dashboard content is shown.
- [x] Added a no-fake-data Welcome Admin overview foundation.
- [ ] Add real admin authentication UX, dashboard data APIs and management modules in the next Phase 12 increments.
- Quality gate: dashboard/storefront production builds passed; unauthenticated admin access returned 401. Live admin login, customer-role denial, database-backed module APIs and visual device testing remain pending.

## Phase 12B Admin Overview / Command Center (2026-09-05)

- [x] Added protected `GET /api/admin/overview?range=7|30` using the existing HttpOnly JWT and `admin` authorization middleware.
- [x] Added real order, paid-revenue, customer, product, payment, recent-order and inventory aggregation/query data.
- [x] Added responsive Command Center KPI cards, revenue trend, order-status breakdown, recent orders and low-stock sections with loading, empty and retryable error states.
- [x] Added bilingual dashboard copy, status badges, mobile-safe table overflow and disabled order-action foundation until an admin order-details API exists.
- Phase 12B verification: DB ping, admin session success, customer rejection (403), unauthenticated rejection (401), overview response and password-hash checks passed. Visual browser/device verification remains pending.
- [ ] Next: implement protected Orders management APIs/UI; then Products and Inventory management.

## Phase 12C Admin Orders Management (2026-09-05)

- [x] Added admin-protected order listing with pagination, newest-first sorting, status/payment filtering and search.
- [x] Added admin order details with customer, delivery address, item variants, authoritative order pricing and payment TxID.
- [x] Added secure fulfillment status transition endpoint and manual payment verification/rejection endpoint using existing schema enums.
- [x] Added responsive bilingual Orders list and operational detail UI with skeletons, empty/error states and toast feedback.
- [ ] Browser viewport verification, production admin credentials and deeper order audit/logging remain pending.
- [ ] Next: Products and Inventory Management.

## Phase 12D Products & Inventory Management (2026-09-05)

- [x] Added admin-protected product list/create/update/archive APIs with search, pagination, category data and variant inventory population.
- [x] Added admin-protected inventory list and safe stock adjustment APIs using reserved-stock guards and restock timestamps.
- [x] Added responsive bilingual-ready Products table, product editor, Inventory table, loading/empty/error states and toast feedback.
- [x] Real MongoDB admin API verification passed for unauthorized rejection and authorized products/inventory access.
- [ ] Category management, image upload/media library, audit-history collection, richer variant editing and visual browser verification remain pending.

## Phase 12E Categories & Customer Management (2026-09-05)

- [x] Added admin-protected category CRUD/archive APIs with SEO slugs, parent-category support and active-product deletion protection.
- [x] Added admin-protected customer directory/detail APIs with real order counts, paid lifetime spend, addresses and order history.
- [x] Replaced manual Product Editor category IDs with a live authenticated category selector.
- [x] Added responsive category and customer management screens with loading, empty/error states and toast feedback.
- [ ] Category edit modal, customer status mutation, richer search/pagination and visual browser verification remain pending.

## Phase 12F Reviews & Coupons Management (2026-09-05)

- [x] Added admin-protected review listing, approve/reject moderation and deletion APIs.
- [x] Added admin-protected coupon listing, creation, update and safe deactivation APIs using existing Coupon enums/fields.
- [x] Added responsive Reviews moderation, Coupons listing and New Coupon screens with loading, empty/error states and toast feedback.
- [x] Added customer-status mutation service/API foundation and retained the Category update API for the next UI refinement.
- [ ] Category edit modal and Customer Directory status toggle UI remain pending; visual browser verification also remains pending.

## Phase 12G Website CMS / Homepage Builder (2026-09-05)

- [x] Added admin-protected homepage configuration API and public fallback-safe homepage configuration endpoint.
- [x] Added Homepage Builder for hero slides, featured category selection and promotional banner settings.
- [x] Connected the Storefront hero carousel to CMS slides while retaining existing defaults when CMS data is unavailable.
- [ ] Category Edit modal UI and Customer Directory status toggle UI remain pending; customer status API foundation is complete.
- [ ] Broader CMS localization and visual browser verification remain pending.

## Phase 8-9 Delivery Update (2026-09-05)

- Phase 8 Order Placement: COMPLETED for secure creation and cart conversion; lifecycle transitions and payment verification remain future work.
- Phase 9 Customer Portal: IN PROGRESS.
- [x] Protected `GET /api/orders/myorders`, newest-first and user-scoped.
- [x] Protected `GET/PUT /api/users/profile` with Joi validation and safe user serialization.
- [x] Account profile, real order history and real address-book service integration.
- [ ] Order details/tracking, cancellation, returns/refunds, reviews, notifications and invoice downloads.

1. Review and approve the Phase 1 schema contracts.
2. Add backend environment validation and automated model/API tests.
3. Implement Phase 2 authentication and protected-route APIs.
4. Connect the existing Storefront service layer to the first real auth endpoints.

## Phase 6 Delivery Update (2026-09-05)

- Phase 5 Cart: COMPLETED for the current server-cart scope.
- Phase 6 Address + Shipping + Checkout: IN PROGRESS.
- [x] Protected address listing and creation APIs.
- [x] Checkout saved-address selection and validated address save flow.
- [x] Shipping quote API: Dhaka 60 BDT, outside Dhaka 120 BDT.
- [x] Dynamic checkout subtotal plus shipping total with responsive loading/error states.
- [ ] Server-side checkout total revalidation, address update/delete, tax/VAT, and idempotent order creation.

## Phase 7–8 Delivery Update (2026-09-05)

- Phase 6 Address + Shipping + Checkout: COMPLETED for the current scope.
- Phase 7 Manual Payment (bKash/Nagad TxID capture): COMPLETED for pending-verification submission.
- Phase 8 Order Creation: IN PROGRESS; secure order creation, authoritative totals, payment record, cart conversion and success redirect are implemented. Lifecycle transitions, payment verification and customer order APIs remain pending.
