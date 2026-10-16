import React from 'react';
import { DetectedVehicle } from '../types';
import { Car, CheckCircle2 } from 'lucide-react';

interface VehicleDetectionOverlayProps {
  imageSrc: string;
  vehicles: DetectedVehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
}

export const VehicleDetectionOverlay: React.FC<VehicleDetectionOverlayProps> = ({
  imageSrc,
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
      {/* Vehicle Image */}
      <div className="relative w-full aspect-video sm:aspect-[16/9] max-h-[500px] bg-slate-950 flex items-center justify-center overflow-hidden">
        <img
          src={imageSrc}
          alt="Detected Vehicle"
          className="w-full h-full object-contain"
        />

        {/* Bounding Box Overlays */}
        {vehicles.map((v, index) => {
          if (!v.box2d) return null;

          const isSelected = selectedVehicleId === v.id;
          const { ymin, xmin, ymax, xmax } = v.box2d;

          // Auto-normalize if coordinate is on 0-1000 scale
          const norm = (n: number) => (n > 100 ? n / 10 : n);
          const topVal = Math.max(0, Math.min(100, norm(ymin)));
          const leftVal = Math.max(0, Math.min(100, norm(xmin)));
          const bottomVal = Math.max(0, Math.min(100, norm(ymax)));
          const rightVal = Math.max(0, Math.min(100, norm(xmax)));

          const top = `${topVal}%`;
          const left = `${leftVal}%`;
          const width = `${Math.max(4, Math.min(100, rightVal - leftVal))}%`;
          const height = `${Math.max(4, Math.min(100, bottomVal - topVal))}%`;

          // Give each vehicle distinct color border if multiple
          const accentColor =
            index % 3 === 0
              ? 'border-cyan-400 text-cyan-400'
              : index % 3 === 1
              ? 'border-amber-400 text-amber-400'
              : 'border-emerald-400 text-emerald-400';

          return (
            <div
              key={v.id || index}
              onClick={() => onSelectVehicle(v.id)}
              style={{
                top,
                left,
                width,
                height,
              }}
              className={`absolute cursor-pointer border-2 transition-all duration-200 rounded-md pointer-events-auto ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_20px_rgba(56,189,248,0.6)] z-20 scale-[1.01]'
                  : `${accentColor} bg-black/20 hover:bg-black/40 z-10 opacity-90 hover:opacity-100`
              }`}
            >
              {/* Corner targeting markers */}
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-current" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-current" />
              <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-current" />
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-current" />

              {/* Tag Label */}
              <div
                className={`absolute -top-7 left-0 max-w-[200px] truncate px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-tight flex items-center gap-1 shadow-md whitespace-nowrap z-30 transition-transform ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 scale-105'
                    : 'bg-slate-900/95 text-slate-100 border border-slate-700'
                }`}
              >
                <span className="opacity-80">#{index + 1}</span>
                <span className="font-semibold">{v.make} {v.model}</span>
                <span className="opacity-75 text-[10px]">({v.confidence}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-car pill quick selector bar if > 1 car detected */}
      {vehicles.length > 1 && (
        <div className="px-4 py-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 shrink-0">
            <Car className="w-3.5 h-3.5 text-cyan-400" />
            <span>{vehicles.length} Detected Vehicles:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {vehicles.map((v, i) => {
              const isSelected = selectedVehicleId === v.id;
              return (
                <button
                  key={v.id || i}
                  onClick={() => onSelectVehicle(v.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap shrink-0 border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/40"
                    style={{ backgroundColor: v.colorHex || '#888' }}
                  />
                  <span>#{i + 1} {v.make} {v.model}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
