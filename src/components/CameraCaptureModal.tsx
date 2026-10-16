import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, Activity, ShieldAlert, Zap } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Data: string, mimeType: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const motionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  // Real-time Motion Detection State
  const [motionActive, setMotionActive] = useState(true);
  const [motionScore, setMotionScore] = useState(0);
  const [autoCaptureOnMotion, setAutoCaptureOnMotion] = useState(false);
  const [motionTriggerCount, setMotionTriggerCount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (motionTimerRef.current) {
      clearInterval(motionTimerRef.current);
      motionTimerRef.current = null;
    }
    prevFrameRef.current = null;
    setIsReady(false);
    setMotionScore(0);
  };

  const startCamera = async () => {
    setError(null);
    setIsReady(false);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsReady(true);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access in browser permissions or use the file upload option.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera device was detected on your system.');
      } else {
        setError(err.message || 'Unable to start camera stream.');
      }
    }
  };

  // Optical frame difference motion detector loop
  useEffect(() => {
    if (!isReady || !motionActive) {
      if (motionTimerRef.current) {
        clearInterval(motionTimerRef.current);
        motionTimerRef.current = null;
      }
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    motionCanvasRef.current = canvas;

    motionTimerRef.current = setInterval(() => {
      if (!videoRef.current || !ctx || videoRef.current.readyState < 2) return;

      ctx.drawImage(videoRef.current, 0, 0, 64, 48);
      const imgData = ctx.getImageData(0, 0, 64, 48);
      const data = imgData.data;

      if (prevFrameRef.current) {
        let diffPixels = 0;
        const totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          // Grayscale luminance
          const r1 = data[i];
          const g1 = data[i + 1];
          const b1 = data[i + 2];
          const lum1 = (r1 * 0.299 + g1 * 0.587 + b1 * 0.114);

          const r2 = prevFrameRef.current[i];
          const g2 = prevFrameRef.current[i + 1];
          const b2 = prevFrameRef.current[i + 2];
          const lum2 = (r2 * 0.299 + g2 * 0.587 + b2 * 0.114);

          if (Math.abs(lum1 - lum2) > 28) {
            diffPixels++;
          }
        }

        const scorePercent = Math.min(100, Math.round((diffPixels / totalPixels) * 100 * 2.8));
        setMotionScore(scorePercent);

        // Auto-capture on vehicle motion trigger
        if (autoCaptureOnMotion && scorePercent > 35) {
          setMotionTriggerCount((prev) => {
            const next = prev + 1;
            if (next >= 3) {
              // Trigger capture!
              handleCapture();
              return 0;
            }
            return next;
          });
        } else {
          setMotionTriggerCount(0);
        }
      }

      // Save copy of current frame
      prevFrameRef.current = new Uint8ClampedArray(data);
    }, 120);

    return () => {
      if (motionTimerRef.current) {
        clearInterval(motionTimerRef.current);
        motionTimerRef.current = null;
      }
    };
  }, [isReady, motionActive, autoCaptureOnMotion]);

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      stopCamera();
      onCapture(dataUrl, 'image/jpeg');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[88vh] max-h-[760px]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800 z-10">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-sm font-semibold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Vehicle Scanner & Motion Radar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          {error ? (
            <div className="p-6 text-center max-w-sm">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <p className="text-sm text-slate-200 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Shutter flash effect */}
              {flashEffect && (
                <div className="absolute inset-0 bg-white opacity-80 pointer-events-none transition-opacity duration-200" />
              )}

              {/* HUD Targeting Reticle & Crosshairs */}
              <div className="absolute inset-5 sm:inset-8 pointer-events-none border border-cyan-500/40 rounded-xl">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

                {/* Center crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-400/40 -translate-y-1/2" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-cyan-400/40 -translate-x-1/2" />
                </div>

                {/* Live Motion Status Indicator */}
                {motionActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 pointer-events-auto">
                    <Activity className={`w-3.5 h-3.5 ${motionScore > 25 ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300">
                        <span>MOTION:</span>
                        <span className={`font-bold ${motionScore > 25 ? 'text-amber-300' : 'text-slate-300'}`}>
                          {motionScore}%
                        </span>
                        {motionScore > 25 && (
                          <span className="px-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            DETECTED
                          </span>
                        )}
                      </div>
                      <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                        <div
                          className={`h-full transition-all duration-100 ${
                            motionScore > 35 ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${motionScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Guidance badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full border border-cyan-500/30 text-[10px] font-mono text-cyan-300 whitespace-nowrap">
                  {autoCaptureOnMotion ? 'AUTO-CAPTURE ARMED • MOVE CAR INTO VIEW' : 'ALIGN VEHICLE INSIDE FRAME'}
                </div>
              </div>

              {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-mono">Initializing camera feed & sensors...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Motion Settings Toggle Strip */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <button
            onClick={() => setMotionActive(!motionActive)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition border ${
              motionActive
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Motion Sensor: {motionActive ? 'ON' : 'OFF'}</span>
          </button>

          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCaptureOnMotion}
              onChange={(e) => setAutoCaptureOnMotion(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Auto-snap on movement</span>
            </span>
          </label>
        </div>

        {/* Bottom Camera Controls Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-around">
          {/* Switch facing camera */}
          <button
            onClick={handleSwitchCamera}
            disabled={!isReady}
            className="p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition active:scale-95"
            title="Switch front/rear camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Shutter capture button */}
          <button
            onClick={handleCapture}
            disabled={!isReady}
            className="relative group p-1 rounded-full border-2 border-cyan-400 disabled:opacity-40 transition active:scale-90"
            title="Capture vehicle photo"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 group-hover:scale-105 transition flex items-center justify-center shadow-lg shadow-cyan-500/40">
              <Camera className="w-7 h-7 text-slate-950 font-bold" />
            </div>
          </button>

          {/* Info pill */}
          <div className="w-11 flex justify-center">
            <span className="text-[10px] font-mono text-cyan-400/80 uppercase">
              {facingMode === 'environment' ? 'Rear' : 'Front'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
