import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import sessionManager from '../utils/sessionManager';

export default function Navbar() {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = sessionManager.getCart();
      setCartCount(cart.items?.length || 0);
    };

    updateCartCount();
    const interval = setInterval(updateCartCount, 1000);

    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm' : 'bg-white/70 backdrop-blur'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <span className="text-lg">🛒</span>
            </div>
            <div className="leading-tight">
              <span className="block text-base font-semibold text-slate-900">SmartTrolley</span>
              <span className="block text-[11px] text-slate-500">Scan & Checkout</span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`hidden sm:flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/connect"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/connect') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <span className="hidden sm:inline">Scan</span>
              <span className="sm:hidden">📷</span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/cart') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">🛒</span>
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
