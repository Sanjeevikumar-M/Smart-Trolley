// API Communication utility using fetch
// Handles all backend communication including ESP32 product scans

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class APIError extends Error {
  constructor(message, status = null, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

export const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorDetails = null;

        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
          errorDetails = errorData;
        } catch (e) {
          // Response is not JSON
        }

        throw new APIError(errorMessage, response.status, errorDetails);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return null;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Network error
      if (error.message === 'Failed to fetch') {
        throw new APIError('Network connection failed. Please check your internet connection.');
      }

      console.error(`API Error [${endpoint}]:`, error);
      throw new APIError(error.message || 'An unexpected error occurred');
    }
  },

  // Products - get details when ESP32 scans
  async getProduct(id) {
    return this.request(`/products/${id}/`);
  },

  async getProducts() {
    return this.request('/products/');
  },

  // Cart - synced with backend
  async getCart(sessionId) {
    return this.request(`/cart/?session_id=${sessionId}`);
  },

  // ESP32 Product Scanning Endpoint
  // Called when user scans product barcode with ESP32 device in trolley
  async addScannedProduct(sessionId, productId) {
    return this.request('/cart/scan-product/', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        product_id: productId,
      }),
    });
  },

  async updateCartItem(sessionId, productId, quantity) {
    return this.request('/cart/', {
      method: 'PUT',
      body: JSON.stringify({
        session_id: sessionId,
        product_id: productId,
        quantity,
      }),
    });
  },

  async removeFromCart(sessionId, productId) {
    return this.request(`/cart/${productId}/?session_id=${sessionId}`, {
      method: 'DELETE',
    });
  },

  // Checkout & Orders
  async createOrder(sessionId, cartItems, shippingInfo = {}) {
    return this.request('/payments/', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        items: cartItems,
        shipping_info: shippingInfo,
      }),
    });
  },

  async getOrderStatus(orderId) {
    return this.request(`/payments/${orderId}/`);
  },

  // Trolley/Device Management
  async getTrolleyInfo(trolleyId) {
    return this.request(`/trolleys/${trolleyId}/`);
  },

  async getTrolleys() {
    return this.request('/trolleys/');
  },

  async connectTrolley(trolleyId, sessionId) {
    return this.request(`/trolleys/${trolleyId}/connect/`, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  },

  async disconnectTrolley(trolleyId, sessionId) {
    return this.request(`/trolleys/${trolleyId}/disconnect/`, {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  },

  // Session Management - linked to trolley
  async createSession(trolleyId) {
    return this.request('/sessions/', {
      method: 'POST',
      body: JSON.stringify({
        trolley_id: trolleyId,
      }),
    });
  },

  async getSessionInfo(sessionId) {
    return this.request(`/sessions/${sessionId}/`);
  },

  // Polling for real-time product updates from ESP32
  async getPendingProducts(sessionId) {
    return this.request(`/cart/pending/?session_id=${sessionId}`);
  },
};

export default api;
export { APIError };

