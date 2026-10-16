import React, { useState, useEffect } from 'react';
import { Cpu, Eye, Palette, ShieldCheck, Car } from 'lucide-react';

interface ScanningHudProps {
  imageSrc: string;
  customStatus?: string | null;
}

const SCAN_STAGES = [
  { icon: Eye, label: 'Scanning visual frame & optics...' },
  { icon: Car, label: 'Detecting vehicle silhouettes & geometry...' },
  { icon: Cpu, label: 'Identifying manufacturer emblem & model line...' },
  { icon: Palette, label: 'Extracting exterior paint pigment & finish...' },
  { icon: ShieldCheck, label: 'Finalizing automotive specifications report...' },
];

export const ScanningHud: React.FC<ScanningHudProps> = ({ imageSrc, customStatus }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    const stageTimer = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % SCAN_STAGES.length);
    }, 1800);

    return () => {
      clearInterval(timer);
      clearInterval(stageTimer);
    };
  }, []);

  const CurrentIcon = SCAN_STAGES[currentStageIndex].icon;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/40 shadow-2xl shadow-cyan-950/50">
      {/* Background Image preview with dark blue cyber tint */}
      <div className="relative aspect-video sm:aspect-[16/9] max-h-[460px] w-full overflow-hidden bg-slate-900 flex items-center justify-center">
        <img
          src={imageSrc}
          alt="Vehicle under analysis"
          className="w-full h-full object-contain filter brightness-75 contrast-125 saturate-75"
        />

        {/* Cyber grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(56, 189, 248, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Animated HUD Scanline */}
        <div className="animate-scanline pointer-events-none" />

        {/* HUD Targeting Reticle & Overlay */}
        <div className="absolute inset-4 sm:inset-8 border border-cyan-400/30 rounded-xl pointer-events-none flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400 tracking-wider">
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              AI_OPTIC_ACTIVE
            </span>
            <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30 font-mono">
              T+{elapsed}s
            </span>
          </div>

          {/* Center Circular Scanner */}
          <div className="self-center flex flex-col items-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40 animate-[spin_6s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-[spin_3s_linear_infinite_reverse]" />
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 backdrop-blur-sm border border-cyan-400 flex items-center justify-center text-cyan-300">
                <CurrentIcon className="w-8 h-8 animate-pulse text-cyan-400" />
              </div>
            </div>
            <p className="mt-3 text-xs sm:text-sm font-semibold tracking-wider text-cyan-300 uppercase drop-shadow">
              Gemini Vision Deep Analysis
            </p>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>MODEL: GEMINI-3.8-FLASH</span>
            <span>MULTI-CAR SPECTRAL RESOLUTION</span>
          </div>
        </div>
      </div>

      {/* Progress status bar */}
      <div className="px-5 py-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <CurrentIcon className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className={`text-xs font-mono font-semibold uppercase tracking-wider ${customStatus ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`}>
              {customStatus || SCAN_STAGES[currentStageIndex].label}
            </div>
            <div className="text-[11px] text-slate-400">
              {customStatus
                ? 'High AI traffic detected on Google servers — waiting for capacity clearance'
                : 'Examining vehicle make, model, color code, body style & features'}
            </div>
          </div>
        </div>

        {/* Pulse gauge */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-6 rounded-sm transition-all duration-300 ${
                i <= currentStageIndex
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/50'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
