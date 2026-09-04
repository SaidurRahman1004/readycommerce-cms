# Project Roadmap - ReadyCommerce CMS

This roadmap is based on the comprehensive project audit. The overarching rule is: **Do NOT start the Admin Dashboard until the Storefront E2E workflow and Backend Foundation are fully complete.**

---

### Priority 0 — Foundation Before More UI
- [x] Create monorepo using npm workspaces & configure Git.
- [x] Initialize Next.js app (`/apps/storefront`) & configure i18n (`next-intl`).
- [x] Scaffold Node.js Express backend & connect to MongoDB.
- [ ] Implement Real backend architecture (Models: User, Product, Category, Order, Payment, Review, Wishlist, Address).
- [ ] Implement Auth API and secure session/token strategy.
- [ ] Setup protected customer routes.
- [ ] Implement Central API error format.
- [ ] Create Frontend service layer connected to real API.
- [ ] Fix Order ID state generation.
- [ ] Setup Automated unit/E2E tests.
- [ ] Configure Environment variable/security policy.
- [ ] Verify UTF-8 Bengali translations.

### Priority 1 — Core Customer Journey
*Goal: Complete the core shopping flow (Search → Product → Cart → Payment → Order).*
- [ ] Search (Keyword, Category, Suggestions).
- [ ] Category pages.
- [ ] Stock validation & Product Variants.
- [ ] Cart persistence & validation.
- [ ] Address selection during checkout.
- [ ] Shipping charge & Tax calculation.
- [ ] Coupon integration.
- [ ] Payment states & verification (bKash/Nagad manual).
- [ ] Real order creation and backend synchronization.
- [ ] Order detail & Tracking.

### Priority 2 — Account & Post-purchase
- [ ] Session-aware Customer Portal.
- [ ] Dashboard overview.
- [ ] Order details route.
- [ ] Cancel order, Return request, Refund request.
- [ ] Reorder capability.
- [ ] Invoice download.
- [ ] Address edit/default address management.
- [ ] Wishlist logic & UI.
- [ ] Review submission & My reviews.
- [ ] Notifications system.

### Priority 3 — Discovery & Conversion
- [ ] Wishlist features across catalog.
- [ ] Search suggestions.
- [ ] Related & Recommended products.
- [ ] Recently viewed products.
- [ ] Best sellers & New arrivals.
- [ ] Offers/discounts engine.
- [ ] Product reviews display.
- [ ] Newsletter subscription.
- [ ] Abandoned cart recovery logic.

### Priority 4 — Trust, Legal & Operations
- [ ] Privacy Policy, Terms, Refund Policy, Shipping Policy.
- [ ] Contact Us & FAQ.
- [ ] Cookie/consent banner.
- [ ] 404 page & Error page templates.
- [ ] Offline/retry state handling.
- [ ] SEO metadata, Sitemap & robots.txt.
- [ ] Product structured data (Schema.org).
- [ ] Analytics & Conversion tracking.
- [ ] Monitoring/logging integration.

### Priority 5 — QA & Production Readiness
- [ ] Unit tests, Integration tests, E2E tests execution.
- [ ] Responsive UI verification (Mobile, Tablet, Desktop, Widescreen).
- [ ] Accessibility audit & Keyboard navigation.
- [ ] Screen reader testing.
- [ ] Performance & Security review.
- [ ] Rate limiting & Input sanitization.
- [ ] Backup/restore strategy.
- [ ] Deployment pipeline (CI/CD).

---

### Priority 6 — Admin Dashboard
*Will only begin after Priorities 0-5 are successfully verified.*
- [ ] Initialize Next.js dashboard app (`/apps/dashboard`).
- [ ] Core admin authentication.
- [ ] Catalog management (Products, Categories).
- [ ] Order fulfillment management.
- [ ] Customer management.
