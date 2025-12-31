# Smart Trolley Backend API

A complete Django REST Framework backend for a Smart Trolley system. This API-only backend manages products, trolley sessions, cart, and payments.

## 🔧 Tech Stack

- **Django 6.0** - Web framework
- **Django REST Framework** - API framework
- **MySQL/SQLite** - Database (configurable)
- **UUID-based sessions** - Session management
- **CORS enabled** - For cross-origin requests

## 📁 Project Structure

```
App/server/
├── manage.py
├── requirements.txt
├── db.sqlite3
├── server/               # Main Django project
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── products/             # Product management
├── trolleys/             # Trolley management
├── sessions/             # Session management
├── cart/                 # Cart management
└── payments/             # Payment management
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd App/server
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
python manage.py migrate
```

### 3. Seed Sample Data

```bash
python manage.py seed_data
```

### 4. Create Admin User (Optional)

```bash
python manage.py createsuperuser
```

### 5. Run Server

```bash
python manage.py runserver 8000
```

API will be available at `http://127.0.0.1:8000/api/`

## 🔌 API Endpoints

### Health Check
- **GET** `/api/health` - Check API status
- **GET** `/api/` - API root with all endpoints

### Session APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session/start` | Start new session for a trolley |
| POST | `/api/session/heartbeat` | Update session heartbeat |
| POST | `/api/session/end` | End session and clear cart |

### Cart APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cart/scan` | Scan barcode to add item |
| POST | `/api/cart/remove` | Remove item from cart |
| GET | `/api/cart/view?session_id=<uuid>` | View cart contents |

### Payment APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create` | Create payment (get UPI QR) |
| POST | `/api/payment/confirm` | Confirm payment (mock) |
| GET | `/api/payment/status?session_id=<uuid>` | Get payment status |

### Utility APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List all products |
| GET | `/api/products/<barcode>` | Get product by barcode |
| GET | `/api/trolleys/` | List all trolleys |
| GET | `/api/trolleys/<trolley_id>` | Get trolley by ID |

## 📝 API Usage Examples

### 1. Start a Session

```bash
curl -X POST http://127.0.0.1:8000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"trolley_id": "TROLLEY_01"}'
```

Response:
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "trolley_id": "TROLLEY_01",
  "message": "Session started successfully"
}
```

### 2. Scan Product (Add to Cart)

```bash
curl -X POST http://127.0.0.1:8000/api/cart/scan \
  -H "Content-Type: application/json" \
  -d '{"session_id": "a1b2c3d4-...", "barcode": "8901234567890"}'
```

Response:
```json
{
  "session_id": "a1b2c3d4-...",
  "product": {
    "barcode": "8901234567890",
    "name": "Milk (1L)",
    "price": "65.00",
    "category": "Dairy"
  },
  "quantity": 1,
  "subtotal": "65.00",
  "action": "added",
  "message": "Milk (1L) added to cart"
}
```

### 3. View Cart

```bash
curl "http://127.0.0.1:8000/api/cart/view?session_id=a1b2c3d4-..."
```

Response:
```json
{
  "session_id": "a1b2c3d4-...",
  "trolley_id": "TROLLEY_01",
  "items": [
    {
      "id": 1,
      "product": {
        "barcode": "8901234567890",
        "name": "Milk (1L)",
        "price": "65.00",
        "category": "Dairy"
      },
      "quantity": 2,
      "subtotal": "130.00",
      "added_at": "2025-12-31T10:00:00Z"
    }
  ],
  "total_items": 2,
  "total_amount": "130.00"
}
```

### 4. Create Payment

```bash
curl -X POST http://127.0.0.1:8000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"session_id": "a1b2c3d4-..."}'
```

Response:
```json
{
  "session_id": "a1b2c3d4-...",
  "total_amount": "130.00",
  "upi_string": "upi://pay?pa=smarttrolley@upi&pn=SmartTrolley&am=130.00&cu=INR&tn=Payment_for_session_a1b2c3d4-...",
  "payment_status": "PENDING",
  "message": "Payment created. Scan QR code to pay."
}
```

### 5. Confirm Payment

```bash
curl -X POST http://127.0.0.1:8000/api/payment/confirm \
  -H "Content-Type: application/json" \
  -d '{"session_id": "a1b2c3d4-..."}'
```

Response:
```json
{
  "session_id": "a1b2c3d4-...",
  "payment_status": "SUCCESS",
  "total_paid": "130.00",
  "trolley_unlocked": true,
  "session_ended": true,
  "message": "Payment successful! Thank you for shopping."
}
```

### 6. Send Heartbeat

```bash
curl -X POST http://127.0.0.1:8000/api/session/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "a1b2c3d4-..."}'
```

## 🔐 Business Rules

1. **One Active Session Per Trolley** - A trolley can only have one active session at a time
2. **Session Expiry** - Sessions expire after 30 seconds without heartbeat
3. **Cart Cleared on Session End** - Cart items are deleted when session ends
4. **Payment Before Unlock** - Trolley remains locked until payment is confirmed
5. **No Authentication** - API uses session-based validation only

## ⚙️ Configuration

### Using MySQL

Set environment variables:
```bash
export USE_MYSQL=true
export DB_NAME=smart_trolley
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_HOST=localhost
export DB_PORT=3306
```

Then install MySQL client:
```bash
pip install mysqlclient
```

### Session Timeout

Default: 30 seconds. Configure in `settings.py`:
```python
SESSION_HEARTBEAT_TIMEOUT = 30  # seconds
```

## 🧪 Sample Data

The `seed_data` command creates:
- **20 products** across categories (Dairy, Bakery, Grains, etc.)
- **10 trolleys** (TROLLEY_01 to TROLLEY_10)

Sample barcodes for testing:
| Barcode | Product |
|---------|---------|
| 8901234567890 | Milk (1L) - ₹65 |
| 8901234567891 | Bread (White) - ₹45 |
| 8901234567892 | Rice (5kg) - ₹350 |
| 8901234567893 | Cooking Oil (1L) - ₹180 |
| 8901234567894 | Sugar (1kg) - ₹55 |

## 📊 Admin Panel

Access Django admin at `http://127.0.0.1:8000/admin/`

Default credentials (if created with seed):
- Username: `admin`
- Password: `admin123`

## 🔄 Complete Shopping Flow

```
1. Customer approaches trolley
   └── Mobile app calls POST /api/session/start with trolley_id
   
2. Trolley unlocks, session starts
   └── App receives session_id

3. Customer scans products
   └── App calls POST /api/cart/scan for each scan

4. App sends heartbeat every 10-20 seconds
   └── POST /api/session/heartbeat

5. Customer ready to pay
   └── App calls GET /api/cart/view to show cart
   └── App calls POST /api/payment/create to get UPI QR

6. Customer scans QR and pays (mock)
   └── App calls POST /api/payment/confirm

7. Payment confirmed, trolley locks, session ends
   └── Customer exits
```

## 📄 License

MIT License - Built for Smart Trolley Hackathon Project
