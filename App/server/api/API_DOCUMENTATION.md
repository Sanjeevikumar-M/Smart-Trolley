# Smart Trolley API Documentation

## Overview
This document provides detailed information about all available endpoints in the Smart Trolley API. The API is built with Django REST Framework and handles user authentication, shopping sessions, cart management, and payment processing.

---

## Base URL
```
http://localhost:8000/api/
```

---

## Table of Contents
1. [User Management](#user-management)
2. [Session Management](#session-management)
3. [Cart Management](#cart-management)
4. [Payment Management](#payment-management)

---

## User Management

### 1. User Signup
**Endpoint:** `POST /user/signup`

**Purpose:** Create a new user account in the system.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone_number": "+91-9876543210",
  "email": "john.doe@example.com"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Full name of the user (max 255 characters) |
| phone_number | string | Yes | Unique phone number (max 20 characters) |
| email | string | No | User's email address |

**Success Response (201 Created):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid data format or missing required fields |
| 400 | Duplicate phone_number | Phone number already exists in the system |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone_number": "+91-9876543210",
    "email": "john.doe@example.com"
  }'
```

**Use Case:** Register a new customer before they can start shopping with a trolley.

---

## Session Management

### 2. Session Start
**Endpoint:** `POST /session/start`

**Purpose:** Initialize a shopping session and assign a trolley to a user.

**Request Body:**
```json
{
  "trolley_id": "TROLLEY-001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| trolley_id | string | Yes | Unique identifier of the trolley (max 50 characters) |
| user_id | UUID | No | ID of the registered user (optional for guest checkout) |

**Success Response (201 Created):**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Trolley inactive | The trolley is marked as inactive |
| 400 | Trolley already in use | Trolley is assigned to another active session |
| 404 | Trolley not found | The provided trolley_id doesn't exist |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "trolley_id": "TROLLEY-001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Use Case:** Customer picks up a trolley and starts shopping. Each session has a unique session_id that is used for subsequent operations.

**Important Notes:**
- Sessions timeout after a configurable period of inactivity (default: SESSION_TIMEOUT_SECONDS in settings)
- If a session has expired due to timeout, the trolley can be reused for a new session
- Guest checkout is supported (without user_id)

---

### 3. Session Heartbeat
**Endpoint:** `POST /session/heartbeat`

**Purpose:** Keep a shopping session active by refreshing its activity timestamp.

**Request Body:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | UUID | Yes | The active session ID |

**Success Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Session not found | The session_id doesn't exist |
| 400 | Session expired | The session exceeded the inactivity timeout |
| 400 | Session inactive | The session has already been ended |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/api/session/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111"
  }'
```

**Use Case:** Sent periodically by the client (e.g., every 30 seconds) to prevent the session from timing out while the customer is still shopping.

**Important Notes:**
- Must be called regularly to maintain an active session
- Failure to call this endpoint will result in session expiration
- The session timeout is typically 15-30 minutes (configured in settings)

---

### 4. Session End
**Endpoint:** `POST /session/end`

**Purpose:** Explicitly end a shopping session and free up the trolley.

**Request Body:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | UUID | Yes | The active session ID |

**Success Response (200 OK):**
```json
{
  "status": "ended"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Session not found | The session_id doesn't exist |
| 400 | Session expired | The session exceeded the inactivity timeout |
| 400 | Session inactive | The session has already been ended |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/api/session/end \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111"
  }'
```

**Use Case:** Customer finishes shopping and manually ends the session. This frees the trolley for the next customer immediately.

**Important Notes:**
- Sessions that timeout automatically will also be ended
- After ending, the trolley becomes available for a new session
- It's recommended to call this endpoint after payment is confirmed

---

## Cart Management

### 5. Cart Scan
**Endpoint:** `POST /cart/scan`

**Purpose:** Add or increase quantity of a product in the cart by scanning its barcode.

**Request Body:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111",
  "barcode": "9780134685991"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | UUID | Yes | The active session ID |
| barcode | string | Yes | Product barcode (max 64 characters) |

**Success Response (200 OK):**
```json
{
  "items": [
    {
      "product_name": "Apple",
      "barcode": "9780134685991",
      "price": "50.00",
      "quantity": 2,
      "subtotal": "100.00"
    },
    {
      "product_name": "Banana",
      "barcode": "9780134685992",
      "price": "30.00",
      "quantity": 1,
      "subtotal": "30.00"
    }
  ],
  "total": "130.00"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Session not found | The session_id doesn't exist |
| 400 | Session expired | The session exceeded the inactivity timeout |
| 404 | Product not found or inactive | The barcode doesn't exist or product is inactive |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/api/cart/scan \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111",
    "barcode": "9780134685991"
  }'
```

**Use Case:** Customer scans a product barcode with a barcode scanner or mobile app.

**Important Notes:**
- If the product is already in the cart, quantity is incremented
- If the product is new, a new cart item is created with quantity 1
- Returns the updated cart contents after the scan
- The session activity is automatically refreshed

---

### 6. Cart Remove
**Endpoint:** `POST /cart/remove`

**Purpose:** Remove a product from the cart using its barcode.

**Request Body:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111",
  "barcode": "9780134685991"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | UUID | Yes | The active session ID |
| barcode | string | Yes | Product barcode to remove (max 64 characters) |

**Success Response (200 OK):**
```json
{
  "items": [
    {
      "product_name": "Banana",
      "barcode": "9780134685992",
      "price": "30.00",
      "quantity": 1,
      "subtotal": "30.00"
    }
  ],
  "total": "30.00"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Session not found | The session_id doesn't exist |
| 400 | Session expired | The session exceeded the inactivity timeout |
| 404 | Product not found | The barcode doesn't exist |
| 404 | Item not in cart | The product is not in the current cart |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/api/cart/remove \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111",
    "barcode": "9780134685991"
  }'
```

**Use Case:** Customer changed their mind and wants to remove a product from the cart.

**Important Notes:**
- Removes the entire product from cart (not just one unit)
- Returns the updated cart contents after removal
- The session activity is automatically refreshed

---

### 7. Cart View
**Endpoint:** `GET /cart/view`

**Purpose:** Retrieve the current contents of the shopping cart.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | UUID | Yes | The active session ID |

**Success Response (200 OK):**
```json
{
  "items": [
    {
      "product_name": "Apple",
      "barcode": "9780134685991",
      "price": "50.00",
      "quantity": 2,
      "subtotal": "100.00"
    },
    {
      "product_name": "Banana",
      "barcode": "9780134685992",
      "price": "30.00",
      "quantity": 1,
      "subtotal": "30.00"
    }
  ],
  "total": "130.00"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Session not found | The session_id doesn't exist |
| 400 | Session expired | The session exceeded the inactivity timeout |

**Example Usage:**
```bash
curl -X GET "http://localhost:8000/api/cart/view?session_id=660f9511-f40c-52e5-b827-557766551111"
```

**Use Case:** Display current cart contents to the customer before proceeding to payment.

**Important Notes:**
- This is a GET request (read-only operation)
- Does not modify the session or cart
- Can be called multiple times without affecting the cart state

---

## Payment Management

### 8. Payment Create
**Endpoint:** `POST /payment/create`

**Purpose:** Create a payment transaction for the current cart and generate a UPI QR code.

**Request Body:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | UUID | Yes | The active session ID |

**Success Response (201 Created):**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111",
  "payment_id": 5,
  "total_amount": "130.00",
  "upi_qr": "upi://pay?pa=smarttrolley@upi&pn=SmartTrolley&am=130.00&cu=INR&tn=Smart%20Trolley",
  "status": "PENDING"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Session not found | The session_id doesn't exist |
| 400 | Session expired | The session exceeded the inactivity timeout |
| 400 | Billing user required for payment | User is not assigned to the session |
| 404 | No items in cart | Cart is empty |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111"
  }'
```

**Use Case:** Customer proceeds to checkout. The system calculates the total and generates a UPI QR code for payment.

**Important Notes:**
- The UPI QR code can be scanned by any UPI-compatible payment app
- Payment status is initially set to "PENDING"
- The payment must be confirmed with the `/payment/confirm` endpoint
- User information must be available in the session for payment creation

**UPI QR Code Details:**
- UPI ID: smarttrolley@upi
- Merchant Name: SmartTrolley
- Currency: INR (Indian Rupee)
- Amount: Cart total

---

### 9. Payment Confirm
**Endpoint:** `POST /payment/confirm`

**Purpose:** Confirm that payment has been received and mark the session as complete.

**Request Body:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| session_id | UUID | Yes | The active session ID |

**Success Response (200 OK):**
```json
{
  "status": "payment_success"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Session not found | The session_id doesn't exist |
| 400 | Session expired | The session exceeded the inactivity timeout |
| 404 | No payment found for session | Payment was never created for this session |

**Example Usage:**
```bash
curl -X POST http://localhost:8000/api/payment/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111"
  }'
```

**Use Case:** After the customer completes payment via UPI, this endpoint confirms the transaction and ends the session.

**Important Notes:**
- Must be called after successful UPI payment
- This automatically ends the shopping session
- The trolley becomes available for the next customer
- Payment status is updated to "SUCCESS"

---

## Complete Shopping Flow Example

Here's a complete example of a typical shopping session:

```bash
# Step 1: Create a user account
curl -X POST http://localhost:8000/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone_number": "+91-9876543210",
    "email": "john@example.com"
  }'
# Response: {"user_id": "550e8400-e29b-41d4-a716-446655440000"}

# Step 2: Start a shopping session
curl -X POST http://localhost:8000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "trolley_id": "TROLLEY-001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
# Response: {"session_id": "660f9511-f40c-52e5-b827-557766551111"}

# Step 3: Scan products (repeat for each product)
curl -X POST http://localhost:8000/api/cart/scan \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111",
    "barcode": "9780134685991"
  }'

curl -X POST http://localhost:8000/api/cart/scan \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111",
    "barcode": "9780134685992"
  }'

# Step 4: View cart before checkout
curl -X GET "http://localhost:8000/api/cart/view?session_id=660f9511-f40c-52e5-b827-557766551111"

# Step 5: Create payment and get UPI QR code
curl -X POST http://localhost:8000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111"
  }'
# Response includes UPI QR code for payment

# Step 6: Confirm payment after UPI transaction
curl -X POST http://localhost:8000/api/payment/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "660f9511-f40c-52e5-b827-557766551111"
  }'
# Response: {"status": "payment_success"}
```

---

## Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Error Response:**
```json
{
  "detail": "Error message description"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid data or request |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Key Concepts

### Session Timeout
- Sessions automatically expire after a period of inactivity
- Use the `/session/heartbeat` endpoint to keep sessions alive
- Expired sessions must be closed before the trolley can be reused

### Cart Items
- Each cart item contains: product, quantity, price, and subtotal
- Same product scanned multiple times increases quantity
- Removing a product deletes all units of that product

### Payment Flow
- Payment must be created before it can be confirmed
- UPI QR code is generated during payment creation
- Payment status changes from PENDING to SUCCESS after confirmation
- Session automatically ends after payment confirmation

### Concurrency Safety
- The API uses database-level locking for critical operations
- Multiple simultaneous requests are handled safely
- Cart and session operations are atomic (all-or-nothing)

---

## Common Scenarios

### Scenario 1: Customer adds and removes items
```
1. POST /session/start → Get session_id
2. POST /cart/scan → Add first product
3. POST /cart/scan → Add second product
4. POST /cart/remove → Remove first product
5. GET /cart/view → See remaining items
```

### Scenario 2: Session timeout handling
```
1. Session becomes inactive (no requests for timeout duration)
2. Next request fails with "Session expired"
3. POST /session/start → Create new session with same trolley
4. Continue shopping with new session_id
```

### Scenario 3: Session heartbeat to prevent timeout
```
Periodically (every 30 seconds):
POST /session/heartbeat → Keep session alive
This prevents timeout while customer is still shopping
```

---

## Authentication
Currently, the API does not require authentication. User identification is optional (guest checkout supported).

---

## Rate Limiting
No rate limiting is currently implemented.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Trolley already in use" | Wait for previous session to timeout or end |
| "Session expired" | Call `/session/heartbeat` periodically |
| "Product not found" | Verify barcode is correct and product is active |
| "Item not in cart" | Item was already removed or cart was cleared |
| "Billing user required" | Provide user_id when starting session |

---

## Version
API Version: 1.0
Last Updated: January 2026
