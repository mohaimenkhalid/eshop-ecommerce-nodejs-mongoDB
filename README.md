# Ecommerce Express MongoJS Starter

A standard, production-ready RESTful API starter template for an E-commerce system. Built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, this template comes pre-configured with secure **User Authentication** (with an optional `MERCHANT` role opt-in at signup) and includes **Brand**, **Category**, **Shop**, **Product (with Variants & Images, scoped to a Shop)**, **Cart**, **Order**, and **Payment** APIs built on the Controller-Service-Repository pattern. Orders can be placed **COD** or online via a driver-based **Stripe Checkout** integration (opt-in — the app still boots as a COD-only shop with no Stripe env vars set). Placing an order kicks off an asynchronous **order confirmation email**, and confirming an order — either an admin status update or a verified Stripe payment — kicks off an **Invoice Email pipeline** (PDF generation + email delivery) — both run via auto-registered BullMQ background workers. Read-heavy listings (**products**, **categories**) are served through a **Redis cache** with write-triggered invalidation, every route group sits behind a **global rate limiter**, and a set of MongoDB **aggregation-based reports** (orders, revenue, top sellers, low stock) is exposed under `/reports`.

## 🏗️ Project Architecture & Design Pattern

The project is structured around the **Controller-Service-Repository** design pattern. This ensures that database queries, business rules, and HTTP routing are entirely decoupled.

```text
src/
├── config/             # Configuration files (DB, Redis, BullMQ connection, upload/mail/payment driver selection)
├── constants/           # Shared constants (e.g. allowed file mime types)
├── controllers/        # Route handlers (Parses HTTP requests & shapes responses)
├── middlewares/        # Express middleware (Auth protection, role gating, upload handling, request validation, rate limiting & global error handling)
├── models/             # Mongoose Schemas & Database models
├── queues/              # BullMQ queue definitions & job producers
├── repositories/       # Data Access Layer (Executes raw Mongoose queries)
├── routes/             # Route declarations mapping endpoints to controllers
├── services/           # Business Logic Layer (validation, orchestrating repositories, cache invalidation)
│   ├── upload/          # Storage driver implementations (local, ...) behind UploadService
│   ├── email/            # Mail driver implementations (SMTP, ...) behind EmailService
│   └── payment/          # Payment gateway driver implementations (Stripe, ...) behind provider.factory.js
├── templates/           # HTML templates rendered to PDF/email (invoice, order confirmation)
├── utils/              # General helper functions (Slug generation, error factory)
├── workers/             # BullMQ worker processes, auto-registered via workers/index.js
├── index.js            # Express application initialization & middleware bindings
└── server.js           # Entry point (starts DB/Redis connections, boots workers, listens to port)
```

### Decoupled Layers Flow:
`HTTP Request` ➔ `Routes` ➔ `Middlewares (e.g. Auth Guard)` ➔ `Controller` ➔ `Service` ➔ `Repository` ➔ `Database (MongoDB)`

### Background Workers

`src/workers/index.js` auto-loads every `*.worker.js` file in that folder (`require("./workers")` in `server.js`) — dropping in a new worker file registers it automatically, no wiring needed elsewhere. Two workers/pipelines exist today:

**1. Order confirmation email** — fires the moment an order is placed, for any payment method:

`Order created` ➔ `enqueueOrderConfirmationEmail (BullMQ, Redis-backed)` ➔ **Worker**: fetch order + user ➔ render confirmation HTML ➔ send "order placed" email (Nodemailer)

**2. Invoice email** — fires when an order's status is updated to `CONFIRMED` (`PATCH /orders/:orderId`), or automatically the moment a Stripe payment is confirmed as paid:

`Order status → CONFIRMED` ➔ `enqueueInvoiceEmail (BullMQ, Redis-backed)` ➔ **Worker**: fetch order/payment/user ➔ render invoice HTML ➔ generate PDF (Puppeteer) ➔ send email with the PDF attached (Nodemailer)

Both queue producers enqueue from inside a try/catch so a queue/Redis failure never fails the underlying HTTP request — it's only logged. The PDF renderer and the mailer are driver-based (`UPLOAD_DRIVER`-style config) so the underlying provider (e.g. SMTP → SES/SendGrid) can be swapped without touching calling code.

### Payments (Stripe Checkout)

Online payment is a separate, opt-in `PAYMENT_DRIVER` behind the same driver-factory pattern as uploads/mail (`src/services/payment/provider.factory.js`; only `stripe` is implemented today, `sslcommerz`/`bkash` are stubbed). The driver auto-detects to `stripe` when `STRIPE_SECRET_KEY` is set, or `none` (COD-only) otherwise — an install with neither keeps booting. The provider is built lazily on first use, so a misconfigured/missing Stripe key doesn't crash boot, only the first checkout call (`503`).

Flow for a `STRIPE` order (`Order.paymentMethod === "STRIPE"`, set at checkout like any other payment method):

1. **`POST /payments/stripe/checkout-session`** — validates the order belongs to the caller, is a `STRIPE` order, and isn't already `PAID`; creates a Stripe-hosted Checkout Session (one line item for the whole order total, in the smallest currency unit) and stores its id as `Payment.gatewayReference`. Returns the session `url` to redirect the customer to.
2. **`GET /payments/stripe/return`** — Stripe's `success_url` target, so it has **no auth guard** (the customer arrives with no `Authorization` header). It never trusts the redirect itself: it re-fetches the session from Stripe by id and only then marks the payment `SUCCESS` / order `PAID` + `CONFIRMED` (which enqueues the invoice email). If `PAYMENT_RETURN_REDIRECT_URL` is set, the customer is redirected there (`?status=paid|expired|pending|error`) instead of getting raw JSON — handy for a frontend, optional for a pure API client.
3. **`POST /payments/order/:orderId/sync`** — on-demand reconciliation ("check payment status" button) for a customer who paid and closed the tab before the return redirect fired; asks Stripe about the stored session and applies the same paid-order logic.
4. **`GET /payments/order/:orderId`** — reads the stored `Payment`; if it's still `PENDING` with a `gatewayReference`, it transparently syncs with Stripe first so the response reflects reality.

All four paths that can discover a payment succeeded (return redirect, on-demand sync, and the read-through sync on `GET`) funnel through one `applyPaidSession` function in `payment.service.js`, so the "mark paid + confirm order + enqueue invoice" side effect only lives in one place.

### Caching (Redis)

Two read-heavy endpoints are cached in Redis, each with its own invalidation strategy:

**1. Category list** (`GET /categories/all`) — cached under a single `categories` key with no expiry. Any create/update/delete in `category.service.js` deletes the key, so the next read repopulates it.

**2. Product list** (`GET /products`) — **versioned cache keys**, so paginated + filtered variants don't have to be tracked individually:

`products:v{version}:page:{page}:limit:{limit}[:name:…][:category:…][:brand:…]`

- The current version lives in the `products:version` counter (initialized to `1` on first read).
- A hit returns the cached page (data + pagination) immediately; a miss queries MongoDB and caches the result for **300s** (empty result sets are not cached).
- Any product or variant write (create, update, delete, image upload/delete) calls `INCR products:version`, which shifts every key prefix at once — all previously cached pages/filters are orphaned and expire on their own. No key scanning, no per-filter bookkeeping.

### Rate Limiting

`src/middlewares/rateLimiter.js` exposes `globalRateLimiter` (`express-rate-limit`), applied in `src/routes/index.js` to every route group — `/auth`, `/brands`, `/categories`, `/shops`, `/products`, `/carts`, `/orders`, `/payments`:

- **100 requests per IP per 15-minute window**
- `draft-8` standard `RateLimit-*` response headers (legacy `X-RateLimit-*` headers disabled)
- Over the limit → **429** with `{ success: false, message: "Too many requests. Please try again later." }`

The limiter currently uses the default **in-memory store**, which is per-process. A `rate-limit-redis` store (`RedisStore` backed by the shared `redisClient`) is wired up but commented out — uncomment it to share counters across multiple instances.

### Authorization Model

Authorization is split across two layers instead of living in one place:

| Layer | Question it answers | Where |
|---|---|---|
| `authGuard` | Is the JWT valid? | `middlewares/authGuard.middleware.js` |
| `roleGuard(...roles)` | May this **role** perform this action? | `middlewares/roleGuard.middleware.js` |
| Service-level assertion | Does this **specific record** belong to the caller? | e.g. `assertShopAccess()` in `services/shop.service.js`; a `product.shop.owner` equality check in `services/product.service.js` |

`roleGuard` is a variadic middleware factory (`roleGuard("MERCHANT", "ADMIN")`) — resource-independent, so it needs no database read and is placed **before** the upload middleware, meaning an unauthorized request never writes a file to disk. Record-level ownership stays in the service layer so the rule holds for every caller (HTTP, worker, script), not just routed requests.

Note the two resources differ in one way: `assertShopAccess()` (shops) explicitly **lets `ADMIN`/`SUPER_ADMIN` bypass** the ownership check; the product/variant owner check does **not** bypass for admins yet — it's a plain "does the caller's `userId` match `product.shop.owner`" comparison.

Current role matrix:

| Resource | Read | Write |
|---|---|---|
| Brands, Categories | public | `ADMIN`, `SUPER_ADMIN` |
| Products | public | `MERCHANT`, `ADMIN`, `SUPER_ADMIN` (creation takes `shop` as given, with no ownership check; update is owner-only, no admin bypass) |
| Product Variants | public | `MERCHANT`, `ADMIN`, `SUPER_ADMIN` + owner-only per record (add/update/delete variant, add/delete variant image), no admin bypass |
| Shops | public | `MERCHANT`, `ADMIN`, `SUPER_ADMIN` + owner-only per record (admins bypass) |
| Carts, Orders | own records (JWT) | own records (JWT) |
| Reports | `ADMIN`, `SUPER_ADMIN` | n/a (read-only) |

---

## 🛠️ Tech Stack & Dependencies

- **Node.js** & **Express (v5.x)** - Server runtime and framework.
- **MongoDB** & **Mongoose (v9.x)** - Database and Object Data Modeling (ODM). Requires a **replica set** (transactions are used for order placement).
- **Redis** - Caching layer (product & category listings) and the backing store for BullMQ.
- **BullMQ** & **ioredis** - Background job queues/workers for asynchronous order confirmation and invoice emailing.
- **Nodemailer** - Email delivery (SMTP driver by default).
- **Puppeteer** - Renders HTML invoices to PDF (headless Chromium).
- **Stripe** - Hosted Checkout for online payments (opt-in driver; app runs COD-only without it).
- **JSON Web Tokens (JWT)** - Secure authorization.
- **Bcrypt** - Password hashing library.
- **Multer** - Multipart file uploads (brand/category/product variant images).
- **express-rate-limit** & **rate-limit-redis** - Global per-IP request throttling (Redis store available for multi-instance deployments).
- **Joi** - Request body validation.
- **Slugify** - Slug generator for title strings.
- **Dotenv** - Configuration loading via environment variables.
- **Nodemon** - Development server monitor.

---

## ⚙️ Prerequisites & Setup

Ensure you have the following installed on your local machine:
- **Node.js** (v18+)
- **MongoDB**, configured as a **replica set** (even a single-node one) — required for the transaction used in order placement. Locally: add `replication: { replSetName: rs0 }` to `mongod.conf`, restart `mongod`, then run `rs.initiate()` once. Alternatively, use a replica-set-enabled hosted instance (e.g. MongoDB Atlas).
- **Redis** (local instance or hosted) — used for caching and as the BullMQ job store.
- An **SMTP** account for sending invoice emails in development (e.g. a free [Mailtrap](https://mailtrap.io) sandbox inbox).

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ecommerce-express-mongojs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and copy the contents of `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Modify the variables as needed:
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/ecommerce
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=1h

   UPLOAD_DRIVER=local
   REDIS_URL=redis://127.0.0.1:6379

   MAIL_DRIVER=smtp
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_pass
   EMAIL_FROM="Shop Name <no-reply@example.com>"

   # Optional — leave STRIPE_SECRET_KEY empty to run as a COD-only shop
   PAYMENT_DRIVER=stripe
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_CURRENCY=usd
   STRIPE_SUCCESS_URL=http://localhost:3000/payments/stripe/return?session_id={CHECKOUT_SESSION_ID}
   STRIPE_CANCEL_URL=http://localhost:3000/carts
   PAYMENT_RETURN_REDIRECT_URL=http://localhost:5173/order-status
   ```

4. **Running the Application:**
   * **Development Mode (with auto-reload):**
     ```bash
     npm run dev
     ```
   * **Production Mode:**
     ```bash
     npm start
     ```

   Both commands boot the HTTP server **and** all background workers in the same process (`src/server.js` requires `src/workers`, which auto-registers every `*.worker.js`) — no separate worker process is needed at this scale.

---

## 📡 API Endpoints

All routes are mounted at the app root (e.g. `/categories`, not `/api/categories`). Every route group is rate limited to 100 requests per IP per 15 minutes.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register a new user. Optional `role` field: `USER` (default) or `MERCHANT` — lets a merchant opt in at signup instead of needing an admin to promote them |
| POST | `/auth/signin` | Login and receive a JWT |

### Brands
_Write endpoints require a `Bearer` JWT and an `ADMIN`/`SUPER_ADMIN` role._

| Method | Endpoint | Description |
|---|---|---|
| GET | `/brands` | Get paginated brands |
| GET | `/brands/all` | Get all brands |
| POST | `/brands/create` | Create a brand (with image upload) |
| PATCH | `/brands/:id` | Update a brand (with image upload) |
| DELETE | `/brands/:id` | Delete a brand |

### Categories
_Write endpoints require a `Bearer` JWT and an `ADMIN`/`SUPER_ADMIN` role._

| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | Get paginated categories |
| GET | `/categories/all` | Get all categories (Redis-cached) |
| POST | `/categories/create` | Create a category (with image upload) |
| PATCH | `/categories/:id` | Update a category (with image upload) |
| DELETE | `/categories/:id` | Delete a category |

### Shops
_Write endpoints require a `Bearer` JWT **and** a `MERCHANT`/`ADMIN`/`SUPER_ADMIN` role (`roleGuard` middleware). On top of that, a shop can only be updated/deleted by its own owner — admins bypass this (enforced in the service layer)._

| Method | Endpoint | Description |
|---|---|---|
| GET | `/shops` | Get paginated shops (filterable by `name`/`status`/`isFeatured`/`owner`) |
| GET | `/shops/all` | Get all active shops |
| GET | `/shops/:id` | Get a single shop |
| POST | `/shops` | Create a shop (owner = logged-in user, with `logo` & `banner` upload) |
| PATCH | `/shops/:id` | Update a shop (with `logo` & `banner` upload) |
| DELETE | `/shops/:id` | Soft delete a shop |

### Products
_Write endpoints require a `Bearer` JWT and a `MERCHANT`/`ADMIN`/`SUPER_ADMIN` role. Every product belongs to a `shop` (`Product.shop`); `PATCH` additionally requires the caller to be that shop's owner (checked in `product.service.js`, no admin bypass yet)._

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Get paginated products, filterable by `name`/`category`/`brand` (Redis-cached, 300s) |
| POST | `/products/create` | Create a product under a `shop` (`shop` is a required body field; the caller's ownership of that shop is not currently verified) |
| PATCH | `/products/:id` | Update a product (owner-only) |

### Product Variants
_All variant endpoints require a `Bearer` JWT and a `MERCHANT`/`ADMIN`/`SUPER_ADMIN` role, plus ownership of the parent product's shop — the service resolves the parent product from the `variantId` (`findProductByVariantId`) and compares `product.shop.owner` to the caller, no admin bypass yet._

| Method | Endpoint | Description |
|---|---|---|
| POST | `/products/:id/variants` | Add a variant to a product (owner-only) |
| PATCH | `/products/variants/:variantId` | Update a variant (owner-only) |
| DELETE | `/products/variants/:variantId` | Delete a variant (also removes its images, owner-only) |
| POST | `/products/variants/:variantId/images` | Upload images (up to 10) for a variant (owner-only) |
| DELETE | `/products/variants/:variantId/image` | Delete a single variant image (owner-only) |

### Cart
_All cart endpoints require a `Bearer` JWT._

| Method | Endpoint | Description |
|---|---|---|
| GET | `/carts` | Get the current user's cart |
| POST | `/carts` | Add a product variant to the cart |
| PATCH | `/carts/:cartId` | Update a cart item's quantity |
| DELETE | `/carts/:cartId` | Remove a cart item |

### Orders
_All order endpoints require a `Bearer` JWT._

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Checkout the current user's cart into an order + payment record. Also enqueues the order confirmation email job. |
| PATCH | `/orders/:orderId` | Update an order's status. Setting status to `CONFIRMED` also enqueues the invoice email job. |
| GET | `/orders` | Get all orders, paginated (admin-facing listing, filterable by `orderNumber`/`paymentStatus`/`status`) |
| GET | `/orders/me` | Get the current user's orders, paginated (same filters) |

### Payments
_Requires the `stripe` driver to be configured (`STRIPE_SECRET_KEY` set); otherwise these return `503`. All endpoints require a `Bearer` JWT except the Stripe return callback, which Stripe calls directly._

| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/stripe/checkout-session` | Create a Stripe Checkout session for one of the caller's own `STRIPE`-method orders; returns the hosted checkout `url` |
| GET | `/payments/stripe/return` | Stripe `success_url` callback (no auth) — verifies the session with Stripe, marks the payment/order paid, and redirects to `PAYMENT_RETURN_REDIRECT_URL` if set, else returns JSON |
| POST | `/payments/order/:orderId/sync` | On-demand reconciliation — re-checks the order's Stripe session and applies the result (owner or admin) |
| GET | `/payments/order/:orderId` | Get the payment record for an order, auto-syncing with Stripe first if it's still `PENDING` (owner or admin) |

### Reports
_Admin-facing MongoDB aggregation reports. Every endpoint requires a `Bearer` JWT and an `ADMIN`/`SUPER_ADMIN` role. None take query params (filters/limits are hardcoded in the aggregation pipelines)._

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/order-status-wise-summary` | Order count + total amount grouped by order `status` |
| GET | `/reports/user-count-report` | User count grouped by `role`, split into `active`/`inActive` by `status` (excludes soft-deleted users) |
| GET | `/reports/order-revenue-summary` | Store-wide totals across all orders: order count, paid count, revenue, average/highest/lowest order value (revenue figures only count `paymentStatus: PAID` orders) |
| GET | `/reports/discount-deliveryCharge-report` | Totals for discount and delivery charge across `PAID` orders, plus discount-as-percentage-of-order-amount |
| GET | `/reports/top-selleing-products` | Top 10 products by quantity sold, from `PAID` orders |
| GET | `/reports/top-selleing-varients-sku-wise` | Top 10 product variants (SKU-level) by quantity sold, from `PAID` orders |
| GET | `/reports/low-stock-alert-report` | Active products with any variant under 10 units in stock, sorted lowest stock first |
