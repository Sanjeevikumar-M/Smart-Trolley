// Session Manager - handles localStorage for cart and session data
// Session is tied to a specific trolley (via QR code scan)

const SESSION_KEY = 'smart_trolley_session';
const CART_KEY = 'smart_trolley_cart';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export const sessionManager = {
  // Session creation - called when user scans QR code
  // QR code passes trolley_id as URL parameter
  createSession(trolleyId) {
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trolleyId: trolleyId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  // Get session id if present; do NOT auto-create
  getSessionId() {
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (!sessionRaw) return null;
    const session = JSON.parse(sessionRaw);
    if (!session || !session.id) return null;

    // Optional local timeout guard: if too old, clear
    const createdAt = new Date(session.createdAt).getTime();
    if (Number.isFinite(createdAt) && Date.now() - createdAt > SESSION_TIMEOUT) {
      this.clearSession();
      return null;
    }

    return session.id;
  },

  // Get full session object (includes trolley_id)
  getSession() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // Get trolley ID for this session
  getTrolleyId() {
    const session = this.getSession();
    return session ? session.trolleyId : null;
  },

  // Check if session is present and has trolley
  isValidSession() {
    const session = this.getSession();
    return Boolean(session && session.trolleyId && session.id);
  },

  updateLastActivity() {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (session) {
      session.lastActivity = new Date().toISOString();
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  },

  // Cart management - products scanned by ESP32
  getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : { items: [], total: 0 };
  },

  // Add product scanned by ESP32
  addScannedProduct(product) {
    const cart = this.getCart();
    const existingItem = cart.items.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      cart.items.push({
        ...product,
        quantity: product.quantity || 1,
        scannedAt: new Date().toISOString(), // Track when ESP32 scanned this
      });
    }

    this.recalculateTotal(cart);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
  },

  removeFromCart(productId) {
    const cart = this.getCart();
    cart.items = cart.items.filter((item) => item.id !== productId);
    this.recalculateTotal(cart);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
  },

  updateCartItem(productId, quantity) {
    const cart = this.getCart();
    const item = cart.items.find((item) => item.id === productId);

    if (item) {
      if (quantity <= 0) {
        return this.removeFromCart(productId);
      }
      item.quantity = quantity;
    }

    this.recalculateTotal(cart);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
  },

  recalculateTotal(cart) {
    cart.total = cart.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  },

  clearCart() {
    localStorage.removeItem(CART_KEY);
  },

  // Clear entire session (called after checkout is complete)
  clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CART_KEY);
  },

  getCartItemCount() {
    const cart = this.getCart();
    return cart.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);
  },

  // Check if browser supports localStorage
  isStorageAvailable() {
    try {
      const test = '__smart_trolley_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
};

export default sessionManager;
