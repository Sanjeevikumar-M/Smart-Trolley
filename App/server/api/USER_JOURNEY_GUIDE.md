# Smart Trolley - User Journey Guide
## Step-by-Step API Links & How to Use Them

---

## 👋 Welcome to Smart Trolley!

Hello! This guide walks you through your shopping experience at Smart Trolley, explaining each step and the API links you'll interact with. Think of this as your personal shopping assistant.

---

## 🎯 Your Shopping Journey

### **Phase 1: Getting Started**

---

## **Step 1️⃣ : Register Yourself** 
**What You're Doing:** Creating your profile in the Smart Trolley system

**Link/Endpoint Name:** 
```
User Signup Link
```

**What Happens:**
- You provide your name, phone number, and email
- The system creates your profile
- You receive a unique User ID that identifies you

**When You Need This:**
- ✅ First time shopping at Smart Trolley
- ✅ Setting up a new account

**The Link:**
```
POST /api/user/signup
```

**What You Send:**
```json
{
  "name": "Ramesh Kumar",
  "phone_number": "+91-9876543210",
  "email": "ramesh@example.com"
}
```

**What You Get Back:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Real-World Analogy:**
Think of this like showing your ID card at the store entrance. The security person notes down your details and gives you a membership ID.

**💡 Pro Tip:** Save your User ID - you'll need it for future visits!

---

### **Phase 2: Starting Your Shopping Session**

---

## **Step 2️⃣ : Pick Up a Trolley & Start Shopping**
**What You're Doing:** Getting a trolley and beginning your shopping session

**Link/Endpoint Name:** 
```
Session Start Link
```

**What Happens:**
- You pick up a physical trolley with an ID (like TROLLEY-001)
- You tell the system who you are (or shop as a guest)
- The system locks that trolley to your session
- You get a Session ID that tracks your entire shopping trip

**When You Need This:**
- ✅ Every time you start shopping (even if you've shopped before)
- ✅ After picking up a trolley from the counter

**The Link:**
```
POST /api/session/start
```

**What You Send:**
```json
{
  "trolley_id": "TROLLEY-001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**What You Get Back:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**Real-World Analogy:**
When you push a trolley and it beeps/lights up, that's the system acknowledging you. You're now "logged in" to that specific trolley. Your Session ID is like a ticket number for your shopping trip.

**💡 Pro Tip:** Your Session ID is super important! It tracks everything you do while shopping - keep it handy!

**❗ What Can Go Wrong:**
- ❌ "Trolley already in use" - Someone else is using this trolley. Pick another one!
- ❌ "Trolley inactive" - This trolley is broken. Try a different one!

---

### **Phase 3: Shopping Time! Adding Items to Your Cart**

---

## **Step 3️⃣ : Scan Your First Product**
**What You're Doing:** Adding items to your cart by scanning product barcodes

**Link/Endpoint Name:** 
```
Cart Scan Link
```

**What Happens:**
- You scan a product barcode (using the trolley's scanner or your phone)
- The system finds the product and adds it to your cart
- If you scan the same product again, it increases the quantity
- The system shows you what's in your cart and the running total

**When You Need This:**
- ✅ Every time you pick up a product and scan it
- ✅ Multiple times during your shopping trip

**The Link:**
```
POST /api/cart/scan
```

**What You Send:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111",
  "barcode": "9780134685991"
}
```

**What You Get Back:**
```json
{
  "items": [
    {
      "product_name": "Apple",
      "barcode": "9780134685991",
      "price": "50.00",
      "quantity": 1,
      "subtotal": "50.00"
    }
  ],
  "total": "50.00"
}
```

**Real-World Analogy:**
Imagine a smart cart that automatically updates as you put items in. You scan, it beeps, and you see the item appear on a display with the price!

**💡 Pro Tip:** Scan multiple times? No problem! The cart automatically increases the quantity.

**❗ What Can Go Wrong:**
- ❌ "Product not found" - The barcode is incorrect or the product isn't available
- ❌ "Session expired" - You haven't used the trolley for too long. See Step 4️⃣!

---

## **Step 4️⃣ : Keep Your Session Alive (The Heartbeat)** 
**What You're Doing:** Telling the system you're still shopping and haven't abandoned your trolley

**Link/Endpoint Name:** 
```
Session Heartbeat Link
```

**What Happens:**
- The system checks if you're still actively shopping
- It refreshes your session so it doesn't expire
- Like a "I'm still here!" signal to the system

**When You Need This:**
- ✅ Every 30 seconds or so while shopping
- ✅ Automatically done by the trolley's display system
- ✅ Helps prevent timeout if you pause to think about what to buy

**The Link:**
```
POST /api/session/heartbeat
```

**What You Send:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**What You Get Back:**
```json
{
  "status": "ok"
}
```

**Real-World Analogy:**
Think of it like tapping the screen on an ATM to stay logged in. If you don't interact with it for a while, your session expires!

**💡 Pro Tip:** The trolley does this automatically for you - you don't need to worry about it!

**❗ Important:** If your session expires:
- Your cart and current items are still saved
- You just need to start a new session with the same trolley
- The system will remember what you were shopping for!

---

## **Step 5️⃣ : Change Your Mind About a Product?**
**What You're Doing:** Removing an item from your cart

**Link/Endpoint Name:** 
```
Cart Remove Link
```

**What Happens:**
- You scan the barcode of the product you want to remove
- The system removes the ENTIRE product from your cart (all units)
- Your total is recalculated
- You see the updated cart

**When You Need This:**
- ✅ You decided you don't want a product
- ✅ You accidentally scanned something twice
- ✅ You found a cheaper alternative elsewhere

**The Link:**
```
POST /api/cart/remove
```

**What You Send:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111",
  "barcode": "9780134685991"
}
```

**What You Get Back:**
```json
{
  "items": [
    {
      "product_name": "Banana",
      "barcode": "9780134685992",
      "price": "30.00",
      "quantity": 1,
      "subtotal": "30.00"
    }
  ],
  "total": "30.00"
}
```

**Real-World Analogy:**
Like putting an item back on the shelf and having it automatically disappear from your shopping list!

**💡 Pro Tip:** If you want to reduce just one unit (not all), you need a different feature. Contact support!

---

## **Step 6️⃣ : Check Your Cart Before Checkout**
**What You're Doing:** Reviewing all items before paying

**Link/Endpoint Name:** 
```
Cart View Link
```

**What Happens:**
- The system shows you everything in your cart
- You see product names, prices, quantities, and subtotals
- You see the grand total for everything

**When You Need This:**
- ✅ Before going to checkout
- ✅ To double-check quantities
- ✅ To see the total price before paying
- ✅ Anytime during shopping to review

**The Link:**
```
GET /api/cart/view
```

**What You Send:**
```
Just the session ID as a query parameter:
?session_id=660f9511-f40c-52e5-b827-557766551111
```

**What You Get Back:**
```json
{
  "items": [
    {
      "product_name": "Apple",
      "barcode": "9780134685991",
      "price": "50.00",
      "quantity": 2,
      "subtotal": "100.00"
    },
    {
      "product_name": "Banana",
      "barcode": "9780134685992",
      "price": "30.00",
      "quantity": 1,
      "subtotal": "30.00"
    }
  ],
  "total": "130.00"
}
```

**Real-World Analogy:**
Like checking your trolley before heading to the checkout counter. "Do I really need all this?"

**💡 Pro Tip:** This is a "view only" link - it doesn't change anything. You can check as many times as you want!

---

### **Phase 4: Time to Pay!**

---

## **Step 7️⃣ : Create Payment & Get QR Code**
**What You're Doing:** Preparing to pay and generating your payment QR code

**Link/Endpoint Name:** 
```
Payment Create Link
```

**What Happens:**
- The system calculates your final total
- It creates a payment transaction
- It generates a UPI QR code (for digital payment)
- You can now scan this QR code with your phone's payment app (Google Pay, PhonePe, etc.)

**When You Need This:**
- ✅ When you're ready to pay
- ✅ Right after you're done shopping
- ✅ Before scanning the payment QR code

**The Link:**
```
POST /api/payment/create
```

**What You Send:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**What You Get Back:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111",
  "payment_id": 5,
  "total_amount": "130.00",
  "upi_qr": "upi://pay?pa=smarttrolley@upi&pn=SmartTrolley&am=130.00&cu=INR&tn=Smart%20Trolley",
  "status": "PENDING"
}
```

**Real-World Analogy:**
The payment QR code is like an invoice at checkout. You take it to the payment counter (your phone), scan it with your payment app, and complete the transaction!

**💡 Pro Tip:** The UPI QR code works with any UPI app:
- ✅ Google Pay
- ✅ PhonePe
- ✅ BHIM
- ✅ Any other UPI app

**❗ What Can Go Wrong:**
- ❌ "Billing user required" - You need to provide a user_id when starting your session

---

## **Step 8️⃣ : Confirm Your Payment**
**What You're Doing:** Telling the system that you've successfully paid

**Link/Endpoint Name:** 
```
Payment Confirm Link
```

**What Happens:**
- You scan the payment QR code with your UPI app and pay
- You confirm the payment in the system
- Your session automatically ends
- The trolley is freed up for the next customer
- Your shopping is complete!

**When You Need This:**
- ✅ Right after you've completed payment in your UPI app
- ✅ When the payment app shows "Payment Successful"
- ✅ To officially finish your shopping

**The Link:**
```
POST /api/payment/confirm
```

**What You Send:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**What You Get Back:**
```json
{
  "status": "payment_success"
}
```

**Real-World Analogy:**
Like getting your receipt at the checkout counter. Payment confirmed, you're all set!

**💡 Pro Tip:** After this step, your session is complete. The trolley can now be used by another customer.

---

## **Step 9️⃣ : (Optional) End Session Early**
**What You're Doing:** Manually ending your shopping session

**Link/Endpoint Name:** 
```
Session End Link
```

**What Happens:**
- Your session ends immediately
- Your trolley becomes available
- Your cart is cleared
- You can't add items anymore

**When You Need This:**
- ✅ If you want to abandon your shopping
- ✅ If you forgot something and want to start over
- ✅ If you want to return the trolley without checking out

**The Link:**
```
POST /api/session/end
```

**What You Send:**
```json
{
  "session_id": "660f9511-f40c-52e5-b827-557766551111"
}
```

**What You Get Back:**
```json
{
  "status": "ended"
}
```

**Real-World Analogy:**
Like putting back your trolley and walking out of the store without buying anything.

**💡 Pro Tip:** You don't HAVE to use this - if you just pay, it automatically ends your session!

---

## 📊 Complete Shopping Journey Map

```
┌─────────────────────────────────────────────────────────────┐
│                   SMART TROLLEY SHOPPING FLOW                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 1️⃣  ──▶  Register (User Signup Link)                  │
│             Get: User ID                                      │
│                                                               │
│  Step 2️⃣  ──▶  Pick Trolley (Session Start Link)            │
│             Get: Session ID                                   │
│                                                               │
│  Step 3️⃣  ──▶  Scan Products (Cart Scan Link)               │
│  ⟲ Repeat    Get: Updated Cart & Total                       │
│                                                               │
│  Step 4️⃣  ──▶  Keep Session Alive (Heartbeat Link)          │
│  (Auto)       Get: Status OK                                  │
│                                                               │
│  Step 5️⃣  ──▶  Remove Items? (Cart Remove Link)             │
│  (Optional)   Get: Updated Cart & Total                       │
│                                                               │
│  Step 6️⃣  ──▶  Review Cart (Cart View Link)                 │
│  (Optional)   Get: Final Cart & Total                         │
│                                                               │
│  Step 7️⃣  ──▶  Create Payment (Payment Create Link)         │
│             Get: Payment ID & UPI QR Code                     │
│                                                               │
│  Step 8️⃣  ──▶  Confirm Payment (Payment Confirm Link)       │
│             Get: Success Status                               │
│             [Session Auto-Ends]                               │
│                                                               │
│  Step 9️⃣  ──▶  Return Trolley                               │
│             Done! ✅                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎓 Learning the API Links by Type

### **Links You Use ONCE Per Session:**
| Link | Purpose |
|------|---------|
| **User Signup** | Create account (once in lifetime) |
| **Session Start** | Begin shopping (once per visit) |
| **Payment Create** | Prepare payment (once per shopping trip) |
| **Payment Confirm** | Complete payment (once per shopping trip) |
| **Session End** | Quit shopping early (optional) |

### **Links You Use MULTIPLE Times:**
| Link | Purpose |
|------|---------|
| **Cart Scan** | Add items (many times) |
| **Cart Remove** | Remove items (as needed) |
| **Cart View** | Check cart (as needed) |
| **Session Heartbeat** | Keep session alive (every 30 seconds automatically) |

---

## 🚨 What Happens If Something Goes Wrong?

### Scenario 1: "Session Expired"
**What Happened:** You didn't interact with the trolley for too long (15-30 minutes)

**How to Fix:**
1. Your current items are still saved
2. Go back to Step 2️⃣ (Session Start) with the same trolley
3. A new session is created with your previous items

### Scenario 2: "Trolley Already in Use"
**What Happened:** Someone else has this trolley

**How to Fix:**
1. Pick a different trolley
2. Go to Step 2️⃣ (Session Start) with the new trolley ID

### Scenario 3: "Product Not Found"
**What Happened:** The barcode doesn't exist in the system

**How to Fix:**
1. Check if you scanned correctly
2. Ask store staff if the product is in stock
3. Try another product

### Scenario 4: "Item Not in Cart"
**What Happened:** You're trying to remove something that isn't there

**How to Fix:**
1. Check your cart with Step 6️⃣ (Cart View)
2. Verify the barcode is correct

---

## 💰 Quick Payment Reference

When you reach Step 7️⃣ (Payment Create), you get a UPI QR Code that looks like:

```
upi://pay?pa=smarttrolley@upi&pn=SmartTrolley&am=130.00&cu=INR&tn=Smart%20Trolley
```

**What This Means:**
- 💳 **UPI ID:** smarttrolley@upi
- 🏪 **Merchant:** SmartTrolley
- 💵 **Amount:** 130.00 (your total)
- 🌍 **Currency:** INR (Indian Rupee)

---

## ⚡ Quick Tips for Faster Shopping

1. **Have your User ID ready** if you've shopped before
2. **Keep your Session ID safe** - you'll need it for everything
3. **The trolley does heartbeats automatically** - you don't need to worry
4. **Scan carefully** - misspelling a barcode will cause errors
5. **Check your cart before paying** - use Step 6️⃣ to review
6. **Use UPI payment** - fastest and most secure

---

## 📱 Example: Your First Shopping Trip (Step by Step)

**Time: 9:00 AM - You arrive at Smart Trolley**

```
9:00 - You: "Hi! I'm new!"
Call: User Signup Link
You provide: Name, Phone, Email
You get: User ID ✅

9:01 - You: "I'll take trolley #5"
Call: Session Start Link
You provide: Trolley ID, Your User ID
You get: Session ID ✅

9:02 - You: Pick up apples
Call: Cart Scan Link
You scan: Apple barcode
System: Added 1 apple - Total: ₹50

9:03 - You: Pick up milk
Call: Cart Scan Link
You scan: Milk barcode
System: Added 1 milk - Total: ₹100

9:05 - You: (Thinking... heartbeat happens automatically)

9:06 - You: "I'll put these apples back"
Call: Cart Remove Link
You scan: Apple barcode
System: Removed apples - Total: ₹50

9:07 - You: "Let me check what I have"
Call: Cart View Link
System: Shows 1 milk - Total: ₹50 ✅

9:08 - You: "Ready to pay!"
Call: Payment Create Link
You get: UPI QR Code ✅

9:09 - You: Scan QR with Google Pay, Pay ₹50

9:09:30 - You: Confirm payment
Call: Payment Confirm Link
System: Session Ended ✅

9:10 - You: Leave with milk, return trolley
Result: Happy shopping! 😊
```

---

## 🆘 Need Help?

**Links Cheat Sheet:**
- 📝 **Register?** → User Signup Link
- 🛒 **Start Shopping?** → Session Start Link
- 📦 **Scan Product?** → Cart Scan Link
- ❌ **Remove Product?** → Cart Remove Link
- 👀 **Check Cart?** → Cart View Link
- 💳 **Pay?** → Payment Create Link
- ✅ **Confirm Pay?** → Payment Confirm Link
- 🔴 **Quit?** → Session End Link
- ⏰ **(Auto)Keep Alive?** → Session Heartbeat Link

---

## Version
User Guide Version: 1.0
Last Updated: January 2026
Perfect for: First-time and regular Smart Trolley users!
