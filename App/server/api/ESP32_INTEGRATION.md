# ESP32 Integration Guide

## Overview
The ESP32 (smart trolley hardware) can now scan product barcodes and send them directly to the backend without needing to know the session ID. Instead, it sends the `trolley_id` which the backend uses to identify the active session.

## Flow

1. **User scans trolley QR code** (frontend)
   - QR code contains trolley_id
   - Frontend creates session on backend and stores session_id locally

2. **ESP32 scans product barcode**
   - ESP32 sends: `trolley_id` + `barcode`
   - Backend finds active session for that trolley
   - Backend adds product to cart

## API Endpoint: Product Scan (ESP32)

**Endpoint:** `POST /api/cart/scan`

### ESP32 Request Format
```json
{
  "trolley_id": "TROLLEY_001",
  "barcode": "5901234123457"
}
```

### Response (Success)
```json
{
  "product": {
    "barcode": "5901234123457",
    "name": "Coca Cola 500ml",
    "price": "49.99",
    "category": "Beverages"
  },
  "quantity": 1,
  "subtotal": "49.99",
  "total_cart": "49.99"
}
```

### Response (Error)
```json
{
  "detail": "No active session for this trolley"
}
```

## Implementation Notes

### For ESP32 Hardware
- Send trolley_id in every product scan request
- The trolley_id matches the QR code that was scanned by the user
- No need to store or manage session_id on the device
- Handle network errors gracefully with retries

### Backend Changes
- `CartScanView` now supports both:
  - `session_id` (from frontend web app)
  - `trolley_id` (from ESP32 hardware)
- New utility function: `get_locked_session_by_trolley(trolley_id, timeout_seconds)`
- New serializer: `CartScanTrolleySerializer` for ESP32 validation

### Error Handling
- If trolley has no active session: Returns 404 "No active session for this trolley"
- If product not found: Returns 404 "Product not found or inactive"
- If session expired: Returns 400 "Session expired"

## Example: ESP32 Arduino Code (Conceptual)

```cpp
const char* TROLLEY_ID = "TROLLEY_001";  // Set from QR code or hardcoded
const char* API_URL = "http://192.168.1.100:8000/api/cart/scan";

void scanProduct(String barcode) {
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"trolley_id\":\"" + TROLLEY_ID + "\",\"barcode\":\"" + barcode + "\"}";
  
  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    String response = http.getString();
    // Handle success
  } else {
    // Handle error
  }
  http.end();
}
```

## Testing

### Test with curl
```bash
# Add product to cart using trolley_id
curl -X POST http://localhost:8000/api/cart/scan \
  -H "Content-Type: application/json" \
  -d '{
    "trolley_id": "TROLLEY_001",
    "barcode": "5901234123457"
  }'
```

## Frontend Still Works
The frontend web app can continue using `session_id` as before:
```json
{
  "session_id": "abc-123-def",
  "barcode": "5901234123457"
}
```

Both methods work simultaneously, allowing flexible integration patterns.
