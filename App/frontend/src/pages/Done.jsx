import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';

const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

function Confetti() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 5,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animation: `confetti 3s ease-out ${piece.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function Done() {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);
  const [orderTime] = useState(new Date());
  const [sessionId] = useState(sessionManager.getSessionId());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    sessionManager.updateLastActivity();
    
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleNewSession = () => {
    navigate('/connect');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {showConfetti && <Confetti />}

      <div className="max-w-md w-full text-center animate-bounce-in">
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl glow-success">
            <span className="text-6xl text-white">✓</span>
          </div>
          <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-green-400 animate-ping opacity-20"></div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Order Placed! 🎉
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-8">
          Thank you for shopping with us!
        </p>

        {/* Order Details Card */}
        <div className="card p-6 mb-8 text-left">
          <h2 className="font-bold text-gray-900 mb-4 text-center">Order Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500 flex items-center gap-2">
                <span>📋</span>
                Status
              </span>
              <span className="flex items-center gap-2 font-semibold text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Confirmed
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500 flex items-center gap-2">
                <span>🕐</span>
                Order Time
              </span>
              <span className="font-semibold text-gray-900">
                {orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 flex items-center gap-2">
                  <span>🔑</span>
                  Session ID
                </span>
                <button
                  onClick={copySessionId}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p className="font-mono text-xs text-gray-500 bg-gray-50 p-2 rounded-lg truncate">
                {sessionId}
              </p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 mb-8 border border-indigo-100">
          <h3 className="font-bold text-gray-900 mb-3">What's Next?</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
                <span className="text-xl">📧</span>
              </div>
              <p className="text-xs text-gray-600">Check your email for receipt</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
                <span className="text-xl">🛒</span>
              </div>
              <p className="text-xs text-gray-600">Continue shopping</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
                <span className="text-xl">⭐</span>
              </div>
              <p className="text-xs text-gray-600">Rate your experience</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinueShopping}
            className="w-full btn-primary py-4 rounded-2xl text-lg flex items-center justify-center gap-2"
          >
            <span>🏠</span>
            <span>Continue Shopping</span>
          </button>

          <button
            onClick={handleNewSession}
            className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
          >
            <span>📷</span>
            <span>Scan New Trolley</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span>✓</span>
            Secure checkout
          </span>
          <span className="flex items-center gap-1">
            <span>✓</span>
            Receipt sent
          </span>
          <span className="flex items-center gap-1">
            <span>✓</span>
            Eco-friendly
          </span>
        </div>
      </div>
    </div>
  );
}
