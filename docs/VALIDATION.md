# Verification — 22 September 2026

Validated locally with Node.js 22.23.2 and PostgreSQL 16.15.

- `npm run db:setup`: all three migrations and seed succeeded on a fresh temporary PostgreSQL database. The temporary database was removed after verification.
- Seed: 7 categories, 14 products, 29 variants, 6 services, 3 coupons, an active promotion, 4 customers/orders, 2 quotes and site settings. Seed data is visible through the same API in both interfaces.
- `npm run build`: TypeScript server/client checks and Vite production build passed.
- `npm test`: 13 passing tests, including real API/PostgreSQL commerce lifecycle and a local SMTP transport.
- `npm run test:e2e`: 5 passing Chromium browser workflows, desktop and mobile.
- `npm audit`: zero reported vulnerabilities at the time of verification.
- `npm run format:check`: passed.
- Production server smoke test: homepage loaded 8 API-backed product cards, local fonts loaded, no captured JavaScript/CSP errors.

Covered flows:

1. Public homepage, categories, product list/detail, exact variant prices and cart persistence.
2. Coupon application, checkout, database order, admin order lookup, status timeline, cancellation and stock restoration.
3. Admin category/product create, upload, flexible specifications, update, public propagation and safe deletion.
4. Automatic promotions and coupons created in the admin, observed and applied in the storefront.
5. Quote with uploaded reference image, contact submission and admin records.
6. Admin sections, notification preview, responsive navigation and horizontally scrollable mobile tables.
7. Customer registration, profile update, authenticated checkout, private order history and login persistence.
8. Guest/customer/admin/manager authorization boundaries, origin checks, expired/disabled coupons, idempotent checkout and competing purchases of the last unit.
9. Transactional email creation, HTML escaping, SMTP MIME delivery, no resend of a sent message, retries and final failure state.

Temporary browser records were removed after their orders were cancelled, restoring stock. The seeded demonstration records remain. Screenshots and the full report are generated under `test-results/` and `playwright-report/` (Git-ignored).

## Deployment configuration still required

- Real SMTP credentials and sender/domain configuration. Actual external email delivery was **not** tested; local SMTP delivery and failure handling were tested. No external email was sent.
- Real business contact information, product prices/specifications/images, shipping arrangements and production admin password.
- Production domain, HTTPS reverse proxy, persistent PostgreSQL/uploads storage, backup and process supervision.

This is a working locally verified application, not a claim of a completed public deployment or an independent security audit.
