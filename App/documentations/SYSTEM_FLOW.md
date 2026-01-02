# Smart Trolley System - Updated Architecture

## 🎯 Project Overview

The Smart Trolley system enables users to scan a QR code on a trolley to start a shopping session. When users place products in the trolley, an ESP32 device automatically scans them and adds them to the user's digital cart in real-time.

---

## 🔄 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. User Arrives at Store
   ↓
2. User Scans QR Code on Trolley
   (QR Code: http://yourwebsite.com/trolley/TROLLEY_01)
   ↓
3. User Redirected to Web App
   ↓
4. Web App Calls: POST /api/session/qr-scan
   Body: { "trolley_id": "TROLLEY_01" }
   ↓
5. Backend Creates Session
   Returns: { "session_id": "uuid", "trolley_id": "TROLLEY_01" }
   ↓
6. Web App Displays Empty Cart
   (Starts heartbeat & cart polling)
   ↓
7. User Places Product in Trolley
   ↓
8. ESP32 Device Scans Product Barcode
   ↓
9. ESP32 Calls: POST /api/cart/esp32-scan
   Body: { "trolley_id": "TROLLEY_01", "product_id": "barcode" }
   ↓
10. Backend Finds Active Session for Trolley
    ↓
11. Backend Adds Product to Cart
    ↓
12. Web App Auto-Updates (via polling)
    Shows: Product added with price
    ↓
13. User Continues Shopping (repeat steps 7-12)
    ↓
14. User Finishes Shopping
    ↓
15. User Clicks "Proceed to Payment"
    ↓
16. Web App Calls: POST /api/session/end
    ↓
17. Backend Clears Cart & Locks Trolley
    ↓
18. User Proceeds to Payment Gateway
```

---

## 🏗️ Architecture Components

### 1. **Trolley with QR Code**
- Physical trolley has QR code sticker
- QR contains URL: `{FRONTEND_URL}/trolley/{trolley_id}`
- Each trolley has unique ID (e.g., TROLLEY_01, TROLLEY_02)

### 2. **ESP32 Device (in Trolley)**
- Mounted in trolley
- Scans product barcodes
- Connected to WiFi
- Knows its own trolley_id
- Sends data to backend API

### 3. **Backend Django API**
- Manages sessions
- Handles product scanning
- Tracks cart items
- Auto-resolves trolley → session → cart

### 4. **Frontend Web App**
- React/Next.js/Vue application
- Receives trolley_id from QR scan
- Displays real-time cart
- Sends heartbeats
- Polls for cart updates

---

## 📡 Key API Endpoints

### For Frontend (User Side)

1. **Initialize Session** (when QR scanned)
   ```
   POST /api/session/qr-scan
   Body: { "trolley_id": "TROLLEY_01" }
   ```

2. **Keep Session Alive** (every 20 seconds)
   ```
   POST /api/session/heartbeat
   Body: { "session_id": "uuid" }
   ```

3. **View Cart** (polling every 2-3 seconds)
   ```
   GET /api/cart/view?session_id=uuid
   ```

4. **End Session** (checkout)
   ```
   POST /api/session/end
   Body: { "session_id": "uuid" }
   ```

### For ESP32 Device

1. **Scan Product** (when barcode detected)
   ```
   POST /api/cart/esp32-scan
   Body: {
     "trolley_id": "TROLLEY_01",
     "product_id": "8901063101012"
   }
   ```

### For Admin

1. **Get Trolley QR Data**
   ```
   GET /api/trolleys/TROLLEY_01/qr
   ```

2. **List All Trolleys**
   ```
   GET /api/trolleys
   ```

---

## 🔑 Key Concepts

### Session Management
- **Session** = One shopping trip with one trolley
- Session is created when user scans QR code
- Session is tied to specific trolley
- Only ONE active session per trolley at a time
- Session expires after 30 seconds of no heartbeat

### Trolley ↔ Session ↔ Cart Relationship
```
Trolley (TROLLEY_01)
    ↓
Session (uuid-1234-5678)
    ↓
Cart Items:
    - Product A × 2
    - Product B × 1
    - Product C × 3
```

### ESP32 → Backend Flow
```
ESP32 knows: trolley_id = "TROLLEY_01"
ESP32 scans: product_id = "8901063101012"
ESP32 sends both to backend
Backend finds: Active session for TROLLEY_01
Backend adds: Product to that session's cart
```

---

## 🛠️ Database Schema

### Trolley Model
```python
- trolley_id: "TROLLEY_01" (unique)
- qr_code_data: "http://example.com/trolley/TROLLEY_01"
- is_active: True/False
- is_locked: True/False
- last_seen: datetime
```

### Session Model
```python
- session_id: UUID (primary key)
- trolley: ForeignKey to Trolley
- is_active: True/False
- last_heartbeat: datetime
- created_at: datetime
- ended_at: datetime
```

### CartItem Model
```python
- session: ForeignKey to Session
- product: ForeignKey to Product
- quantity: int
- subtotal: decimal
- added_at: datetime
```

---

## 🚀 Quick Start Guide

### 1. Apply Migrations
```bash
cd App/server
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Trolleys (Django Shell)
```bash
python manage.py shell
```
```python
from trolleys.models import Trolley

# Create trolleys
for i in range(1, 6):
    Trolley.objects.create(
        trolley_id=f"TROLLEY_{i:02d}",
        is_active=True,
        is_locked=True
    )
```

### 3. Get QR Code for Trolley
```bash
curl http://localhost:8000/api/trolleys/TROLLEY_01/qr
```

Response:
```json
{
  "qr_code_url": "http://localhost:3000/trolley/TROLLEY_01",
  "instructions": "Encode this URL in QR code"
}
```

### 4. Test the Flow
```bash
# 1. Scan QR (simulate user)
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id": "TROLLEY_01"}'

# 2. Scan product (simulate ESP32)
curl -X POST http://localhost:8000/api/cart/esp32-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id": "TROLLEY_01", "product_id": "8901063101012"}'

# 3. View cart
curl "http://localhost:8000/api/cart/view?session_id=YOUR_SESSION_ID"
```

---

## 💻 Frontend Implementation

### React Example (Complete Component)

```javascript
// TrolleyCart.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

function TrolleyCart() {
  const { trolleyId } = useParams(); // From /trolley/:trolleyId route
  const [sessionId, setSessionId] = useState(null);
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [loading, setLoading] = useState(true);

  // Initialize session when component mounts
  useEffect(() => {
    initSession();
  }, [trolleyId]);

  // Start heartbeat when session is active
  useEffect(() => {
    if (!sessionId) return;
    
    const heartbeatInterval = setInterval(sendHeartbeat, 20000);
    return () => clearInterval(heartbeatInterval);
  }, [sessionId]);

  // Poll cart updates when session is active
  useEffect(() => {
    if (!sessionId) return;
    
    const pollInterval = setInterval(fetchCart, 2000);
    return () => clearInterval(pollInterval);
  }, [sessionId]);

  const initSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/session/qr-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trolley_id: trolleyId })
      });
      
      const data = await response.json();
      setSessionId(data.session_id);
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setLoading(false);
    }
  };

  const sendHeartbeat = async () => {
    if (!sessionId) return;
    
    try {
      await fetch(`${API_BASE}/session/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  };

  const fetchCart = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/cart/view?session_id=${sessionId}`
      );
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  const handleCheckout = async () => {
    try {
      await fetch(`${API_BASE}/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      
      // Redirect to payment
      window.location.href = '/payment';
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="cart-container">
      <header>
        <h1>Trolley {trolleyId}</h1>
        <p>Session: {sessionId?.slice(0, 8)}...</p>
      </header>

      <div className="cart-items">
        {cart.items.length === 0 ? (
          <p>Your cart is empty. Start adding items!</p>
        ) : (
          cart.items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="item-info">
                <h3>{item.product.name}</h3>
                <p>{item.product.category}</p>
              </div>
              <div className="item-details">
                <p>₹{item.product.price} × {item.quantity}</p>
                <p className="subtotal">₹{item.subtotal}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary">
        <div className="total">
          <span>Total Items:</span>
          <span>{cart.total_items}</span>
        </div>
        <div className="total">
          <span>Total Amount:</span>
          <span>₹{cart.total_amount}</span>
        </div>
        
        <button 
          onClick={handleCheckout}
          disabled={cart.items.length === 0}
          className="checkout-btn"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}

export default TrolleyCart;
```

### Routing Setup
```javascript
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TrolleyCart from './components/TrolleyCart';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/trolley/:trolleyId" element={<TrolleyCart />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🔧 ESP32 Implementation

### Complete Arduino Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* serverUrl = "http://192.168.1.100:8000/api/cart/esp32-scan";
const char* trolleyId = "TROLLEY_01";  // CHANGE FOR EACH TROLLEY

// Pin definitions (adjust based on your barcode scanner)
#define BARCODE_RX 16
#define BARCODE_TX 17
#define LED_SUCCESS 2
#define LED_ERROR 4
#define BUZZER 5

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_SUCCESS, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("ESP32 Ready!");
  Serial.print("Trolley ID: ");
  Serial.println(trolleyId);
}

void loop() {
  // Check for barcode scan
  if (Serial.available()) {
    String barcode = Serial.readStringUntil('\n');
    barcode.trim();
    
    if (barcode.length() > 0) {
      Serial.print("Scanned: ");
      Serial.println(barcode);
      
      // Send to backend
      sendToBackend(barcode);
      
      delay(1000); // Debounce
    }
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void sendToBackend(String productId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    showError();
    return;
  }
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["trolley_id"] = trolleyId;
  doc["product_id"] = productId;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Sending: " + jsonPayload);
  
  // Send POST request
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Response code: " + String(httpCode));
    Serial.println("Response: " + response);
    
    if (httpCode == 200 || httpCode == 201) {
      // Parse success response
      DynamicJsonDocument responseDoc(1024);
      deserializeJson(responseDoc, response);
      
      const char* productName = responseDoc["product"]["name"];
      const char* action = responseDoc["action"];
      int quantity = responseDoc["cart_item"]["quantity"];
      
      Serial.print("✓ ");
      Serial.print(productName);
      Serial.print(" (qty: ");
      Serial.print(quantity);
      Serial.println(")");
      
      showSuccess();
    } else {
      Serial.println("Error from server");
      showError();
    }
  } else {
    Serial.println("HTTP Error: " + String(httpCode));
    showError();
  }
  
  http.end();
}

void showSuccess() {
  // LED blink
  digitalWrite(LED_SUCCESS, HIGH);
  
  // Buzzer beep
  tone(BUZZER, 1000, 100);
  
  delay(500);
  digitalWrite(LED_SUCCESS, LOW);
}

void showError() {
  // LED blink 3 times
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_ERROR, HIGH);
    tone(BUZZER, 500, 100);
    delay(200);
    digitalWrite(LED_ERROR, LOW);
    delay(200);
  }
}
```

---

## 📋 Testing Checklist

- [ ] Migrations applied successfully
- [ ] Trolleys created in database
- [ ] QR codes generated for trolleys
- [ ] Test QR scan endpoint (session creation)
- [ ] Test ESP32 scan endpoint (add product)
- [ ] Test cart view endpoint
- [ ] Test session heartbeat
- [ ] Test session end (cleanup)
- [ ] Frontend displays cart correctly
- [ ] Frontend polls for updates
- [ ] ESP32 connects to WiFi
- [ ] ESP32 sends data to backend
- [ ] LED/Buzzer feedback works

---

## 🐛 Troubleshooting

### Issue: "No active session found"
**Cause:** User hasn't scanned trolley QR code yet  
**Solution:** User must scan QR code first to create session

### Issue: "Session expired"
**Cause:** No heartbeat for 30+ seconds  
**Solution:** Ensure frontend sends heartbeat every 20 seconds

### Issue: ESP32 can't connect
**Cause:** Wrong WiFi credentials or server URL  
**Solution:** Check WiFi SSID/password and server IP in ESP32 code

### Issue: Cart not updating in real-time
**Cause:** Polling interval too long  
**Solution:** Reduce polling interval to 2-3 seconds

---

## 📊 System Configuration

### Django Settings (settings.py)
```python
# Add to settings.py
FRONTEND_URL = 'http://localhost:3000'  # Change for production
SESSION_HEARTBEAT_TIMEOUT = 30  # seconds
```

### CORS Settings (for API access)
```python
# In settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://192.168.1.100:3000",  # Add your frontend URL
]
```

---

## 🎉 Success Criteria

Your system is working correctly when:
1. ✅ User scans QR → redirected to web app
2. ✅ Web app creates session automatically
3. ✅ Empty cart is displayed
4. ✅ User places product in trolley
5. ✅ ESP32 scans product
6. ✅ Product appears in web app cart (within 2-3 seconds)
7. ✅ Price and quantity are correct
8. ✅ Multiple products can be added
9. ✅ Total amount calculated correctly
10. ✅ User can end session and proceed to payment

---

## 📞 Support

For detailed API documentation, see: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

**Version:** 2.0  
**Last Updated:** January 2026
