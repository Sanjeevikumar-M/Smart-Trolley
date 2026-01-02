# Setup & Migration Guide

## Overview
This guide will walk you through all the changes made to the Smart Trolley backend and how to set up your system with the new QR code-based flow.

---

## What Changed?

### Models Updated
1. **Trolley Model** - Added QR code support
   - New field: `qr_code_data` (stores QR code URL)
   - New methods: `generate_qr_data()`, `get_qr_payload()`

### Serializers Added/Updated
1. **TrolleySerializer** - Now includes QR code data
2. **TrolleyQRSerializer** - For QR scan requests
3. **ESP32ScanSerializer** - For ESP32 product scanning
4. **QRScanResponseSerializer** - For QR scan responses

### Views Added
1. **SessionQRScanView** - Main entry point for user QR scans
2. **ESP32ScanView** - For ESP32 product scanning

### API Endpoints Added
1. `POST /api/session/qr-scan` - Create/retrieve session from QR scan
2. `POST /api/cart/esp32-scan` - Add product from ESP32 device
3. `GET /api/trolleys/{trolley_id}/qr` - Get QR code data for admin

---

## Step 1: Apply Database Migrations

### 1.1 Activate Virtual Environment
```bash
# Windows
cd D:\Smart-Trolley
.venv\Scripts\Activate.ps1

# Or on macOS/Linux
source .venv/bin/activate
```

### 1.2 Navigate to Server Directory
```bash
cd App/server
```

### 1.3 Create Migrations
```bash
python manage.py makemigrations trolleys
```

**Expected Output:**
```
Migrations for 'trolleys':
  trolleys/migrations/0002_trolley_qr_code_data.py
    + Add field qr_code_data to trolley
```

### 1.4 Apply Migrations
```bash
python manage.py migrate
```

**Expected Output:**
```
Operations to perform:
  Apply all migrations: ...
  
Running migrations:
  Applying trolleys.0002_trolley_qr_code_data... OK
```

---

## Step 2: Initialize Trolleys

### 2.1 Open Django Shell
```bash
python manage.py shell
```

### 2.2 Create Trolleys with QR Codes
```python
from trolleys.models import Trolley

# Create 5 trolleys
trolley_ids = ["TROLLEY_01", "TROLLEY_02", "TROLLEY_03", "TROLLEY_04", "TROLLEY_05"]

for trolley_id in trolley_ids:
    trolley, created = Trolley.objects.get_or_create(
        trolley_id=trolley_id,
        defaults={'is_active': True, 'is_locked': True}
    )
    if created:
        print(f"✓ Created {trolley_id} with QR: {trolley.qr_code_data}")
    else:
        print(f"• {trolley_id} already exists")

# Verify all trolleys
all_trolleys = Trolley.objects.all()
for trolley in all_trolleys:
    print(f"{trolley.trolley_id}: {trolley.qr_code_data}")
```

### 2.3 Exit Django Shell
```python
exit()
```

---

## Step 3: Configure Django Settings

### 3.1 Update settings.py
Add these settings to `App/server/server/settings.py`:

```python
# ============================================
# Smart Trolley Configuration
# ============================================

# Frontend URL for QR code generation
# Change this to your actual frontend URL
FRONTEND_URL = 'http://localhost:3000'  # Development
# FRONTEND_URL = 'https://yourdomain.com'  # Production

# Session timeout (seconds)
SESSION_HEARTBEAT_TIMEOUT = 30

# ============================================
# CORS Configuration (if using separate frontend)
# ============================================

from corsheaders.middleware import CorsMiddleware

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    # Add your production domain here
]

CORS_ALLOW_CREDENTIALS = True
```

### 3.2 Ensure CORS Headers is Installed
```bash
pip install django-cors-headers
```

Then add to `INSTALLED_APPS` in settings.py:
```python
INSTALLED_APPS = [
    'corsheaders',
    # ... other apps
]
```

And to `MIDDLEWARE`:
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... other middleware
]
```

---

## Step 4: Test the Backend API

### 4.1 Start Django Development Server
```bash
cd App/server
python manage.py runserver
```

**Expected Output:**
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

### 4.2 Test Trolley Endpoints

#### Get all trolleys with QR data:
```bash
curl http://localhost:8000/api/trolleys/
```

**Expected Response:**
```json
{
  "count": 5,
  "trolleys": [
    {
      "trolley_id": "TROLLEY_01",
      "qr_code_data": "http://localhost:3000/trolley/TROLLEY_01",
      "qr_payload": {
        "trolley_id": "TROLLEY_01",
        "url": "http://localhost:3000/trolley/TROLLEY_01",
        "hash": "abc123d4"
      },
      "is_active": true,
      "is_locked": true
    }
  ]
}
```

#### Get QR code for specific trolley:
```bash
curl http://localhost:8000/api/trolleys/TROLLEY_01/qr
```

**Expected Response:**
```json
{
  "trolley_id": "TROLLEY_01",
  "qr_code_url": "http://localhost:3000/trolley/TROLLEY_01",
  "qr_payload": {
    "trolley_id": "TROLLEY_01",
    "url": "http://localhost:3000/trolley/TROLLEY_01",
    "hash": "abc123d4"
  },
  "instructions": "Encode qr_code_url in QR code...",
  "is_active": true,
  "is_locked": false
}
```

### 4.3 Test Session Endpoints

#### Simulate user scanning QR code:
```bash
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id": "TROLLEY_01"}'
```

**Expected Response (201 Created):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "trolley_locked": false,
  "is_new_session": true,
  "cart_items_count": 0,
  "message": "Session started successfully"
}
```

**Save the session_id for next tests!**

#### Simulate sending heartbeat:
```bash
curl -X POST http://localhost:8000/api/session/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Expected Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "last_heartbeat": "2024-01-15T10:35:00Z",
  "message": "Heartbeat updated successfully"
}
```

### 4.4 Test Cart Endpoints

First, make sure you have a product in the database. Create one via Django admin or shell:

```python
python manage.py shell
```

```python
from products.models import Product

# Create a test product
product = Product.objects.create(
    barcode="8901063101012",
    name="Coca Cola 500ml",
    price=40.00,
    category="Beverages",
    is_active=True
)
print(f"Created product: {product.name}")
```

#### Simulate ESP32 scanning product:
```bash
curl -X POST http://localhost:8000/api/cart/esp32-scan \
  -H "Content-Type: application/json" \
  -d '{
    "trolley_id": "TROLLEY_01",
    "product_id": "8901063101012"
  }'
```

**Expected Response (201 Created):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "product": {
    "product_id": "8901063101012",
    "name": "Coca Cola 500ml",
    "price": "40.00",
    "category": "Beverages"
  },
  "cart_item": {
    "quantity": 1,
    "subtotal": "40.00"
  },
  "cart_summary": {
    "total_items": 1,
    "total_amount": "40.00"
  },
  "action": "added",
  "message": "Coca Cola 500ml added to cart"
}
```

#### View cart:
```bash
curl "http://localhost:8000/api/cart/view?session_id=550e8400-e29b-41d4-a716-446655440000"
```

**Expected Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "items": [
    {
      "id": 1,
      "product": {
        "barcode": "8901063101012",
        "name": "Coca Cola 500ml",
        "price": "40.00",
        "category": "Beverages"
      },
      "quantity": 1,
      "subtotal": "40.00"
    }
  ],
  "total_items": 1,
  "total_amount": "40.00"
}
```

### 4.5 Test Session End

```bash
curl -X POST http://localhost:8000/api/session/end \
  -H "Content-Type: application/json" \
  -d '{"session_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Expected Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "items_cleared": 1,
  "message": "Session ended successfully"
}
```

---

## Step 5: Setup ESP32 Device

### 5.1 Update Arduino Code with Your Settings
Edit the ESP32 code with:
- WiFi SSID and password
- Backend server IP/URL
- Trolley ID matching your physical trolley
- GPIO pins for barcode scanner, LED, buzzer

### 5.2 Upload Code to ESP32
Use Arduino IDE or PlatformIO to upload the code.

### 5.3 Test Connection
Monitor ESP32 serial output:
```
ESP32 Ready!
Trolley ID: TROLLEY_01
Connecting to WiFi...
WiFi connected!
IP: 192.168.1.100
```

---

## Step 6: Setup Frontend Application

### 6.1 Create React/Vue App with QR Support
```bash
# Create new React app (or use existing)
npx create-react-app smart-trolley-web

cd smart-trolley-web

# Install dependencies
npm install react-router-dom axios
npm install qrcode.react  # For QR code display
```

### 6.2 Create Trolley Cart Component
See [SYSTEM_FLOW.md](./SYSTEM_FLOW.md) for complete React component code.

### 6.3 Configure API Base URL
```javascript
const API_BASE = 'http://localhost:8000/api';
// Change to production URL when deploying
```

### 6.4 Setup Routing
Ensure you have route: `/trolley/:trolleyId`

### 6.5 Start Frontend Server
```bash
npm start
```

Expected: App runs on http://localhost:3000

---

## Step 7: End-to-End Testing

### Full User Journey Test

1. **Start Backend**
   ```bash
   cd App/server
   python manage.py runserver
   ```

2. **Start Frontend**
   ```bash
   cd smart-trolley-web
   npm start
   ```

3. **Simulate QR Scan**
   Navigate to: http://localhost:3000/trolley/TROLLEY_01
   (This simulates scanning the QR code)

4. **Verify Session Created**
   - Check that cart is displayed (empty)
   - Check browser console for session_id

5. **Simulate ESP32 Scan**
   ```bash
   curl -X POST http://localhost:8000/api/cart/esp32-scan \
     -H "Content-Type: application/json" \
     -d '{"trolley_id": "TROLLEY_01", "product_id": "8901063101012"}'
   ```

6. **Verify Cart Updated**
   - Product should appear in web app within 2-3 seconds
   - Price and quantity should be correct

7. **Test Multiple Products**
   Repeat step 5-6 with different products

8. **Test Checkout**
   Click "Proceed to Payment" button
   - Session should end
   - Cart should be cleared
   - Trolley should be locked

---

## Troubleshooting

### Issue: Migration fails
```
ModuleNotFoundError: No module named 'django'
```
**Solution:** Ensure virtual environment is activated

### Issue: "Trolley not found" error
**Cause:** Trolleys not created in database  
**Solution:** Run Django shell and create trolleys (Step 2)

### Issue: CORS errors in browser console
**Cause:** CORS not configured properly  
**Solution:** Check CORS settings in settings.py (Step 3)

### Issue: ESP32 can't connect to backend
**Cause:** Wrong server URL or WiFi down  
**Solution:** 
- Verify server URL in ESP32 code
- Check WiFi connection
- Ping server from ESP32: `ping 192.168.1.100`

### Issue: Cart not updating in real-time
**Cause:** Frontend polling interval too long  
**Solution:** Reduce polling interval to 2-3 seconds

### Issue: Session expires immediately
**Cause:** Heartbeat not being sent from frontend  
**Solution:** Ensure heartbeat is sent every 20 seconds

---

## Production Deployment

### Update Configuration
```python
# settings.py

# Change to production frontend URL
FRONTEND_URL = 'https://yourdomain.com'

# Change to production backend URL
ALLOWED_HOSTS = ['yourdomain.com', 'api.yourdomain.com']

# Update CORS settings
CORS_ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
]

# Disable debug mode
DEBUG = False

# Update session timeout if needed (default: 30 seconds)
SESSION_HEARTBEAT_TIMEOUT = 30
```

### Deploy Backend
```bash
# Create production database
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Collect static files (if using)
python manage.py collectstatic

# Run with production server (gunicorn recommended)
pip install gunicorn
gunicorn server.wsgi:application --bind 0.0.0.0:8000
```

### Deploy Frontend
```bash
# Build for production
npm run build

# Deploy build/ folder to hosting (Vercel, Netlify, etc.)
# Or use Docker, AWS, etc.
```

---

## File Changes Summary

### Modified Files
- `trolleys/models.py` - Added QR code support
- `trolleys/serializers.py` - Updated TrolleySerializer, added TrolleyQRSerializer
- `trolleys/views.py` - Added TrolleyQRCodeView
- `trolleys/urls.py` - Added QR endpoint
- `sessions/serializers.py` - Added QRScanResponseSerializer
- `sessions/views.py` - Added SessionQRScanView
- `sessions/urls.py` - Added QR scan route
- `cart/serializers.py` - Added ESP32ScanSerializer
- `cart/views.py` - Added ESP32ScanView
- `cart/urls.py` - Added ESP32 scan route

### New Files
- `API_DOCUMENTATION.md` - Complete API reference
- `SYSTEM_FLOW.md` - System architecture and flow
- `SETUP_GUIDE.md` - This file

### New Migration
- `trolleys/migrations/0002_trolley_qr_code_data.py` - Auto-generated

---

## Next Steps

1. ✅ Apply migrations
2. ✅ Initialize trolleys
3. ✅ Configure Django settings
4. ✅ Test backend API
5. ✅ Setup ESP32
6. ✅ Setup frontend
7. ✅ End-to-end testing
8. ✅ Deploy to production

---

## Support & Documentation

- **API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **System Flow:** See [SYSTEM_FLOW.md](./SYSTEM_FLOW.md)
- **Django Documentation:** https://docs.djangoproject.com/
- **Django REST Framework:** https://www.django-rest-framework.org/
- **ESP32 Documentation:** https://docs.espressif.com/projects/esp-idf/

---

**Version:** 2.0  
**Last Updated:** January 2026  
**Status:** Ready for Production
