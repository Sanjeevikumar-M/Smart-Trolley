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

  // User Management
  async signupUser(name, phoneNumber, email = '') {
    return this.request('/user/signup', {
      method: 'POST',
      body: JSON.stringify({
        name,
        phone_number: phoneNumber,
        email,
      }),
    });
  },

  // Session Management
  async startSession(trolleyId, userId = null) {
    return this.request('/session/start', {
      method: 'POST',
      body: JSON.stringify({
        trolley_id: trolleyId,
        ...(userId && { user_id: userId }),
      }),
    });
  },

  async sessionHeartbeat(sessionId) {
    return this.request('/session/heartbeat', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  },

  async endSession(sessionId) {
    return this.request('/session/end', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  },

  // Cart Management
  async scanProduct(sessionId, barcode) {
    return this.request('/cart/scan', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        barcode,
      }),
    });
  },

  async removeFromCart(sessionId, barcode) {
    return this.request('/cart/remove', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        barcode,
      }),
    });
  },

  async viewCart(sessionId) {
    return this.request(`/cart/view?session_id=${sessionId}`);
  },

  // Payment Management
  async createPayment(sessionId) {
    return this.request('/payment/create', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  },

  async confirmPayment(sessionId) {
    return this.request('/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  },
};

export default api;
export { APIError };

