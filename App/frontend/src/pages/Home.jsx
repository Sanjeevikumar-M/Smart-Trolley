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
    <div className="py-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="w-20 h-20 mx-auto bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md mb-6">
            <span className="text-3xl">🛒</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">SmartTrolley</h1>
          <p className="text-lg text-slate-600">Scan products and checkout effortlessly</p>
        </div>

        {/* Connection Status */}
        {isConnected ? (
          <div className="card p-6 mb-8">
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
                className="py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>📷</span>
                <span>New Scan</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main CTA */}
            <Link
              to="/connect"
              className="block card p-8 hover:shadow-xl transition-all group"
            >
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <span className="text-3xl">📷</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan QR Code</h2>
              <p className="text-slate-600 mb-4">Connect to your smart trolley</p>
              <div className="inline-flex items-center gap-2 text-indigo-600 font-semibold">
                <span>Get Started</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* How it works */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">How it works</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-slate-700">Scan the QR code on your trolley</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-slate-700">ESP32 scans products as you shop</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-slate-700">Checkout when you're done</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
