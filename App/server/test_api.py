"""
Smart Trolley API Test Script
Run this script to test all API endpoints.
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def print_response(title, response):
    print(f"\n{'='*50}")
    print(f"📌 {title}")
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    except:
        print(f"Response: {response.text}")
    print('='*50)

def main():
    print("\n🛒 SMART TROLLEY API TEST SUITE 🛒\n")
    
    # 1. Health Check
    r = requests.get(f"{BASE_URL}/health")
    print_response("Health Check", r)
    
    # 2. List Products
    r = requests.get(f"{BASE_URL}/products/")
    print_response("List Products", r)
    
    # 3. List Trolleys
    r = requests.get(f"{BASE_URL}/trolleys/")
    print_response("List Trolleys", r)
    
    # 4. Start Session
    r = requests.post(f"{BASE_URL}/session/start", json={"trolley_id": "TROLLEY_03"})
    print_response("Start Session", r)
    
    if r.status_code != 201:
        print("❌ Failed to start session. Exiting.")
        return
    
    session_id = r.json()["session_id"]
    print(f"\n✅ Session ID: {session_id}")
    
    # 5. Scan Products
    products_to_scan = [
        "8901234567890",  # Milk
        "8901234567891",  # Bread
        "8901234567890",  # Milk again (should update quantity)
        "8901234567894",  # Sugar
    ]
    
    for barcode in products_to_scan:
        r = requests.post(f"{BASE_URL}/cart/scan", json={
            "session_id": session_id,
            "barcode": barcode
        })
        print_response(f"Scan Product ({barcode})", r)
        time.sleep(0.5)  # Small delay between scans
    
    # 6. View Cart
    r = requests.get(f"{BASE_URL}/cart/view", params={"session_id": session_id})
    print_response("View Cart", r)
    
    # 7. Send Heartbeat
    r = requests.post(f"{BASE_URL}/session/heartbeat", json={"session_id": session_id})
    print_response("Heartbeat", r)
    
    # 8. Remove Item
    r = requests.post(f"{BASE_URL}/cart/remove", json={
        "session_id": session_id,
        "barcode": "8901234567894"  # Remove Sugar
    })
    print_response("Remove Item", r)
    
    # 9. View Cart Again
    r = requests.get(f"{BASE_URL}/cart/view", params={"session_id": session_id})
    print_response("View Cart (after removal)", r)
    
    # 10. Create Payment
    r = requests.post(f"{BASE_URL}/payment/create", json={"session_id": session_id})
    print_response("Create Payment", r)
    
    # 11. Check Payment Status
    r = requests.get(f"{BASE_URL}/payment/status", params={"session_id": session_id})
    print_response("Payment Status", r)
    
    # 12. Confirm Payment
    r = requests.post(f"{BASE_URL}/payment/confirm", json={"session_id": session_id})
    print_response("Confirm Payment", r)
    
    # 13. Check Trolley Status
    r = requests.get(f"{BASE_URL}/trolleys/TROLLEY_03")
    print_response("Trolley Status (after payment)", r)
    
    print("\n✅ ALL TESTS COMPLETED!\n")

if __name__ == "__main__":
    main()
