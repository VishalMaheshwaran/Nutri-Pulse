// src/components/StatisticsTab.tsx
import React, { useState } from 'react';
import { Target, Flame, Trophy, Zap, Calendar, Activity, PieChart, Award, TrendingUp, Sparkles, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { DailyLog, UserProfile } from '../types/nutrition';
import { calculateTotals } from '../services/storage';
import { WeeklyReportCard } from './WeeklyReportCard';
import { MonthlyReportCard } from './MonthlyReportCard';
import { useTheme } from '../hooks/useTheme';

interface StatisticsTabProps {
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  currentDate: string;
  onSelectDate: (date: string) => void;
  onOpenDailyReport?: () => void;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  logs,
  profile,
  currentDate,
  onSelectDate,
  onOpenDailyReport,
}) => {
  const { t } = useTheme(); 
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');
  
  const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(false);
  const [isProteinExpanded, setIsProteinExpanded] = useState(false);
  
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  
  const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;

  const datesList: string[] = [];
  const today = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    datesList.push(`${y}-${m}-${day}`);
  }

  const dailyMetrics = datesList.map((dateStr) => {
    const dayLog = logs[dateStr] || {
      date: dateStr,
      items: [],
      waterIntakeMl: 0,
      workouts: [],
    };
    
    const totals = calculateTotals(dayLog.items);
    const hasLogged = dayLog.items.length > 0;
    const workouts = dayLog.workouts || [];
    const hasWorkouts = workouts.length > 0;

    const dayTargetCals = dayLog.targetCalories ?? profile.targetCalories ?? 2000;
    const dayTargetProtein = dayLog.targetProtein ?? profile.targetProtein ?? 120;
    
    const burned = workouts.reduce((s, w) => s + w.caloriesBurned, 0);
    const effectiveBudget = dayTargetCals + burned;

    let hitCalories = false;
    let hitProtein = false;

    if (hasLogged) {
      hitProtein = totals.protein >= dayTargetProtein * 0.95;

      if (profile.goal === 'lose_weight') {
        hitCalories = totals.calories > 0 && totals.calories <= effectiveBudget + 25;
      } else if (profile.goal === 'gain_muscle') {
        hitCalories = totals.calories >= effectiveBudget * 0.95 && totals.calories <= effectiveBudget + 200;
      } else {
        hitCalories = Math.abs(totals.calories - effectiveBudget) <= 150;
      }
    }

    const isPerfect = hasLogged && hitProtein && hitCalories;

    return {
      date: dateStr,
      totals,
      hasLogged,
      hasWorkouts,
      hitProtein,
      hitCalories,
      isPerfect,
      targetProtein: dayTargetProtein,
      burnedCalories: burned,
    };
  });

  const totalTrackedDays = dailyMetrics.filter((d) => d.hasLogged).length;
  const proteinHitDays = dailyMetrics.filter((d) => d.hitProtein).length;
  const calorieHitDays = dailyMetrics.filter((d) => d.hitCalories).length;
  const perfectDaysCount = dailyMetrics.filter((d) => d.isPerfect).length;

  const proteinSuccessRate =
    totalTrackedDays > 0 ? Math.round((proteinHitDays / totalTrackedDays) * 100) : 0;
  const calorieSuccessRate =
    totalTrackedDays > 0 ? Math.round((calorieHitDays / totalTrackedDays) * 100) : 0;

  let currentProteinStreak = 0;
  for (let i = dailyMetrics.length - 1; i >= 0; i--) {
    if (dailyMetrics[i].hitProtein) {
      currentProteinStreak++;
    } else if (i === dailyMetrics.length - 1) {
      continue;
    } else {
      break;
    }
  }

  const activeDays = dailyMetrics.filter((d) => d.hasLogged);
  const avgCalories =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, d) => sum + d.totals.calories, 0) / activeDays.length)
      : 0;
  const avgProtein =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, d) => sum + d.totals.protein, 0) / activeDays.length)
      : 0;
  const avgCarbs =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, d) => sum + d.totals.carbs, 0) / activeDays.length)
      : 0;
  const avgFat =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, d) => sum + d.totals.fat, 0) / activeDays.length)
      : 0;

  const proteinCals = avgProtein * 4;
  const carbsCals = avgCarbs * 4;
  const fatCals = avgFat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals || 1;

  const proteinEnergyPct = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsEnergyPct = Math.round((carbsCals / totalMacroCals) * 100);
  const fatEnergyPct = 100 - proteinEnergyPct - carbsEnergyPct;

  const foodProteinMap: Record<string, { totalGrams: number; occurrences: number }> = {};
  activeDays.forEach((d) => {
    const dayLog = logs[d.date];
    if (dayLog && dayLog.items) {
      dayLog.items.forEach((item) => {
        const pGrams = item.protein * item.servings;
        if (pGrams > 3) {
          if (!foodProteinMap[item.name]) {
            foodProteinMap[item.name] = { totalGrams: 0, occurrences: 0 };
          }
          foodProteinMap[item.name].totalGrams += pGrams;
          foodProteinMap[item.name].occurrences += 1;
        }
      });
    }
  });

  const topProteinFoods = Object.entries(foodProteinMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalGrams - a.totalGrams)
    .slice(0, 5);

  const visibleHeatmapMetrics = isHeatmapExpanded ? dailyMetrics : dailyMetrics.slice(-7);
  const visibleProteinMetrics = isProteinExpanded ? dailyMetrics : dailyMetrics.slice(-7);

  const canExpand = timeRange !== '7d';

  return (
    <div className="space-y-5 sm:space-y-8 w-full transition-colors duration-300">
      
      {/* 3-COLUMN REPORT GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">
        
        {onOpenDailyReport && (
          <div className={`p-4 sm:p-5 ${t.cardBg} border ${t.cardBorder} rounded-2xl sm:rounded-3xl ${t.shadow} flex flex-col justify-between gap-4 transition-colors h-full w-full relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 ${t.bgEmerald} opacity-5 rounded-full blur-2xl pointer-events-none`} />
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-3.5 z-10 text-center sm:text-left">
              <div className={`w-10 h-10 rounded-xl ${t.innerBg} border ${t.innerBorder} flex items-center justify-center ${t.accentEmerald} shrink-0`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className={`text-xs sm:text-sm font-bold ${t.textPrimary} truncate`}>Daily AI Report</h2>
                <p className={`text-[10px] sm:text-xs ${t.textSecondary} mt-0.5 line-clamp-1`}>Yesterday&apos;s insight</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenDailyReport}
              className={`w-full py-2.5 px-3 ${t.activeBtnBg} ${t.activeBtnText} hover:opacity-90 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0 z-10 mt-auto`}
            >
              <span className="truncate">Open Report</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        )}

        <div className={`p-4 sm:p-5 ${t.cardBg} border ${t.cardBorder} rounded-2xl sm:rounded-3xl ${t.shadow} flex flex-col justify-between gap-4 transition-colors h-full w-full relative overflow-hidden group`}>
          <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 ${t.bgEmerald} opacity-5 rounded-full blur-2xl pointer-events-none`} />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-3.5 z-10 text-center sm:text-left">
            <div className={`w-10 h-10 rounded-xl ${t.innerBg} border ${t.innerBorder} flex items-center justify-center ${t.accentEmerald} shrink-0`}>
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-xs sm:text-sm font-bold ${t.textPrimary} truncate`}>Weekly AI Report</h2>
              <p className={`text-[10px] sm:text-xs ${t.textSecondary} mt-0.5 line-clamp-1`}>Mon – Sun trends</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWeeklyModalOpen(true)}
            className={`w-full py-2.5 px-3 ${t.activeBtnBg} ${t.activeBtnText} hover:opacity-90 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0 z-10 mt-auto`}
          >
            <span className="truncate">Open Weekly</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        <div className={`col-span-2 sm:col-span-1 p-4 sm:p-5 ${t.cardBg} border ${t.cardBorder} rounded-2xl sm:rounded-3xl ${t.shadow} flex flex-col justify-between gap-4 transition-colors h-full w-full relative overflow-hidden group`}>
          <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 ${t.bgEmerald} opacity-5 rounded-full blur-2xl pointer-events-none`} />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-3.5 z-10 text-center sm:text-left">
            <div className={`w-10 h-10 rounded-xl ${t.innerBg} border ${t.innerBorder} flex items-center justify-center ${t.accentEmerald} shrink-0`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-xs sm:text-sm font-bold ${t.textPrimary} truncate`}>Monthly Audit</h2>
              <p className={`text-[10px] sm:text-xs ${t.textSecondary} mt-0.5 line-clamp-1`}>Full month review</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMonthlyModalOpen(true)}
            className={`w-full py-2.5 px-3 ${t.activeBtnBg} ${t.activeBtnText} hover:opacity-90 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0 z-10 mt-auto`}
          >
            <span className="truncate">Open Monthly</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

      </div>

      {/* Render Report Modals with currentDate passed down */}
      <WeeklyReportCard 
        logs={logs} 
        profile={profile} 
        currentDate={currentDate}
        isOpen={isWeeklyModalOpen} 
        onClose={() => setIsWeeklyModalOpen(false)} 
      />
      <MonthlyReportCard 
        logs={logs} 
        profile={profile} 
        currentDate={currentDate}
        isOpen={isMonthlyModalOpen} 
        onClose={() => setIsMonthlyModalOpen(false)} 
      />

      {/* Analytics Header Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 ${t.cardBg} border ${t.cardBorder} rounded-2xl ${t.shadow} w-full transition-colors`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${t.innerBg} border ${t.innerBorder} flex items-center justify-center ${t.accentCyan} shrink-0 transition-colors`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${t.textPrimary} flex items-center gap-2 transition-colors`}>
              Macro &amp; Calorie Analytics Hub
            </h2>
            <p className={`text-xs ${t.textSecondary} transition-colors`}>
              Protein adherence, caloric targets, and habit streaks
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-3 sm:flex items-center gap-1 ${t.innerBg} p-1 rounded-xl border ${t.innerBorder} w-full sm:w-auto transition-colors`}>
          {(['7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setTimeRange(r);
                setIsHeatmapExpanded(false);
                setIsProteinExpanded(false);
              }}
              className={`py-1.5 px-2.5 sm:px-3 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                timeRange === r
                  ? `${t.activeBtnBg} ${t.activeBtnText} shadow-sm`
                  : t.inactiveBtnText
              }`}
            >
              {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <div className={`p-4 sm:p-5 ${t.cardBg} border ${t.cardBorder} rounded-2xl space-y-2.5 sm:space-y-3 ${t.shadow} transition-colors`}>
          <div className={`flex items-center justify-between text-xs ${t.textSecondary}`}>
            <span className={`font-semibold uppercase tracking-wider ${t.accentCyan} text-[11px] sm:text-xs`}>
              Protein Goal
            </span>
            <Target className={`w-4 h-4 ${t.accentCyan}`} />
          </div>
          <div>
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${t.textPrimary} tabular-nums transition-colors`}>
              {proteinHitDays}
              <span className={`text-xs sm:text-sm font-normal ${t.textSecondary}`}> / {daysCount} days</span>
            </span>
            <div className={`text-[11px] sm:text-xs ${t.textSecondary} mt-1 flex items-center justify-between`}>
              <span>Success Rate:</span>
              <strong className={`${t.accentCyan} font-mono`}>{proteinSuccessRate}%</strong>
            </div>
          </div>
          <div className={`h-2 w-full ${t.progressBg} rounded-full overflow-hidden border ${t.innerBorder} transition-colors`}>
            <div
              className={`h-full ${t.bgCyan} rounded-full transition-all duration-500`}
              style={{ width: `${proteinSuccessRate}%` }}
            />
          </div>
        </div>

        <div className={`p-4 sm:p-5 ${t.cardBg} border ${t.cardBorder} rounded-2xl space-y-2.5 sm:space-y-3 ${t.shadow} transition-colors`}>
          <div className={`flex items-center justify-between text-xs ${t.textSecondary}`}>
            <span className={`font-semibold uppercase tracking-wider ${t.accentEmerald} text-[11px] sm:text-xs`}>
              Calorie Budget
            </span>
            <Flame className={`w-4 h-4 ${t.accentEmerald}`} />
          </div>
          <div>
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${t.textPrimary} tabular-nums transition-colors`}>
              {calorieHitDays}
              <span className={`text-xs sm:text-sm font-normal ${t.textSecondary}`}> / {daysCount} days</span>
            </span>
            <div className={`text-[11px] sm:text-xs ${t.textSecondary} mt-1 flex items-center justify-between`}>
              <span>On Target:</span>
              <strong className={`${t.accentEmerald} font-mono`}>{calorieSuccessRate}%</strong>
            </div>
          </div>
          <div className={`h-2 w-full ${t.progressBg} rounded-full overflow-hidden border ${t.innerBorder} transition-colors`}>
            <div
              className={`h-full ${t.bgEmerald} rounded-full transition-all duration-500`}
              style={{ width: `${calorieSuccessRate}%` }}
            />
          </div>
        </div>

        <div className={`p-4 sm:p-5 ${t.cardBg} border ${t.cardBorder} rounded-2xl space-y-2.5 sm:space-y-3 ${t.shadow} transition-colors`}>
          <div className={`flex items-center justify-between text-xs ${t.textSecondary}`}>
            <span className={`font-semibold uppercase tracking-wider ${t.accentAmber} text-[11px] sm:text-xs`}>
              Perfect Days
            </span>
            <Trophy className={`w-4 h-4 ${t.accentAmber}`} />
          </div>
          <div>
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${t.textPrimary} tabular-nums transition-colors`}>
              {perfectDaysCount}
            </span>
            <span className={`text-xs ${t.textSecondary} ml-1.5 font-sans`}>Gold Badges</span>
            <div className={`text-[11px] sm:text-xs ${t.textSecondary} mt-1 flex items-center justify-between`}>
              <span>Both Goals:</span>
              <strong className={`${t.accentAmber} font-mono`}>
                {totalTrackedDays > 0 ? Math.round((perfectDaysCount / totalTrackedDays) * 100) : 0}%
              </strong>
            </div>
          </div>
          <div className={`h-2 w-full ${t.progressBg} rounded-full overflow-hidden border ${t.innerBorder} transition-colors`}>
            <div
              className={`h-full ${t.bgAmber} rounded-full transition-all duration-500`}
              style={{
                width: `${
                  totalTrackedDays > 0 ? (perfectDaysCount / totalTrackedDays) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className={`p-4 sm:p-5 ${t.cardBg} border ${t.cardBorder} rounded-2xl space-y-2.5 sm:space-y-3 ${t.shadow} transition-colors`}>
          <div className={`flex items-center justify-between text-xs ${t.textSecondary}`}>
            <span className={`font-semibold uppercase tracking-wider ${t.accentIndigo} text-[11px] sm:text-xs`}>
              Active Streak
            </span>
            <Zap className={`w-4 h-4 ${t.accentIndigo}`} />
          </div>
          <div>
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${t.textPrimary} tabular-nums transition-colors`}>
              {currentProteinStreak}
              <span className={`text-xs sm:text-sm font-normal ${t.textSecondary}`}> days</span>
            </span>
            <div className={`text-[11px] sm:text-xs ${t.textSecondary} mt-1 flex items-center justify-between`}>
              <span>Momentum:</span>
              <strong className={`${t.accentIndigo} font-medium truncate max-w-30`}>
                {currentProteinStreak >= 3 ? 'On Fire' : 'Building'}
              </strong>
            </div>
          </div>
          <div className={`h-2 w-full ${t.progressBg} rounded-full overflow-hidden border ${t.innerBorder} transition-colors`}>
            <div
              className={`h-full ${t.bgIndigo} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, (currentProteinStreak / 7) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Habit Heatmap - Clean borders */}
      <div className={`p-4 sm:p-6 ${t.cardBg} border ${t.cardBorder} rounded-2xl ${t.shadow} space-y-4 w-full relative transition-colors`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1 border-b ${t.innerBorder} mb-2 transition-colors`}>
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div>
              <h3 className={`text-sm sm:text-base font-bold ${t.textPrimary} flex items-center gap-2 transition-colors`}>
                <Calendar className={`w-4 h-4 ${t.accentEmerald}`} />
                Daily Habit Heatmap
              </h3>
              <p className={`text-xs ${t.textSecondary} transition-colors`}>
                Tap any date to inspect meal log
              </p>
            </div>
          </div>

          <div className={`flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono ${t.textSecondary} transition-colors`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded ${t.bgAmber} shadow-sm shrink-0`} />
              <span>Perfect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded ${t.bgCyan} shrink-0`} />
              <span>Protein</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded ${t.bgEmerald} shrink-0`} />
              <span>Calories</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded ${t.heatmapLogged} shrink-0`} />
              <span>Logged</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5">
          {visibleHeatmapMetrics.map((day) => {
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
                className={`p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? `border border-emerald-500/60 shadow-md ${t.innerBg}`
                    : `${t.innerBg} border border-slate-800/40 hover:border-slate-700/60`
                }`}
              >
                <div
                  className={`w-full h-1.5 rounded-full mb-2 ${
                    day.isPerfect
                      ? `${t.bgAmber} shadow-sm`
                      : day.hitProtein
                      ? t.bgCyan
                      : day.hitCalories
                      ? t.bgEmerald
                      : day.hasLogged
                      ? t.heatmapLogged
                      : t.heatmapEmpty
                  }`}
                />

                <div className={`flex items-center justify-between text-[10px] sm:text-[11px] ${t.textSecondary} font-mono transition-colors`}>
                  <span className="truncate">{formattedDay}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {day.hasWorkouts && (
                      <span title="Workout logged" className="inline-flex items-center">
                        <Activity className={`w-3 h-3 ${t.accentOrange}`} />
                      </span>
                    )}
                    {day.isPerfect && <Award className={`w-3.5 h-3.5 ${t.accentAmber}`} />}
                  </div>
                </div>

                <div className="mt-1.5 space-y-0.5 font-mono">
                  <div className={`text-[10px] sm:text-xs font-bold ${t.textPrimary} tabular-nums flex items-center flex-wrap gap-x-1 leading-tight transition-colors`}>
                    {day.burnedCalories > 0 ? (
                      <>
                        <span className={`${t.textSecondary} font-normal`}>{day.totals.calories}</span>
                        <span className={`${t.accentOrange} font-normal`}>-{day.burnedCalories}</span>
                        <span className={`${t.textTertiary} font-normal`}>=</span>
                        <span className={t.accentEmerald}>{day.totals.calories - day.burnedCalories}</span>
                      </>
                    ) : (
                      <span>{day.totals.calories}</span>
                    )}
                    <span className={`text-[9px] ${t.textTertiary} font-normal transition-colors`}>kcal</span>
                  </div>
                  <div className={`text-[10px] sm:text-[11px] ${t.accentCyan} tabular-nums truncate transition-colors`}>
                    P: {Math.round(day.totals.protein)}g{' '}
                    <span className={`text-[9px] sm:text-[10px] ${t.textTertiary} transition-colors`}>
                      ({Math.round((day.totals.protein / (day.targetProtein || 120)) * 100)}%)
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          
          {canExpand && (
            <button
              onClick={() => setIsHeatmapExpanded(!isHeatmapExpanded)}
              className={`rounded-xl border border-slate-800/40 ${t.innerBg} ${t.btnHover} ${t.textSecondary} hover:${t.textPrimary} transition-all flex flex-col items-center justify-center cursor-pointer group 
                ${isHeatmapExpanded 
                  ? 'col-span-2 sm:col-span-4 md:col-span-7 h-12 flex-row gap-2 py-0 min-h-0' 
                  : 'col-span-1 p-2.5 sm:p-3 min-h-24'
                }`}
              title={isHeatmapExpanded ? "Show Less" : "Expand Heatmap"}
            >
              {isHeatmapExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Protein Intake Trend & Macro Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 w-full">
        <div className={`lg:col-span-7 p-4 sm:p-6 ${t.cardBg} border ${t.cardBorder} rounded-2xl ${t.shadow} space-y-4 sm:space-y-5 transition-colors`}>
          <div className={`flex items-center justify-between gap-2 border-b ${t.innerBorder} pb-3 transition-colors`}>
            <div>
              <h3 className={`text-xs sm:text-sm font-bold ${t.textPrimary} flex items-center gap-2 transition-colors`}>
                <Target className={`w-4 h-4 ${t.accentCyan} shrink-0`} />
                <span>Protein Intake Trend</span>
              </h3>
              <p className={`text-[11px] sm:text-xs ${t.textSecondary} mt-0.5 transition-colors`}>
                Daily protein consumed vs target
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono ${t.accentCyan} transition-colors`}>
                Avg: <strong>{avgProtein}g</strong>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {visibleProteinMetrics.map((day) => {
              const pct = Math.min(140, Math.round((day.totals.protein / (day.targetProtein || 120)) * 100));
              const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'numeric',
                day: 'numeric',
              });

              return (
                <div key={day.date} className="space-y-1">
                  <div className={`flex items-center justify-between text-[11px] sm:text-xs font-mono ${t.textSecondary} transition-colors`}>
                    <span className={`w-16 sm:w-24 shrink-0 ${t.textSecondary}`}>{dayLabel}</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className={`${t.textPrimary} font-bold tabular-nums transition-colors`}>
                        {Math.round(day.totals.protein)}g
                      </span>
                      <span
                        className={`text-[10px] sm:text-[11px] ${
                          day.hitProtein ? `${t.accentEmerald} font-semibold` : t.textTertiary
                        } transition-colors`}
                      >
                        ({pct}%)
                      </span>
                    </div>
                  </div>

                  <div className={`h-2.5 sm:h-3 w-full ${t.progressBg} rounded-full overflow-hidden border ${t.innerBorder} relative transition-colors`}>
                    <div
                      className={`absolute top-0 bottom-0 w-0.5 bg-slate-600/40 z-10`}
                      style={{ left: `${Math.min(100, (100 / 140) * 100)}%` }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        day.hitProtein
                          ? t.gradientProtein
                          : `${t.bgCyan} opacity-60`
                      }`}
                      style={{ width: `${Math.min(100, (pct / 140) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {canExpand && (
            <div className={`pt-2 flex justify-center border-t ${t.innerBorder} transition-colors`}>
              <button
                onClick={() => setIsProteinExpanded(!isProteinExpanded)}
                className={`px-4 py-2 rounded-xl ${t.innerBg} ${t.btnHover} border ${t.innerBorder} text-xs font-semibold ${t.textSecondary} hover:${t.textPrimary} flex items-center gap-2 transition-colors w-full sm:w-auto justify-center cursor-pointer`}
              >
                {isProteinExpanded ? (
                  <>Collapse Trend <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Load Full {daysCount} Days <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-5 sm:space-y-6">
          <div className={`p-4 sm:p-6 ${t.cardBg} border ${t.cardBorder} rounded-2xl ${t.shadow} space-y-4 transition-colors`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs sm:text-sm font-bold ${t.textPrimary} flex items-center gap-2 transition-colors`}>
                <PieChart className={`w-4 h-4 ${t.accentIndigo}`} />
                Average Macro Energy Split
              </h3>
              <span className={`text-xs font-mono ${t.textSecondary} transition-colors`}>
                {avgCalories} kcal/d
              </span>
            </div>

            <div className={`h-3.5 sm:h-4 w-full ${t.innerBg} rounded-xl overflow-hidden flex border ${t.innerBorder} transition-colors`}>
              <div
                style={{ width: `${proteinEnergyPct}%` }}
                className={`${t.bgCyan} transition-all duration-500`}
                title={`Protein: ${proteinEnergyPct}%`}
              />
              <div
                style={{ width: `${carbsEnergyPct}%` }}
                className={`${t.bgAmber} transition-all duration-500`}
                title={`Carbohydrates: ${carbsEnergyPct}%`}
              />
              <div
                style={{ width: `${fatEnergyPct}%` }}
                className={`${t.bgRose} transition-all duration-500`}
                title={`Fat: ${fatEnergyPct}%`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className={`p-2 sm:p-2.5 ${t.innerBg} rounded-xl border ${t.innerBorder} transition-colors`}>
                <span className={`${t.accentCyan} font-bold block transition-colors`}>{proteinEnergyPct}%</span>
                <span className={`text-[10px] ${t.textSecondary} transition-colors`}>Protein</span>
                <span className={`text-[10px] ${t.textTertiary} block transition-colors`}>{avgProtein}g</span>
              </div>
              <div className={`p-2 sm:p-2.5 ${t.innerBg} rounded-xl border ${t.innerBorder} transition-colors`}>
                <span className={`${t.accentAmber} font-bold block transition-colors`}>{carbsEnergyPct}%</span>
                <span className={`text-[10px] ${t.textSecondary} transition-colors`}>Carbs</span>
                <span className={`text-[10px] ${t.textTertiary} block transition-colors`}>{avgCarbs}g</span>
              </div>
              <div className={`p-2 sm:p-2.5 ${t.innerBg} rounded-xl border ${t.innerBorder} transition-colors`}>
                <span className={`${t.accentRose} font-bold block transition-colors`}>{fatEnergyPct}%</span>
                <span className={`text-[10px] ${t.textSecondary} transition-colors`}>Fat</span>
                <span className={`text-[10px] ${t.textTertiary} block transition-colors`}>{avgFat}g</span>
              </div>
            </div>
          </div>

          <div className={`p-4 sm:p-6 ${t.cardBg} border ${t.cardBorder} rounded-2xl ${t.shadow} space-y-3 transition-colors`}>
            <h3 className={`text-xs sm:text-sm font-bold ${t.textPrimary} flex items-center gap-2 transition-colors`}>
              <Award className={`w-4 h-4 ${t.accentAmber}`} />
              Top Muscle-Building Fuel Sources
            </h3>
            <p className={`text-xs ${t.textSecondary} transition-colors`}>
              Foods contributing the highest cumulative protein to your diet
            </p>

            <div className="space-y-2 pt-1">
              {topProteinFoods.length === 0 ? (
                <p className={`text-xs ${t.textTertiary} transition-colors`}>Log meals to uncover your top protein drivers.</p>
              ) : (
                topProteinFoods.map((f, i) => (
                  <div
                    key={i}
                    className={`p-2.5 ${t.innerBg} rounded-xl border ${t.innerBorder} flex items-center justify-between text-xs gap-2 transition-colors`}
                  >
                    <div className={`${t.textPrimary} truncate min-w-0 transition-colors`}>
                      <span className="font-semibold truncate block sm:inline">{f.name}</span>
                      <span className={`${t.textTertiary} sm:ml-2 font-mono text-[10px] sm:text-[11px] block sm:inline transition-colors`}>
                        ({f.occurrences}x logged)
                      </span>
                    </div>
                    <span className={`font-mono ${t.accentCyan} font-bold shrink-0 transition-colors`}>
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