# System Specification: Super Shop Inventory & Expiration Management System

## 1. Project Overview & Objectives
This project is a **production-ready Multi-Tenant Super Shop Inventory & Expiration Management System**. It addresses critical retail operations: user authentication, multi-tenant store data isolation, tracking stock at the granular batch level, enforcing **First-Expired, First-Out (FEFO)** stock deduction during transactions, and providing an executive dashboard for monitoring real-time inventory and upcoming expirations.

The codebase adheres strictly to **Clean Architecture** principles, includes robust database-level concurrency control, maintains high automated test coverage, and is fully documented for software engineering evaluation.

---

## 2. Technical Stack & Architecture

- **Architecture:** Monorepo (Clean Architecture: Entities, Use Cases, Controllers, Presenters/Adapters)
- **Frontend Framework:** React.js (Vite) with Tailwind CSS
- **Backend Framework:** AdonisJS (Node.js)
- **Authentication:** AdonisJS `@adonisjs/auth` (Session / API Access Tokens)
- **Database:** MySQL (Managed via XAMPP / Lucid ORM)
- **State & Data Visualization:** Lucide Icons, Recharts / Chart.js for dashboard metrics
- **Testing Suite:** Japa (AdonisJS native runner) for Backend Unit/Integration Tests & Vitest for Frontend

---

## 3. Database Schema Specification (MySQL)

### 3.1. `users` (Shop Owners / Accounts)
- `id`: `CHAR(36)` (UUID, Primary Key)
- `store_name`: `VARCHAR(255)`
- `email`: `VARCHAR(255)` (Unique, Indexed)
- `password`: `VARCHAR(255)` (Hashed)
- `role`: `ENUM('OWNER', 'CASHIER')` (Default: `'OWNER'`)
- `created_at`: `TIMESTAMP`
- `updated_at`: `TIMESTAMP`

### 3.2. `products`
- `id`: `CHAR(36)` (UUID, Primary Key)
- `user_id`: `CHAR(36)` (Foreign Key referencing `users.id`, ON DELETE CASCADE) — **Data Isolation**
- `barcode`: `VARCHAR(100)` (Indexed)
- `name`: `VARCHAR(255)`
- `category`: `VARCHAR(100)`
- `unit`: `VARCHAR(50)` (e.g., 'pcs', 'kg', 'ltr')
- `min_stock_alert`: `INT` (Default: 10)
- `created_at`: `TIMESTAMP`
- `updated_at`: `TIMESTAMP`
- `deleted_at`: `TIMESTAMP` (NULLable, for Soft Deletes)
- *Unique Constraint:* Composite `(user_id, barcode)` to allow different stores to use the same barcode.

### 3.3. `batches`
- `id`: `CHAR(36)` (UUID, Primary Key)
- `user_id`: `CHAR(36)` (Foreign Key referencing `users.id`, ON DELETE CASCADE) — **Data Isolation**
- `product_id`: `CHAR(36)` (Foreign Key referencing `products.id`, ON DELETE CASCADE)
- `batch_number`: `VARCHAR(100)`
- `quantity`: `INT` (Unsigned, Must be >= 0)
- `received_date`: `DATE` (Indexed)
- `expiry_date`: `DATE` (Indexed)
- `cost_price`: `DECIMAL(10, 2)`
- `selling_price`: `DECIMAL(10, 2)`
- `status`: `ENUM('ACTIVE', 'EXPIRED', 'DEPLETED')` (Default: `'ACTIVE'`)
- `created_at`: `TIMESTAMP`
- `updated_at`: `TIMESTAMP`
- `deleted_at`: `TIMESTAMP` (NULLable, for Soft Deletes)

### 3.4. `sales`
- `id`: `CHAR(36)` (UUID, Primary Key)
- `user_id`: `CHAR(36)` (Foreign Key referencing `users.id`, ON DELETE CASCADE) — **Data Isolation**
- `invoice_no`: `VARCHAR(100)` (Unique per store)
- `total_amount`: `DECIMAL(10, 2)`
- `payment_method`: `ENUM('CASH', 'CARD', 'MFS')`
- `created_at`: `TIMESTAMP`

### 3.5. `sale_items`
- `id`: `CHAR(36)` (UUID, Primary Key)
- `sale_id`: `CHAR(36)` (Foreign Key referencing `sales.id`, ON DELETE CASCADE)
- `product_id`: `CHAR(36)` (Foreign Key referencing `products.id`)
- `batch_id`: `CHAR(36)` (Foreign Key referencing `batches.id`)
- `quantity`: `INT`
- `unit_price`: `DECIMAL(10, 2)`
- `subtotal`: `DECIMAL(10, 2)`

---

## 4. Core Business Logic Requirements

### 4.1. Authentication & Context-Based Data Scoping
- **Context Extraction:** Controllers read the active user using `ctx.auth.user` provided by AdonisJS Auth Middleware.
- **Strict Scoping:** All database queries **MUST** attach `.where('user_id', auth.user.id)` to prevent cross-account data leaks.

### 4.2. FEFO (First-Expired, First-Out) Stock Deduction
When a checkout request is submitted for a given `product_id` and `quantity`:
1. Query active batches where `user_id = auth.user.id`, `product_id = product_id`, `quantity > 0`, and `expiry_date >= CURRENT_DATE()`.
2. Sort retrieved batches by `expiry_date ASC` (Primary), and then `received_date ASC` (Secondary fallback for same expiry) to ensure oldest stock is cleared first.
3. **Multi-Batch Allocation:** Deduct the required quantity across available batches sequentially, splitting line items across multiple `batch_id` records in `sale_items` if necessary.
4. If total active stock across non-expired batches is less than the requested quantity, abort the transaction and throw an `INSUFFICIENT_STOCK` exception.

### 4.3. Database Concurrency & Race Condition Prevention
- Utilize database row-level locking (`SELECT ... FOR UPDATE` via Lucid ORM) inside ACID database transactions during checkout to block concurrent overselling.

---

## 5. API Endpoint Architecture

### Authentication Routes
- `POST /api/auth/register` - Create store account & owner user.
- `POST /api/auth/login` - Authenticate & return session/access token.
- `POST /api/auth/logout` - Revoke active session/token.
- `GET /api/auth/me` - Fetch currently logged-in account profile.

### Inventory Intake & Batch Management (Protected by Auth Middleware)
- `POST /api/products` - Register a new product under `auth.user.id`.
- `GET /api/products` - List products for the authenticated store with aggregate stock counts.
- `POST /api/batches` - Register a new batch with `expiry_date` and `quantity`.
- `POST /api/batches/bulk` - Bulk inwarding for multi-product shipments.
- `GET /api/batches/expiring` - Fetch expiring batches with filtering (`?days=7`, `?days=30`).

### POS & Checkout Engine (Protected by Auth Middleware)
- `POST /api/sales/checkout` - Process checkout using transactional FEFO batch allocation.

### Executive Dashboard Data (Protected by Auth Middleware)
- `GET /api/dashboard/summary` - Aggregate metrics scoped to `auth.user.id`.
- `GET /api/dashboard/expiring-chart` - Expiration timeline chart data.

---

## 6. Frontend UI / Dashboard Specifications

1. **Authentication Views:**
   - Store Registration & Login UI with persistent token/session handling.
2. **Executive Dashboard:**
   - Metric Summary Cards (Scoped to active store): Total Products, Total Batches, Low Stock Warnings, Critical Expiring Batches (<= 7 Days).
   - Interactive Expiration Timeline Chart.
   - Urgent Expiration Table with color-coded status badges.
3. **Fast Bulk Intake / Stock In:**
   - Sequential barcode scanning workflow for receiving shipments.
4. **Point of Sale (POS) View:**
   - Barcode scanner support for checkout with live validation against stock and expiration status.

---

## 7. Step-by-Step Execution Plan for AI Coding Assistants (e.g., Cline)

1. **Step 1: Monorepo Setup & Auth Setup** - Initialize AdonisJS backend and React frontend. Install `@adonisjs/auth` and set up authentication middleware.
2. **Step 2: Database Migrations** - Create MySQL migrations for `users`, `products`, `batches`, `sales`, and `sale_items` with foreign keys referencing `users.id`.
3. **Step 3: Domain Entities & Scoped FEFO Service** - Write the checkout use case enforcing `user_id` scoping, FEFO logic, and row-level database locks.
4. **Step 4: API Controllers & Data Presenters** - Implement auth controllers and scoped CRUD operations reading `ctx.auth.user`.
5. **Step 5: Frontend React Dashboard & Auth State** - Implement login/register pages, protected routes, and the React expiration dashboard.
6. **Step 6: Automated Testing Suite** - Write Japa tests ensuring multi-tenant data separation and concurrent transaction locking.