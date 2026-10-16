import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  Car,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AnalysisResult, DetectedVehicle, SampleCarImage } from './types';
import { SAMPLE_CARS } from './data/samples';
import { fileToBase64, optimizeImageData, urlToBase64 } from './utils/imageUtils';
import { Header } from './components/Header';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ScanningHud } from './components/ScanningHud';
import { VehicleDetectionOverlay } from './components/VehicleDetectionOverlay';
import { VehicleCard } from './components/VehicleCard';
import { AndroidGuideModal } from './components/AndroidGuideModal';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Analyze image payload with backend Gemini API
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearRetryTimer = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setRetryCountdown(null);
  };

  const analyzeImage = async (base64Payload: string, mimeType = 'image/jpeg') => {
    clearRetryTimer();
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setSelectedVehicleId(null);

    try {
      const response = await fetch('/api/analyze-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Payload,
          mimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        let msg = data?.error || 'Failed to analyze vehicle image';
        if (typeof msg === 'string' && msg.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(msg);
            if (parsed?.error?.message) msg = parsed.error.message;
          } catch {}
        }
        if (
          msg.includes('503') ||
          msg.toLowerCase().includes('high demand') ||
          msg.includes('UNAVAILABLE')
        ) {
          msg = 'Google AI Vision servers are currently experiencing a brief traffic spike.';
          // Initiate auto-retry countdown
          startAutoRetry(base64Payload, mimeType);
        }
        throw new Error(msg);
      }

      const result: AnalysisResult = data.data;
      setAnalysisResult(result);

      if (result.vehicles && result.vehicles.length > 0) {
        setSelectedVehicleId(result.vehicles[0].id);
      }
    } catch (err: any) {
      console.error('Detection analysis failed:', err);
      let displayError = err.message || 'Analysis failed. Please try again.';
      if (typeof displayError === 'string' && displayError.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(displayError);
          if (parsed?.error?.message) displayError = parsed.error.message;
        } catch {}
      }
      setError(displayError);
    } finally {
      setAnalyzing(false);
    }
  };

  const startAutoRetry = (payload: string, mime: string) => {
    clearRetryTimer();
    let timeLeft = 4;
    setRetryCountdown(timeLeft);

    countdownTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearRetryTimer();
        analyzeImage(payload, mime);
      } else {
        setRetryCountdown(timeLeft);
      }
    }, 1000);
  };

  // Handle file chosen from device file picker / gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawBase64 = await fileToBase64(file);
      const optimized = await optimizeImageData(rawBase64);
      setImageSrc(optimized.base64);
      analyzeImage(optimized.base64, optimized.mimeType);
    } catch (err: any) {
      setError('Could not process selected image file.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Handle capture from viewfinder modal
  const handleCameraCapture = async (base64Data: string, mimeType: string) => {
    try {
      const optimized = await optimizeImageData(base64Data);
      setImageSrc(optimized.base64);
      analyzeImage(optimized.base64, optimized.mimeType);
    } catch (err) {
      setError('Failed to process captured camera snapshot.');
    }
  };

  // Handle sample preset car selection
  const handleSelectSample = async (sample: SampleCarImage) => {
    try {
      setError(null);
      setImageSrc(sample.url);
      setAnalyzing(true);

      const optimized = await urlToBase64(sample.url);
      setImageSrc(optimized.base64);
      analyzeImage(optimized.base64, optimized.mimeType);
    } catch (err) {
      setError('Failed to load sample image. Please try another sample or upload an image.');
      setAnalyzing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const rawBase64 = await fileToBase64(file);
      const optimized = await optimizeImageData(rawBase64);
      setImageSrc(optimized.base64);
      analyzeImage(optimized.base64, optimized.mimeType);
    }
  };

  // Reset state for new scan
  const handleReset = () => {
    setImageSrc(null);
    setAnalysisResult(null);
    setSelectedVehicleId(null);
    setError(null);
  };

  // Select vehicle and scroll to card
  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    const el = document.getElementById(`vehicle-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        onReset={handleReset}
        hasActiveImage={Boolean(imageSrc)}
      />

      {/* Hidden file inputs */}
      {/* Gallery / File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Mobile Native Camera Direct Trigger */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Banner when no image is loaded */}
        {!imageSrc && !analyzing && (
          <div className="space-y-6">
            {/* Top Automotive AI Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 sm:p-10 text-center shadow-2xl">
              {/* Background ambient lighting */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini 3.8 Flash Vision Powered</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
                  Instant Car Detection & Classification
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Snap or upload any vehicle photo. AI instantly decodes the manufacturer,
                  model, paint color finish, body class, and engineering signatures — with multi-car support.
                </p>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {/* Camera Viewfinder Button */}
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide uppercase shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    <span>Open Camera</span>
                  </button>

                  {/* Native Mobile Camera Direct Shutter */}
                  <button
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Quick Shutter (Mobile)</span>
                  </button>

                  {/* Gallery Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-semibold text-sm border border-cyan-500/30 flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Upload From Gallery</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Drop your car photos here, or <span className="text-cyan-400 underline underline-offset-2">browse gallery</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP, HEIC from smartphone cameras
              </p>
            </div>

            {/* Sample Preset Cars Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    Or Try With Sample Vehicles
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">1-Click Test</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SAMPLE_CARS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 bg-slate-900/80 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-md"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950">
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-0.5">
                        {sample.badge}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">
                        {sample.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {sample.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase">Make & Model ID</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Detects manufacturer badge, specific trim, and estimated production era.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase">Multi-Vehicle Vision</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Locates and categorizes multiple cars within parking lots and street traffic.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase">Paint & Category</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Extracts exact exterior color name, hex code, and vehicular classification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanning Loading State & Seamless Auto-Retry */}
        {(analyzing || retryCountdown !== null) && imageSrc && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <ScanningHud
              imageSrc={imageSrc}
              customStatus={
                retryCountdown !== null
                  ? `High AI Server Demand — Reconnecting in ${retryCountdown}s...`
                  : null
              }
            />
          </div>
        )}

        {/* Error Notification (Shown only when not actively retrying) */}
        {error && retryCountdown === null && !analyzing && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Analysis Notice
                  </h4>
                  {retryCountdown !== null && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      Auto-retrying in {retryCountdown}s
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-200 mt-1 max-w-xl leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {imageSrc && (
                <button
                  onClick={() => {
                    clearRetryTimer();
                    analyzeImage(imageSrc);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-rose-600/30 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retryCountdown !== null ? 'animate-spin' : ''}`} />
                  <span>{retryCountdown !== null ? 'Retry Now' : 'Retry Analysis'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  clearRetryTimer();
                  handleReset();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Choose Another
              </button>
            </div>
          </div>
        )}

        {/* Analysis Results Display */}
        {!analyzing && analysisResult && imageSrc && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Action & Overview Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono font-bold text-cyan-400">
                      Detection Status:
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {analysisResult.hasVehicles
                        ? `${analysisResult.vehiclesCount} Vehicle${
                            analysisResult.vehiclesCount > 1 ? 's' : ''
                          } Identified`
                        : 'No Vehicles Detected'}
                    </span>
                  </div>
                  {analysisResult.sceneDescription && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Environment: {analysisResult.sceneDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Snap Another</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Upload New</span>
                </button>
              </div>
            </div>

            {/* Visual Photo View with Interactive Bounding Boxes */}
            <VehicleDetectionOverlay
              imageSrc={imageSrc}
              vehicles={analysisResult.vehicles || []}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={handleSelectVehicle}
            />

            {/* Case: No Vehicles Detected in Image */}
            {!analysisResult.hasVehicles && (
              <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center space-y-3">
                <Info className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-white">
                  No Motor Vehicles Detected
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {analysisResult.detectionNotes ||
                    'The AI could not confidently identify a vehicle in this image. Please try taking a closer photo with good lighting and clear view of the vehicle chassis or grille.'}
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
                  >
                    Retake Photo
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Try Another File
                  </button>
                </div>
              </div>
            )}

            {/* List of Detected Vehicles Cards */}
            {analysisResult.hasVehicles && analysisResult.vehicles && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Car className="w-4 h-4 text-cyan-400" />
                    <span>Vehicle Specification Breakdown</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {analysisResult.vehicles.length} Result{analysisResult.vehicles.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-4">
                  {analysisResult.vehicles.map((vehicle, index) => (
                    <VehicleCard
                      key={vehicle.id || index}
                      vehicle={vehicle}
                      index={index}
                      totalCount={analysisResult.vehicles.length}
                      isSelected={selectedVehicleId === vehicle.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Detection Notes if available */}
            {analysisResult.detectionNotes && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300">Observation Notes: </span>
                  {analysisResult.detectionNotes}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar for Mobile Ergonomics when an image is loaded */}
      {imageSrc && (
        <div className="sticky bottom-0 z-30 p-3 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 sm:hidden">
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30"
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Upload className="w-4 h-4" />
              <span>Gallery</span>
            </button>
            <button
              onClick={handleReset}
              className="py-2.5 px-3 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-xs"
              title="Reset"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Camera Capture Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Android & Testing Guide Modal */}
      <AndroidGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
