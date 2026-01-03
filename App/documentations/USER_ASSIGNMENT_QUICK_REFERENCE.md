# Smart Trolley Assignment - Quick Reference

## What Was Implemented

Your idea has been fully implemented! Here's what the system now does:

### 1. **Trolley Initialization** ✅
- When switch is turned on, trolley connects to backend
- Each trolley has unique ID (TROLLEY_01, TROLLEY_02, etc.)
- ID is converted to QR code and stored in database

### 2. **User Assignment on QR Scan** ✅
```
User scans QR → Backend receives request → 
Check if trolley assigned → 
  ├─ If YES and assigned to someone else → Return 409 CONFLICT "Already in use"
  ├─ If YES but same user → Continue session
  └─ If NO → Assign to current user → Return 201 CREATED
```

### 3. **Product Scanning** ✅
- User scans product barcode in the trolley
- Backend fetches product details from database
- Details sent to user's mobile device
- Item added to their cart (tied to their session)

### 4. **Payment & Auto-Unassignment** ✅
```
User completes payment → 
POST /api/session/end → 
  ├─ Clear cart items
  ├─ End session
  └─ Unassign trolley (assigned_to = NULL)
```

### 5. **Conflict Handling** ✅
```
User B tries to scan while User A has it →
409 CONFLICT Response:
{
  "error": "Trolley is already in use",
  "message": "Currently assigned to john_doe",
  "assigned_to": "john_doe",
  "assigned_at": "2025-01-03T10:30:45Z"
}
```

---

## Key Database Changes

### Trolley Model
```python
assigned_to = ForeignKey(User)      # Who has the trolley
assigned_at = DateTimeField()       # When assigned
```

### Session Model
```python
user = ForeignKey(User)             # Who started this session
```

---

## API Summary

| Action | Endpoint | Method | Status | Response |
|--------|----------|--------|--------|----------|
| Scan QR | `/api/session/qr-scan` | POST | 201 (new) / 200 (existing) / 409 (conflict) | Session ID + assignment info |
| Pay & End | `/api/session/end` | POST | 200 | Confirms unassignment |
| Get Trolley Info | `/api/trolleys/{trolley_id}` | GET | 200 | Trolley details including `assigned_to` |
| Get All Trolleys | `/api/trolleys` | GET | 200 | List of all trolleys with assignment status |

---

## Testing with cURL

### Test 1: Scan QR (New Session)
```bash
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{
    "trolley_id": "TROLLEY_01",
    "user_id": 1
  }'
```

**Expected Response (201)**:
```json
{
  "session_id": "uuid-string",
  "trolley_id": "TROLLEY_01",
  "is_assigned": true,
  "assigned_to": "username",
  "message": "Session started successfully"
}
```

### Test 2: Try to Scan Same QR (Should Fail)
```bash
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{
    "trolley_id": "TROLLEY_01",
    "user_id": 2
  }'
```

**Expected Response (409)**:
```json
{
  "error": "Trolley is already in use",
  "message": "This trolley is currently assigned to another user (username)...",
  "assigned_to": "username"
}
```

### Test 3: End Session (Unassign Trolley)
```bash
curl -X POST http://localhost:8000/api/session/end \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "uuid-string"
  }'
```

**Expected Response (200)**:
```json
{
  "session_id": "uuid-string",
  "trolley_id": "TROLLEY_01",
  "trolley_unassigned": true,
  "message": "Session ended successfully and trolley unassigned"
}
```

---

## Files Modified

**Models**:
- ✅ `trolleys/models.py` - Added assignment fields
- ✅ `sessions/models.py` - Added user tracking

**Serializers**:
- ✅ `trolleys/serializers.py` - Show assignment info
- ✅ `sessions/serializers.py` - Include user and assignment status

**Views**:
- ✅ `sessions/views.py` - Assignment & conflict checking logic

**Migrations**:
- ✅ `trolleys/migrations/0003_*.py` - Created (auto-generated)
- ✅ `sessions/migrations/0002_*.py` - Created (auto-generated)

---

## State Diagram

```
┌──────────────┐
│  AVAILABLE   │  (assigned_to = None)
│  (Unlocked)  │
└──────┬───────┘
       │ User scans QR + user_id
       ├─────────────────────┐
       │                     │
       ▼                     ▼
  ┌─────────┐         ┌─────────────┐
  │ ASSIGN  │         │  CONFLICT!  │
  │(409?)   │         │  (409 error)│
  └─────────┘         └─────────────┘
       │
       ▼
 ┌──────────────┐
 │  IN USE      │  (assigned_to = User)
 │  (Locked)    │  Session active
 └──────┬───────┘
        │
     ┌──┴──────────────┐
     │                 │
     ▼ (30s idle)      ▼ (user pays)
  AUTO-EXPIRE      POST /end
     │                 │
     └──────┬──────────┘
            ▼
       ┌──────────────┐
       │  AVAILABLE   │  (assigned_to = None)
       │  (Unlocked)  │  Ready for next user
       └──────────────┘
```

---

## Key Features

✅ **Single Assignment**: Only one user per trolley at a time
✅ **Conflict Detection**: 409 error when someone tries to use assigned trolley
✅ **Auto-cleanup**: Sessions expire after 30s inactivity (trolley unassigned)
✅ **Clear Messaging**: Users told who has the trolley and when
✅ **Audit Trail**: Sessions track which user used which trolley
✅ **Payment Integration**: Trolley unassigned after `POST /session/end`

---

## What Happens Next

1. **Apply Migrations** (Already Done ✅)
   ```bash
   python manage.py migrate  # Applied successfully!
   ```

2. **Test the Endpoints** (Do This)
   - Use the cURL commands above
   - Or use Postman/Thunder Client

3. **Integrate with Frontend** (Next Step)
   - Pass `user_id` when calling QR scan endpoint
   - Handle 409 conflicts to show user message
   - Call `/api/session/end` after payment

4. **Connect to Hardware** (Hardware Team)
   - Ensure trolley sends `user_id` with QR scan
   - Ensure hardware triggers payment endpoint after checkout

---

## Documentation Files

📄 **Full Documentation**: See `USER_ASSIGNMENT_IMPLEMENTATION.md`
📄 **This File**: `USER_ASSIGNMENT_QUICK_REFERENCE.md`

---

## Questions or Issues?

If anything doesn't work as expected:
1. Check database migrations ran: `python manage.py showmigrations`
2. Verify models have new fields: `python manage.py sqlmigrate trolleys 0003`
3. Test endpoints individually with cURL/Postman
4. Check Django logs for detailed error messages

---

**Status**: ✅ Implementation Complete | ✅ Database Migrated | ⏳ Testing Phase
