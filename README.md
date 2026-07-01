# E-Commerce Order Processing System

> Full-stack order processing with **React + Vite**, **Express.js**, **Supabase (PostgreSQL)**, **JWT authentication**, and **n8n workflow automation**.

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  React App  │────▶│  Express API  │────▶│  n8n Webhook        │────▶│   Supabase   │
│  (Vite)     │◀────│  (JWT Auth)   │◀────│  (Workflow Engine)  │◀────│  PostgreSQL  │
│  :5173      │     │  :3000        │     │  :5678              │     │  :6543       │
└─────────────┘     └──────────────┘     └──────────────────────┘     └──────────────┘
```

[![GitHub](https://img.shields.io/badge/GitHub-ademhmercha/n8n--order--processing-181717?style=flat&logo=github)](https://github.com/ademhmercha/n8n-order-processing)
![React](https://img.shields.io/badge/React-20232a?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase)
![n8n](https://img.shields.io/badge/n8n-EA4B71?style=flat&logo=n8n)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=json-web-tokens)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [n8n Workflow Setup](#-n8n-workflow-setup)
- [API Reference](#-api-reference)
- [Order Flow (End to End)](#-order-flow-end-to-end)
- [Troubleshooting](#-troubleshooting)
- [Project Notes](#-project-notes)

---

## 📖 Project Overview

This system processes e-commerce orders **end-to-end**:

1. Customers register/login via JWT
2. Browse a product catalog with live stock
3. Place orders → Express creates a pending order → triggers an **n8n webhook**
4. n8n handles **all business logic**: stock validation, inventory decrement, invoice generation, warehouse task creation, and customer notifications
5. Results flow back to the UI in real-time

**Key design principle:** Express is intentionally thin. All business logic lives in the n8n workflow, making it easy to modify order processing without touching backend code.

---

## 🔧 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| n8n | Latest | `npm install -g n8n` |
| Supabase | Any | [supabase.com](https://supabase.com) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

---

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/ademhmercha/n8n-order-processing.git
cd n8n-order-processing

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values (see [Environment Variables](#-environment-variables) below).

### 3. Run Database Migration

Run the SQL in `backend/db/migrate.sql` against your Supabase database via the Supabase SQL Editor.

### 4. Start the Stack

Open **three terminals**:

```bash
# Terminal 1 — Backend API
cd backend
node server.js
# → http://localhost:3000
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

```bash
# Terminal 3 — n8n
n8n start
# → http://localhost:5678
```

Open `http://localhost:5173` in your browser.

---

## 🔐 Environment Variables

All configuration lives in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.peqtogtlszfibszuyyeq:<PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=your_jwt_secret_here
N8N_WEBHOOK_URL=http://localhost:5678/webhook/order-processing
PORT=3000
```

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Full PostgreSQL connection string to Supabase pooler. Format: `postgresql://postgres.YOUR_REF:YOUR_PASSWORD@POOLER_HOST:6543/postgres` | `postgresql://postgres.abc123:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `a1b2c3d4e5...` |
| `N8N_WEBHOOK_URL` | n8n webhook URL the backend calls when an order is placed. Use the **production** URL (not `/webhook-test/`). | `http://localhost:5678/webhook/order-processing` |
| `PORT` | Port for the Express server | `3000` |

> **⚠️ Important:** Replace `<PASSWORD>` in `DATABASE_URL` with your actual Supabase database password. Do NOT commit real passwords to Git.

---

## 🗄️ Database Setup (Supabase)

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Wait for the database to provision (~2 minutes)
3. Go to **Project Settings → Database** to find your connection string
4. Use the **Pooler** connection (port 6543), not the direct connection (port 5432)

### Run Migrations

Open your Supabase dashboard → **SQL Editor** → paste the contents of `backend/db/migrate.sql` → click **Run**.

```sql
-- backend/db/migrate.sql
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
```

### (Optional) Seed Sample Products

```sql
-- backend/db/seed.sql
INSERT INTO products (name, price, stock_quantity) VALUES
  ('Wireless Bluetooth Headphones', 79.99, 25),
  ('Ergonomic Mechanical Keyboard', 129.99, 15),
  ('USB-C Hub 7-in-1', 34.99, 50),
  ('27" 4K IPS Monitor', 399.99, 10),
  ('Portable SSD 1TB', 109.99, 30);
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `customers` | Registered users (name, email, password hash) |
| `products` | Product catalog with name, price, and current stock quantity |
| `orders` | Order lifecycle — status tracks `pending → confirmed | failed` |
| `invoices` | Generated invoice references (invoice number, file path) |
| `warehouse_tasks` | Fulfillment queue items for warehouse staff |
| `notifications` | Customer alerts (new order, status change, etc.) |

---

## ⚙️ n8n Workflow Setup

This is **the most important section**. The n8n workflow is the brain of the system — it handles all order processing logic.

### 📦 Installation

```bash
# Install n8n globally
npm install -g n8n

# Start n8n
n8n start
```

Open `http://localhost:5678` in your browser.

### 📥 Importing the Workflow

1. In the n8n UI, click **Workflows** in the left sidebar
2. Click the **Import from File** button (or use the + dropdown)
3. Select `n8n/order-processing-workflow.json` from this project
4. The workflow will appear with all nodes connected

> **📸 Workflow Editor:**  
> ![n8n Workflow Editor](screenshots/n8n%20workflow%20editor.png)  
> *The complete workflow pipeline — 11 connected nodes from Webhook trigger to Response nodes*

### 🔑 Configuring PostgreSQL Credentials

This is the most common source of issues. Follow these steps carefully:

1. **Click any Postgres node** in the workflow (e.g., "Check Product Stock")
2. Under **Credential to connect with**, click **Create New** (or the + icon)

   > **📸 Screenshot:** ![Postgres Credential Setup](screenshots/n8n-postgres-credential.svg)  
   > *Enter your Supabase pooler credentials — Host, Port 6543, SSL set to Disable*

3. Fill in the form:

| Field | Value | Notes |
|-------|-------|-------|
| **Host** | `aws-0-eu-west-1.pooler.supabase.com` | Use YOUR region's pooler host |
| **Port** | `6543` | Pooler port, **not** 5432 |
| **Database** | `postgres` | Default Supabase database name |
| **User** | `postgres.peqtogtlszfibszuyyeq` | Format: `postgres.YOUR_PROJECT_REF` |
| **Password** | Your Supabase database password | Found in Project Settings → Database |
| **SSL** | **Disable** | Required due to Supabase pooler self-signed cert |

4. Click **Test Connection** — you should see a green success message
5. Click **Save**
6. n8n will automatically apply this credential to all other Postgres nodes in the workflow

> **⚠️ Red warning triangles** on Postgres nodes will disappear once the credential is configured.

### 🔄 Workflow Nodes Explained

The workflow is a linear pipeline with one conditional branch. Here is every node in order:

---

#### Node 1 — Webhook (New Order Trigger)

```
┌─────────────────────────────┐
│  Webhook                    │
│  • Method: POST             │
│  • Path: order-processing   │
│  • Respond: Webhook Node    │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Webhook
- **Method:** POST
- **Path:** `order-processing`
- **Respond:** Using "Respond to Webhook" Node
- **Receives:** `{ orderId, customerId, productId, quantity }`
- **Test URL:** `http://localhost:5678/webhook-test/order-processing`
- **Production URL:** `http://localhost:5678/webhook/order-processing`

> **📸 Screenshot:** ![Webhook Node Config](screenshots/n8n-webhook-node.svg)  
> *Webhook node — POST method, path `/order-processing`, with test and production URLs*

> **Important:** The test URL (`/webhook-test/`) only works when you click **"Listen for test event"** and handles ONE request per click. For continuous use, publish the workflow and use the production URL.

---

#### Node 2 — Validate Order Data

```
         │
         ▼
┌─────────────────────────────┐
│  Code (JavaScript)          │
│  Validates: orderId,        │
│  customerId, productId,     │
│  quantity                   │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Code (JavaScript)
- **Input data:** From webhook: `{ orderId, customerId, productId, quantity }`
- **Logic:**
  - Checks all four fields exist and are non-empty
  - Casts `quantity` to a Number
  - Throws an error (stopping the workflow) if validation fails
- **Output:** Cleaned data object ready for the next node

```javascript
// Simplified validation logic
const data = $input.first().json;
if (!data.orderId || !data.customerId || !data.productId || !data.quantity) {
  throw new Error('Missing required fields');
}
data.quantity = Number(data.quantity);
return data;
```

---

#### Node 3 — Check Product Stock

```
         │
         ▼
┌─────────────────────────────┐
│  Postgres                   │
│  SELECT stock_quantity,     │
│  price FROM products        │
│  WHERE id = $1              │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Postgres
- **Query:** `SELECT id, name, stock_quantity, price FROM products WHERE id = $1`
- **Parameter:** `productId` (from the validated data)
- **Result:** Returns the current product row with its stock level and price, or an empty result if the product doesn't exist

---

#### Node 4 — Merge Order + Stock

```
         │
         ▼
┌─────────────────────────────┐
│  Code (JavaScript)          │
│  Compares: stock_quantity   │
│  >= quantity                │
│  Outputs: inStock boolean   │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Code (JavaScript)
- **Input:** Data from Node 2 (order) + Node 3 (product stock)
- **Logic:**
  - Extracts `stock_quantity` from the product query result
  - Compares: `inStock = stock_quantity >= quantity`
  - Combines all fields into one object
- **Output:** `{ orderId, customerId, productId, quantity, productName, price, stock_quantity, inStock }`

---

#### Node 5 — IF Stock Available?

```
         │
         ▼
    ┌────┴────┐
    │  IF     │
    │ inStock │
    │ === true│
    └────┬────┘
    ✅   │    ❌
    Yes  │    No
         │
         ▼
```

- **Type:** IF
- **Condition:** `inStock === true`
- **TRUE branch (✅):** Stock is sufficient → proceed to reserve stock, generate invoice, etc.
- **FALSE branch (❌):** Insufficient stock → mark order as failed and return error

---

#### Node 6a — Reserve Stock (TRUE Branch)

```
         │  ✅
         ▼
┌─────────────────────────────┐
│  Postgres                   │
│  UPDATE products SET        │
│  stock_quantity =           │
│  stock_quantity - $1        │
│  WHERE id = $2              │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Postgres
- **Query:** `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`
- **Parameters:** `$1 = quantity`, `$2 = productId`
- **Atomic operation:** This runs in a single SQL statement, so it's safe under concurrent requests. PostgreSQL handles the locking.

---

#### Node 7 — Generate Invoice

```
         │
         ▼
┌─────────────────────────────┐
│  Code (JavaScript)          │
│  Creates: INV-{timestamp}   │
│  -{orderId}                 │
│  Calculates: total =        │
│  price × quantity           │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Code (JavaScript)
- **Logic:**
  - Creates invoice number: `INV-{Date.now()}-{orderId}`
  - Calculates total: `price * quantity`
  - Generates file path: `/invoices/{invoiceNumber}.pdf`
- **Note:** This creates the **invoice reference record only**, not an actual PDF file. A real PDF generation service can be added to this node later.

---

#### Node 8 — Save Invoice to Database

```
         │
         ▼
┌─────────────────────────────┐
│  Postgres                   │
│  INSERT INTO invoices       │
│  (order_id, invoice_number, │
│  file_path, created_at)     │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Postgres
- **Query:** `INSERT INTO invoices (order_id, invoice_number, file_path, created_at) VALUES ($1, $2, $3, NOW())`
- **Parameters:** `$1 = orderId`, `$2 = invoiceNumber`, `$3 = filePath`

---

#### Node 9 — Create Warehouse Task

```
         │
         ▼
┌─────────────────────────────┐
│  Postgres                   │
│  INSERT INTO                │
│  warehouse_tasks            │
│  (order_id, status,         │
│  created_at)                │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Postgres
- **Query:** `INSERT INTO warehouse_tasks (order_id, status, created_at) VALUES ($1, 'pending_pack', NOW())`
- **Purpose:** Creates a fulfillment task for the warehouse team to pick and pack the items.

---

#### Node 10 — Create Customer Notification

```
         │
         ▼
┌─────────────────────────────┐
│  Postgres                   │
│  INSERT INTO notifications  │
│  (customer_id, order_id,    │
│  message, is_read)          │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Postgres
- **Query:** `INSERT INTO notifications (customer_id, order_id, message, is_read) VALUES ($1, $2, $3, false)`
- **Message:** `` `Your order #${orderId} has been confirmed.` ``

---

#### Node 11 — Update Order Status = Confirmed

```
         │
         ▼
┌─────────────────────────────┐
│  Postgres                   │
│  UPDATE orders SET          │
│  status='confirmed',        │
│  invoice_path=$1            │
│  WHERE id = $2              │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Postgres
- **Query:** `UPDATE orders SET status = 'confirmed', invoice_path = $1 WHERE id = $2`
- **Parameters:** `$1 = filePath`, `$2 = orderId`
- **Final step** of the success branch — order is now fully processed.

---

#### Node 12 — Respond — Success

```
         │
         ▼
┌─────────────────────────────┐
│  Respond to Webhook         │
│  200 OK                     │
│  { success: true,           │
│    order: {...} }           │
└─────────────────────────────┘
```

- **Type:** Respond to Webhook
- **HTTP Status:** 200
- **Response Body:**
```json
{
  "success": true,
  "message": "Order confirmed",
  "order": {
    "id": 1,
    "invoice_number": "INV-1719000000000-1",
    "invoice_path": "/invoices/INV-1719000000000-1.pdf",
    "status": "confirmed"
  }
}
```

---

#### Node 6b — Update Order Status = Failed (FALSE Branch)

```
         │  ❌
         ▼
┌─────────────────────────────┐
│  Postgres                   │
│  UPDATE orders SET          │
│  status = 'failed'          │
│  WHERE id = $1              │
└─────────────────────────────┘
         │
         ▼
```

- **Type:** Postgres
- **Query:** `UPDATE orders SET status = 'failed' WHERE id = $1`
- **Runs when:** Stock is insufficient. Marks the order as failed in the database.

---

#### Node 13 — Respond — Failure

```
         │
         ▼
┌─────────────────────────────┐
│  Respond to Webhook         │
│  409 Conflict               │
│  { success: false,          │
│    message: "Insufficient   │
│    stock" }                 │
└─────────────────────────────┘
```

- **Type:** Respond to Webhook
- **HTTP Status:** 409
- **Response Body:**
```json
{
  "success": false,
  "message": "Insufficient stock"
}
```

### ✅ Activating the Workflow for Production

1. Once all credentials are configured, click the **Publish** button (top-right corner of the n8n editor)
2. The status indicator changes from **"Inactive"** to **"Published"** (green dot)
3. The production webhook URL becomes active:
   ```
   http://localhost:5678/webhook/order-processing
   ```

> **📸 Screenshot:** ![Publish Workflow](screenshots/n8n-publish-button.svg)  
> *Click Publish to activate — status changes from Inactive (red) to Published (green)*

> **⚠️ Critical:** The Express backend uses the **production URL** (`/webhook/`), NOT the test URL (`/webhook-test/`). The workflow must be Published for the production URL to work. The test URL only responds when you click "Listen for test event" in the editor.

### 🧪 Testing the Workflow Manually

#### Method 1: Using n8n's Built-in Test Mode

1. Open the workflow in the n8n editor
2. Click **"Listen for test event"** (the ear icon near the Webhook node)
3. Send a test request using one of the commands below
4. Each click of "Listen for test event" handles exactly ONE request

#### Method 2: Using PowerShell (Windows)

```powershell
# Copy and run this command
$body = @{
    orderId = 1
    customerId = 1
    productId = 1
    quantity = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook-test/order-processing" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

#### Method 3: Using cURL (Mac/Linux)

```bash
# Copy and run this command
curl -X POST http://localhost:5678/webhook-test/order-processing \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1, "customerId": 1, "productId": 1, "quantity": 2}'
```

#### Successful Response

```json
{
  "success": true,
  "message": "Order confirmed",
  "order": {
    "id": 1,
    "invoice_number": "INV-1719000000000-1",
    "invoice_path": "/invoices/INV-1719000000000-1.pdf",
    "status": "confirmed"
  }
}
```

#### Failure Response (Insufficient Stock)

```json
{
  "success": false,
  "message": "Insufficient stock"
}
```

#### Debugging with Executions

- Open the **Executions** tab in n8n (left sidebar)
- Every webhook call creates an execution log
- Click any execution to see step-by-step what each node received, did, and output
- Red nodes indicate where the error occurred — click them to see the error message

> **📸 Executions Tab (all successful):**  
> ![n8n Executions](screenshots/n8n%20executions.png)  
> *Every order processed successfully — green checkmarks across all executions*

### ❌ Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| **"Host not found"** | Using the direct Supabase host instead of pooler | Use `aws-0-eu-west-1.pooler.supabase.com` (with your region) |
| **"self-signed certificate in certificate chain"** | Supabase pooler uses a self-signed cert | Set **SSL to "Disable"** in the n8n Postgres credential |
| **"The requested webhook is not registered"** | Trying the test URL without clicking "Listen for test event" | Click "Listen for test event" first OR publish the workflow and use the production URL |
| **"insert or update on table invoices violates foreign key constraint"** | The order doesn't exist in the orders table yet | The Express backend inserts the pending order BEFORE calling n8n. If testing manually, insert the order first: `INSERT INTO orders (customer_id, product_id, quantity, status) VALUES (1, 1, 2, 'pending')` |
| **"Couldn't connect with these settings"** | Wrong connection parameters in Postgres credential | Verify: Port is 6543, User is `postgres.YOUR_REF`, SSL is disabled |

---

## 🔌 API Reference

All endpoints are prefixed with `/api`. The Express server runs on `http://localhost:3000`.

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ No | Create a new account. Body: `{ name, email, password }` → Returns JWT |
| `POST` | `/api/auth/login` | ❌ No | Login. Body: `{ email, password }` → Returns JWT |

### Product Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/products` | ❌ No | List all products with id, name, price, stock_quantity |

### Order Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/orders` | ✅ Yes | Place an order. Body: `{ productId, quantity }`. Inserts pending order → calls n8n webhook → returns n8n's response |
| `GET` | `/api/orders` | ✅ Yes | Get all past orders for the logged-in user, joined with product name and price |

### Notification Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/notifications` | ✅ Yes | Get all notifications for the logged-in user, ordered by date DESC |
| `PATCH` | `/api/notifications/:id/read` | ✅ Yes | Mark a single notification as read |

### Standard Response Format

```json
// Success
{ "success": true, "data": {...}, "message": "..." }

// Error
{ "success": false, "message": "Error description" }
```

---

## 🔄 Order Flow (End to End)

Here is the complete journey of a single order through the system:

```
1. User registers / logs in
   └─▶ Frontend calls POST /api/auth/login
       └─▶ Backend verifies credentials
           └─▶ Returns JWT token (stored in localStorage)
               └─▶ Frontend attaches JWT to all subsequent requests via axios interceptor

2. User browses products
   └─▶ Frontend calls GET /api/products (no auth needed)
       └─▶ Backend queries Supabase: SELECT * FROM products
           └─▶ Returns product list with prices and stock levels
               └─▶ Frontend renders product cards with stock indicators

3. User clicks "Place Order" (or "Add to Cart" → checkout)
   └─▶ Frontend calls POST /api/orders { productId, quantity }
       └─▶ JWT interceptor attaches Authorization: Bearer <token>

4. Express validates the JWT (auth middleware)
   └─▶ Decodes userId, name from token
       └─▶ Checks product exists in database

5. Express inserts a pending order
   └─▶ INSERT INTO orders (customer_id, product_id, quantity, status)
       └─▶ Status is set to 'pending'
           └─▶ New order ID is captured

6. Express calls the n8n webhook
   └─▶ POST http://localhost:5678/webhook/order-processing
       └─▶ Body: { orderId, customerId, productId, quantity }
           └─▶ Waits for n8n's response (synchronous call)

7. n8n executes the workflow:
   ┌────────────────────────────────────────────────┐
   │  Webhook receives the POST request              │
   │  └─▶ Validates all fields are present           │
   │      └─▶ Checks product stock in Supabase       │
   │          └─▶ IF stock >= quantity?               │
   │              ├─ ✅ YES ───────────────────┐      │
   │              │  ├─ Decrement stock         │      │
   │              │  ├─ Generate invoice        │      │
   │              │  ├─ Save invoice to DB      │      │
   │              │  ├─ Create warehouse task   │      │
   │              │  ├─ Create notification     │      │
   │              │  ├─ Update order→confirmed  │      │
   │              │  └─ Return success response │      │
   │              └─ ❌ NO ────────────────────┐      │
   │                 ├─ Update order→failed    │      │
   │                 └─ Return failure response│      │
   └────────────────────────────────────────────────┘

8. Express receives n8n's response
   └─▶ If success: Returns { success: true, order: {...} } to frontend
       └─▶ If failure: Returns { success: false, message: "Insufficient stock" } with 409 status

9. Frontend handles the response
   └─▶ Success: Shows green alert "Order confirmed! Invoice: INV-xxx"
       └─▶ Failure: Shows red alert "Insufficient stock"
           └─▶ Navbar bell badge updates (new notification)
               └─▶ User can click bell to see: "Your order #X has been confirmed."
                   └─▶ Clicking notification marks it as read

10. User can view order history at /orders
    └─▶ Calls GET /api/orders (JWT required)
        └─▶ Returns all orders with product details and status badges
            └─▶ Status badges: Confirmed (green) | Pending (yellow) | Failed (red)
```

---

## 🔍 Troubleshooting

### Backend won't start

```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Check for missing environment variables
echo %DATABASE_URL%
```

### Frontend shows 401 errors

- **Cause:** JWT token expired or missing
- **Fix:** Log out and log back in. Tokens last 7 days by default.

### Orders stuck in 'pending'

- **Cause 1:** n8n workflow is not published (most common)
  - **Fix:** Open n8n → click **Publish** button
- **Cause 2:** n8n is not running
  - **Fix:** `n8n start` in a terminal
- **Cause 3:** n8n webhook URL mismatch
  - **Fix:** Verify `N8N_WEBHOOK_URL` in `.env` points to `http://localhost:5678/webhook/order-processing` (not `/webhook-test/`)

### Stock not decrementing

- **Cause:** Postgres credential not configured on the Reserve Stock node
- **Fix:** Check that all Postgres nodes have the credential set. Red triangle = missing credential.

### n8n won't start

```bash
# Check if port 5678 is in use
netstat -ano | findstr :5678

# If in use, kill the process or change n8n port:
n8n start --port=5679
# Then update N8N_WEBHOOK_URL in .env to use port 5679
```

---

## 📝 Project Notes

- This project was built as **Workflow 1** of a larger e-commerce automation platform
- **n8n handles ALL business logic** — stock validation, inventory management, invoice generation, warehouse task creation, and customer notifications
- **Express is intentionally thin** — it only authenticates users, manages the session, and routes orders to n8n
- **This separation of concerns means:**
  - You can modify the order processing workflow without touching a single line of backend code
  - You can add new workflow steps (email confirmation, SMS, PDF generation) directly in n8n
  - You can replace the entire backend without losing business logic
- The n8n workflow JSON file is version-controlled in `n8n/order-processing-workflow.json` — import it to restore or share the workflow
- PostgreSQL SSL uses `rejectUnauthorized: false` to handle Supabase pooler's self-signed certificate
- CORS is configured to allow requests from `http://localhost:5173` (Vite dev server) only

---

## 📄 License

MIT
