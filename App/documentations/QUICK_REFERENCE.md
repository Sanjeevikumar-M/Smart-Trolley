# Quick Reference Guide - Smart Trolley QR Flow

## 🎯 What Changed?

### Old Flow (Before)
```
User manually enters trolley ID
→ Backend creates session
→ User manually scans products
→ Product added to cart
```

### New Flow (After)
```
User scans QR code on trolley
↓
Web app automatically gets trolley_id
↓
Session created automatically
↓
ESP32 in trolley scans products
↓
Products automatically added to cart
↓
User sees real-time updates
```

---

## 📱 User Experience

### 1. User Arrives at Store
- User takes a trolley
- Sees QR code sticker

### 2. User Scans QR Code
- Opens camera app
- Scans QR code
- Automatically redirected to web app
- Sees empty cart

### 3. User Shops
- Places products in trolley
- ESP32 device scans each product
- Product appears in web app instantly

### 4. User Checks Out
- Views cart total
- Clicks "Proceed to Payment"
- Cart is cleared
- Trolley is locked

---

## 🔌 API Endpoints at a Glance

| Endpoint | Method | Called By | Purpose |
|----------|--------|-----------|---------|
| `/api/session/qr-scan` | POST | Frontend | Start session from QR scan |
| `/api/session/heartbeat` | POST | Frontend | Keep session alive |
| `/api/session/end` | POST | Frontend | Checkout/end session |
| `/api/cart/esp32-scan` | POST | ESP32 | Add product to cart |
| `/api/cart/view` | GET | Frontend | Get current cart |
| `/api/trolleys/{id}/qr` | GET | Admin | Get QR code data |

---

## 💾 Database Flow

```
QR Code Scan
    ↓
Session Created (linked to Trolley)
    ↓
ESP32 Scan
    ↓
Find Active Session for Trolley
    ↓
Add Product to Session's Cart
    ↓
Cart Item Created
```

---

## 🛠️ Implementation Checklist

### Backend Setup
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create trolleys in Django shell
- [ ] Test API endpoints with curl
- [ ] Configure FRONTEND_URL in settings.py

### ESP32 Setup
- [ ] Update WiFi credentials
- [ ] Update server URL and trolley_id
- [ ] Upload code to ESP32
- [ ] Test serial output

### Frontend Setup
- [ ] Create React/Vue component
- [ ] Setup routing: `/trolley/:trolleyId`
- [ ] Implement session initialization
- [ ] Implement cart polling
- [ ] Implement heartbeat
- [ ] Test in browser

### Testing
- [ ] Simulate QR scan (manual URL navigation)
- [ ] Test product scan (curl command)
- [ ] Verify cart updates in real-time
- [ ] Test session timeout
- [ ] Test checkout

---

## 🔑 Key Code Snippets

### Frontend Session Initialization
```javascript
// When component mounts
const initSession = async () => {
  const response = await fetch('/api/session/qr-scan', {
    method: 'POST',
    body: JSON.stringify({ trolley_id: trolleyIdFromUrl })
  });
  const data = await response.json();
  setSessionId(data.session_id);
};
```

### Frontend Heartbeat (every 20 seconds)
```javascript
const sendHeartbeat = async () => {
  await fetch('/api/session/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId })
  });
};
```

### Frontend Cart Polling (every 2-3 seconds)
```javascript
const fetchCart = async () => {
  const response = await fetch(`/api/cart/view?session_id=${sessionId}`);
  const data = await response.json();
  setCart(data);
};
```

### ESP32 Product Scan
```cpp
// When barcode scanned
sendToBackend(scannedBarcode);

void sendToBackend(String productId) {
  HTTPClient http;
  http.begin(serverUrl);
  
  String json = "{\"trolley_id\":\"" + String(trolleyId) + 
                "\",\"product_id\":\"" + productId + "\"}";
  
  int httpCode = http.POST(json);
  
  if (httpCode == 201 || httpCode == 200) {
    showSuccess();  // LED/Buzzer feedback
  } else {
    showError();
  }
}
```

---

## 📊 Testing Commands

### Test 1: Get Trolley Info
```bash
curl http://localhost:8000/api/trolleys/TROLLEY_01/
```

### Test 2: Simulate QR Scan
```bash
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id":"TROLLEY_01"}'
```
**Save the session_id returned!**

### Test 3: Simulate ESP32 Scan
```bash
curl -X POST http://localhost:8000/api/cart/esp32-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id":"TROLLEY_01","product_id":"8901063101012"}'
```

### Test 4: View Cart
```bash
curl "http://localhost:8000/api/cart/view?session_id=[SESSION_ID]"
```

### Test 5: End Session
```bash
curl -X POST http://localhost:8000/api/session/end \
  -H "Content-Type: application/json" \
  -d '{"session_id":"[SESSION_ID]"}'
```

---

## ⚙️ Configuration

### Django Settings (settings.py)
```python
FRONTEND_URL = 'http://localhost:3000'  # Change for production
SESSION_HEARTBEAT_TIMEOUT = 30  # seconds before session expires
```

### ESP32 Code
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:8000/api/cart/esp32-scan";
const char* trolleyId = "TROLLEY_01";  // Match your physical trolley
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Trolley not found" | Create trolleys in Django shell |
| "No active session" | User must scan QR code first |
| "Session expired" | Frontend not sending heartbeat |
| ESP32 can't connect | Check WiFi and server URL |
| Cart not updating | Reduce polling interval to 2-3 sec |
| CORS error | Update CORS settings in Django |

---

## 📈 Performance Tips

- **Polling Interval:** 2-3 seconds for cart
- **Heartbeat Interval:** 20 seconds
- **Session Timeout:** 30 seconds
- **Use WebSocket:** For production (real-time without polling)
- **Cache Products:** To reduce database queries

---

## 🚀 Production Deployment

1. Update FRONTEND_URL to production domain
2. Set DEBUG = False
3. Update ALLOWED_HOSTS
4. Update CORS_ALLOWED_ORIGINS
5. Use production database (PostgreSQL recommended)
6. Use production web server (Gunicorn + Nginx)
7. Enable HTTPS
8. Setup monitoring and logging

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `API_DOCUMENTATION.md` | Complete API reference with examples |
| `SYSTEM_FLOW.md` | Architecture, flow diagrams, code examples |
| `SETUP_GUIDE.md` | Step-by-step setup and testing |
| `QUICK_REFERENCE.md` | This file - quick lookup guide |

---

## ✅ Success Indicators

System is working when:
- ✅ User scans QR → redirected to web app
- ✅ Cart displayed (empty initially)
- ✅ ESP32 scans product → appears in web app (2-3 sec)
- ✅ Multiple products can be added
- ✅ Total amount calculated correctly
- ✅ Checkout clears cart and locks trolley

---

## 🔗 Related Documents

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Full API reference
- [SYSTEM_FLOW.md](./SYSTEM_FLOW.md) - System architecture
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions

---

**Quick Links:**
- Django Server: `http://localhost:8000`
- Django Admin: `http://localhost:8000/admin`
- Frontend: `http://localhost:3000`
- API Base: `http://localhost:8000/api`

---

**Version:** 2.0  
**Last Updated:** January 2026
