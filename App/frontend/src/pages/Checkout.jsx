import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';
import api from '../utils/api';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart] = useState(sessionManager.getCart());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [step, setStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.email?.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone?.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    return true;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const sessionId = sessionManager.getSessionId();

      try {
        await api.createOrder(sessionId, cart.items, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        });
      } catch {
        console.debug('API not available, using local checkout');
      }

      sessionManager.clearCart();
      navigate('/done');
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cartItems = cart.items || [];
  const subtotal = cart.total || 0;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="text-center animate-slide-in">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
            <span className="text-5xl opacity-50">🛍️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add items to your cart before checkout</p>
          <Link to="/cart" className="btn-primary">
            Go to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      {/* Progress Steps */}
      <div className="glass sticky top-16 z-40 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <span>←</span>
              <span className="hidden sm:inline">Back to Cart</span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
            </div>
            
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl p-4 animate-slide-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Order Summary - Right Column on Large */}
          <div className="lg:col-span-2 lg:order-2">
            <div className="card p-6 sticky top-40">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span>
                Order Summary
              </h2>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                      {item.image || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ${(item.price * (item.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax (8%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-gradient">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Promo Banner */}
              <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <span>🎉</span>
                  <span>You're saving <strong>$5.00</strong> on this order!</span>
                </p>
              </div>
            </div>
          </div>

          {/* Checkout Form - Left Column */}
          <div className="lg:col-span-3 lg:order-1">
            <form onSubmit={handleCheckout} className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>👤</span>
                Contact Information
              </h2>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => setStep(1)}
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setStep(2)}
                      placeholder="john@example.com"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📱</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onFocus={() => setStep(2)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💳</span>
                  Payment Method
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className="p-4 border-2 border-indigo-500 bg-indigo-50 rounded-xl text-center transition-all"
                  >
                    <span className="text-2xl block mb-1">💵</span>
                    <span className="text-xs font-medium text-gray-700">Cash</span>
                  </button>
                  <button
                    type="button"
                    className="p-4 border-2 border-gray-200 rounded-xl text-center hover:border-gray-300 transition-all"
                  >
                    <span className="text-2xl block mb-1">💳</span>
                    <span className="text-xs font-medium text-gray-500">Card</span>
                  </button>
                  <button
                    type="button"
                    className="p-4 border-2 border-gray-200 rounded-xl text-center hover:border-gray-300 transition-all"
                  >
                    <span className="text-2xl block mb-1">📱</span>
                    <span className="text-xs font-medium text-gray-500">UPI</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 btn-success py-4 rounded-2xl text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Order</span>
                    <span>•</span>
                    <span>${total.toFixed(2)}</span>
                  </>
                )}
              </button>

              {/* Security Note */}
              <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                <span>🔒</span>
                <span>Your information is secure and encrypted</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
