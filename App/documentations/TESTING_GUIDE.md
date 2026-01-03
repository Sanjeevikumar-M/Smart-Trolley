# Testing Guide - Smart Trolley User Assignment

## Prerequisites

1. Django server running on `http://localhost:8000`
2. Database migrated successfully
3. Test user created in database
4. Tool: Postman, Thunder Client, or cURL

## Setup Test Users

```bash
cd D:\Smart-Trolley\App\server

# Create superuser if not exists
python manage.py createsuperuser

# Or create test users via Django shell
python manage.py shell
```

In Django shell:
```python
from django.contrib.auth.models import User

# Create test users
user1 = User.objects.create_user(username='john_doe', password='pass123')
user2 = User.objects.create_user(username='jane_smith', password='pass123')

print(f"User 1 ID: {user1.id}")  # Should be 1
print(f"User 2 ID: {user2.id}")  # Should be 2

exit()
```

---

## Test Suite

### TEST 1: User A Scans QR Code (New Session)

**Description**: First user scans QR code, should get assigned to trolley

**Request**:
```
POST http://localhost:8000/api/session/qr-scan
Content-Type: application/json

{
  "trolley_id": "TROLLEY_01",
  "user_id": 1
}
```

**cURL**:
```bash
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id": "TROLLEY_01", "user_id": 1}'
```

**Expected Response** (201 Created):
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "trolley_id": "TROLLEY_01",
  "trolley_locked": false,
  "is_new_session": true,
  "is_assigned": true,
  "assigned_to": "john_doe",
  "assigned_at": "2025-01-03T10:30:45.123456Z",
  "cart_items_count": 0,
  "message": "Session started successfully"
}
```

**Verify in Database**:
```sql
SELECT assigned_to, assigned_at FROM trolleys_trolley 
WHERE trolley_id = 'TROLLEY_01';
```

Should show:
- `assigned_to`: 1 (User A's ID)
- `assigned_at`: Current timestamp

---

### TEST 2: User B Tries to Scan Same QR Code (Should Fail)

**Description**: Second user tries to scan, should get 409 CONFLICT error

**Request**:
```
POST http://localhost:8000/api/session/qr-scan
Content-Type: application/json

{
  "trolley_id": "TROLLEY_01",
  "user_id": 2
}
```

**cURL**:
```bash
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id": "TROLLEY_01", "user_id": 2}'
```

**Expected Response** (409 Conflict):
```json
{
  "error": "Trolley is already in use",
  "message": "This trolley is currently assigned to another user (john_doe). Please use a different trolley or wait until the current session is completed.",
  "trolley_id": "TROLLEY_01",
  "assigned_to": "john_doe",
  "assigned_at": "2025-01-03T10:30:45.123456Z"
}
```

**Verify**: User B should see error message and cannot proceed

---

### TEST 3: User A Adds Products (Shopping)

**Description**: User A scans product and adds to cart

**Prerequisites**: 
- User A has active session (from TEST 1)
- Product exists in database with barcode

**Create Test Product** (if needed):
```bash
python manage.py shell
```

```python
from products.models import Product

product = Product.objects.create(
    barcode='1234567890',
    name='Test Product',
    price=100.00,
    category='Electronics'
)

exit()
```

**Request**:
```
POST http://localhost:8000/api/cart/add
Content-Type: application/json

{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "barcode": "1234567890"
}
```

**cURL**:
```bash
curl -X POST http://localhost:8000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "barcode": "1234567890"
  }'
```

**Expected Response** (200 OK):
```json
{
  "product": {
    "barcode": "1234567890",
    "name": "Test Product",
    "price": 100.00,
    "category": "Electronics"
  },
  "quantity": 1,
  "subtotal": 100.00,
  "message": "Item added to cart"
}
```

**Verify in Database**:
```sql
SELECT * FROM cart_cartitem 
WHERE session_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

Should show: Product added with quantity 1

---

### TEST 4: User A Completes Payment (Session End)

**Description**: User A pays and session ends, trolley unassigned

**Request**:
```
POST http://localhost:8000/api/session/end
Content-Type: application/json

{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**cURL**:
```bash
curl -X POST http://localhost:8000/api/session/end \
  -H "Content-Type: application/json" \
  -d '{"session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'
```

**Expected Response** (200 OK):
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "trolley_id": "TROLLEY_01",
  "items_cleared": 1,
  "trolley_unassigned": true,
  "message": "Session ended successfully and trolley unassigned"
}
```

**Verify in Database**:
```sql
SELECT assigned_to, assigned_at, is_locked FROM trolleys_trolley 
WHERE trolley_id = 'TROLLEY_01';
```

Should show:
- `assigned_to`: NULL (Unassigned!)
- `assigned_at`: NULL
- `is_locked`: 1 (Locked)

**Verify Cart Cleared**:
```sql
SELECT COUNT(*) FROM cart_cartitem 
WHERE session_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

Should return: 0 (All items cleared)

---

### TEST 5: User B Can Now Scan Same Trolley (After User A Pays)

**Description**: Now that User A is done, User B can use the same trolley

**Request**:
```
POST http://localhost:8000/api/session/qr-scan
Content-Type: application/json

{
  "trolley_id": "TROLLEY_01",
  "user_id": 2
}
```

**cURL**:
```bash
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id": "TROLLEY_01", "user_id": 2}'
```

**Expected Response** (201 Created):
```json
{
  "session_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "trolley_id": "TROLLEY_01",
  "trolley_locked": false,
  "is_new_session": true,
  "is_assigned": true,
  "assigned_to": "jane_smith",
  "assigned_at": "2025-01-03T10:45:30.654321Z",
  "cart_items_count": 0,
  "message": "Session started successfully"
}
```

**Verify in Database**:
```sql
SELECT assigned_to FROM trolleys_trolley 
WHERE trolley_id = 'TROLLEY_01';
```

Should show: `assigned_to = 2` (User B's ID)

---

### TEST 6: Get Trolley Status (With Assignment Info)

**Description**: Query trolley to see current assignment status

**Request**:
```
GET http://localhost:8000/api/trolleys/TROLLEY_01
```

**cURL**:
```bash
curl -X GET http://localhost:8000/api/trolleys/TROLLEY_01 \
  -H "Content-Type: application/json"
```

**Expected Response** (200 OK):
```json
{
  "id": 1,
  "trolley_id": "TROLLEY_01",
  "qr_code_data": "http://localhost:3000/trolley/TROLLEY_01",
  "qr_payload": {
    "trolley_id": "TROLLEY_01",
    "url": "http://localhost:3000/trolley/TROLLEY_01",
    "timestamp": "2025-01-01T08:00:00Z",
    "hash": "abc12345"
  },
  "is_active": true,
  "is_locked": false,
  "assigned_to": 2,
  "assigned_to_username": "jane_smith",
  "assigned_at": "2025-01-03T10:45:30.654321Z",
  "last_seen": "2025-01-03T10:45:35.123456Z",
  "created_at": "2025-01-01T08:00:00Z"
}
```

---

### TEST 7: List All Trolleys (See All Assignments)

**Description**: View all trolleys and their assignment statuses

**Request**:
```
GET http://localhost:8000/api/trolleys/
```

**cURL**:
```bash
curl -X GET http://localhost:8000/api/trolleys/ \
  -H "Content-Type: application/json"
```

**Expected Response** (200 OK):
```json
{
  "count": 2,
  "trolleys": [
    {
      "id": 1,
      "trolley_id": "TROLLEY_01",
      "qr_code_data": "...",
      "is_active": true,
      "is_locked": false,
      "assigned_to": 2,
      "assigned_to_username": "jane_smith",
      "assigned_at": "2025-01-03T10:45:30.654321Z",
      ...
    },
    {
      "id": 2,
      "trolley_id": "TROLLEY_02",
      "qr_code_data": "...",
      "is_active": true,
      "is_locked": true,
      "assigned_to": null,
      "assigned_to_username": null,
      "assigned_at": null,
      ...
    }
  ]
}
```

---

## Test Workflow Checklist

- [ ] TEST 1: User A scans QR → Gets session (201)
- [ ] TEST 2: User B tries same QR → Conflict error (409)
- [ ] TEST 3: User A adds products → Item in cart
- [ ] TEST 4: User A pays → Trolley unassigned, cart cleared
- [ ] TEST 5: User B scans same QR → Gets new session (201)
- [ ] TEST 6: Get trolley status → Shows current assignment
- [ ] TEST 7: List all trolleys → Shows all assignments

---

## Postman Collection

Save as `smart_trolley_tests.json`:

```json
{
  "info": {
    "name": "Smart Trolley Assignment Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "TEST 1: User A Scans QR",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"trolley_id\": \"TROLLEY_01\", \"user_id\": 1}"
        },
        "url": {
          "raw": "http://localhost:8000/api/session/qr-scan",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8000",
          "path": ["api", "session", "qr-scan"]
        }
      }
    },
    {
      "name": "TEST 2: User B Tries Same QR",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"trolley_id\": \"TROLLEY_01\", \"user_id\": 2}"
        },
        "url": {
          "raw": "http://localhost:8000/api/session/qr-scan",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8000",
          "path": ["api", "session", "qr-scan"]
        }
      }
    },
    {
      "name": "TEST 4: End Session",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"session_id\": \"PASTE_SESSION_ID_HERE\"}"
        },
        "url": {
          "raw": "http://localhost:8000/api/session/end",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8000",
          "path": ["api", "session", "end"]
        }
      }
    },
    {
      "name": "TEST 6: Get Trolley Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:8000/api/trolleys/TROLLEY_01",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8000",
          "path": ["api", "trolleys", "TROLLEY_01"]
        }
      }
    },
    {
      "name": "TEST 7: List All Trolleys",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:8000/api/trolleys/",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8000",
          "path": ["api", "trolleys"]
        }
      }
    }
  ]
}
```

---

## Debugging Tips

### Issue: 404 Trolley not found
**Solution**: Create test trolley:
```bash
python manage.py shell
```
```python
from trolleys.models import Trolley

trolley = Trolley.objects.create(trolley_id='TROLLEY_01')
trolley.save()

exit()
```

### Issue: User not found
**Solution**: Create test users (see Setup section above)

### Issue: Migration errors
**Solution**: Check migration status:
```bash
python manage.py showmigrations

# If not applied:
python manage.py migrate
```

### Issue: Database locked
**Solution**: Delete old database and recreate:
```bash
# Delete db.sqlite3
rm db.sqlite3

# Recreate:
python manage.py migrate
```

### View API Response in Django Admin

1. Navigate to `http://localhost:8000/admin/`
2. Login with superuser credentials
3. Check "Trolleys" → See assignments
4. Check "Sessions" → See active sessions
5. Check "Users" → See user details

---

## Performance Testing

### Load Test: Multiple Users Scanning

```bash
# Use Apache Bench or similar tool
ab -n 100 -c 10 -p payload.json \
  http://localhost:8000/api/session/qr-scan
```

This will send 100 requests with 10 concurrent, should get:
- First request: 201 (assigned)
- Next 99 requests: 409 (conflict)

---

## Expected Database State After All Tests

```sql
-- TROLLEYS
SELECT trolley_id, assigned_to, assigned_at FROM trolleys_trolley;
-- Should show TROLLEY_01 assigned to user 2, TROLLEY_02 unassigned

-- SESSIONS
SELECT session_id, trolley_id, user_id, is_active FROM trolley_sessions_session;
-- Should show at least 2 sessions (one ended, one active)

-- CART ITEMS
SELECT COUNT(*) FROM cart_cartitem;
-- Should show 0 (cleared after payment)

-- PAYMENTS (if implemented)
SELECT * FROM payments_payment;
-- Should show payment record for completed transaction
```

---

## Success Criteria

✅ All 7 tests pass
✅ Trolley assignment visible in admin
✅ Sessions properly tracked
✅ Cart items cleared after payment
✅ Conflict errors appear correctly
✅ Database shows proper state transitions
✅ API responses match expected format

**Status**: Ready for testing!
