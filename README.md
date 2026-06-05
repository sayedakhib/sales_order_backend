# Sales Order Management — Backend API

REST API for the Sales Order Management module (medical distribution).
Built with **Node.js, Express and MongoDB (Mongoose)**.

> Frontend (React + Ant Design) lives in a separate repository.

---

## Features

- **Customers** — list, search (name/code), profile, outstanding balance, purchase history
- **Products** — list, search (name/code/brand/generic), stock/price/discount/FOC
- **Product intelligence** — similar products, brand comparison, variations
- **Orders** — creation with full business-logic validation (10 scenarios), listing with filters
- **Order status workflow** — `draft → submitted → confirmed → delivered → cancelled` (with stock/outstanding side-effects)
- **PDF generation** — per-order PDF (PDFKit)
- **Email notification** — order PDF emailed to owner + sales manager (Nodemailer)

---

## Tech Stack

| Area | Choice |
|---|---|
| Runtime | Node.js (18+) |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 8 |
| PDF | PDFKit |
| Email | Nodemailer (SMTP) |

---

## Prerequisites

- **Node.js** 18+ (tested on Node 24)
- **MongoDB** 6+ running locally (default `mongodb://127.0.0.1:27017`)

Start MongoDB (Windows service): `net start MongoDB`
…or directly: `mongod --dbpath "C:\path\to\data"`

---

## Setup

> ⚠️ **MongoDB must be running before you start the backend.** The API connects to
> MongoDB on startup and will exit if it can't reach it (`ECONNREFUSED ...:27017`).
> MongoDB is a **separate program** — `npm start` does NOT launch it for you.

```bash
# 1. START MONGODB FIRST (in its own terminal / as a service)
#    Windows service:
net start MongoDB
#    ...OR run it directly (keep this terminal open):
#    mongod --dbpath "C:\data\sales_order"

# 2. install dependencies
npm install

# 3. create your env file from the template, then edit values
cp .env.example .env        # Windows: copy .env.example .env

# 4. seed the database (20 products, 6 customers, 5 users, 10 orders)
npm run seed

# 5. start the API
npm start                   # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

> **Order of services:** MongoDB → backend → frontend. Each depends on the one before it.

### Scripts
| Command | Description |
|---|---|
| `npm start` | Start the API server |
| `npm run dev` | Start with auto-reload (`node --watch`) |
| `npm run seed` | Wipe & re-populate the database |

---

## Environment Variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/sales_order` | Mongo connection |
| `VAT_PERCENT` | `5` | VAT applied to order net amount |
| `CURRENCY` | `OMR` | Display currency |
| `COMPANY_NAME` / `COMPANY_ADDRESS` / `COMPANY_PHONE` / `COMPANY_EMAIL` | – | Printed on PDF / emails |
| `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASS` | – | SMTP for order emails |
| `MAIL_FROM` | – | Email "from" header |
| `MAIL_RECIPIENTS` | seeded owner+manager | Comma-separated recipient override |

> **Email is optional.** If SMTP variables are blank, order creation still succeeds —
> the email step is skipped with a console warning. Fill them in (e.g. a Gmail
> App Password) to enable real delivery.
> **Never commit your real `.env`** — it is git-ignored.

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Customers
| Method | Path | Description |
|---|---|---|
| GET | `/customers` | List (filters: `q`, `status`, pagination) |
| GET | `/customers/search?q=` | Search by name/code |
| GET | `/customers/:id` | Profile |
| GET | `/customers/:id/outstanding` | Outstanding + available credit |
| GET | `/customers/:id/history` | Purchase history |

### Products
| Method | Path | Description |
|---|---|---|
| GET | `/products` | List (filters: `q`, `brand`, `category`, `generic`, `inStock`) |
| GET | `/products/search?q=` | Search by name/code/brand/generic |
| GET | `/products/:id` | Single product |
| GET | `/products/:id/similar` | Same generic / category / alternative brands |
| GET | `/products/:id/comparison` | Brand · price · stock · discount |
| GET | `/products/:id/variations` | Variations (e.g. 500mg/650mg/Syrup) |

### Orders
| Method | Path | Description |
|---|---|---|
| POST | `/orders` | Create order (validates 10 scenarios) |
| GET | `/orders` | List (filters: `q`, `orderNumber`, `customer`, `status`, `dateFrom`, `dateTo`) |
| GET | `/orders/:id` | Full order |
| PATCH | `/orders/:id/status` | Advance status (workflow) |
| GET | `/orders/:id/pdf` | Download order PDF |
| POST | `/orders/:id/email` | (Re)send order email |

### Meta
| Method | Path | Description |
|---|---|---|
| GET | `/meta/company` | Company profile + VAT/currency |
| GET | `/meta/users?role=` | Users by role |

> A full **Postman collection** (`postman_collection.json`) covering every endpoint
> and all 10 order scenarios is included.

---

## Order Business Logic

```
gross      = rate × quantity
lineDisc   = gross × discount%
lineTotal  = gross − lineDisc
subtotal   = Σ gross
discount   = Σ lineDisc
net        = subtotal − discount
vat        = net × VAT%
grandTotal = net + vat
FOC        = floor(quantity / focBuyQty) × focFreeQty
```

| Scenario | Rule | Result |
|---|---|---|
| 1 Normal | 10 × 20 | net 200 |
| 2 Discount | + 5% | discount 10, net 190 |
| 3 FOC | Buy 10 Get 1, qty 25 | FOC 2 |
| 4 Multiple | per-line + overall | grand total |
| 5 Insufficient stock | qty+FOC > stock | `400` |
| 6 Inactive product | order inactive product | `400` |
| 7 Inactive customer | order for inactive customer | `400` |
| 8 Invalid quantity | qty 0 | `400` |
| 9 Missing customer | no customer | `400` |
| 10 Missing delivery date | no delivery date | `400` |

---

## Project Structure

```
backend/
├── src/
│   ├── config/        # env + db connection
│   ├── models/        # Customer, Product, Order, User, Company, Counter
│   ├── controllers/   # route handlers
│   ├── routes/        # express routers
│   ├── services/      # orderCalc, pdfService, emailService
│   ├── middleware/    # error handling
│   ├── seed/          # seed data + seed script
│   ├── app.js         # express app
│   └── server.js      # entry point
├── postman_collection.json
├── .env.example
└── package.json
```
