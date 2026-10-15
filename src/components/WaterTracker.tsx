import React from 'react';
import { Droplets, Plus, Minus, RotateCcw } from 'lucide-react';

interface WaterTrackerProps {
  waterIntakeMl: number;
  waterGoalMl: number;
  onUpdateWater: (newAmount: number) => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  waterIntakeMl,
  waterGoalMl,
  onUpdateWater,
}) => {
  const pct = Math.min(100, Math.round((waterIntakeMl / waterGoalMl) * 100));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5 sm:space-y-4 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">Daily Hydration Log</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Metabolic &amp; kidney filtration</p>
          </div>
        </div>

        <div className="text-right font-mono shrink-0">
          <span className="text-xs sm:text-sm font-bold text-blue-400 tabular-nums">
            {waterIntakeMl} <span className="text-slate-400 text-[10px] sm:text-xs font-normal">/ {waterGoalMl} ml</span>
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block">{pct}% of goal</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 sm:h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Quick Add Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => onUpdateWater(waterIntakeMl + 250)}
            className="py-1.5 px-2.5 sm:px-3 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-300 border border-blue-500/30 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" /> 250 ml (Glass)
          </button>
          <button
            onClick={() => onUpdateWater(waterIntakeMl + 500)}
            className="py-1.5 px-2.5 sm:px-3 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-300 border border-blue-500/30 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" /> 500 ml (Bottle)
          </button>
          <button
            onClick={() => onUpdateWater(Math.max(0, waterIntakeMl - 250))}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Subtract 250ml"
            aria-label="Subtract 250ml"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onUpdateWater(0)}
          className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1 cursor-pointer py-1"
          title="Reset to 0ml"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>
    </div>
  );
};
