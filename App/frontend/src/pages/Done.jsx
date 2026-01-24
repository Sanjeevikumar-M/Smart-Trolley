import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';
import heartbeatManager from '../utils/heartbeatManager';
import api from '../utils/api';

// Professional success page with celebration

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
        if (!sessionId) {
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900"></div>
      
      {/* Floating celebration orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-full blur-3xl opacity-50 animate-float"></div>
      <div className="absolute bottom-40 right-10 w-40 h-40 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-green-500/30 rounded-full blur-2xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Pulsing rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-96 h-96 rounded-full border-2 border-emerald-500/20 animate-ping opacity-20" style={{ animationDuration: '2s' }}></div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-72 h-72 rounded-full border-2 border-cyan-500/20 animate-ping opacity-25" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
      </div>
      
      <div className="max-w-md w-full text-center relative z-10">
        {/* Success Icon */}
        <div className="mb-10 animate-bounce-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white shadow-2xl glow-success">
              <span className="text-6xl drop-shadow-lg">✓</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-white mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Order <span className="text-gradient-success">Confirmed!</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-slate-400 mb-10 font-medium animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          Thank you for shopping with SmartTrolley 🎉
        </p>

        {/* Order Details Card */}
        <div className="card p-8 mb-8 text-left animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 rounded-t-2xl"></div>
          
          <h2 className="font-black text-lg text-white mb-6 text-center">Order Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-slate-700">
              <span className="text-slate-400 flex items-center gap-3 font-medium">
                <span className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">📋</span>
                Status
              </span>
              <span className="flex items-center gap-3 font-bold text-emerald-400 bg-emerald-500/20 px-4 py-2 rounded-xl">
                <div className="relative">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping absolute"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full relative"></div>
                </div>
                Confirmed
              </span>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-slate-700">
              <span className="text-slate-400 flex items-center gap-3 font-medium">
                <span className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">🕐</span>
                Order Time
              </span>
              <span className="font-bold text-white text-lg">
                {orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 flex items-center gap-3 font-medium">
                  <span className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">🔑</span>
                  Session ID
                </span>
                <button
                  onClick={copySessionId}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 scale-105'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-500 bg-slate-800 p-4 rounded-xl truncate border border-slate-700">
                {sessionId}
              </p>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="card p-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-black text-lg text-white mb-5">What's Next?</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '📧', text: 'Check email for receipt', color: 'from-blue-500/20 to-cyan-500/20' },
              { icon: '🛒', text: 'Continue shopping', color: 'from-purple-500/20 to-pink-500/20' },
              { icon: '⭐', text: 'Rate experience', color: 'from-amber-500/20 to-orange-500/20' },
            ].map((item, i) => (
              <div key={i} className="group">
                <div className={`w-14 h-14 mx-auto bg-gradient-to-br ${item.color} rounded-2xl border border-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={handleContinueShopping}
            className="w-full btn-primary py-5 rounded-2xl text-lg flex items-center justify-center gap-3 group"
          >
            <span className="text-2xl group-hover:scale-125 transition-transform">🏠</span>
            <span>Continue Shopping</span>
          </button>

          <button
            onClick={handleNewSession}
            className="w-full btn-secondary py-5 rounded-2xl text-lg flex items-center justify-center gap-3 group"
          >
            <span className="text-2xl group-hover:rotate-12 transition-transform">📷</span>
            <span>Scan New Trolley</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-8 text-sm text-slate-500 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-full border border-slate-700">
            <span className="text-emerald-400">✓</span> Secure checkout
          </span>
          <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-full border border-slate-700">
            <span className="text-emerald-400">✓</span> Receipt sent
          </span>
          <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-full border border-slate-700">
            <span className="text-emerald-400">✓</span> Eco-friendly
          </span>
        </div>
      </div>
    </div>
  );
}
