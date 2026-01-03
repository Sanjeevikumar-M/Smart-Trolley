import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if device has camera
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const hasVideo = devices.some((device) => device.kind === 'videoinput');
        setHasCamera(hasVideo);
        if (hasVideo) setIsScanning(true);
      })
      .catch(() => {
        setHasCamera(false);
        setError('Unable to access camera. Please check permissions.');
        if (onError) onError('Camera access denied');
      });

    if (!hasCamera) return;

    const scanner = new Html5QrcodeScanner(
      'qr-scanner-container',
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1,
        disableFlip: false,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    const handleScan = (decodedText) => {
      let trolleyId = null;

      if (decodedText.includes('trolley_id=')) {
        const match = decodedText.match(/trolley_id=([A-Z0-9_]+)/i);
        trolleyId = match ? match[1].toUpperCase() : null;
      } else if (decodedText.match(/^[A-Z0-9_]+$/i)) {
        trolleyId = decodedText.toUpperCase();
      }

      if (trolleyId) {
        setIsScanning(false);
        scanner.clear().catch(() => {});
        onScan(trolleyId);
      }
    };

    const handleError = (err) => {
      if (!err.includes('NotFoundException')) {
        console.debug('QR scan error:', err);
      }
    };

    scanner.render(handleScan, handleError);

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [hasCamera, onScan, onError]);

  if (!hasCamera) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 text-center border border-red-200">
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📷</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Camera Not Available
        </h3>
        <p className="text-gray-600 mb-6">
          {error || 'Your device does not have a camera or camera access is denied.'}
        </p>
        <div className="bg-white rounded-xl p-4 text-left">
          <p className="text-sm font-medium text-gray-700 mb-2">To fix this:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-indigo-500">•</span>
              Check your browser camera permissions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-500">•</span>
              Allow camera access when prompted
            </li>
            <li className="flex items-center gap-2">
              <span className="text-indigo-500">•</span>
              Try refreshing the page
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scanner Container */}
      <div
        id="qr-scanner-container"
        className="rounded-2xl overflow-hidden"
        style={{
          width: '100%',
          minHeight: '300px',
        }}
      ></div>

      {/* Scanning Indicator */}
      {isScanning && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">Scanning...</span>
        </div>
      )}

      {/* Custom Styles for html5-qrcode */}
      <style>{`
        #qr-scanner-container {
          border: none !important;
        }
        #qr-scanner-container video {
          border-radius: 1rem !important;
        }
        #qr-scanner-container__scan_region {
          background: transparent !important;
        }
        #qr-scanner-container__dashboard {
          padding: 1rem !important;
        }
        #qr-scanner-container__dashboard_section_csr button {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
          color: white !important;
          border: none !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 0.75rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }
        #qr-scanner-container__dashboard_section_csr button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4) !important;
        }
        #qr-scanner-container__dashboard_section_swaplink {
          color: #6366f1 !important;
          text-decoration: none !important;
          font-weight: 500 !important;
        }
        #qr-shaded-region {
          border-color: rgba(99, 102, 241, 0.8) !important;
        }
        #qr-scanner-container select {
          padding: 0.5rem 1rem !important;
          border-radius: 0.5rem !important;
          border: 2px solid #e2e8f0 !important;
          background: white !important;
        }
        #qr-scanner-container select:focus {
          border-color: #6366f1 !important;
          outline: none !important;
        }
      `}</style>
    </div>
  );
}
