# Smart Trolley API Documentation

## Overview

This API documentation describes the new QR-based flow for the Smart Trolley system. The system allows users to scan a QR code on a trolley to start a shopping session, and products are scanned by an ESP32 device in the trolley to automatically add them to the user's cart.

## Architecture Flow

### 1. **User Scans Trolley QR Code**
   - User opens camera (or visits website directly)
   - Scans QR code stuck on the trolley
   - QR code contains URL: `{FRONTEND_URL}/trolley/{trolley_id}`
   - User is redirected to web application

### 2. **Frontend Calls Session API**
   - Web app extracts `trolley_id` from URL
   - Calls `POST /api/session/qr-scan` with `trolley_id`
   - Receives `session_id` to track the shopping session

### 3. **ESP32 Device Scans Products**
   - ESP32 device in trolley scans product barcode
   - ESP32 sends `trolley_id` + `product_id` to backend
   - Backend resolves active session for trolley
   - Product automatically added to cart

### 4. **Frontend Displays Cart**
   - Frontend uses `session_id` to fetch cart
   - Real-time updates when ESP32 adds products
   - User sees items, quantities, and total amount

---

## API Endpoints

### Base URL
```
http://localhost:8000/api
```

---

## 1. Trolley Management

### GET /api/trolleys
Get list of all trolleys with their QR code information.

**Response:**
```json
{
  "count": 5,
  "trolleys": [
    {
      "id": 1,
      "trolley_id": "TROLLEY_01",
      "qr_code_data": "http://localhost:3000/trolley/TROLLEY_01",
      "qr_payload": {
        "trolley_id": "TROLLEY_01",
        "url": "http://localhost:3000/trolley/TROLLEY_01",
        "timestamp": "2024-01-15T10:30:00Z",
        "hash": "a1b2c3d4"
      },
      "is_active": true,
      "is_locked": false,
      "last_seen": "2024-01-15T10:35:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /api/trolleys/{trolley_id}
Get details of a specific trolley.

**Response:**
```json
{
  "id": 1,
  "trolley_id": "TROLLEY_01",
  "qr_code_data": "http://localhost:3000/trolley/TROLLEY_01",
  "qr_payload": {
    "trolley_id": "TROLLEY_01",
    "url": "http://localhost:3000/trolley/TROLLEY_01",
    "timestamp": "2024-01-15T10:30:00Z",
    "hash": "a1b2c3d4"
  },
  "is_active": true,
  "is_locked": false,
  "last_seen": "2024-01-15T10:35:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### GET /api/trolleys/{trolley_id}/qr
Get QR code data for a specific trolley (for admin/setup purposes).

**Response:**
```json
{
  "trolley_id": "TROLLEY_01",
  "qr_code_url": "http://localhost:3000/trolley/TROLLEY_01",
  "qr_payload": {
    "trolley_id": "TROLLEY_01",
    "url": "http://localhost:3000/trolley/TROLLEY_01",
    "timestamp": "2024-01-15T10:30:00Z",
    "hash": "a1b2c3d4"
  },
  "instructions": "Encode qr_code_url in QR code. When scanned, user should be redirected to your web app with trolley_id parameter.",
  "is_active": true,
  "is_locked": false
}
```

**Use Case:**
- Admin dashboard to generate/print QR codes for trolleys
- Frontend QR code generator component

---

## 2. Session Management (User-Side)

### POST /api/session/qr-scan
**Primary endpoint called when user scans trolley QR code.**

Creates a new session or returns existing active session for the trolley.

**Request Body:**
```json
{
  "trolley_id": "TROLLEY_01"
}
```

**Response (New Session - 201 Created):**
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

**Response (Existing Session - 200 OK):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "trolley_locked": false,
  "is_new_session": false,
  "cart_items_count": 3,
  "message": "Continuing existing session"
}
```

**Error Responses:**
- `404`: Trolley not found
- `400`: Trolley not active/available

---

### POST /api/session/heartbeat
Keep session alive (prevents timeout).

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "last_heartbeat": "2024-01-15T10:35:00Z",
  "message": "Heartbeat updated successfully"
}
```

**Recommendation:** Call this endpoint every 20-25 seconds from frontend.

---

### POST /api/session/end
End shopping session and clear cart.

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "items_cleared": 5,
  "message": "Session ended successfully"
}
```

---

## 3. Cart Management

### POST /api/cart/esp32-scan
**Primary endpoint for ESP32 device to add products to cart.**

ESP32 device scans product and sends trolley_id + product_id. Backend automatically resolves the session.

**Request Body:**
```json
{
  "trolley_id": "TROLLEY_01",
  "product_id": "8901063101012"
}
```

**Response (Product Added - 201 Created):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "product": {
    "product_id": "8901063101012",
    "name": "Coca Cola 500ml",
    "price": "40.00",
    "category": "Beverages",
    "image_url": "https://example.com/coke.jpg"
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

**Response (Quantity Updated - 200 OK):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "product": {
    "product_id": "8901063101012",
    "name": "Coca Cola 500ml",
    "price": "40.00",
    "category": "Beverages",
    "image_url": "https://example.com/coke.jpg"
  },
  "cart_item": {
    "quantity": 2,
    "subtotal": "80.00"
  },
  "cart_summary": {
    "total_items": 2,
    "total_amount": "80.00"
  },
  "action": "quantity_updated",
  "message": "Coca Cola 500ml updated in cart"
}
```

**Error Responses:**
- `404`: Trolley not found
- `404`: No active session (user needs to scan QR code first)
- `404`: Product not found
- `400`: Session expired

---

### GET /api/cart/view
Get all items in cart for a session.

**Query Parameters:**
- `session_id` (required): UUID of the session

**Request:**
```
GET /api/cart/view?session_id=550e8400-e29b-41d4-a716-446655440000
```

**Response:**
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
      "quantity": 2,
      "subtotal": "80.00",
      "added_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "product": {
        "barcode": "8901234567890",
        "name": "Bread Loaf",
        "price": "35.00",
        "category": "Bakery"
      },
      "quantity": 1,
      "subtotal": "35.00",
      "added_at": "2024-01-15T10:32:00Z"
    }
  ],
  "total_items": 3,
  "total_amount": "115.00"
}
```

---

### POST /api/cart/remove
Remove item or decrement quantity (for manual removal from web interface).

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "barcode": "8901063101012"
}
```

**Response (Quantity Decremented):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "product": {
    "barcode": "8901063101012",
    "name": "Coca Cola 500ml",
    "price": "40.00"
  },
  "quantity": 1,
  "subtotal": "40.00",
  "action": "quantity_decremented",
  "message": "Coca Cola 500ml quantity decremented"
}
```

**Response (Item Removed):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "product": {
    "barcode": "8901063101012",
    "name": "Coca Cola 500ml"
  },
  "action": "removed",
  "message": "Coca Cola 500ml removed from cart"
}
```

---

## Complete User Flow Example

### Scenario: User shops with ESP32-enabled trolley

#### Step 1: User scans trolley QR code
```
QR Code URL: http://localhost:3000/trolley/TROLLEY_01
↓
User redirected to web app
↓
Frontend extracts trolley_id: "TROLLEY_01"
```

#### Step 2: Frontend initializes session
```http
POST /api/session/qr-scan
{
  "trolley_id": "TROLLEY_01"
}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "trolley_id": "TROLLEY_01",
  "is_new_session": true,
  "cart_items_count": 0,
  "message": "Session started successfully"
}
```

#### Step 3: Frontend stores session_id and displays empty cart
```javascript
// Store in state/localStorage
localStorage.setItem('session_id', '550e8400-e29b-41d4-a716-446655440000');
localStorage.setItem('trolley_id', 'TROLLEY_01');

// Start heartbeat interval (every 20 seconds)
setInterval(() => {
  sendHeartbeat(session_id);
}, 20000);

// Poll cart updates (every 2-3 seconds)
setInterval(() => {
  fetchCart(session_id);
}, 2000);
```

#### Step 4: User places product in trolley, ESP32 scans it
```http
POST /api/cart/esp32-scan
{
  "trolley_id": "TROLLEY_01",
  "product_id": "8901063101012"
}
```

**ESP32 Response (success):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "product": {
    "name": "Coca Cola 500ml",
    "price": "40.00"
  },
  "cart_summary": {
    "total_items": 1,
    "total_amount": "40.00"
  },
  "message": "Coca Cola 500ml added to cart"
}
```

#### Step 5: Frontend automatically updates (via polling or WebSocket)
```http
GET /api/cart/view?session_id=550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "items": [
    {
      "product": {
        "name": "Coca Cola 500ml",
        "price": "40.00"
      },
      "quantity": 1,
      "subtotal": "40.00"
    }
  ],
  "total_items": 1,
  "total_amount": "40.00"
}
```

#### Step 6: User finishes shopping, proceeds to payment
```http
POST /api/session/end
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## ESP32 Integration Guide

### ESP32 Code Structure

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:8000/api/cart/esp32-scan";
const char* trolleyId = "TROLLEY_01";  // Unique per trolley

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void scanProduct(String productId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["trolley_id"] = trolleyId;
    doc["product_id"] = productId;
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    // Send POST request
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
      
      // Parse response to show feedback (LED, buzzer, etc.)
      DynamicJsonDocument responseDoc(1024);
      deserializeJson(responseDoc, response);
      
      const char* productName = responseDoc["product"]["name"];
      const char* message = responseDoc["message"];
      
      Serial.println("Product added: " + String(productName));
      // Show success feedback
      showSuccessFeedback();
    } else {
      Serial.println("Error: " + String(httpResponseCode));
      // Show error feedback
      showErrorFeedback();
    }
    
    http.end();
  }
}

void loop() {
  // Your barcode scanning logic here
  String scannedCode = readBarcode();  // Implement your scanner
  
  if (scannedCode != "") {
    scanProduct(scannedCode);
    delay(1000);  // Debounce
  }
}
```

---

## Frontend Integration Guide

### React Example

```javascript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function TrolleyCart() {
  const { trolleyId } = useParams(); // From URL: /trolley/TROLLEY_01
  const [sessionId, setSessionId] = useState(null);
  const [cart, setCart] = useState({ items: [], total_amount: 0 });

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [trolleyId]);

  // Start heartbeat
  useEffect(() => {
    if (!sessionId) return;
    
    const heartbeat = setInterval(() => {
      sendHeartbeat();
    }, 20000);
    
    return () => clearInterval(heartbeat);
  }, [sessionId]);

  // Poll cart updates
  useEffect(() => {
    if (!sessionId) return;
    
    const pollCart = setInterval(() => {
      fetchCart();
    }, 2000);
    
    return () => clearInterval(pollCart);
  }, [sessionId]);

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/session/qr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trolley_id: trolleyId })
      });
      
      const data = await response.json();
      setSessionId(data.session_id);
      localStorage.setItem('session_id', data.session_id);
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  };

  const sendHeartbeat = async () => {
    try {
      await fetch('/api/session/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/cart/view?session_id=${sessionId}`);
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  const endSession = async () => {
    try {
      await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      
      // Redirect to payment or home
      window.location.href = '/payment';
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  return (
    <div className="cart-container">
      <h1>Trolley {trolleyId}</h1>
      <div className="cart-items">
        {cart.items.map(item => (
          <div key={item.id} className="cart-item">
            <h3>{item.product.name}</h3>
            <p>Quantity: {item.quantity}</p>
            <p>Subtotal: ₹{item.subtotal}</p>
          </div>
        ))}
      </div>
      <div className="cart-total">
        <h2>Total: ₹{cart.total_amount}</h2>
      </div>
      <button onClick={endSession}>Proceed to Payment</button>
    </div>
  );
}
```

---

## Configuration

### Django Settings

Add to `settings.py`:

```python
# Frontend URL for QR code generation
FRONTEND_URL = 'http://localhost:3000'  # Change for production

# Session heartbeat timeout (seconds)
SESSION_HEARTBEAT_TIMEOUT = 30
```

---

## Migration Commands

Run these commands to update database with new fields:

```bash
cd App/server
python manage.py makemigrations trolleys
python manage.py migrate
```

This will add the `qr_code_data` field to trolleys and auto-generate QR data for existing trolleys.

---

## Testing Workflow

### 1. Test Trolley QR Generation
```bash
curl http://localhost:8000/api/trolleys/TROLLEY_01/qr
```

### 2. Test QR Scan (Session Creation)
```bash
curl -X POST http://localhost:8000/api/session/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"trolley_id": "TROLLEY_01"}'
```

### 3. Test ESP32 Product Scan
```bash
curl -X POST http://localhost:8000/api/cart/esp32-scan \
  -H "Content-Type: application/json" \
  -d '{
    "trolley_id": "TROLLEY_01",
    "product_id": "8901063101012"
  }'
```

### 4. Test Cart View
```bash
curl "http://localhost:8000/api/cart/view?session_id=YOUR_SESSION_ID"
```

### 5. Test Session End
```bash
curl -X POST http://localhost:8000/api/session/end \
  -H "Content-Type: application/json" \
  -d '{"session_id": "YOUR_SESSION_ID"}'
```

---

## Error Handling

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 404 | Trolley not found | Verify trolley_id |
| 404 | No active session | User must scan trolley QR code first |
| 404 | Product not found | Verify product exists in database |
| 400 | Trolley not active | Check trolley is_active status |
| 400 | Session expired | User must scan QR code again |

---

## Security Considerations

1. **Session Validation**: Every request validates session is active and not expired
2. **Trolley Verification**: ESP32 must send correct trolley_id that matches hardware
3. **Heartbeat Mechanism**: Sessions auto-expire after 30 seconds of inactivity
4. **QR Hash**: Optional hash in QR payload for verification

---

## Performance Tips

1. **Frontend Polling**: Poll cart every 2-3 seconds (balance between real-time and server load)
2. **Heartbeat Interval**: Send heartbeat every 20 seconds (within 30s timeout)
3. **WebSocket Alternative**: Consider implementing WebSocket for real-time updates instead of polling
4. **Database Indexing**: Ensure `trolley_id` and `session_id` are indexed
5. **Caching**: Cache product details to reduce database queries

---

## Future Enhancements

1. **WebSocket Support**: Real-time cart updates without polling
2. **Product Images**: Add image support in product model
3. **Payment Integration**: Integrate payment gateway (Razorpay, Stripe)
4. **Session Analytics**: Track shopping patterns and cart abandonment
5. **Multi-language Support**: i18n for product names and messages
6. **Offline Mode**: Queue scans when ESP32 loses connection

---

## Support

For issues or questions:
- Check logs: `python manage.py runserver` output
- Verify migrations: `python manage.py showmigrations`
- Test API endpoints: Use Postman or curl
- Check ESP32 serial output for connection issues

---

**Version:** 2.0  
**Last Updated:** January 2026  
**Author:** Smart Trolley Team
