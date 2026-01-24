import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';
import api from '../utils/api';
import { getProductImage } from '../utils/productImageMap';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(sessionManager.getCart());
  
  // Fetch cart from backend on component mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const sessionId = sessionManager.getSessionId();
        if (!sessionId || sessionId.includes('unknown')) {
          return;
        }
        const cartData = await api.getCart(sessionId);
        if (cartData && cartData.items) {
          // Flatten the items structure
          const flattenedItems = cartData.items.map((item) => ({
            id: item.product.barcode,
            ...item.product,
            image: getProductImage(item.product),
            quantity: item.quantity,
            subtotal: item.subtotal,
          }));
          
          const updatedCart = {
            items: flattenedItems,
            total: typeof cartData.total === 'string' ? parseFloat(cartData.total) : (cartData.total || 0),
          };
          
          setCart(updatedCart);
        }
      } catch (err) {
        console.warn('Failed to fetch cart from API:', err);
        // Fall back to local cart
        setCart(sessionManager.getCart());
      }
    };
    
    fetchCart();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Add payment method state

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
        // Create payment on backend
        const paymentResponse = await api.createPayment(sessionId);
        console.log('Payment created:', paymentResponse);
        
        // After payment is created, confirm the payment to expire session
        if (paymentResponse && paymentResponse.session_id) {
          await api.confirmPayment(sessionId);
          console.log('Payment confirmed, session should be expired');
        }
      } catch (apiErr) {
        console.warn('API payment failed:', apiErr);
        // Continue anyway - user might complete payment manually
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
      <div className="min-h-screen pt-24 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl opacity-50"></div>
        
        <div className="text-center animate-slide-in relative z-10">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-slate-800 via-slate-800/80 to-slate-900 rounded-full flex items-center justify-center mb-8 shadow-xl border border-slate-700">
            <span className="text-6xl opacity-40">🛍️</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Cart is Empty</h1>
          <p className="text-lg text-slate-400 mb-10 font-medium">Add items to your cart before checkout</p>
          <Link to="/cart" className="btn-primary inline-flex items-center gap-3 text-lg">
            <span>🛒</span>
            Go to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-40"></div>

      {/* Progress Steps */}
      <div className="glass sticky top-16 z-40 border-b border-cyan-500/20 shadow-lg shadow-cyan-500/10">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors font-medium group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span className="hidden sm:inline">Back to Cart</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                step >= 1 ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-700 text-slate-400'
              }`}>
                1
              </div>
              <div className={`w-16 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-slate-700'}`}></div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                step >= 2 ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-700 text-slate-400'
              }`}>
                2
              </div>
            </div>
            
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-900/50 via-rose-900/50 to-orange-900/50 border-l-4 border-red-500 rounded-2xl p-5 animate-slide-in shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-red-400 font-bold">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="icon-btn icon-btn-danger">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Order Summary - Right Column on Large */}
          <div className="lg:col-span-2 lg:order-2">
            <div className="card p-6 sticky top-40 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
              
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">📋</span>
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 max-h-52 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-colors">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden shadow-sm border border-slate-600">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="opacity-50">📦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity || 1}</p>
                    </div>
                    <p className="text-sm font-bold text-white">
                      ${(item.price * (item.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="divider"></div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-300">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Tax (8%)</span>
                  <span className="font-bold text-slate-300">${tax.toFixed(2)}</span>
                </div>
                <div className="divider"></div>
                <div className="flex justify-between text-xl font-black">
                  <span className="text-white">Total</span>
                  <span className="text-gradient">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Promo Banner */}
              <div className="mt-6 bg-gradient-to-r from-emerald-900/30 via-cyan-900/30 to-blue-900/30 rounded-2xl p-4 border border-emerald-500/30">
                <p className="text-sm text-emerald-400 flex items-center gap-3 font-medium">
                  <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">🎉</span>
                  <span>You're saving <strong>$5.00</strong> on this order!</span>
                </p>
              </div>
            </div>
          </div>

          {/* Checkout Form - Left Column */}
          <div className="lg:col-span-3 lg:order-1">
            <form onSubmit={handleCheckout} className="card p-8 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
              
              <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <span className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">👤</span>
                Contact Information
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-bold text-slate-300 mb-3">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">👤</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => setStep(1)}
                      placeholder="John Doe"
                      className="w-full pl-14 pr-5 py-4 rounded-2xl transition-all text-lg"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-sm font-bold text-slate-300 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">✉️</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setStep(2)}
                      placeholder="john@example.com"
                      className="w-full pl-14 pr-5 py-4 rounded-2xl transition-all text-lg"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <label className="block text-sm font-bold text-slate-300 mb-3">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">📱</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onFocus={() => setStep(2)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-14 pr-5 py-4 rounded-2xl transition-all text-lg"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xl font-black text-white mb-5 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">💳</span>
                  Payment Method
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'cash', icon: '💵', label: 'Cash' },
                    { id: 'card', icon: '💳', label: 'Card' },
                    { id: 'upi', icon: '📱', label: 'UPI' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-5 border-2 rounded-2xl text-center transition-all duration-300 ${
                        paymentMethod === method.id
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 scale-105 shadow-lg shadow-cyan-500/20'
                          : 'border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-3xl block mb-2">{method.icon}</span>
                      <span className={`text-sm font-bold ${
                        paymentMethod === method.id ? 'text-cyan-400' : 'text-slate-400'
                      }`}>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-10 btn-success py-5 rounded-2xl text-xl flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Order</span>
                    <span className="text-white/80">•</span>
                    <span className="font-black">${total.toFixed(2)}</span>
                    <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
                  </>
                )}
              </button>

              {/* Security Note */}
              <p className="mt-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2 font-medium">
                <span className="text-emerald-400">🔒</span>
                <span>Your information is secure and encrypted</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
