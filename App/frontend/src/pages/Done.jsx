import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';
import heartbeatManager from '../utils/heartbeatManager';
import api from '../utils/api';

// Professional success page without confetti

export default function Done() {
  const navigate = useNavigate();
  const [showConfetti] = useState(false);
  const [orderTime] = useState(new Date());
  const [sessionId] = useState(sessionManager.getSessionId());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    sessionManager.updateLastActivity();
    
    // Stop heartbeat manager since session will be ended
    heartbeatManager.stop();
    
    // Confirm payment and expire session on this page
    const confirmPaymentAndEndSession = async () => {
      const sessionId = sessionManager.getSessionId();
      
      try {
        if (!sessionId || sessionId.includes('unknown')) {
          console.warn('No valid session to end');
          return;
        }
        
        console.log('Starting payment confirmation for session:', sessionId);
        
        // Confirm payment (which expires the session on backend)
        try {
          await api.confirmPayment(sessionId);
          console.log('✓ Payment confirmed and session expired on backend');
        } catch (confirmErr) {
          console.error('✗ Payment confirmation failed:', confirmErr);
          // Continue to try ending session anyway
        }
        
        // End the session on backend
        try {
          await api.endSession(sessionId);
          console.log('✓ Session ended on backend, trolley should be freed');
        } catch (endErr) {
          console.error('✗ Session end failed:', endErr);
        }
        
        // Clear local session and cart data
        sessionManager.clearSession();
        console.log('✓ Local session and cart cleared');
        
      } catch (err) {
        console.error('Unexpected error during session cleanup:', err);
        // Clear local data anyway
        sessionManager.clearSession();
      }
    };
    
    confirmPaymentAndEndSession();
    
    // No confetti
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md">
            <span className="text-4xl">✓</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Order Placed
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-slate-600 mb-8">
          Thank you for shopping with us.
        </p>

        {/* Order Details Card */}
        <div className="card p-6 mb-8 text-left">
          <h2 className="font-bold text-slate-900 mb-4 text-center">Order Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-slate-500 flex items-center gap-2">
                <span>📋</span>
                Status
              </span>
              <span className="flex items-center gap-2 font-semibold text-emerald-700">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Confirmed
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-slate-500 flex items-center gap-2">
                <span>🕐</span>
                Order Time
              </span>
              <span className="font-semibold text-slate-900">
                {orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <span>🔑</span>
                  Session ID
                </span>
                <button
                  onClick={copySessionId}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-500 bg-slate-50 p-2 rounded-lg truncate">
                {sessionId}
              </p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-2xl p-5 mb-8 border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-3">What's Next?</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-12 h-12 mx-auto bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center mb-2">
                <span className="text-xl">📧</span>
              </div>
              <p className="text-xs text-slate-600">Check your email for receipt</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center mb-2">
                <span className="text-xl">🛒</span>
              </div>
              <p className="text-xs text-slate-600">Continue shopping</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center mb-2">
                <span className="text-xl">⭐</span>
              </div>
              <p className="text-xs text-slate-600">Rate your experience</p>
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
            className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
          >
            <span>📷</span>
            <span>Scan New Trolley</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
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
