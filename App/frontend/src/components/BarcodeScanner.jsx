import { useEffect, useRef, useState } from 'react';
import { useZxing } from 'react-zxing';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

const decodeHints = new Map();
decodeHints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.ITF,
]);

export default function BarcodeScanner({ onScan, onError, disabled = false }) {
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [paused, setPaused] = useState(false);
  const cooldownRef = useRef(null);
  const lastScanRef = useRef(0);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.enumerateDevices) {
      setHasCamera(false);
      setCameraError('Camera access is not supported by this browser.');
      return;
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        if (cancelled) return;
        const hasVideo = devices.some((device) => device.kind === 'videoinput');
        setHasCamera(hasVideo);
        if (!hasVideo) {
          setCameraError('No camera found on this device.');
          onErrorRef.current && onErrorRef.current('Camera not available');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setHasCamera(false);
        setCameraError('Camera access was blocked.');
        onErrorRef.current && onErrorRef.current('Camera access denied');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { ref } = useZxing({
    paused: disabled || paused || !hasCamera,
    hints: decodeHints,
    constraints: {
      facingMode: 'environment',
    },
    timeBetweenDecodingAttempts: 200,
    onDecodeResult: (result) => {
      const barcode = result?.getText?.().trim();
      if (!barcode) return;
      const now = Date.now();
      if (now - lastScanRef.current < 1500) return;
      lastScanRef.current = now;
      setPaused(true);
      onScanRef.current && onScanRef.current(barcode);
      cooldownRef.current = setTimeout(() => setPaused(false), 1500);
    },
    onDecodeError: (err) => {
      if (err?.name === 'NotFoundException') return;
      onErrorRef.current && onErrorRef.current(err);
    },
  });

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
    };
  }, []);

  if (!hasCamera) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
          <span className="text-2xl">📷</span>
        </div>
        <p className="text-sm font-semibold text-amber-200">{cameraError || 'Camera not available.'}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/60">
      <video ref={ref} className="h-64 w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-cyan-400/40"></div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-cyan-100">
        {disabled || paused ? 'Hold steady...' : 'Scanning barcode...'}
      </div>
    </div>
  );
}
