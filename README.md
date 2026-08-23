# Ecommerce Express MongoJS Starter

A standard, production-ready RESTful API starter template for an E-commerce system. Built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, this template comes pre-configured with secure **User Authentication** and includes **Brand**, **Category**, **Product (with Variants & Images)**, **Cart**, and **Order** APIs built on the Controller-Service-Repository pattern. Placing an order kicks off an asynchronous **order confirmation email**, and confirming an order (admin status update) kicks off an **Invoice Email pipeline** (PDF generation + email delivery) — both run via auto-registered BullMQ background workers. Read-heavy listings (**products**, **categories**) are served through a **Redis cache** with write-triggered invalidation, and every route group sits behind a **global rate limiter**.

## 🏗️ Project Architecture & Design Pattern

The project is structured around the **Controller-Service-Repository** design pattern. This ensures that database queries, business rules, and HTTP routing are entirely decoupled.

```text
src/
├── config/             # Configuration files (DB, Redis, BullMQ connection, upload/mail driver selection)
├── constants/           # Shared constants (e.g. allowed file mime types)
├── controllers/        # Route handlers (Parses HTTP requests & shapes responses)
├── middlewares/        # Express middleware (Auth protection, upload handling, request validation, rate limiting & global error handling)
├── models/             # Mongoose Schemas & Database models
├── queues/              # BullMQ queue definitions & job producers
├── repositories/       # Data Access Layer (Executes raw Mongoose queries)
├── routes/             # Route declarations mapping endpoints to controllers
├── services/           # Business Logic Layer (validation, orchestrating repositories, cache invalidation)
│   ├── upload/          # Storage driver implementations (local, ...) behind UploadService
│   └── email/            # Mail driver implementations (SMTP, ...) behind EmailService
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

**2. Invoice email** — fires when an order's status is updated to `CONFIRMED` (`PATCH /orders/:orderId`):

`Order status → CONFIRMED` ➔ `enqueueInvoiceEmail (BullMQ, Redis-backed)` ➔ **Worker**: fetch order/payment/user ➔ render invoice HTML ➔ generate PDF (Puppeteer) ➔ send email with the PDF attached (Nodemailer)

Both queue producers enqueue from inside a try/catch so a queue/Redis failure never fails the underlying HTTP request — it's only logged. The PDF renderer and the mailer are driver-based (`UPLOAD_DRIVER`-style config) so the underlying provider (e.g. SMTP → SES/SendGrid) can be swapped without touching calling code.

### Caching (Redis)

Two read-heavy endpoints are cached in Redis, each with its own invalidation strategy:

**1. Category list** (`GET /categories/all`) — cached under a single `categories` key with no expiry. Any create/update/delete in `category.service.js` deletes the key, so the next read repopulates it.

**2. Product list** (`GET /products`) — **versioned cache keys**, so paginated + filtered variants don't have to be tracked individually:

`products:v{version}:page:{page}:limit:{limit}[:name:…][:category:…][:brand:…]`

- The current version lives in the `products:version` counter (initialized to `1` on first read).
- A hit returns the cached page (data + pagination) immediately; a miss queries MongoDB and caches the result for **300s** (empty result sets are not cached).
- Any product or variant write (create, update, delete, image upload/delete) calls `INCR products:version`, which shifts every key prefix at once — all previously cached pages/filters are orphaned and expire on their own. No key scanning, no per-filter bookkeeping.

### Rate Limiting

`src/middlewares/rateLimiter.js` exposes `globalRateLimiter` (`express-rate-limit`), applied in `src/routes/index.js` to every route group — `/auth`, `/brands`, `/categories`, `/products`, `/carts`, `/orders`:

- **100 requests per IP per 15-minute window**
- `draft-8` standard `RateLimit-*` response headers (legacy `X-RateLimit-*` headers disabled)
- Over the limit → **429** with `{ success: false, message: "Too many requests. Please try again later." }`

The limiter currently uses the default **in-memory store**, which is per-process. A `rate-limit-redis` store (`RedisStore` backed by the shared `redisClient`) is wired up but commented out — uncomment it to share counters across multiple instances.

---

## 🛠️ Tech Stack & Dependencies

- **Node.js** & **Express (v5.x)** - Server runtime and framework.
- **MongoDB** & **Mongoose (v9.x)** - Database and Object Data Modeling (ODM). Requires a **replica set** (transactions are used for order placement).
- **Redis** - Caching layer (product & category listings) and the backing store for BullMQ.
- **BullMQ** & **ioredis** - Background job queues/workers for asynchronous order confirmation and invoice emailing.
- **Nodemailer** - Email delivery (SMTP driver by default).
- **Puppeteer** - Renders HTML invoices to PDF (headless Chromium).
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
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/signin` | Login and receive a JWT |

### Brands
| Method | Endpoint | Description |
|---|---|---|
| GET | `/brands` | Get paginated brands |
| GET | `/brands/all` | Get all brands |
| POST | `/brands/create` | Create a brand (with image upload) |
| PATCH | `/brands/:id` | Update a brand (with image upload) |
| DELETE | `/brands/:id` | Delete a brand |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | Get paginated categories |
| GET | `/categories/all` | Get all categories (Redis-cached) |
| POST | `/categories/create` | Create a category (with image upload) |
| PATCH | `/categories/:id` | Update a category (with image upload) |
| DELETE | `/categories/:id` | Delete a category |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Get paginated products, filterable by `name`/`category`/`brand` (Redis-cached, 300s) |
| POST | `/products/create` | Create a product |
| PATCH | `/products/:id` | Update a product |

### Product Variants
| Method | Endpoint | Description |
|---|---|---|
| POST | `/products/:id/variants` | Add a variant to a product |
| PATCH | `/products/variants/:variantId` | Update a variant |
| DELETE | `/products/variants/:variantId` | Delete a variant (also removes its images) |
| POST | `/products/variants/:variantId/images` | Upload images (up to 10) for a variant |
| DELETE | `/products/variants/:variantId/image` | Delete a single variant image |

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
