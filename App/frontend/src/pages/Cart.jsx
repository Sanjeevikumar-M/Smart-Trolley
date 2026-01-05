import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';
import api from '../utils/api';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if user has a valid session
    const session = sessionManager.getSession();
    if (!session || !session.trolleyId || session.trolleyId === 'unknown') {
      // No valid session - redirect to connect
      setHasSession(false);
      setLoading(false);
      return;
    }
    
    setHasSession(true);
    sessionManager.updateLastActivity();
    fetchCart();

    const pollInterval = setInterval(() => {
      if (pollingActive) {
        checkForNewProducts();
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [pollingActive]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const sessionId = sessionManager.getSessionId();
      if (!sessionId || sessionId.includes('unknown')) {
        // No valid session
        setCart({ items: [], total: 0 });
        return;
      }
      
      try {
        const cartData = await api.getCart(sessionId);
        if (cartData && cartData.items) {
          setCart(cartData);
          sessionManager.getCart().items = cartData.items;
          sessionManager.getCart().total = cartData.total || 0;
        }
      } catch (err) {
        console.warn('Failed to fetch from API, using local cart:', err);
        const localCart = sessionManager.getCart();
        setCart(localCart);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkForNewProducts = async () => {
    try {
      const sessionId = sessionManager.getSessionId();
      const pendingProducts = await api.getPendingProducts(sessionId);
      
      if (pendingProducts && pendingProducts.length > 0) {
        let updatedCart = sessionManager.getCart();
        pendingProducts.forEach(product => {
          updatedCart = sessionManager.addScannedProduct(product);
        });
        setCart(updatedCart);
      }
    } catch {
      // Silent fail
    }
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const updatedCart = sessionManager.updateCartItem(productId, quantity);
    setCart(updatedCart);
  };

  const handleRemoveFromCart = (productId) => {
    const updatedCart = sessionManager.removeFromCart(productId);
    setCart(updatedCart);
  };

  const handleClearCart = () => {
    if (window.confirm('Clear all items from your cart?')) {
      sessionManager.clearCart();
      setCart({ items: [], total: 0 });
    }
  };

  const cartItems = cart?.items || [];
  const itemCount = cartItems.reduce((sum, item) => sum + (item?.quantity || 1), 0);
  const trolleyId = sessionManager.getTrolleyId();
  const totalAmount = typeof cart?.total === 'string' ? parseFloat(cart.total) : (cart?.total || 0);

  return (
    <div className="min-h-screen pt-20 pb-32">
      {/* No Session Redirect */}
      {!hasSession && !loading && (
        <div className="text-center py-16 animate-slide-in">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-amber-100 to-orange-200 rounded-full flex items-center justify-center mb-6">
            <span className="text-6xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Trolley Connected</h2>
          <p className="text-gray-500 mb-8">Please connect to a trolley first to start shopping</p>
          
          <button
            onClick={() => navigate('/connect', { replace: true })}
            className="inline-flex items-center gap-2 btn-primary"
          >
            <span>📷</span>
            Connect to Trolley
          </button>
        </div>
      )}

      {hasSession && (
      <>
      <div className="glass sticky top-16 z-40 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>🛒</span>
                Scanned Items
              </h1>
              <p className="text-sm text-gray-500">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            {trolleyId && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-2 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-indigo-700">{trolleyId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading scanned items...</p>
          </div>
        )}

        {/* Empty Cart */}
        {!loading && cartItems.length === 0 && (
          <div className="text-center py-16 animate-slide-in">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <span className="text-6xl opacity-50">📦</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No items scanned yet</h2>
            <p className="text-gray-500 mb-8">Use the ESP32 scanner on your trolley to add products</p>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-100">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-gray-700 font-medium">Waiting for scans...</p>
              </div>
              <p className="text-sm text-gray-500">
                Products will appear here automatically when scanned
              </p>
            </div>

            <Link
              to="/connect"
              className="inline-flex items-center gap-2 btn-primary"
            >
              <span>📷</span>
              Connect Trolley
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {!loading && cartItems.length > 0 && (
          <div className="space-y-6 animate-slide-in">
            {/* Scanning Status */}
            <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">Scanner active</span>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div
                  key={item.id}
                  className="card-product p-4 animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {item.image || '📦'}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-indigo-600">
                          ${(item.price * (item.quantity || 1)).toFixed(2)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-xs text-gray-500">
                            (${item.price?.toFixed(2)} × {item.quantity})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-lg font-semibold transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-lg font-semibold transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="w-8 h-8 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      {!loading && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/30 safe-area-bottom">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Total ({itemCount} items)</p>
                <p className="text-3xl font-bold text-gradient">${totalAmount.toFixed(2)}</p>
              </div>
              <button
                onClick={handleClearCart}
                className="text-red-500 hover:text-red-600 text-sm font-medium"
              >
                Clear All
              </button>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full btn-success py-4 rounded-2xl text-lg flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
