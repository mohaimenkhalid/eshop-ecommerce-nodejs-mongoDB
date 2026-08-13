# Ecommerce Express MongoJS Starter

A standard, production-ready RESTful API starter template for an E-commerce system. Built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, this template comes pre-configured with secure **User Authentication** and includes **Brand**, **Category**, and **Product (with Variants & Images)** APIs built on the Controller-Service-Repository pattern.

## 🏗️ Project Architecture & Design Pattern

The project is structured around the **Controller-Service-Repository** design pattern. This ensures that database queries, business rules, and HTTP routing are entirely decoupled.

```text
src/
├── config/             # Configuration files (Database setup)
├── controllers/        # Route handlers (Parses HTTP requests & shapes responses)
├── middlewares/        # Express middleware (Auth protection & Global error handling)
├── models/             # Mongoose Schemas & Database models (User, Todo)
├── repositories/       # Data Access Layer (Executes raw Mongoose queries)
├── routes/             # Route declarations mapping endpoints to controllers
├── services/           # Business Logic Layer (Input validation, calculations, orchestrating repositories)
├── utils/              # General helper functions (Slug generation)
├── index.js            # Express application initialization & middleware bindings
└── server.js           # Entry point (Starts database connection & listens to port)
```

### Decoupled Layers Flow:
`HTTP Request` ➔ `Routes` ➔ `Middlewares (e.g. Auth Guard)` ➔ `Controller` ➔ `Service` ➔ `Repository` ➔ `Database (MongoDB)`

---

## 🛠️ Tech Stack & Dependencies

- **Node.js** & **Express (v5.x)** - Server runtime and framework.
- **MongoDB** & **Mongoose (v9.x)** - Database and Object Data Modeling (ODM).
- **JSON Web Tokens (JWT)** - Secure authorization.
- **Bcrypt** - Password hashing library.
- **Slugify** - Slug generator for title strings.
- **Dotenv** - Configuration loading via environment variables.
- **Nodemon** - Development server monitor.

---

## ⚙️ Prerequisites & Setup

Ensure you have the following installed on your local machine:
- **Node.js** (v18+)
- **MongoDB** (Local instance or Atlas connection string)

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
   MONGO_URI=mongodb://127.0.0.1:27017/eshop-ecommerce
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=1h
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

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/signin` | Login and receive a JWT |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | Get all users |

### Brands
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/brands` | Get paginated brands |
| GET | `/api/brands/all` | Get all brands |
| POST | `/api/brands/create` | Create a brand (with image upload) |
| PATCH | `/api/brands/:id` | Update a brand (with image upload) |
| DELETE | `/api/brands/:id` | Delete a brand |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | Get paginated categories |
| GET | `/api/categories/all` | Get all categories |
| POST | `/api/categories/create` | Create a category (with image upload) |
| PATCH | `/api/categories/:id` | Update a category (with image upload) |
| DELETE | `/api/categories/:id` | Delete a category |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Get paginated products |
| POST | `/api/products/create` | Create a product |
| PATCH | `/api/products/:id` | Update a product |

### Product Variants
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/products/:id/variants` | Add a variant to a product |
| PATCH | `/api/products/variants/:variantId` | Update a variant |
| DELETE | `/api/products/variants/:variantId` | Delete a variant (also removes its images) |
| POST | `/api/products/variants/:variantId/images` | Upload images (up to 10) for a variant |
| DELETE | `/api/products/variants/:variantId/image` | Delete a single variant image |