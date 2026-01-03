# Smart Trolley - User Assignment System Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SMART TROLLEY SYSTEM                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      PHYSICAL TROLLEY (Hardware)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │ Power Switch    │  │  QR Code Label   │  │ Barcode Scanner  │        │
│  │  (ON/OFF)       │  │ (Unique ID)      │  │ (Product items)  │        │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘        │
│           │                    │                     │                  │
│           └────────────────────┼─────────────────────┘                  │
│                                ▼                                        │
│                    ┌──────────────────────────┐                         │
│                    │  WiFi/IoT Connection    │                         │
│                    └────────────┬─────────────┘                         │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                                  │ HTTP Requests
                                  ▼
        ┌─────────────────────────────────────────────────┐
        │         Django REST API Backend                │
        │         (Smart Trolley Server)                 │
        └─────────────────────────────────────────────────┘
        
                ┌──────────────────────────────────┐
                │     API ENDPOINTS                │
                ├──────────────────────────────────┤
                │ POST /api/session/qr-scan        │
                │   → Assign trolley to user       │
                │   → Check conflicts              │
                │                                  │
                │ POST /api/session/end            │
                │   → Unassign trolley             │
                │   → Clear cart                   │
                │                                  │
                │ POST /api/cart/add               │
                │   → Add scanned product          │
                │                                  │
                │ GET /api/trolleys/{id}           │
                │   → Get trolley status           │
                └──────────────────────────────────┘
                
                        │        │        │
                        ▼        ▼        ▼
        
        ┌─────────────────────────────────────────────────┐
        │          DATABASE SCHEMA                        │
        ├─────────────────────────────────────────────────┤
        │                                                 │
        │  ┌────────────────────────────────────────┐    │
        │  │    TROLLEY                             │    │
        │  ├────────────────────────────────────────┤    │
        │  │ • trolley_id (unique)                  │    │
        │  │ • qr_code_data                         │    │
        │  │ • is_active                            │    │
        │  │ • is_locked                            │    │
        │  │ • assigned_to ────────┐               │    │
        │  │ • assigned_at         │               │    │
        │  │ • last_seen           │               │    │
        │  │ • created_at          │               │    │
        │  └────────────────────────────────────────┘    │
        │                         │                      │
        │  ┌──────────────────────▼───┐                 │
        │  │    USER (Django Auth)     │                 │
        │  ├───────────────────────────┤                 │
        │  │ • id (Primary Key)        │                 │
        │  │ • username                │                 │
        │  │ • email                   │                 │
        │  │ • password                │                 │
        │  └───────────────────────────┘                 │
        │           ▲                                    │
        │           │                                    │
        │           └─────────────────────┐             │
        │                                 │              │
        │  ┌──────────────────────────────▼──────┐      │
        │  │    SESSION                          │      │
        │  ├─────────────────────────────────────┤      │
        │  │ • session_id (UUID, Primary Key)    │      │
        │  │ • trolley_id (Foreign Key) ────────→│ Trolley
        │  │ • user_id (Foreign Key) ───────────→│ User
        │  │ • is_active                         │      │
        │  │ • last_heartbeat                    │      │
        │  │ • created_at                        │      │
        │  │ • ended_at                          │      │
        │  └─────────────────────────────────────┘      │
        │           │                                    │
        │           └─────────────────────┐             │
        │                                 │              │
        │  ┌──────────────────────────────▼──────┐      │
        │  │    CART_ITEM                        │      │
        │  ├─────────────────────────────────────┤      │
        │  │ • session_id (Foreign Key) ────────→│ Session
        │  │ • product_id (Foreign Key)         │      │
        │  │ • quantity                          │      │
        │  │ • subtotal                          │      │
        │  │ • added_at                          │      │
        │  └─────────────────────────────────────┘      │
        │           │                                    │
        │           └─────────────────────┐             │
        │                                 │              │
        │  ┌──────────────────────────────▼──────┐      │
        │  │    PRODUCT                          │      │
        │  ├─────────────────────────────────────┤      │
        │  │ • barcode (unique)                  │      │
        │  │ • name                              │      │
        │  │ • price                             │      │
        │  │ • category                          │      │
        │  │ • is_active                         │      │
        │  │ • created_at                        │      │
        │  └─────────────────────────────────────┘      │
        │                                                 │
        └─────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    MOBILE APP / USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  QR Scanner      │    │  Product Scanner │    │  Cart View       │  │
│  │  (1. User scans) │    │  (2. Add items)  │    │  (3. Checkout)   │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘  │
│           │                       │                        │           │
│           └───────────────────────┼────────────────────────┘           │
│                                   ▼                                    │
│                   POST /api/session/qr-scan                            │
│                     + product barcode scans                            │
│                     + payment completion                              │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow Diagram

### 1. QR Scan Request Flow

```
User Scans QR Code
        │
        ▼
┌──────────────────────────────────┐
│ POST /api/session/qr-scan        │
│ {                                │
│   "trolley_id": "TROLLEY_01",    │
│   "user_id": 5                   │
│ }                                │
└──────────────┬───────────────────┘
               │
    ┌──────────▼──────────┐
    │ Backend Processing  │
    ├─────────────────────┤
    │ 1. Find Trolley     │
    │ 2. Check if exists  │
    │ 3. Check if active  │
    │ 4. Check if         │
    │    assigned         │
    └──────────┬──────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼ (Already assigned)  ▼ (Available)
    
409 CONFLICT             201 CREATED
{                        {
  "error":                 "session_id": "uuid",
  "Trolley already        "trolley_id": "TROLLEY_01",
   in use",               "is_assigned": true,
  "assigned_to":         "assigned_to": "john_doe",
  "john_doe"             "assigned_at": "2025-01-03T10:30:45Z",
}                        "message": "Session started..."
                         }
```

### 2. Product Scanning Flow

```
User Scans Product Barcode
        │
        ▼
┌──────────────────────────────────┐
│ POST /api/cart/add               │
│ {                                │
│   "session_id": "uuid",          │
│   "barcode": "123456789"         │
│ }                                │
└──────────────┬───────────────────┘
               │
    ┌──────────▼──────────┐
    │ Backend Processing  │
    ├─────────────────────┤
    │ 1. Find Product by  │
    │    barcode          │
    │ 2. Get price        │
    │ 3. Add to cart      │
    │ 4. Update subtotal  │
    └──────────┬──────────┘
               │
               ▼
          200 OK
          {
            "product": {
              "barcode": "123456789",
              "name": "Product Name",
              "price": 100.00
            },
            "cart_total": 500.00,
            "items_count": 5
          }
```

### 3. Payment & Session End Flow

```
User Completes Payment
        │
        ▼
┌──────────────────────────────────┐
│ POST /api/session/end            │
│ {                                │
│   "session_id": "uuid"           │
│ }                                │
└──────────────┬───────────────────┘
               │
    ┌──────────▼──────────┐
    │ Backend Processing  │
    ├─────────────────────┤
    │ 1. Find Session     │
    │ 2. Clear cart items │
    │ 3. End session      │
    │ 4. Lock trolley     │
    │ 5. Unassign from    │
    │    user (KEY!)      │
    └──────────┬──────────┘
               │
               ▼
          200 OK
          {
            "session_id": "uuid",
            "trolley_id": "TROLLEY_01",
            "trolley_unassigned": true,
            "items_cleared": 5,
            "message": "Session ended..."
          }
```

---

## State Machine - Detailed

```
┌───────────────────────────────────────────────────────────────┐
│                    TROLLEY STATE MACHINE                      │
└───────────────────────────────────────────────────────────────┘

START
  │
  ▼
╔═══════════════════════════════════════════════════════════╗
║         STATE 1: AVAILABLE & UNLOCKED                     ║
║  (assigned_to = NULL, is_locked = False)                 ║
║  Ready for any user to scan                              ║
╚═════════════════════╤═════════════════════════════════════╝
                      │
                      │ User scans QR + user_id
                      │
          ┌───────────▼──────────┐
          │ Check: Is trolley    │
          │ assigned?            │
          └───────────┬──────────┘
                      │
          ┌───────────┴──────────┐
          │                      │
    YES   │                      │   NO
          ▼                      ▼
  ┌─────────────┐         ┌──────────────────┐
  │ Compare     │         │ Assign Trolley   │
  │ assigned_to │         │ to this user     │
  │ with        │         │                  │
  │ user_id     │         │ Save:            │
  └──────┬──────┘         │ • assigned_to=ID │
         │                │ • assigned_at=NOW│
    ┌────┴────┐           │                  │
    │          │           │ Lock trolley     │
    │          │           │ is_locked=True  │
    │          │           │                  │
 SAME DIFFERENT  └──────┬──────────┘
    │         │         │
    │         ▼         ▼
    │      409 Error   201 Created
    │     (Already in  (New Session
    │       use!)       Started)
    │         │         │
    │         │         └───────────────┐
    │         │                         │
    │         │              ┌──────────▼──────────┐
    │         │              │ SESSION ACTIVE     │
    │         │              │ • User shopping    │
    │         │              │ • Cart accumulating│
    │         │              │ • Session heartbeat│
    │         │              └──────────┬─────────┘
    │         │                         │
    │         │                 ┌───────┴──────────┐
    │         │                 │                  │
    │         │       ┌──────────▼───────┐  ┌──────▼──────────┐
    │         │       │ Session Expires  │  │ User Completes  │
    │         │       │ (30s inactivity) │  │ Payment         │
    │         │       │                  │  │                 │
    │         │       │ Auto-end         │  │ POST /end       │
    │         │       │ Auto-unassign    │  │                 │
    │         │       │ Reset trolley    │  │ Unassign        │
    │         │       └──────────┬───────┘  │ Unlock          │
    │         │                  │          │ Clear cart      │
    │         │                  │          └──────┬──────────┘
    │         │                  │                 │
    │         │                  │    ┌────────────┘
    │         │                  │    │
    │         └────────┬─────────┴────┘
    │                  │
    └──────────────────┼──────────────────┐
                       │                  │
                       ▼                  ▼
        ╔═════════════════════════════════════╗
        ║     BACK TO STATE 1: AVAILABLE      ║
        ║  (assigned_to = NULL, is_locked=F) ║
        ║   Ready for next user to scan       ║
        ╚═════════════════════════════════════╝
                       │
                       │ [LOOP]
                       ▼
                  (Cycle repeats)
```

---

## Conflict Resolution Scenario

```
Timeline: User A uses trolley, User B tries to access

Time    User A                          User B
────────────────────────────────────────────────────────────
T0:     Scans QR Code
        │
        ├─ Trolley assigned to User A
        ├─ Session created
        └─ assigned_to = User A
                                        
T5:                                     Scans QR Code
                                        │
                                        ├─ Check: Is assigned?
                                        ├─ YES: assigned_to = User A
                                        ├─ Check: Is same user?
                                        ├─ NO
                                        └─ Return 409 CONFLICT
                                           "Already in use"
                                           "Assigned to User A"

T10:    Adding items to cart           Waiting / using another trolley

T30:    Proceeding to checkout         Still waiting...

T40:    Payment complete
        POST /api/session/end
        │
        ├─ Clear cart
        ├─ End session
        ├─ Unassign trolley
        │  assigned_to = NULL
        └─ Unlock trolley
                                        Now can scan!
                                        │
                                        ├─ Check: Is assigned?
                                        ├─ NO
                                        ├─ Assign to User B
                                        └─ Return 201 CREATED
                                           "New Session Started"
```

---

## Data Flow Summary

```
INPUT                 PROCESSING              OUTPUT              DATABASE
═════════════════════════════════════════════════════════════════════════════

QR SCAN REQUEST
┌────────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│ {              │───▶│ 1. Validate  │───▶│ 201 CREATED/ │───▶│ Update   │
│  trolley_id,   │    │    trolley   │    │ 409 CONFLICT │    │ Trolley: │
│  user_id       │    │ 2. Check     │    │              │    │ assign_to│
│ }              │    │    assignment│    │ Session data │    │ assigned_│
└────────────────┘    │ 3. Assign/   │    │ Cart count   │    │ at       │
                      │    Conflict  │    └──────────────┘    │ is_locked│
PRODUCT SCAN          └──────────────┘                        └──────────┘
┌────────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│ {              │───▶│ 1. Find      │───▶│ 200 OK       │───▶│ Add      │
│  session_id,   │    │    product   │    │              │    │ CartItem │
│  barcode       │    │ 2. Get price │    │ Product name │    │ Record   │
│ }              │    │ 3. Add to    │    │ Price        │    │ & update │
└────────────────┘    │    cart      │    │ Cart total   │    │ subtotal │
                      └──────────────┘    └──────────────┘    └──────────┘

PAYMENT/END SESSION
┌────────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│ {              │───▶│ 1. Validate  │───▶│ 200 OK       │───▶│ Clear    │
│  session_id    │    │    session   │    │              │    │ CartItems│
│ }              │    │ 2. Clear cart│    │ Confirmation │    │ End      │
└────────────────┘    │ 3. End sess. │    │ Unassigned   │    │ Session  │
                      │ 4. Unassign  │    │ Locked       │    │ Unassign │
                      │    trolley   │    └──────────────┘    │ Trolley  │
                      │ 5. Lock      │                        └──────────┘
                      └──────────────┘
```

---

## Summary of Implementation

This architecture ensures:

1. ✅ **One User Per Trolley**: `assigned_to` field prevents concurrent usage
2. ✅ **Clear Conflict Messages**: 409 errors with assignment details
3. ✅ **Auto-Cleanup**: Sessions expire trolley assignments after 30s
4. ✅ **Payment Integration**: Unassignment happens on `POST /session/end`
5. ✅ **Audit Trail**: `user` field in Session tracks who used what
6. ✅ **Mobile-Ready**: APIs return all necessary data for frontend display
