# API Documentation — Sales Order Management

Base URL: `http://localhost:5000/api`

All responses share a common envelope:

```json
{ "success": true, "data": { } }
```
Errors:
```json
{ "success": false, "message": "Delivery date is required", "details": null }
```

---

## Health

### `GET /health`
Returns service status.

---

## Customers (Task 1)

### `GET /customers`
List customers. Query params: `q` (search), `status`, `page`, `limit`.
```
GET /customers?q=shifa&status=active
```
Response: `{ success, total, page, limit, data: [Customer] }`

### `GET /customers/search?q=`
Search by name / code / contact / mobile. Returns up to 20 matches.

### `GET /customers/:id`
Single customer profile (includes `availableCredit` virtual).

### `GET /customers/:id/outstanding`
```json
{ "success": true, "data": {
  "customerId": "...", "customerCode": "CUST-001", "customerName": "Al Noor Pharmacy",
  "creditLimit": 5000, "outstandingAmount": 708.903, "availableCredit": 4291.097 } }
```

### `GET /customers/:id/history`
Customer purchase history (orders + totals).
```json
{ "success": true, "data": {
  "customer": { "id": "...", "code": "CUST-001", "name": "Al Noor Pharmacy" },
  "orderCount": 3, "totalPurchased": 458.903, "orders": [ ] } }
```

**Customer model**

| Field | Type | Notes |
|---|---|---|
| customerCode | String | unique |
| customerName | String | required |
| contactPerson, mobileNumber, email | String | |
| address | Object | `{ country, city, area, zipcode, googleMapUrl }` |
| creditLimit | Number | set by super admin |
| outstandingAmount | Number | from statement |
| status | enum | `active` \| `inactive` |

---

## Products (Task 2)

### `GET /products`
List products. Query params: `q`, `brand`, `category`, `generic`, `status`,
`inStock=true`, `page`, `limit`.

### `GET /products/search?q=`
Search by name / code / brand / generic / category.

### `GET /products/:id`
Single product (stock, price, discount, FOC, `hasFoc` virtual).

**Product model**

| Field | Type | Notes |
|---|---|---|
| productCode | String | unique |
| productName | String | required |
| genericName, brand, category | String | |
| variation | String | e.g. `500mg Tablet` |
| stockQuantity | Number | |
| sellingPrice | Number | |
| discountPercentage | Number | 0–100 |
| focBuyQuantity / focFreeQuantity | Number | Buy X get Y free |
| status | enum | `active` \| `inactive` |

---

## Product Intelligence (Task 3)

### `GET /products/:id/similar`
Products with the same generic / same category, plus alternative brands when
the current product is out of stock.
```json
{ "success": true, "data": {
  "product": { "id": "...", "name": "...", "generic": "Paracetamol" },
  "sameGeneric": [ ], "sameCategory": [ ], "alternativeBrands": [ ],
  "outOfStock": false } }
```

### `GET /products/:id/comparison`
Compare brand / price / available stock / discount across the same generic.
```json
{ "success": true, "data": { "generic": "Paracetamol", "count": 4, "comparison": [
  { "productId": "...", "productName": "...", "brand": "Panadol",
    "price": 0.8, "availableStock": 450, "discount": 5, "isCurrent": true } ] } }
```

### `GET /products/:id/variations`
Variations sharing the generic (e.g. Paracetamol → 500mg Tablet, 650mg Tablet,
Syrup, Drops).

---

## Orders (Task 4 & 5)

### `POST /orders`
Create an order. Validates customer, products, stock, quantity, delivery date.

**Request body**
```json
{
  "customer": "<customerId>",
  "salesPerson": "<userId>",
  "orderDate": "2026-06-03T00:00:00.000Z",
  "deliveryDate": "2026-06-06T00:00:00.000Z",
  "remarks": "Monthly stock",
  "status": "submitted",
  "items": [
    { "product": "<productId>", "quantity": 20, "rate": 10, "discountPercentage": 5, "focQuantity": 0 }
  ]
}
```
- `rate`, `discountPercentage`, `focQuantity` are optional — they default to the
  product's selling price / discount / computed FOC scheme.
- `status: "draft"` relaxes stock/active/delivery-date validation.

**Validation (Scenarios 5–10)** → `400` with a message:
insufficient stock, inactive product, inactive customer, quantity ≤ 0,
missing customer, missing delivery date.

**Response** `201`: the created order with computed line + order totals.

### `GET /orders`
List orders (Task 5). Query params: `q`, `orderNumber`, `customer`, `status`,
`dateFrom`, `dateTo`, `page`, `limit`.
```json
{ "success": true, "total": 10, "data": [
  { "id": "...", "orderNumber": "SO-20260001", "customerName": "Al Noor Pharmacy",
    "orderDate": "...", "deliveryDate": "...", "totalAmount": 199.5, "status": "submitted" } ] }
```

### `GET /orders/:id`
Full order with populated customer & sales person.

### `PATCH /orders/:id/status`  (order status workflow)
Advance an order through its lifecycle. Body: `{ "status": "confirmed" }`.

Allowed transitions:
```
draft      -> submitted | cancelled
submitted  -> confirmed | cancelled
confirmed  -> delivered | cancelled
delivered  -> (terminal)
cancelled  -> (terminal)
```
Side effects:
- `draft -> submitted` re-validates active status + stock, **decrements stock**,
  adds to the customer's outstanding, and emails the PDF.
- `-> cancelled` (from submitted/confirmed) **restores stock** and reduces outstanding.

Invalid transitions return `400` with the list of allowed next statuses.
Response includes `allowedNext` for the new status.

### `GET /orders/:id/pdf` (Task 6)
Streams the order PDF (`application/pdf`). Add `?inline=true` to view in-browser
instead of downloading. PDF includes company info, order number, customer
details, product table (with discount + FOC), and the order summary.

### `POST /orders/:id/email` (Task 7)
(Re)sends the order notification email with the PDF attached to the company
owner + sales manager (or `MAIL_RECIPIENTS`). Returns a skipped message if SMTP
is not configured.

**Order totals**
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

---

## Meta

### `GET /meta/company`
Company profile + VAT% + currency (for the order form / PDF preview).

### `GET /meta/users?role=sales_person`
Active users by role (used to populate the Sales Person dropdown).
