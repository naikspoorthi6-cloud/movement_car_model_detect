import React, { useState } from 'react';
import { DetectedVehicle } from '../types';
import {
  Car,
  Palette,
  Tag,
  Calendar,
  Zap,
  CheckCircle,
  Volume2,
  VolumeX,
  Compass,
  Gauge,
  Sparkles,
} from 'lucide-react';

interface VehicleCardProps {
  vehicle: DetectedVehicle;
  index: number;
  totalCount: number;
  isSelected?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  index,
  totalCount,
  isSelected,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = `Detected vehicle: ${vehicle.make} ${vehicle.model}, estimated ${
      vehicle.yearRange
    }. Category: ${vehicle.category}. Exterior color is ${vehicle.colorName}. ${
      vehicle.fuelType ? `Powertrain: ${vehicle.fuelType}.` : ''
    } ${vehicle.summary || ''}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const confidenceColor =
    vehicle.confidence >= 90
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : vehicle.confidence >= 75
      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  return (
    <div
      id={`vehicle-${vehicle.id}`}
      className={`rounded-2xl bg-slate-900/90 border transition-all duration-300 overflow-hidden shadow-xl ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-950/40'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Banner with Make/Model & Confidence */}
      <div className="p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {totalCount > 1 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  CAR #{index + 1}
                </span>
              )}
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                {vehicle.make}
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{vehicle.model}</span>
              {vehicle.yearRange && (
                <span className="text-sm font-normal text-slate-400 font-mono">
                  ({vehicle.yearRange})
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Readout Button */}
            <button
              onClick={handleSpeak}
              className={`p-2 rounded-xl border transition ${
                isPlayingAudio
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
              }`}
              title={isPlayingAudio ? 'Stop audio' : 'Listen to vehicle analysis'}
            >
              {isPlayingAudio ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Confidence Badge */}
            <div
              className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 ${confidenceColor}`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{vehicle.confidence}% Match</span>
            </div>
          </div>
        </div>

        {/* Executive summary quote */}
        {vehicle.summary && (
          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            "{vehicle.summary}"
          </p>
        )}
      </div>

      {/* Main Grid: Core Vehicle Properties */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Exterior Color */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" /> Exterior Color
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full border-2 border-white/30 shadow-md shrink-0"
                style={{ backgroundColor: vehicle.colorHex || '#333' }}
              />
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">
                  {vehicle.colorName}
                </div>
                {vehicle.colorHex && (
                  <div className="text-[10px] font-mono text-slate-400">
                    {vehicle.colorHex}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Category */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" /> Category
            </span>
            <div>
              <div className="text-xs font-bold text-cyan-300 truncate">
                {vehicle.category}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {vehicle.bodyStyle || 'Automotive Class'}
              </div>
            </div>
          </div>

          {/* Year / Era */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Model Year
            </span>
            <div>
              <div className="text-xs font-bold text-amber-300 truncate font-mono">
                {vehicle.yearRange || 'N/A'}
              </div>
              <div className="text-[10px] text-slate-400">Production Era</div>
            </div>
          </div>

          {/* Powertrain / Fuel */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Powertrain
            </span>
            <div>
              <div className="text-xs font-bold text-emerald-300 truncate">
                {vehicle.fuelType || 'Combustion / Hybrid'}
              </div>
              <div className="text-[10px] text-slate-400">Propulsion</div>
            </div>
          </div>
        </div>

        {/* Movement & Dynamic State Status */}
        {vehicle.movementStatus && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg border ${
                  vehicle.movementStatus.toLowerCase().includes('motion') ||
                  vehicle.movementStatus.toLowerCase().includes('driving') ||
                  vehicle.movementStatus.toLowerCase().includes('speed')
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                }`}
              >
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
                  Movement & Dynamic Status
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {vehicle.movementStatus}
                  {vehicle.estimatedSpeedState && (
                    <span className="text-[11px] font-mono text-cyan-400 font-normal">
                      • {vehicle.estimatedSpeedState}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Visual Motion Cues pills */}
            {vehicle.motionVisualCues && vehicle.motionVisualCues.length > 0 && (
              <div className="flex flex-wrap gap-1 self-start sm:self-auto">
                {vehicle.motionVisualCues.map((cue, cIdx) => (
                  <span
                    key={cIdx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300"
                  >
                    {cue}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Location in image if provided */}
        {vehicle.locationInImage && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/60">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Position in frame: <strong className="text-slate-200">{vehicle.locationInImage}</strong></span>
          </div>
        )}

        {/* Distinctive Features */}
        {vehicle.distinctiveFeatures && vehicle.distinctiveFeatures.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Key Design & Styling Signatures</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {vehicle.distinctiveFeatures.map((feat, fIdx) => (
                <span
                  key={fIdx}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
