import React from 'react';
import { MacroTotals, UserProfile } from '../types/nutrition';
import confetti from 'canvas-confetti';
import { Flame, Sparkles } from 'lucide-react';

interface MacroRingsProps {
  totals: MacroTotals;
  profile: UserProfile;
}

export const MacroRings: React.FC<MacroRingsProps> = ({ totals, profile }) => {
  const caloriesRemaining = Math.max(0, profile.targetCalories - totals.calories);
  const caloriesPct = Math.min(100, Math.round((totals.calories / profile.targetCalories) * 100));

  const proteinPct = Math.min(100, Math.round((totals.protein / profile.targetProtein) * 100));
  const carbsPct = Math.min(100, Math.round((totals.carbs / profile.targetCarbs) * 100));
  const fatPct = Math.min(100, Math.round((totals.fat / profile.targetFat) * 100));
  const fiberPct = Math.min(100, Math.round((totals.fiber / profile.targetFiber) * 100));

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6 w-full">
      {/* Top Banner: Calories Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
        {/* Left Circle / Radial Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 w-full">
          <div className="relative w-38 h-38 sm:w-44 sm:h-44 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-slate-800/80"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className={`transition-all duration-1000 ease-out ${
                  totals.calories > profile.targetCalories
                    ? 'stroke-rose-500'
                    : 'stroke-emerald-400'
                }`}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={
                  2 * Math.PI * 50 * (1 - Math.min(1, totals.calories / profile.targetCalories))
                }
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Centered Calories Data */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-100 tabular-nums">
                {totals.calories}
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 font-medium">
                of {profile.targetCalories} kcal
              </span>
              <span
                className={`text-[11px] font-mono mt-0.5 ${
                  totals.calories > profile.targetCalories ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {caloriesPct}% of target
              </span>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-mono w-full">
            <div className="text-center min-w-[70px]">
              <span className="text-slate-400 block text-[10px] sm:text-[11px]">Remaining</span>
              <span className="text-slate-200 font-bold tabular-nums">
                {caloriesRemaining} kcal
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="text-center min-w-[70px]">
              <span className="text-slate-400 block text-[10px] sm:text-[11px]">Goal Mode</span>
              <span className="text-emerald-400 capitalize font-medium text-xs">
                {profile.goal.replace('_', ' ')}
              </span>
            </div>
            {profile.bodyFatPct && (
              <>
                <div className="h-4 w-px bg-slate-800 hidden sm:block" />
                <div className="text-center min-w-[70px]">
                  <span className="text-slate-400 block text-[10px] sm:text-[11px]">Body Fat</span>
                  <span className="text-cyan-400 font-bold tabular-nums">
                    {profile.bodyFatPct}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right 4-Macro Bars Grid */}
        <div className="lg:col-span-8 space-y-4 w-full">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span>Daily Macronutrient Targets</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tracked in real time from logged meals and food scans
              </p>
            </div>
            {proteinPct >= 100 && (
              <button
                onClick={triggerCelebration}
                className="px-2.5 sm:px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Protein Goal Met!</span>
                <span className="sm:hidden">Goal Met!</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Protein */}
            <div className="p-3.5 sm:p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400">Protein</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  <strong className="text-slate-100 font-bold">{totals.protein}</strong> / {profile.targetProtein}g
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-700"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{Math.round(totals.protein * 4)} kcal</span>
                <span>
                  {totals.protein >= profile.targetProtein
                    ? 'Target Reached'
                    : `${Math.round(profile.targetProtein - totals.protein)}g left`}
                </span>
              </div>
            </div>

            {/* Carbohydrates */}
            <div className="p-3.5 sm:p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400">Carbohydrates</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  <strong className="text-slate-100 font-bold">{totals.carbs}</strong> / {profile.targetCarbs}g
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{Math.round(totals.carbs * 4)} kcal</span>
                <span>
                  {totals.carbs >= profile.targetCarbs
                    ? 'Target Reached'
                    : `${Math.round(profile.targetCarbs - totals.carbs)}g left`}
                </span>
              </div>
            </div>

            {/* Fats */}
            <div className="p-3.5 sm:p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-400">Total Fats</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  <strong className="text-slate-100 font-bold">{totals.fat}</strong> / {profile.targetFat}g
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-700"
                  style={{ width: `${fatPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{Math.round(totals.fat * 9)} kcal</span>
                <span>
                  {totals.fat >= profile.targetFat
                    ? 'Target Reached'
                    : `${Math.round(profile.targetFat - totals.fat)}g left`}
                </span>
              </div>
            </div>

            {/* Fiber */}
            <div className="p-3.5 sm:p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">Dietary Fiber</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  <strong className="text-slate-100 font-bold">{totals.fiber}</strong> / {profile.targetFiber}g
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${fiberPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Digestion &amp; Health</span>
                <span>
                  {totals.fiber >= profile.targetFiber
                    ? 'Target Reached'
                    : `${Math.round(profile.targetFiber - totals.fiber)}g left`}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary stats strip: Sugar, Sodium, Protein Energy - perfectly responsive grid */}
          <div className="grid grid-cols-3 gap-2 px-3 py-2.5 bg-slate-950/40 rounded-xl border border-slate-800/60 text-[11px] sm:text-xs font-mono text-slate-400 text-center">
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-500">Sugars</span>
              <strong className="text-slate-200">{totals.sugar}g</strong>
            </div>
            <div className="border-x border-slate-800/80">
              <span className="block text-[10px] sm:text-xs text-slate-500">Sodium</span>
              <strong className="text-slate-200">{totals.sodiumMg}mg</strong>
            </div>
            <div>
              <span className="block text-[10px] sm:text-xs text-slate-500">Protein Energy</span>
              <strong className="text-cyan-400">
                {totals.calories > 0 ? Math.round(((totals.protein * 4) / totals.calories) * 100) : 0}%
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
