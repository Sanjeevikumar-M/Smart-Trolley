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
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-center animate-bounce-in">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-2xl glow-success">
            <span className="text-6xl">✓</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Connected!</h2>
          <p className="text-gray-600">Starting your shopping session...</p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🛒</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting...</h2>
          <p className="text-gray-600">Setting up your smart trolley</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl mb-4 animate-float">
            <span className="text-4xl">📷</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Trolley</h1>
          <p className="text-gray-600">Scan the QR code on your trolley to start shopping</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-xl p-4 animate-slide-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-800">Connection Failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setScanMode(true)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
              scanMode
                ? 'bg-white shadow-md text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">📷</span>
            Scan QR Code
          </button>
          <button
            onClick={() => setScanMode(false)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
              !scanMode
                ? 'bg-white shadow-md text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">⌨️</span>
            Enter Code
          </button>
        </div>

        {/* Scanner or Manual Input */}
        <div className="card p-6 mb-6">
          {scanMode ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-gray-900">
                <QRScanner onScan={handleQRScan} onError={(e) => setError(e)} />
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-white/20 rounded-2xl"></div>
                  
                  {/* Corner Markers */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-indigo-500 rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-indigo-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-indigo-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-indigo-500 rounded-br-lg"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Camera active - Point at QR code</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trolley ID
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                  placeholder="e.g., TROLLEY_01"
                  className="w-full px-4 py-4 text-lg font-mono text-center tracking-widest border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="w-full btn-primary py-4 rounded-2xl text-lg disabled:opacity-50"
              >
                Connect to Trolley
              </button>
            </form>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💡</span>
            How to Connect
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <p className="text-gray-600 text-sm">Find the QR code on your smart trolley's display</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <p className="text-gray-600 text-sm">Point your camera at the QR code</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <p className="text-gray-600 text-sm">Start scanning products and enjoy smart shopping!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
