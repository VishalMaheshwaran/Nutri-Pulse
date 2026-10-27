import React from 'react';
import { MacroTotals, UserProfile } from '../types/nutrition';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Sparkles, 
  Utensils, 
  Dumbbell, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

interface MacroRingsProps {
  totals: MacroTotals;
  profile: UserProfile;
  caloriesBurned?: number; // Added to track workout burn
}

export const MacroRings: React.FC<MacroRingsProps> = ({ 
  totals, 
  profile, 
  caloriesBurned = 0 
}) => {
  // Net Calories Math
  const netCalories = Math.max(0, totals.calories - caloriesBurned);
  const caloriesRemaining = profile.targetCalories - totals.calories + caloriesBurned;
  const isOverTarget = caloriesRemaining < 0;

  // Percentages
  const caloriesPct = profile.targetCalories > 0 
    ? Math.min(100, Math.max(0, Math.round((netCalories / profile.targetCalories) * 100))) 
    : 0;
  
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

  // Dynamic Progress Status
  const getProgressStatus = () => {
    if (totals.calories === 0 && caloriesBurned === 0) {
      return {
        text: 'Ready for today — log your first meal!',
        color: 'text-slate-300 bg-slate-800/80 border-slate-700',
        icon: Sparkles,
      };
    }
    if (totals.calories === 0 && caloriesBurned > 0) {
      return {
        text: `Burned ${caloriesBurned} kcal — time to refuel.`,
        color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
        icon: Dumbbell,
      };
    }
    if (caloriesRemaining < -150) {
      return {
        text: `${Math.abs(caloriesRemaining)} kcal over — a quick workout helps!`,
        color: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
        icon: AlertCircle,
      };
    }
    if (caloriesRemaining >= -150 && caloriesRemaining <= 150) {
      return {
        text: 'Spot on! You are in your calorie sweet spot.',
        color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40',
        icon: CheckCircle2,
      };
    }
    if (caloriesPct >= 75) {
      return {
        text: `Strong finish! ${caloriesRemaining} kcal left today.`,
        color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
        icon: TrendingUp,
      };
    }
    if (caloriesPct >= 40) {
      return {
        text: `Great momentum! ${caloriesPct}% of net goal met.`,
        color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
        icon: Flame,
      };
    }
    return {
      text: `Plenty of fuel — ${caloriesRemaining} kcal remaining.`,
      color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
      icon: Sparkles,
    };
  };

  const status = getProgressStatus();
  const StatusIcon = status.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
        
        {/* Left Column: Net Calories & Progress */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 w-full space-y-4">
          
          {/* Dynamic Status Pill */}
          <div className={`w-full px-3 py-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 text-center transition-all ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{status.text}</span>
          </div>

          <div className="relative w-38 h-38 sm:w-44 sm:h-44 flex items-center justify-center">
            {/* SVG Progress Ring (Driven by Net Calories) */}
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
                  isOverTarget ? 'stroke-rose-500' : 'stroke-emerald-400'
                }`}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - caloriesPct / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Centered Net Calories Data */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                {isOverTarget ? 'Over Target' : 'Remaining'}
              </span>
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums ${isOverTarget ? 'text-rose-400' : 'text-slate-100'}`}>
                {Math.abs(caloriesRemaining)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1">
                Target: {profile.targetCalories}
              </span>
            </div>
          </div>

          {/* Eaten / Burned / Net Breakdown */}
          <div className="w-full grid grid-cols-3 gap-2 pt-1">
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
                <Utensils className="w-3 h-3" />
              </div>
              <div className="text-sm font-bold font-mono text-slate-200">{totals.calories}</div>
              <span className="text-[9px] text-slate-500 uppercase">Eaten</span>
            </div>
            <div className="bg-slate-900 border border-orange-500/20 rounded-xl p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-orange-400 mb-0.5">
                <Dumbbell className="w-3 h-3" />
              </div>
              <div className="text-sm font-bold font-mono text-orange-400">-{caloriesBurned}</div>
              <span className="text-[9px] text-slate-500 uppercase">Burned</span>
            </div>
            <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-cyan-400 mb-0.5">
                <Flame className="w-3 h-3" />
              </div>
              <div className="text-sm font-bold font-mono text-cyan-400">{netCalories}</div>
              <span className="text-[9px] text-slate-500 uppercase">Net</span>
            </div>
          </div>
        </div>

        {/* Right 4-Macro Bars Grid */}
        <div className="lg:col-span-7 space-y-4 w-full">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span>Daily Macronutrient Targets</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tracked in real time from logged meals
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

          {/* Secondary stats strip: Sugar, Sodium, Protein Energy */}
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