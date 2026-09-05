# ReadyCommerce CMS - Project Progress

## Project Vision
ReadyCommerce CMS - A premium, self-hosted commerce platform for lifestyle businesses (Perfume, Cosmetics, Boutiques).

## Project Rules (Permanent)
1. **Design Implementation**: The Stitch MCP designs are purely a REFERENCE, not a strict limit. Must understand the flow and implement an EVEN BETTER, more interactive, and premium UI. Add any missing screens or states to perfect the workflow.
2. **Internationalization**: The entire platform MUST support Dual Languages (English and Bengali).

## Tech Stack
- **Architecture**: Monorepo (npm workspaces)
- **Frontend**: Next.js + Tailwind CSS + next-intl
- **Backend**: Node.js/Express
- **Database**: MongoDB

## Current Status
- Monorepo folder structure created, Git initialized.
- Next.js storefront frontend initialized inside `/apps/storefront` using App Router.
- Backend Express API Engine scaffolded in `/packages/backend`.
- Documentation (README and Roadmap) added.
- **Storefront i18n**: Configured with `next-intl` (English & Bengali).
- **Backend Setup**: Basic backend initialized and MongoDB connection configured.
- **Phase 2 Real Authentication**: Backend-backed registration, login, logout, current-user retrieval, rotating database sessions, short-lived HttpOnly JWT access cookies, explicit CORS, and protected customer-route session restoration are implemented. Email/account verification remains pending.
- **Phase 2 Password Flows**: Added secure forgot-password reset token generation with expiry, reset-password token validation, and protected change-password endpoint; Storefront recovery and profile password forms now use the real API. MongoDB E2E verification is still pending because the local MongoDB endpoint was unavailable during verification.
- **Phase 3 Catalog (In Progress)**: Added public catalog read APIs for products, categories, variants and inventory with category/price/scent/colour filtering, sorting and pagination; prepared an idempotent 8-product premium catalog seeder with Unsplash imagery and stock; connected Homepage categories/trending, Shop and PDP to the backend with loading skeletons, API error states and responsive layouts. Seeding and live API verification remain pending because local MongoDB is currently unreachable.
- **Phase 3 Catalog (Completed)**: MongoDB ping and real database query verification succeeded: 8 active products, 3 categories, 17 active variants and 17 stocked inventory records are present. The seeder now exits deterministically with explicit success/failure codes and clear logs.
- **Phase 4 Storefront Integration (In Progress)**: Connected Navbar suggestions, search results, Homepage catalog sections, Shop, PDP, Wishlist, Cart Drawer and Checkout summaries to real catalog product metadata/API boundaries; removed legacy `catalog.ts` and unused mock `product-grid.tsx`. Storefront lint/build pass; direct backend HTTP smoke testing and retry/caching hardening remain.
- **Phase 4 Storefront Integration (Completed)**: Real backend catalog search is connected to Navbar suggestions and Search Results; Wishlist, Cart Drawer and Checkout now consume real product metadata, and legacy catalog/product-grid mocks were safely removed. Live API smoke test returned catalog `200` and server cart add `201` with database-authoritative variant pricing.
- **Phase 5 Server Cart (In Progress)**: Added authenticated/guest server cart APIs with HttpOnly guest session support, ProductVariant/Inventory stock validation, authoritative pricing, cart totals, quantity update/remove operations, loading/error-ready client service boundary, and disposable guest-cart cleanup verification. Frontend button-level pending indicators and full authenticated E2E flow remain.
- **Customer Authentication UI**: Login and Registration screens completed in English and Bengali with responsive premium layout, accessible form states, and client-side validation.
- **Global Storefront Layout**: Responsive i18n-aware Navbar, language switcher, cart badge state, route-aware shell, and minimalist Footer completed.
- **Public Storefront Homepage**: Premium responsive hero, category discovery cards, and bilingual trending product grid completed.
- **Shop Product Listing**: Responsive product listing with category, price, scent, and colour filters, sorting, empty state, and mobile bottom-sheet filter controls completed.
- **Product Details (PDP)**: Responsive product gallery/carousel, thumbnails, reviews, size selectors, quantity control, accordion details, and sticky mobile Add to Cart completed.
- **Checkout Flow**: Globally accessible cart drawer with line items, quantity controls, subtotal, distraction-free bilingual checkout, manual bKash/Nagad TxID payment, and responsive order summary completed.
- **Order Success**: Minimalist bilingual confirmation page with order ID and continue-shopping CTA completed.
- **Frontend Hardening**: Added service-layer mock API requests with replaceable network boundary, Zod validation, loading/disabled states, react-hot-toast success/error feedback, redirects, and regression-safe responsive interactions.
- **Missing Auth Flows**: Forgot Password, Reset Password, Profile Change Password, and Logout are now connected with mocked async logic and bilingual UX.
- **Customer Portal**: Added the bilingual `/account` portal with responsive sidebar navigation, profile update, change password, logout, mocked order history/details, and address book management.
- **Storefront State & Discovery**: Cart and wishlist now persist through guarded LocalStorage hydration; global debounced search, query-based results, wishlist listing, and product-card/PDP wishlist controls are connected.
- **Order Confirmation Integrity**: Checkout now stores the generated mock order ID and the Success page reads the same ID, removing the previous mismatch.
- **Backend-First Phase 1 Foundation**: Added production-oriented Mongoose schemas for the core commerce domain, secure password hashing hooks, Joi validation utilities, Helmet security headers, rate limiting, Morgan request logging, a resilient MongoDB connection utility, and centralized error handling. Real APIs, authentication, and backend-connected commerce behavior remain pending in the 12-phase roadmap.

## Pending Gap Analysis
- [ ] Real backend/API integration, authentication persistence, sessions, authorization, and secure password reset tokens.
- [ ] Global product search with suggestions, recent searches, filters, and no-results experience.
- [ ] Wishlist/favourites with persistence and wishlist-to-cart flow.
- [ ] Product reviews, ratings, moderation, verified-purchase labels, and review submission.
- [ ] Complete category landing pages and collection filtering experience.
- [ ] Real payment gateway integration and verified bKash/Nagad payment reconciliation.
- [ ] Inventory, stock status, variants, coupons, taxes, shipping rates, and order tracking.
- [ ] Customer order details, cancellation, return/refund requests, and reorder flow.
- [ ] Legal and support pages: Privacy Policy, Terms, Refund Policy, Shipping Policy, Contact Us, FAQ.
- [ ] Newsletter subscription with consent, validation, duplicate handling, and backend delivery.
- [ ] Custom 404, error, loading, offline, and network-retry states for every major route.
- [ ] SEO metadata, Open Graph, sitemap, robots, structured product data, and canonical URLs.
- [ ] Production image/CDN strategy, caching, performance budgets, analytics, and conversion tracking.
- [ ] Full accessibility audit, keyboard navigation, screen-reader semantics, and automated E2E/visual testing.
- [ ] Production deployment, environment secrets, monitoring, logging, backups, and security review.

## UI/UX Status
- Wireframes and complete UI flow available via Google Stitch (Ready for implementation).

## Changelog

* **[2026-09-05]**: **[Dashboard Branch & Foundation]**: Created and switched to the isolated `dashboard-all` branch. Audited the storefront/backend, corrected storefront lint issues and preserved pre-existing auth UI changes. Initialized `apps/dashboard` with a responsive Tailwind App Router shell, sidebar navigation, top header and Welcome Admin page. No dashboard business logic was added.

* **[2026-09-05]**: **[Phase 10–11 Storefront Lock]**: Added Coupon model/API with seeded `WELCOME10` and `RITUAL500` codes, responsive promo validation in the cart drawer, bilingual Privacy Policy/Terms/Contact pages, global legal footer links, root SEO metadata, and branded 404 handling. Production legal approval, structured SEO data, analytics, formal accessibility and E2E audit remain future hardening work.

* **[2026-09-05]**: **[Phase 9 Finalization]**: Added pending-order cancellation with ownership/status guards, printable customer invoice route, real product review listing/submission, duplicate-review protection, and automatic product rating/review-count recalculation. Customer Portal order, profile and address flows now use backend APIs; tracking, returns/refunds and moderation remain future extensions.

* **[2026-09-05]**: **[Phase 9 Customer Portal Integration]**: Replaced portal mocks with protected real APIs for user profile read/update, newest-first user-scoped order history, and address listing/creation. Added real status/total rendering, profile loading/update feedback, responsive address management, and bilingual service boundaries. Tracking, cancellation, returns/refunds, reviews, notifications, and invoices remain pending.
* **[2026-09-03]**: Initialized monorepo infrastructure.
* **[2026-09-03]**: Initialized Next.js storefront app in `/apps/storefront` with Tailwind CSS, TypeScript, and ESLint. Configured as part of the monorepo workspace.
* **[2026-09-03]**: Scaffolded backend engine, added Documentation (README & Roadmap), and prepared initial commit for GitHub.
* **[2026-09-04]**: Configured Google Stitch MCP and Codex MCP in `.agents/mcp.toml` and untracked config from Git.
* **[2026-09-04]**: Updated project rules (Stitch designs as reference, premium UI, dual languages). Set up `next-intl` in storefront for English and Bengali. Added MongoDB connection config to backend.
* **[2026-09-04]**: Built bilingual Storefront Customer Authentication UI for Login and Registration with responsive split-screen design, Unsplash lifestyle visual, and frontend validation.
* **[2026-09-04]**: Completed Phase 2 Public Storefront core with responsive global navigation, EN/BN language switching, cart badge state, footer, hero, category cards, and trending products.
* **[2026-09-04]**: Completed Shop listing and Product Details pages with responsive filtering, sorting, swipeable mobile gallery, product options, and conversion-focused cart actions.
* **[2026-09-04]**: Completed Phase 3 Checkout Flow with cart drawer, responsive shipping/contact checkout, manual mobile-wallet payment validation, and order success screen.
* **[2026-09-04]**: Completed frontend hardening, missing auth flows, and service layer implementation with simulated network latency, robust validation, toast feedback, loading states, cart clearing, and redirects.
* **[2026-09-04]**: Completed Customer Portal with responsive account navigation, profile and password management, mocked order history, address book CRUD, bilingual UX, validation, loading states, and toast feedback. Added the future Pending Gap Analysis checklist.
* **[2026-09-04]**: Hardened storefront client state with LocalStorage-persistent cart/wishlist, added debounced global search and search results, connected wishlist discovery flow, and synchronized checkout order IDs with the Success page.
* **[2026-09-04]**: **[Frontend Premium UI Polish]**: Refactored the storefront to a modern, premium design system using robust Tailwind CSS variables (`--primary`, `--background`, `--foreground`). Replaced raw slate/indigo utility classes with semantic design tokens, applied elegant typography (Plus Jakarta Sans & Hind Siliguri), unified component states (hover/focus/active), and elevated micro-interactions (animations, glassmorphism, refined shadows) across all core storefront, discovery, checkout, and auth screens.
* **[2026-09-04]**: **[Hero Carousel]**: Replaced static homepage banner with a dynamic, dashboard-ready `embla-carousel-react` integration, featuring autoplay, smooth transitions, and glassmorphic UI controls.
* **[2026-09-04]**: **[Premium Cards]**: Redesigned Product Catalog cards and Homepage Category cards with enhanced data display (dynamic rating, reviews, stock status), premium glassmorphic overlays, 'New' badges, floating Add to Cart buttons, and immersive hover zoom animations optimized for all device sizes.
* **[2026-09-04]**: **[Catalog Verification Attempt]**: MongoDB connectivity was confirmed successfully with a Mongoose admin ping. The catalog seeder was then executed but exceeded the 34-second command timeout before completion, so product insertion and database counts remain unverified. Phase 4 real search integration and legacy mock-data cleanup have not started.
* **[2026-09-05]**: **[Phase 6 Address + Shipping + Checkout]**: Added protected `GET/POST /api/addresses` endpoints tied to the authenticated user, a server shipping quote (`Dhaka: 60 BDT`, other cities: `120 BDT`), and a responsive checkout that loads server cart data, selects/saves addresses with validation and loading states, and calculates subtotal plus live shipping cost. Server-side order creation, address update/delete, tax, and payment remain pending.
* **[2026-09-05]**: **[Phase 7–8 Payment + Order Placement]**: Added protected `POST /api/orders` with database-authoritative cart price/stock revalidation, address ownership validation, Dhaka-aware shipping calculation, pending Payment creation with bKash/Nagad TxID, OrderItem snapshots, atomic-scope cart clearing, duplicate TxID protection, and a real order-ID query redirect to the Success page. Payment verification, order lifecycle APIs, and server-side idempotency remain pending.
* **[2026-09-05]**: **[BugFix & Premium UI Upgrade]**: Resolved critical `next-intl` language persistence issue and `/account/profile` infinite redirect loop by configuring the correct global matcher in the proxy middleware and fixing broken navigation links. Upgraded the `CatalogCard`, Homepage Categories, and Shop listing components with a highly premium glassmorphic aesthetic, unified hover animations, refined typography, and layout optimizations.
* **[2026-09-05]**: **[Special Offers & Product Card Polish]**: Refactored the `CatalogCard` component to include a dynamic star rating display and prominent discount pricing with crossed-out original prices. Created a new backend integration for `isSpecialOffer` inside the `Product` schema, re-seeded the database with discounted products, and built a dedicated, responsive "Special Offers" layout section in `home-catalog.tsx` that is queryable via the dashboard/API. Fully integrated dual-language translations for the new components.
