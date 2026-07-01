# E-Commerce Order Processing — n8n Workflow

> Order processing automation with n8n, Express.js (thin API layer), and Supabase PostgreSQL.

## Prerequisites

- Node.js v18+
- n8n (install: `npm install -g n8n`)
- Supabase PostgreSQL database

## Quick Start

### Option 1: Docker (recommended)

```bash
cp backend/.env.example backend/.env  # then edit with your values
docker compose up -d
```

### Option 2: Manual

```bash
# Terminal 1 — n8n
n8n start

# Terminal 2 — Backend
cd backend && node server.js

# Terminal 3 — Frontend
cd frontend && npm run dev
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=change_this_to_a_random_secret
N8N_WEBHOOK_URL=http://localhost:5678/webhook/order-processing
PORT=3000
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooler connection string (port 6543) |
| `JWT_SECRET` | Secret for signing JWT tokens — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `N8N_WEBHOOK_URL` | n8n production webhook URL — must use `/webhook/` not `/webhook-test/` |
| `PORT` | Express server port (default 3000) |

(The Express backend runs on `:3000`, calls the n8n webhook when an order is placed.)

## n8n Workflow Setup

This workflow is the brain of the system — it handles all order processing logic.

### Import the Workflow

1. Open `http://localhost:5678` in your browser
2. Click **Workflows** → **Import from File**
3. Select `n8n/order-processing-workflow.json`
4. The workflow appears with 11 connected nodes

![n8n Workflow Editor](screenshots/n8n%20workflow%20editor.png)

### Configure PostgreSQL Credentials

1. Click any **Postgres node** in the workflow
2. Under **Credential to connect with**, click **Create New**
3. Fill in:

| Field | Value |
|-------|-------|
| **Host** | `aws-0-eu-west-1.pooler.supabase.com` (your pooler host) |
| **Port** | `6543` |
| **Database** | `postgres` |
| **User** | `postgres.YOUR_PROJECT_REF` |
| **Password** | Your Supabase DB password |
| **SSL** | **Disable** (required for Supabase pooler) |

4. Click **Test Connection** → green = success → **Save**

> All Postgres nodes share the same credential — red warning triangles disappear once configured.

### Workflow Nodes

The workflow is a linear pipeline with one conditional branch:

1. **Webhook** — POST `/order-processing`, receives `{ orderId, customerId, productId, quantity }`
2. **Validate Order Data** (Code) — checks all fields exist
3. **Check Product Stock** (Postgres) — `SELECT stock_quantity, price FROM products WHERE id = $1`
4. **Merge Order + Stock** (Code) — compares stock vs quantity, outputs `inStock` boolean
5. **IF Stock Available?** — if `inStock === true` → success branch, else → failure branch

**Success branch (stock ≥ quantity):**
6. **Reserve Stock** (Postgres) — `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`
7. **Generate Invoice** (Code) — creates invoice number `INV-{timestamp}-{orderId}`, calculates total
8. **Save Invoice** (Postgres) — `INSERT INTO invoices`
9. **Create Warehouse Task** (Postgres) — `INSERT INTO warehouse_tasks`
10. **Create Notification** (Postgres) — `INSERT INTO notifications`
11. **Update Order → confirmed** (Postgres) — `UPDATE orders SET status = 'confirmed'`
12. **Respond Success** — 200 OK `{ success: true, order: {...} }`

**Failure branch (insufficient stock):**
6b. **Update Order → failed** (Postgres) — `UPDATE orders SET status = 'failed'`
13. **Respond Failure** — 409 Conflict `{ success: false, message: "Insufficient stock" }`

### Activate for Production

1. Click **Publish** (top-right corner)
2. Status changes from "Inactive" to "Published" (green dot)
3. Production URL becomes active: `http://localhost:5678/webhook/order-processing`

> **Critical:** The Express backend uses the **production** URL (`/webhook/`), NOT `/webhook-test/`. The workflow **must be Published** for it to work.

### Test Manually

```powershell
$body = @{ orderId = 1; customerId = 1; productId = 1; quantity = 2 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5678/webhook-test/order-processing" `
  -Method Post -Body $body -ContentType "application/json"
```

### Debug with Executions

Open the **Executions** tab in n8n — every webhook call creates an execution log. Click any execution to see step-by-step node outputs.

![n8n Executions](screenshots/n8n%20executions.png)

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Host not found" | Using direct host instead of pooler | Use `aws-0-eu-west-1.pooler.supabase.com` |
| "self-signed certificate" | Supabase pooler self-signed cert | Set SSL to **Disable** in credential |
| "Webhook not registered" | Using test URL without listening | Publish workflow and use production URL |
| "Foreign key violation" | Order doesn't exist yet | Express inserts pending order first — if testing manually, run `INSERT INTO orders (customer_id, product_id, quantity, status) VALUES (1, 1, 2, 'pending')` |
| "Couldn't connect" | Wrong credentials | Verify Port 6543, User `postgres.YOUR_REF`, SSL disabled |

## Order Flow Summary

1. User places order → Express inserts `pending` order in Supabase
2. Express calls n8n webhook with `{ orderId, customerId, productId, quantity }`
3. n8n validates, checks stock, then either:
   - ✅ **Success:** decrements stock, generates invoice, creates warehouse task & notification, updates order to `confirmed`
   - ❌ **Failure:** updates order to `failed`
4. Response flows back to the UI

## Troubleshooting (n8n)

**Orders stuck in 'pending':**
- Open n8n → click **Publish** (most common)
- Ensure n8n is running (`n8n start`)
- Verify `N8N_WEBHOOK_URL` in `.env` is `http://localhost:5678/webhook/order-processing`

**n8n won't start:**
```bash
netstat -ano | findstr :5678
n8n start --port=5679  # if port in use, then update N8N_WEBHOOK_URL
```

**Stock not decrementing:**
- Postgres credential not configured on Reserve Stock node — check for red triangles

## Design Principle

Express is intentionally thin — it only authenticates users and routes orders to n8n. **All business logic** (stock validation, inventory, invoicing, warehouse tasks, notifications) lives in the n8n workflow. Modify order processing without touching backend code.
