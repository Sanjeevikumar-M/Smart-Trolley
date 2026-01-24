import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';
import heartbeatManager from '../utils/heartbeatManager';
import api from '../utils/api';
import { getProductImage } from '../utils/productImageMap';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if user has a valid session
    const session = sessionManager.getSession();
    if (!session || !session.trolleyId || !session.id) {
      // No valid session - redirect to connect
      setHasSession(false);
      setLoading(false);
      return;
    }
    
    setHasSession(true);
    sessionManager.updateLastActivity();
    
    // Start heartbeat to keep session alive
    heartbeatManager.start();
    
    fetchCart();

    const pollInterval = setInterval(() => {
      if (pollingActive) {
        checkForNewProducts();
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      // Don't stop heartbeat here - let it run as long as user is in the app
    };
  }, [pollingActive]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const sessionId = sessionManager.getSessionId();
      if (!sessionId) {
        // No valid session
        setCart({ items: [], total: 0 });
        setHasSession(false);
        heartbeatManager.stop();
        return;
      }
      
      try {
        const cartData = await api.getCart(sessionId);
        if (cartData && cartData.items) {
          // Flatten the items structure to include product details at item level
          const flattenedItems = cartData.items.map((item) => ({
            id: item.product.barcode, // Use barcode as unique ID
            ...item.product,
            // Attach image URL via util
            image: getProductImage(item.product),
            quantity: item.quantity,
            subtotal: item.subtotal,
          }));
          
          const cart = {
            items: flattenedItems,
            total: typeof cartData.total === 'string' ? parseFloat(cartData.total) : (cartData.total || 0),
          };
          
          setCart(cart);
          // Update local storage
          sessionManager.getCart().items = flattenedItems;
          sessionManager.getCart().total = cart.total;
        }
      } catch (err) {
        console.warn('Failed to fetch from API:', err);
        // If session invalid or expired, clear and mark as disconnected
        if (err?.status === 404 || err?.status === 400) {
          sessionManager.clearSession();
          setHasSession(false);
          heartbeatManager.stop();
        } else {
          // fallback to local cart
          const localCart = sessionManager.getCart();
          setCart(localCart);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const checkForNewProducts = async () => {
    try {
      const sessionId = sessionManager.getSessionId();
      if (!sessionId) {
        setHasSession(false);
        heartbeatManager.stop();
        return;
      }
      
      // Fetch latest cart from backend
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
        // Update local storage
        sessionManager.getCart().items = flattenedItems;
        sessionManager.getCart().total = updatedCart.total;
      }
    } catch (err) {
      console.debug('Failed to fetch updated cart:', err);
      if (err?.status === 404 || err?.status === 400) {
        sessionManager.clearSession();
        setHasSession(false);
        heartbeatManager.stop();
      }
      // Silent otherwise
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    
    try {
      const sessionId = sessionManager.getSessionId();
      const barcode = itemId; // itemId is the barcode
      
      // Find the current item
      const currentItem = cart.items.find(item => item.id === itemId);
      if (!currentItem) return;
      
      const currentQuantity = currentItem.quantity || 1;
      const difference = newQuantity - currentQuantity;
      
      if (difference > 0) {
        // Add more items by scanning multiple times
        for (let i = 0; i < difference; i++) {
          await api.scanProduct(sessionId, barcode);
        }
      } else if (difference < 0) {
        // Remove items one by one (decreases quantity)
        for (let i = 0; i < Math.abs(difference); i++) {
          await api.removeFromCart(sessionId, barcode);
        }
      }
      
      // Refresh cart from backend
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
      // Fallback to local update
      const updatedCart = sessionManager.updateCartItem(itemId, newQuantity);
      setCart(updatedCart);
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    if (!window.confirm('Remove this item from cart?')) {
      return;
    }
    
    try {
      const sessionId = sessionManager.getSessionId();
      const barcode = itemId; // itemId is the barcode
      
      // Find the item to get its quantity
      const item = cart.items.find(i => i.id === itemId);
      if (!item) return;
      
      // Remove all quantities by calling remove multiple times
      for (let i = 0; i < (item.quantity || 1); i++) {
        await api.removeFromCart(sessionId, barcode);
      }
      
      // Refresh cart from backend
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove from cart:', err);
      // Fallback to local update
      const updatedCart = sessionManager.removeFromCart(itemId);
      setCart(updatedCart);
    }
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
    <div className="min-h-screen pt-20 pb-32 relative">
      {/* Background decoration */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-40 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-40"></div>

      {/* No Session Redirect */}
      {!hasSession && !loading && (
        <div className="text-center py-16 animate-slide-in relative z-10">
          <div className="w-36 h-36 mx-auto bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 rounded-full flex items-center justify-center mb-8 shadow-xl border border-amber-500/30">
            <span className="text-7xl drop-shadow-lg">⚠️</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">No Trolley Connected</h2>
          <p className="text-lg text-slate-400 mb-10 font-medium">Please connect to a trolley first to start shopping</p>
          
          <button
            onClick={() => navigate('/connect', { replace: true })}
            className="inline-flex items-center gap-3 btn-primary text-lg px-8"
          >
            <span className="text-2xl">📷</span>
            Connect to Trolley
          </button>
        </div>
      )}

      {hasSession && (
      <>
      {/* Sticky Header */}
      <div className="glass sticky top-16 z-40 border-b border-cyan-500/20 shadow-lg shadow-cyan-500/10">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3">
                <span className="text-3xl">🛒</span>
                <span>Scanned Items</span>
              </h1>
              <p className="text-sm text-slate-400 font-medium mt-1">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            {trolleyId && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 px-4 py-3 rounded-2xl border border-cyan-500/30">
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full relative"></div>
                </div>
                <span className="text-sm font-bold text-cyan-400">{trolleyId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 border-r-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl animate-pulse">📦</span>
              </div>
            </div>
            <p className="text-slate-400 font-medium">Loading scanned items...</p>
          </div>
        )}

        {/* Empty Cart */}
        {!loading && cartItems.length === 0 && (
          <div className="text-center py-16 animate-slide-in">
            <div className="relative inline-block mb-8">
              <div className="w-40 h-40 mx-auto bg-gradient-to-br from-slate-800 via-slate-800/80 to-slate-900 rounded-full flex items-center justify-center shadow-xl border border-slate-700">
                <span className="text-7xl opacity-40">📦</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-3">No items scanned yet</h2>
            <p className="text-lg text-slate-400 mb-10 font-medium">Use the ESP32 scanner on your trolley to add products</p>
            
            <div className="card p-8 mb-10 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full animate-ping absolute"></div>
                  <div className="w-4 h-4 bg-emerald-400 rounded-full relative"></div>
                </div>
                <p className="text-white font-bold text-lg">Waiting for scans...</p>
              </div>
              <p className="text-slate-400 font-medium">
                Products will appear here automatically when scanned
              </p>
            </div>

            <Link
              to="/connect"
              className="inline-flex items-center gap-3 btn-secondary"
            >
              <span className="text-xl">📷</span>
              Connect New Trolley
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {!loading && cartItems.length > 0 && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Scanning Status */}
            <div className="flex items-center justify-center gap-4 py-4 bg-gradient-to-r from-emerald-900/30 via-cyan-900/30 to-blue-900/30 rounded-2xl border border-emerald-500/30 shadow-sm">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping absolute"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full relative"></div>
              </div>
              <span className="text-sm text-emerald-400 font-bold">Scanner active - Add more items!</span>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {cartItems.map((item, index) => {
                // Handle both flattened and nested product structure
                const product = item.product || item;
                const name = product.name || 'Unknown Product';
                const price = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);
                const quantity = item.quantity || 1;
                const itemId = item.id || item.barcode || index;
                
                return (
                <div
                  key={itemId}
                  className="card-product p-5 animate-fade-in-up group"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div className="flex items-center gap-5">
                    {/* Product Image */}
                    <div className="w-18 h-18 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden shadow-inner border border-slate-700 group-hover:scale-105 transition-transform">
                      {product.image ? (
                        <img src={product.image} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="opacity-60">📦</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-white truncate">{name}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xl font-black text-gradient">
                          ${(price * quantity).toFixed(2)}
                        </span>
                        {quantity > 1 && (
                          <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-1 rounded-lg">
                            ${price.toFixed(2)} × {quantity}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                      <button
                        onClick={() => handleUpdateQuantity(itemId, quantity - 1)}
                        className="icon-btn bg-slate-700 shadow-sm hover:bg-slate-600 text-white font-bold"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-bold text-lg text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(itemId, quantity + 1)}
                        className="icon-btn bg-slate-700 shadow-sm hover:bg-slate-600 text-white font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemoveFromCart(itemId)}
                      className="icon-btn icon-btn-danger ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      {!loading && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass border-t border-cyan-500/20 safe-area-bottom shadow-2xl shadow-cyan-500/10">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-400 font-medium">Total ({itemCount} items)</p>
                <p className="text-4xl font-black text-gradient">${totalAmount.toFixed(2)}</p>
              </div>
              <button
                onClick={handleClearCart}
                className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
              >
                <span>🗑️</span>
                Clear All
              </button>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full btn-success py-5 rounded-2xl text-xl flex items-center justify-center gap-3 group"
            >
              <span>Proceed to Checkout</span>
              <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
