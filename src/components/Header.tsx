import React from 'react';
import { Car, Smartphone, Sparkles, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  onReset: () => void;
  hasActiveImage: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGuide,
  onReset,
  hasActiveImage,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={onReset}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-md shadow-cyan-500/10 group-hover:border-cyan-400 transition">
            <Car className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Car Detection AI
              </h1>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO VISION
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-tight">
              Manufacturer • Model • Color • Category
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {hasActiveImage && (
            <button
              onClick={onReset}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium"
            >
              New Scan
            </button>
          )}

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-medium transition shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xs:inline">Android APK</span>
            <span className="xs:hidden">Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
