import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import sessionManager from '../utils/sessionManager';

export default function Navbar() {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovering, setIsHovering] = useState(null);

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-cyan-500/10' 
          : 'bg-slate-900/80 backdrop-blur-lg border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            onMouseEnter={() => setIsHovering('brand')}
            onMouseLeave={() => setIsHovering(null)}
          >
            <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg transition-all duration-300 ${isHovering === 'brand' ? 'scale-110 rotate-6 shadow-xl shadow-cyan-500/40' : 'shadow-cyan-500/20'}`}>
              <span className="text-lg">🛒</span>
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="leading-tight">
              <span className="block text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">SmartTrolley</span>
              <span className="block text-[10px] font-medium text-slate-500 tracking-wider uppercase">Scan & Checkout</span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Home Link */}
            <Link
              to="/"
              onMouseEnter={() => setIsHovering('home')}
              onMouseLeave={() => setIsHovering(null)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive('/') 
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30' 
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
              }`}
            >
              <span className={`transition-transform duration-300 ${isHovering === 'home' && !isActive('/') ? 'scale-125' : ''}`}>🏠</span>
              <span>Home</span>
            </Link>

            {/* Scan Link */}
            <Link
              to="/connect"
              onMouseEnter={() => setIsHovering('scan')}
              onMouseLeave={() => setIsHovering(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive('/connect') 
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30' 
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
              }`}
            >
              <span className={`transition-transform duration-300 ${isHovering === 'scan' && !isActive('/connect') ? 'scale-125 rotate-12' : ''}`}>📷</span>
              <span className="hidden sm:inline">Scan</span>
            </Link>

            {/* Cart Link */}
            <Link 
              to="/cart" 
              className="relative"
              onMouseEnter={() => setIsHovering('cart')}
              onMouseLeave={() => setIsHovering(null)}
            >
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive('/cart') 
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30' 
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                }`}
              >
                <span className={`text-lg transition-transform duration-300 ${isHovering === 'cart' && !isActive('/cart') ? 'scale-125 -rotate-12' : ''}`}>🛒</span>
                <span className="hidden sm:inline">Cart</span>
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 animate-bounce-in">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
