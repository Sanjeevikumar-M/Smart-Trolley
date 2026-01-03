import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import sessionManager from '../utils/sessionManager';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [trolleyId, setTrolleyId] = useState(null);

  useEffect(() => {
    const id = sessionManager.getTrolleyId();
    if (id) {
      setIsConnected(true);
      setTrolleyId(id);
    }
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-8 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center">
        {/* Hero Section */}
        <div className="mb-12 animate-slide-in">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mb-8 animate-float">
            <span className="text-7xl">🛒</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart<span className="text-gradient">Trolley</span>
          </h1>
          <p className="text-xl text-gray-600">
            Scan. Shop. Checkout.
          </p>
        </div>

        {/* Connection Status */}
        {isConnected ? (
          <div className="card p-6 mb-8 animate-scale-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold text-green-700">Connected</span>
            </div>
            <p className="text-gray-600 mb-2">Trolley ID</p>
            <p className="text-2xl font-bold font-mono text-indigo-600">{trolleyId}</p>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                to="/cart"
                className="btn-primary py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <span>🛒</span>
                <span>View Cart</span>
              </Link>
              <Link
                to="/connect"
                className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>📷</span>
                <span>New Scan</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-in">
            {/* Main CTA */}
            <Link
              to="/connect"
              className="block card p-8 hover:shadow-2xl transition-all group"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-4xl">📷</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan QR Code</h2>
              <p className="text-gray-600 mb-4">Connect to your smart trolley</p>
              <div className="inline-flex items-center gap-2 text-indigo-600 font-semibold">
                <span>Get Started</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* How it works */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">How it works</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-gray-700">Scan the QR code on your trolley</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-gray-700">ESP32 scans products as you shop</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-gray-700">Checkout when you're done</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
