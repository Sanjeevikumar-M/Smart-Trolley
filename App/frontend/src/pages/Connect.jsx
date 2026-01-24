import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import sessionManager from '../utils/sessionManager';
import api from '../utils/api';

export default function Connect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanMode, setScanMode] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    const trolleyIdFromUrl = searchParams.get('trolley_id');
    if (trolleyIdFromUrl) {
      handleTrolleyConnect(trolleyIdFromUrl);
    }
  }, []);

  const handleQRScan = (trolleyId) => {
    handleTrolleyConnect(trolleyId);
  };

  const handleTrolleyConnect = async (trolleyId) => {
    try {
      setLoading(true);
      setError(null);

      if (!trolleyId || trolleyId.trim() === '') {
        setError('Invalid trolley ID. Please try again.');
        setLoading(false);
        return;
      }

      const trolleyIdUpper = trolleyId.trim().toUpperCase();

      // If an existing session is present, end it to free previous trolley
      try {
        const existing = sessionManager.getSession();
        if (existing?.id) {
          await api.endSession(existing.id);
        }
      } catch (endErr) {
        // Non-fatal: continue connecting to new trolley
        console.debug('Ending previous session failed (ignored):', endErr?.message || endErr);
      } finally {
        // Clear local state before creating a new session
        sessionManager.clearSession();
      }

      // Create session on backend
      try {
        const response = await api.startSession(trolleyIdUpper);
        if (response && response.session_id) {
          // Backend session created successfully, store it locally
          const session = {
            id: response.session_id,  // Use backend UUID
            trolleyId: trolleyIdUpper,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
          };
          localStorage.setItem('smart_trolley_session', JSON.stringify(session));
        } else {
          throw new Error('No session_id in response');
        }
      } catch (apiErr) {
        console.error('Backend session creation failed:', apiErr);
        setError(`Failed to connect: ${apiErr.message}`);
        setLoading(false);
        return;
      }

      // Show success animation
      setScanSuccess(true);
      
      setTimeout(() => {
        navigate('/cart', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect. Please try again.');
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleTrolleyConnect(manualInput);
    }
  };

  // Success State
  if (scanSuccess) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Celebration background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900"></div>
        
        {/* Animated circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 rounded-full border-4 border-emerald-500/30 animate-ping opacity-20"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-48 h-48 rounded-full border-4 border-cyan-500/30 animate-ping opacity-30" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        <div className="text-center animate-bounce-in relative z-10">
          <div className="w-36 h-36 mx-auto bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-8 shadow-2xl glow-success">
            <span className="text-7xl drop-shadow-lg">✓</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-3">Connected!</h2>
          <p className="text-lg text-slate-400 font-medium">Starting your shopping session...</p>
          <div className="mt-8 flex justify-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 border-r-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-b-purple-500 border-l-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl animate-pulse">🛒</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Connecting...</h2>
          <p className="text-slate-400 font-medium">Setting up your smart trolley</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float glow-blue">
              <span className="text-5xl drop-shadow-lg">📷</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Connect Trolley</h1>
          <p className="text-lg text-slate-400 font-medium">Scan the QR code on your trolley to start shopping</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-900/50 via-rose-900/50 to-orange-900/50 border-l-4 border-red-500 rounded-2xl p-5 animate-slide-in shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-400">Connection Failed</p>
                <p className="text-sm text-red-300/80">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex bg-slate-800/50 rounded-2xl p-1.5 mb-6 shadow-inner border border-slate-700/50">
          <button
            onClick={() => setScanMode(true)}
            className={`flex-1 py-4 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              scanMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className={`text-xl transition-transform ${scanMode ? 'scale-110' : ''}`}>📷</span>
            <span>Scan QR Code</span>
          </button>
          <button
            onClick={() => setScanMode(false)}
            className={`flex-1 py-4 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              !scanMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className={`text-xl transition-transform ${!scanMode ? 'scale-110' : ''}`}>⌨️</span>
            <span>Enter Code</span>
          </button>
        </div>

        {/* Scanner or Manual Input */}
        <div className="card p-6 mb-6 overflow-hidden">
          {scanMode ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                <QRScanner onScan={handleQRScan} onError={(e) => setError(e)} />
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-2xl"></div>
                  
                  {/* Animated scan line */}
                  <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2"></div>
                  
                  {/* Corner Markers with glow */}
                  <div className="absolute top-4 left-4 w-10 h-10 border-l-4 border-t-4 border-cyan-400 rounded-tl-xl shadow-lg shadow-cyan-500/50"></div>
                  <div className="absolute top-4 right-4 w-10 h-10 border-r-4 border-t-4 border-blue-400 rounded-tr-xl shadow-lg shadow-blue-500/50"></div>
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-l-4 border-b-4 border-purple-400 rounded-bl-xl shadow-lg shadow-purple-500/50"></div>
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-r-4 border-b-4 border-cyan-400 rounded-br-xl shadow-lg shadow-cyan-500/50"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-sm bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 py-3 px-4 rounded-xl border border-emerald-500/30">
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full relative"></div>
                </div>
                <span className="font-medium text-emerald-400">Camera active - Point at QR code</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-3">
                  Trolley ID
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                  placeholder="e.g., TROLLEY_01"
                  className="w-full px-5 py-5 text-xl font-mono text-center tracking-widest rounded-2xl transition-all"
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="w-full btn-primary py-5 rounded-2xl text-lg disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <span>🔗</span>
                <span>Connect to Trolley</span>
              </button>
            </form>
          )}
        </div>

        {/* Help Section */}
        <div className="card p-6 bg-gradient-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20 border border-cyan-500/20">
          <h3 className="font-bold text-lg text-white mb-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              💡
            </div>
            How to Connect
          </h3>
          <div className="space-y-4">
            {[
              { step: 1, text: "Find the QR code on your smart trolley's display", icon: '🔍' },
              { step: 2, text: 'Point your camera at the QR code', icon: '📱' },
              { step: 3, text: 'Start scanning products and enjoy smart shopping!', icon: '🎉' },
            ].map((item, i) => (
              <div 
                key={item.step}
                className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
              >
                <div className="number-badge shrink-0">{item.step}</div>
                <p className="text-slate-300 font-medium pt-1">{item.text}</p>
                <span className="ml-auto text-xl opacity-50">{item.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
