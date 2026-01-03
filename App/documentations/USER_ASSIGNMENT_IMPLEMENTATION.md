# Smart Trolley User Assignment Implementation

## Overview
This document describes the implementation of the user assignment system for the Smart Trolley application. When a user scans a trolley's QR code, the trolley is assigned to that user and cannot be used by others until the payment is completed.

---

## System Flow

### 1. **Trolley Connection & QR Scan**
- User turns on the Smart Trolley (hardware switch)
- Trolley connects to the backend server
- User scans the QR code on the trolley using their mobile device
- QR code contains the trolley's unique ID (e.g., `TROLLEY_01`)

### 2. **User Assignment**
- **Endpoint**: `POST /api/session/qr-scan`
- When QR is scanned:
  - System checks if trolley exists and is active
  - **NEW**: System checks if trolley is already assigned to another user
  - If already assigned: Returns **409 CONFLICT** error with "Already in use" message
  - If available: Creates a new session and assigns trolley to the current user
  - Trolley is unlocked for use

### 3. **Product Scanning**
- User scans product barcodes while shopping
- **Endpoint**: `POST /api/cart/add` (existing)
- Backend fetches product details from barcode
- Sends product info to user's mobile app
- Item is added to the user's cart (tied to their session)

### 4. **Payment & De-assignment**
- User completes shopping and initiates payment
- **Endpoint**: `POST /api/session/end`
- Session ends
- **NEW**: Trolley is automatically unassigned from user (`assigned_to = None`)
- **NEW**: Trolley is returned to available state for next user
- Cart is cleared

---

## Database Schema Changes

### Trolley Model - New Fields
```python
assigned_to = ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
assigned_at = DateTimeField(null=True, blank=True)
```

**Fields**:
- `assigned_to`: Foreign key to Django User model. Null when trolley is available.
- `assigned_at`: Timestamp when trolley was assigned to user.

### Session Model - New Field
```python
user = ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
```

**Field**:
- `user`: Stores which user initiated the session (for audit trail)

---

## API Endpoints

### 1. QR Code Scan & Session Start
**Endpoint**: `POST /api/session/qr-scan`

**Request**:
```json
{
  "trolley_id": "TROLLEY_01",
  "user_id": 5  // Optional: User ID for assignment
}
```

**Success Response (201 Created - New Session)**:
```json
{
  "session_id": "uuid-string",
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

**Conflict Response (409 Conflict - Already Assigned)**:
```json
{
  "error": "Trolley is already in use",
  "message": "This trolley is currently assigned to another user (jane_smith). Please use a different trolley or wait until the current session is completed.",
  "trolley_id": "TROLLEY_01",
  "assigned_to": "jane_smith",
  "assigned_at": "2025-01-03T10:15:00.000000Z"
}
```

### 2. Session End & Payment Completion
**Endpoint**: `POST /api/session/end`

**Request**:
```json
{
  "session_id": "uuid-string"
}
```

**Success Response (200 OK)**:
```json
{
  "session_id": "uuid-string",
  "trolley_id": "TROLLEY_01",
  "items_cleared": 5,
  "trolley_unassigned": true,
  "message": "Session ended successfully and trolley unassigned"
}
```

### 3. Get Trolley Details (With Assignment Info)
**Endpoint**: `GET /api/trolleys/{trolley_id}`

**Response**:
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
  "assigned_to": 5,
  "assigned_to_username": "john_doe",
  "assigned_at": "2025-01-03T10:30:45.123456Z",
  "last_seen": "2025-01-03T10:35:10.987654Z",
  "created_at": "2025-01-01T08:00:00Z"
}
```

---

## State Machine

```
┌─────────────────────────┐
│   TROLLEY AVAILABLE     │
│  (assigned_to = None)   │
└────────────┬────────────┘
             │
             │ User scans QR
             ↓
┌─────────────────────────┐
│   TROLLEY ASSIGNED      │
│  (assigned_to = User)   │
└────────────┬────────────┘
             │
   ┌─────────┴──────────┐
   │                    │
   ↓                    ↓
SHOPPING            SESSION
 IN                  EXPIRES
PROGRESS             (30s)
   │                    │
   └─────────┬──────────┘
             │
             │ User pays
             ↓
┌─────────────────────────┐
│   TROLLEY AVAILABLE     │
│  (assigned_to = None)   │
└─────────────────────────┘
```

---

## Key Behaviors

### Assignment Logic
1. **New QR Scan**: If trolley is unassigned, it's immediately assigned to the scanning user
2. **Concurrent Access**: If another user tries to scan while assigned, they get a 409 CONFLICT error
3. **Session Expiry**: If a session expires (30s heartbeat timeout), the trolley is automatically unassigned

### De-assignment Logic
1. **Payment Completion**: When `POST /api/session/end` is called, trolley is unassigned
2. **Force Unassignment**: Admin can manually unassign through Django admin
3. **Auto-cleanup**: Expired sessions automatically unassign trolleys

---

## Implementation Files Modified

### Models
- **[trolleys/models.py](../App/server/trolleys/models.py)**: Added `assigned_to` and `assigned_at` fields
- **[sessions/models.py](../App/server/sessions/models.py)**: Added `user` field

### Serializers
- **[trolleys/serializers.py](../App/server/trolleys/serializers.py)**: Added `assigned_to_username` and `assigned_at` fields
- **[sessions/serializers.py](../App/server/sessions/serializers.py)**: Added `user` and `is_assigned` fields

### Views
- **[sessions/views.py](../App/server/sessions/views.py)**:
  - Updated `SessionQRScanView` to check assignment and prevent concurrent access
  - Updated `SessionEndView` to unassign trolley on session end

### Migrations
- **trolleys/migrations/0003_trolley_assigned_at_trolley_assigned_to.py**: Created
- **sessions/migrations/0002_session_user.py**: Created

---

## Testing Scenarios

### Scenario 1: Normal Flow
1. User A scans QR code → Trolley assigned to User A ✓
2. User A adds products → Cart filled ✓
3. User A pays → Trolley unassigned ✓
4. User B scans same QR code → Trolley assigned to User B ✓

### Scenario 2: Concurrent Access
1. User A scans QR code → Trolley assigned to User A ✓
2. User B tries to scan same QR → Gets 409 CONFLICT error ✓
3. User B shown: "Trolley is already in use by john_doe" ✓

### Scenario 3: Session Expiry
1. User A scans QR code → Trolley assigned ✓
2. No activity for 30 seconds → Session expires ✓
3. Trolley auto-unassigned ✓
4. User B can now scan → Gets new session ✓

### Scenario 4: Payment After Assignment
1. User A scans → Trolley assigned ✓
2. User A adds items and completes payment ✓
3. `POST /api/session/end` called ✓
4. Trolley unassigned, available for next user ✓

---

## Error Handling

| Error | HTTP Code | Message | Solution |
|-------|-----------|---------|----------|
| Trolley not found | 404 | "Trolley {id} not found" | Check trolley ID |
| Trolley inactive | 400 | "Trolley is not available for use" | Contact admin |
| Already in use | 409 | "Trolley is already in use" | Use different trolley or wait |
| Session expired | 400 | "Session has expired due to inactivity" | Start new session |
| Session not found | 404 | "Session not found" | Check session ID |

---

## Frontend Integration Notes

### Required Parameters
- **User ID**: Pass `user_id` when calling QR scan endpoint to enable assignment tracking
- **Session Management**: Store `session_id` for cart operations and payment completion

### Example Flow
```javascript
// 1. User scans QR code
POST /api/session/qr-scan
{
  "trolley_id": "TROLLEY_01",
  "user_id": currentUser.id  // IMPORTANT
}

// 2. Get response
if (response.status === 409) {
  // Show error: "Trolley already in use"
  showError("This trolley is being used by " + response.assigned_to);
} else {
  // Store session_id for later use
  localStorage.setItem('session_id', response.session_id);
  // Navigate to shopping page
}

// 3. Add items to cart
POST /api/cart/add
{
  "session_id": sessionId,
  "barcode": scannedBarcode
}

// 4. Complete payment
POST /api/session/end
{
  "session_id": sessionId
}
```

---

## Admin Dashboard Features

### Trolley Status View
- **Status**: Available / In Use
- **Assigned To**: Username (if assigned)
- **Assigned Since**: Duration of current assignment
- **Actions**: Force unassign (admin only)

### Session Audit Trail
- **User**: Who initiated the session
- **Trolley**: Which trolley was used
- **Duration**: How long the session lasted
- **Items**: How many items were purchased

---

## Future Enhancements

1. **Automatic De-assignment on Payment Success**: Integrate with payment service
2. **Multi-trolley Families**: Allow user to manage multiple trolleys
3. **Trolley Reservation**: Allow users to reserve trolleys in advance
4. **Real-time Notifications**: Notify users when their assigned trolley expires
5. **Admin Force Release**: Quick action to unassign trolleys stuck in sessions
6. **Analytics**: Track trolley usage patterns and assignment frequency

---

## Summary

Your Smart Trolley system now has a complete user assignment system where:
- ✅ Trolleys get unique IDs and QR codes
- ✅ When user scans QR, trolley is assigned to them
- ✅ Other users cannot use the trolley while assigned (409 conflict error)
- ✅ After payment, trolley is automatically unassigned
- ✅ Next user can immediately use the trolley

All changes are backward compatible and the database has been migrated successfully!
