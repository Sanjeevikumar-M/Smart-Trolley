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

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

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
        isScrolled
          ? 'glass shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white text-xl">🛒</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gradient">SmartTrolley</h1>
              <p className="text-xs text-gray-500 -mt-1">Scan & Go</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/connect"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive('/connect')
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white shadow-md hover:shadow-lg text-gray-700 hover:text-indigo-600'
              }`}
            >
              <span>📷</span>
              <span className="hidden sm:inline">Scan</span>
            </Link>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative group"
            >
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive('/cart')
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white shadow-md hover:shadow-lg text-gray-700 hover:text-indigo-600'
                }`}
              >
                <span className="text-lg">🛒</span>
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
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
