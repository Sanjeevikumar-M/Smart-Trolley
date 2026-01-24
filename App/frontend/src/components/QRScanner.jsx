import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }) {
  // Single instance guard for Html5QrcodeScanner
  const instanceRef = useRef(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanComplete, setScanComplete] = useState(false);

  // Keep callbacks stable
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Detect camera availability first
  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        if (cancelled) return;
        const hasVideo = devices.some((device) => device.kind === 'videoinput');
        setHasCamera(hasVideo);
        setIsScanning(hasVideo);
        if (!hasVideo) {
          setError('Unable to access camera. Please check permissions.');
          onErrorRef.current && onErrorRef.current('Camera access denied');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setHasCamera(false);
        setError('Unable to access camera. Please check permissions.');
        onErrorRef.current && onErrorRef.current('Camera access denied');
      });
    return () => { cancelled = true; };
  }, []);

  // Initialize scanner once when camera is available
  useEffect(() => {
    if (!hasCamera || instanceRef.current || scanComplete) return;

    const containerId = 'qr-scanner-container';
    // Defensive: ensure container is clean before init
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';

    const scanner = new Html5QrcodeScanner(
      containerId,
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

    instanceRef.current = scanner;

    const handleScan = (decodedText) => {
      let trolleyId = null;
      if (decodedText.includes('trolley_id=')) {
        const match = decodedText.match(/trolley_id=([A-Z0-9_]+)/i);
        trolleyId = match ? match[1].toUpperCase() : null;
      } else if (decodedText.match(/^[A-Z0-9_]+$/i)) {
        trolleyId = decodedText.toUpperCase();
      }
      if (trolleyId && !scanComplete) {
        setScanComplete(true);
        setIsScanning(false);
        
        // Stop camera immediately
        const inst = instanceRef.current;
        if (inst) {
          inst.clear()
            .then(() => {
              // Stop all video tracks to turn off camera
              const container = document.getElementById('qr-scanner-container');
              if (container) {
                const videos = container.getElementsByTagName('video');
                for (let video of videos) {
                  const stream = video.srcObject;
                  if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                  }
                }
                container.innerHTML = '';
              }
              instanceRef.current = null;
            })
            .catch(err => console.debug('Scanner clear error:', err));
        }
        
        onScanRef.current && onScanRef.current(trolleyId);
      }
    };

    const handleError = (err) => {
      if (typeof err === 'string' && err.includes('NotFoundException')) return;
      console.debug('QR scan error:', err);
    };

    scanner.render(handleScan, handleError);

    return () => {
      const inst = instanceRef.current;
      if (inst) {
        inst
          .clear()
          .catch(() => {})
          .finally(() => {
            instanceRef.current = null;
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '';
          });
      }
    };
  }, [hasCamera]);

  if (scanComplete) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-200">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          QR Code Scanned!
        </h3>
        <p className="text-gray-600">
          Connecting to your trolley...
        </p>
      </div>
    );
  }

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

      {/* Scoped styles for html5-qrcode */}
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
