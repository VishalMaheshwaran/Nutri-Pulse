import React, { useState } from 'react';
import { DailyLog, MacroTotals, UserProfile, FoodItem } from '../types/nutrition';
import { calculateTotals } from '../services/storage';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Zap,
  Target,
  Trophy,
  PieChart,
  ChevronRight,
  Info,
} from 'lucide-react';

interface StatisticsTabProps {
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  currentDate: string;
  onSelectDate: (date: string) => void;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  logs,
  profile,
  currentDate,
  onSelectDate,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  // Build sorted list of dates
  const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;

  // Generate date array for the selected range ending at today
  const rangeDates: string[] = [];
  const today = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    rangeDates.push(`${y}-${m}-${day}`);
  }

  // Calculate day-by-day metrics
  const dailyMetrics = rangeDates.map((dateStr) => {
    const log = logs[dateStr];
    const items = log?.items || [];
    const totals = calculateTotals(items);
    const hasLogged = items.length > 0;

    const hitProtein = hasLogged && totals.protein >= profile.targetProtein;
    // Calorie adherence: consumed is within target + 100 kcal, and at least 70% of target
    const hitCalories =
      hasLogged &&
      totals.calories <= profile.targetCalories + 100 &&
      totals.calories >= profile.targetCalories * 0.7;

    const isPerfect = hitProtein && hitCalories;

    return {
      date: dateStr,
      hasLogged,
      totals,
      hitProtein,
      hitCalories,
      isPerfect,
      water: log?.waterIntakeMl || 0,
      itemCount: items.length,
    };
  });

  // Calculate aggregate stats
  const loggedDays = dailyMetrics.filter((d) => d.hasLogged);
  const totalTrackedDays = loggedDays.length;

  const proteinHitDays = dailyMetrics.filter((d) => d.hitProtein).length;
  const proteinSuccessRate =
    totalTrackedDays > 0 ? Math.round((proteinHitDays / totalTrackedDays) * 100) : 0;

  const calorieHitDays = dailyMetrics.filter((d) => d.hitCalories).length;
  const calorieSuccessRate =
    totalTrackedDays > 0 ? Math.round((calorieHitDays / totalTrackedDays) * 100) : 0;

  const perfectDaysCount = dailyMetrics.filter((d) => d.isPerfect).length;

  // Calculate current protein streak
  let currentProteinStreak = 0;
  for (let i = rangeDates.length - 1; i >= 0; i--) {
    const m = dailyMetrics[i];
    if (m.hitProtein) {
      currentProteinStreak++;
    } else if (m.hasLogged) {
      break;
    }
  }

  // Average macros over the selected range
  const avgCalories =
    totalTrackedDays > 0
      ? Math.round(loggedDays.reduce((acc, d) => acc + d.totals.calories, 0) / totalTrackedDays)
      : 0;
  const avgProtein =
    totalTrackedDays > 0
      ? Math.round(
          (loggedDays.reduce((acc, d) => acc + d.totals.protein, 0) / totalTrackedDays) * 10
        ) / 10
      : 0;
  const avgCarbs =
    totalTrackedDays > 0
      ? Math.round(
          (loggedDays.reduce((acc, d) => acc + d.totals.carbs, 0) / totalTrackedDays) * 10
        ) / 10
      : 0;
  const avgFat =
    totalTrackedDays > 0
      ? Math.round((loggedDays.reduce((acc, d) => acc + d.totals.fat, 0) / totalTrackedDays) * 10) /
        10
      : 0;

  // Top Protein Sources aggregation across all logs
  const proteinSourcesMap: Record<string, { name: string; totalGrams: number; occurrences: number }> =
    {};
  Object.values(logs).forEach((log) => {
    log.items.forEach((item) => {
      const p = item.protein * (item.servings || 1);
      if (p > 5) {
        const key = item.name.toLowerCase().trim();
        if (!proteinSourcesMap[key]) {
          proteinSourcesMap[key] = { name: item.name, totalGrams: 0, occurrences: 0 };
        }
        proteinSourcesMap[key].totalGrams += p;
        proteinSourcesMap[key].occurrences += 1;
      }
    });
  });

  const topProteinFoods = Object.values(proteinSourcesMap)
    .sort((a, b) => b.totalGrams - a.totalGrams)
    .slice(0, 4);

  // Calculate energy percentage split from averages
  const totalMacroCals = avgProtein * 4 + avgCarbs * 4 + avgFat * 9;
  const proteinEnergyPct =
    totalMacroCals > 0 ? Math.round(((avgProtein * 4) / totalMacroCals) * 100) : 0;
  const carbsEnergyPct =
    totalMacroCals > 0 ? Math.round(((avgCarbs * 4) / totalMacroCals) * 100) : 0;
  const fatEnergyPct =
    totalMacroCals > 0 ? Math.round(((avgFat * 9) / totalMacroCals) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {/* Analytics Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Macro &amp; Calorie Analytics Hub
            </h2>
            <p className="text-xs text-slate-400">
              Protein adherence, caloric targets, and habit streaks
            </p>
          </div>
        </div>

        {/* Range Segmented Buttons: full width on mobile */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          {(['7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`py-1.5 px-2.5 sm:px-3 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                timeRange === r
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Hero Achievement KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Protein Target Achieved */}
        <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-cyan-400 text-[11px] sm:text-xs">
              Protein Goal
            </span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
              {proteinHitDays}
              <span className="text-xs sm:text-sm font-normal text-slate-400"> / {daysCount} days</span>
            </span>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Success Rate:</span>
              <strong className="text-cyan-400 font-mono">{proteinSuccessRate}%</strong>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${proteinSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Caloric Budget Adherence */}
        <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-emerald-400 text-[11px] sm:text-xs">
              Calorie Budget
            </span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
              {calorieHitDays}
              <span className="text-xs sm:text-sm font-normal text-slate-400"> / {daysCount} days</span>
            </span>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>On Target:</span>
              <strong className="text-emerald-400 font-mono">{calorieSuccessRate}%</strong>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${calorieSuccessRate}%` }}
            />
          </div>
        </div>

        {/* Dual Perfect Days */}
        <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-amber-400 text-[11px] sm:text-xs">
              Perfect Days
            </span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
              {perfectDaysCount}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-sans">Gold Badges</span>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Both Goals:</span>
              <strong className="text-amber-400 font-mono">
                {totalTrackedDays > 0 ? Math.round((perfectDaysCount / totalTrackedDays) * 100) : 0}%
              </strong>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{
                width: `${
                  totalTrackedDays > 0 ? (perfectDaysCount / totalTrackedDays) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Active Protein Streak */}
        <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-indigo-400 text-[11px] sm:text-xs">
              Active Streak
            </span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tabular-nums">
              {currentProteinStreak}
              <span className="text-xs sm:text-sm font-normal text-slate-400"> days</span>
            </span>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Momentum:</span>
              <strong className="text-indigo-400 font-medium truncate max-w-[120px]">
                {currentProteinStreak >= 3 ? 'On Fire' : 'Building'}
              </strong>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (currentProteinStreak / 7) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual Habit Heatmap (Interactive Nutrition Matrix) */}
      <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Daily Habit Heatmap &amp; Compliance Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Tap any date to inspect and jump directly to that day&apos;s meal log
            </p>
          </div>

          {/* Fully wrapping legend - prevents horizontal overflow */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-emerald-400 shadow-sm shrink-0" />
              <span>Perfect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-cyan-400 shadow-sm shrink-0" />
              <span>Protein Hit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-amber-400 shadow-sm shrink-0" />
              <span>Calories Only</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700 shrink-0" />
              <span>Logged</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5 pt-1">
          {dailyMetrics.map((day) => {
            const isSelected = day.date === currentDate;
            const formattedDay = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'numeric',
              day: 'numeric',
            });

            return (
              <button
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-emerald-400 bg-slate-800/90 shadow-md ring-1 ring-emerald-400/50'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Status Bar Pip */}
                <div
                  className={`w-full h-1.5 rounded-full mb-2 ${
                    day.isPerfect
                      ? 'bg-emerald-400'
                      : day.hitProtein
                      ? 'bg-cyan-400'
                      : day.hitCalories
                      ? 'bg-amber-400'
                      : day.hasLogged
                      ? 'bg-slate-700'
                      : 'bg-slate-850'
                  }`}
                />

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono">
                  <span className="truncate">{formattedDay}</span>
                  {day.isPerfect && <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                </div>

                <div className="mt-1.5 space-y-0.5 font-mono">
                  <div className="text-xs font-bold text-slate-100 tabular-nums">
                    {day.totals.calories}{' '}
                    <span className="text-[10px] text-slate-500 font-normal">kcal</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-cyan-400 tabular-nums truncate">
                    P: {Math.round(day.totals.protein)}g{' '}
                    <span className="text-[9px] sm:text-[10px] text-slate-500">
                      ({Math.round((day.totals.protein / profile.targetProtein) * 100)}%)
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Daily Protein & Calorie Comparison Bars + Macro Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 w-full">
        {/* Left: Day-by-Day Protein Intake Bar Chart */}
        <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Protein Intake Trend ({profile.targetProtein}g Target)</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Daily protein grams consumed across timeframe
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 shrink-0">
              Avg: <strong>{avgProtein}g</strong>
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-3 pt-2">
            {dailyMetrics.map((day) => {
              const pct = Math.min(140, Math.round((day.totals.protein / profile.targetProtein) * 100));
              const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'numeric',
                day: 'numeric',
              });

              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-400">
                    <span className="w-16 sm:w-24 shrink-0 text-slate-300">{dayLabel}</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-slate-100 font-bold tabular-nums">
                        {Math.round(day.totals.protein)}g
                      </span>
                      <span
                        className={`text-[10px] sm:text-[11px] ${
                          day.hitProtein ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        ({pct}%)
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 sm:h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 relative">
                    {/* Target 100% line indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10"
                      style={{ left: `${Math.min(100, (100 / 140) * 100)}%` }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        day.hitProtein
                          ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                          : 'bg-cyan-500/60'
                      }`}
                      style={{ width: `${Math.min(100, (pct / 140) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Macro Energy Distribution & Top Protein Foods */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6">
          {/* Energy Distribution Card */}
          <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                Average Macro Energy Split
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {avgCalories} kcal/d
              </span>
            </div>

            {/* Split Progress Bar */}
            <div className="h-3.5 sm:h-4 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${proteinEnergyPct}%` }}
                className="bg-cyan-400 transition-all duration-500"
                title={`Protein: ${proteinEnergyPct}%`}
              />
              <div
                style={{ width: `${carbsEnergyPct}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Carbohydrates: ${carbsEnergyPct}%`}
              />
              <div
                style={{ width: `${fatEnergyPct}%` }}
                className="bg-rose-400 transition-all duration-500"
                title={`Fat: ${fatEnergyPct}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 sm:p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold block">{proteinEnergyPct}%</span>
                <span className="text-[10px] text-slate-400">Protein</span>
                <span className="text-[10px] text-slate-500 block">{avgProtein}g</span>
              </div>
              <div className="p-2 sm:p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-amber-400 font-bold block">{carbsEnergyPct}%</span>
                <span className="text-[10px] text-slate-400">Carbs</span>
                <span className="text-[10px] text-slate-500 block">{avgCarbs}g</span>
              </div>
              <div className="p-2 sm:p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-rose-400 font-bold block">{fatEnergyPct}%</span>
                <span className="text-[10px] text-slate-400">Fat</span>
                <span className="text-[10px] text-slate-500 block">{avgFat}g</span>
              </div>
            </div>
          </div>

          {/* Top Protein Sources Card */}
          <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Top Muscle-Building Fuel Sources
            </h3>
            <p className="text-xs text-slate-400">
              Foods contributing the highest cumulative protein to your diet
            </p>

            <div className="space-y-2 pt-1">
              {topProteinFoods.length === 0 ? (
                <p className="text-xs text-slate-500">Log meals to uncover your top protein drivers.</p>
              ) : (
                topProteinFoods.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="text-slate-200 truncate min-w-0">
                      <span className="font-semibold truncate block sm:inline">{f.name}</span>
                      <span className="text-slate-500 sm:ml-2 font-mono text-[10px] sm:text-[11px] block sm:inline">
                        ({f.occurrences}x logged)
                      </span>
                    </div>
                    <span className="font-mono text-cyan-400 font-bold shrink-0">
                      +{Math.round(f.totalGrams)}g P
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
