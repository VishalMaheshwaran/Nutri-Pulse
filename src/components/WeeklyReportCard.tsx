// src/components/WeeklyReportCard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles, RefreshCw, AlertCircle, Award, Zap, Calendar, X, Utensils, Flame,
  TrendingUp, TrendingDown, Droplets, Dumbbell, Target, ArrowUp, ArrowDown,
  CheckCircle2, BarChart3, Share2, Check, Trophy, Activity, Heart, Clock, Star
} from 'lucide-react';
import { DailyLog, UserProfile } from '../types/nutrition';
import { calculateTotals } from '../services/storage';
import { getStoredApiKey } from '../utils/geminiStorage';
import { CalendarModal } from './CalendarModal';
import { useTheme } from '../hooks/useTheme';

interface WeeklyReportCardProps {
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  currentDate: string;
  isOpen: boolean;
  onClose: () => void;
}

interface EatenFoodSummary {
  name: string;
  count: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface DayBreakdown {
  date: string;
  dayLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  burned: number;
  itemCount: number;
  workoutCount: number;
  hasData: boolean;
}

interface WeeklyAIAnalysis {
  weeklyHeadline: string;
  consistencyScore: number;
  trendSummary: string;
  strengths: string[];
  weaknesses: string[];
  topHabitToFix: string;
  mealTimingTip: string;
  proteinDistributionNote: string;
  nextWeekGoal: string;
  motivationalQuote: string;
}

export const WeeklyReportCard: React.FC<WeeklyReportCardProps> = ({ logs, profile, currentDate, isOpen, onClose }) => {
  const { t } = useTheme();

  const getMondayFromDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = dt.getDay();
    const diffToMonday = dt.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(dt);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const yr = monday.getFullYear();
    const mo = String(monday.getMonth() + 1).padStart(2, '0');
    const da = String(monday.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const [selectedMonday, setSelectedMonday] = useState<string>(getMondayFromDate(currentDate));
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  const [weeklyData, setWeeklyData] = useState<WeeklyAIAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [animateIn, setAnimateIn] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedMonday(getMondayFromDate(currentDate));
  }, [currentDate]);

  const formatDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weekStats = useMemo(() => {
    const [y, m, d] = selectedMonday.split('-').map(Number);
    const monday = new Date(y, m - 1, d);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const todayStr = formatDateKey(new Date());

    let cals = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, burned = 0, water = 0, loggedDays = 0;
    let totalWorkoutCount = 0, totalWorkoutMinutes = 0;
    const foodMap: Record<string, EatenFoodSummary> = {};
    const dailySummaries: string[] = [];
    const dailyBreakdowns: DayBreakdown[] = [];
    const mealTypeCounts: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };

    let bestDay: { date: string; calories: number; protein: number } | null = null;
    let worstDay: { date: string; calories: number; protein: number } | null = null;

    for (let i = 0; i < 7; i++) {
      const curr = new Date(monday);
      curr.setDate(monday.getDate() + i);
      const dateStr = formatDateKey(curr);
      const isFuture = dateStr > todayStr;

      const dayLog = !isFuture ? logs[dateStr] : undefined;
      const hasData = !!(dayLog && dayLog.items && dayLog.items.length > 0);

      let dayCals = 0, dayProt = 0, dayCarbs = 0, dayFat = 0, dayBurned = 0, dayWater = 0;
      let dayItemCount = 0, dayWorkoutCount = 0;

      if (hasData && dayLog) {
        const totals = calculateTotals(dayLog.items);
        dayCals = totals.calories;
        dayProt = totals.protein;
        dayCarbs = totals.carbs;
        dayFat = totals.fat;
        fiber += totals.fiber || 0;
        dayItemCount = dayLog.items.length;

        cals += dayCals;
        protein += dayProt;
        carbs += dayCarbs;
        fat += dayFat;
        loggedDays++;

        dayLog.items.forEach((item) => {
          const key = item.name.trim();
          if (!foodMap[key]) {
            foodMap[key] = { name: key, count: 0, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
          }
          foodMap[key].count += item.servings;
          foodMap[key].totalCalories += Math.round(item.calories * item.servings);
          foodMap[key].totalProtein += Math.round(item.protein * item.servings);
          foodMap[key].totalCarbs += Math.round(item.carbs * item.servings);
          foodMap[key].totalFat += Math.round(item.fat * item.servings);

          if (item.mealType && mealTypeCounts[item.mealType] !== undefined) {
            mealTypeCounts[item.mealType]++;
          }
        });

        const wList = dayLog.workouts || [];
        dayBurned = wList.reduce((s, w) => s + w.caloriesBurned, 0);
        burned += dayBurned;
        dayWorkoutCount = wList.length;
        totalWorkoutCount += dayWorkoutCount;
        totalWorkoutMinutes += wList.reduce((s, w) => s + (w.durationMinutes || 0), 0);

        dayWater = dayLog.waterIntakeMl || 0;
        water += dayWater;

        // Track best/worst day
        if (!bestDay || dayProt > bestDay.protein) {
          bestDay = { date: dateStr, calories: Math.round(dayCals), protein: Math.round(dayProt) };
        }
        if (!worstDay || dayProt < worstDay.protein) {
          worstDay = { date: dateStr, calories: Math.round(dayCals), protein: Math.round(dayProt) };
        }

        dailySummaries.push(
          `- ${dateStr}: ${Math.round(dayCals)} kcal, ${Math.round(dayProt)}g P`
        );
      }

      dailyBreakdowns.push({
        date: dateStr,
        dayLabel: DAY_NAMES[i],
        calories: Math.round(dayCals),
        protein: Math.round(dayProt),
        carbs: Math.round(dayCarbs),
        fat: Math.round(dayFat),
        water: Math.round(dayWater),
        burned: Math.round(dayBurned),
        itemCount: dayItemCount,
        workoutCount: dayWorkoutCount,
        hasData,
      });
    }

    const dailyCalGoal = profile.targetCalories || 2600;
    const dailyProtGoal = profile.targetProtein || 160;
    const dailyCarbGoal = profile.targetCarbs || Math.round((dailyCalGoal * 0.45) / 4);
    const dailyFatGoal = profile.targetFat || Math.round((dailyCalGoal * 0.27) / 9);
    const dailyFiberGoal = profile.targetFiber || 30;
    const dailyWaterGoal = profile.waterGoalMl || 3000;

    const rangeLabel = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    // Calculate macro percentages
    const totalMacroCals = (protein * 4) + (carbs * 4) + (fat * 9);
    const proteinPct = totalMacroCals > 0 ? Math.round((protein * 4 / totalMacroCals) * 100) : 0;
    const carbsPct = totalMacroCals > 0 ? Math.round((carbs * 4 / totalMacroCals) * 100) : 0;
    const fatPct = totalMacroCals > 0 ? Math.round((fat * 9 / totalMacroCals) * 100) : 0;

    // Calorie adherence: how many days were within ±10% of target
    const adherentDays = dailyBreakdowns.filter(d => {
      if (!d.hasData) return false;
      const lower = dailyCalGoal * 0.9;
      const upper = dailyCalGoal * 1.1;
      return d.calories >= lower && d.calories <= upper;
    }).length;

    return {
      rangeLabel,
      loggedDays,
      cals: Math.round(cals),
      targetCals: dailyCalGoal * 7,
      protein: Math.round(protein),
      targetProtein: dailyProtGoal * 7,
      carbs: Math.round(carbs),
      targetCarbs: dailyCarbGoal * 7,
      fat: Math.round(fat),
      targetFat: dailyFatGoal * 7,
      fiber: Math.round(fiber),
      targetFiber: dailyFiberGoal * 7,
      burned: Math.round(burned),
      water: Math.round(water),
      targetWater: dailyWaterGoal * 7,
      eatenFoods: Object.values(foodMap).sort((a, b) => b.totalProtein - a.totalProtein),
      dailySummaries,
      dailyBreakdowns,
      mealTypeCounts,
      totalWorkoutCount,
      totalWorkoutMinutes,
      bestDay,
      worstDay,
      proteinPct,
      carbsPct,
      fatPct,
      adherentDays,
      dailyCalGoal,
      dailyProtGoal,
    };
  }, [logs, profile, selectedMonday]);

  useEffect(() => {
    setWeeklyData(null);
    setError(null);
  }, [selectedMonday]);

  const generateWeeklySummary = async () => {
    if (weekStats.loggedDays === 0) return;
    setLoading(true);
    setError(null);

    try {
      const apiKey = getStoredApiKey();
      if (!apiKey) {
        throw new Error('No Gemini API key found. Add your key in Profile Settings.');
      }

      const avgCals = Math.round(weekStats.cals / weekStats.loggedDays);
      const avgProt = Math.round(weekStats.protein / weekStats.loggedDays);

      const topFoodsSnippet = weekStats.eatenFoods
        .slice(0, 10)
        .map(f => `- ${f.name} (${f.count}x): ${f.totalCalories} kcal, ${f.totalProtein}g P, ${f.totalCarbs}g C, ${f.totalFat}g F`)
        .join('\n');

      const dailyBreakdownSnippet = weekStats.dailyBreakdowns
        .filter(d => d.hasData)
        .map(d => `- ${d.dayLabel} (${d.date}): ${d.calories} kcal, ${d.protein}g P, ${d.workoutCount} workouts (${d.burned} kcal burned)`)
        .join('\n');

      const mealDistSnippet = `Breakfast: ${weekStats.mealTypeCounts.breakfast} items, Lunch: ${weekStats.mealTypeCounts.lunch}, Dinner: ${weekStats.mealTypeCounts.dinner}, Snacks: ${weekStats.mealTypeCounts.snack}`;

      const prompt = `You are an elite sports nutritionist analyzing a user's 7-day weekly nutrition trend (${weekStats.rangeLabel}).

USER PROFILE & 7-DAY GOALS:
- Active Goal: ${profile.goal}
- 7-Day Calorie Target: ${weekStats.targetCals} kcal (${weekStats.cals} eaten)
- 7-Day Protein Target: ${weekStats.targetProtein}g (${weekStats.protein}g eaten)
- 7-Day Carbs Target: ${weekStats.targetCarbs}g (${weekStats.carbs}g eaten)
- 7-Day Fat Target: ${weekStats.targetFat}g (${weekStats.fat}g eaten)
- Active Days Logged: ${weekStats.loggedDays} / 7 days
- Calorie Adherent Days (within ±10%): ${weekStats.adherentDays} / ${weekStats.loggedDays}
- Total Workouts: ${weekStats.totalWorkoutCount} sessions, ${weekStats.totalWorkoutMinutes} mins, ${weekStats.burned} kcal burned
- Macro Split: ${weekStats.proteinPct}% Protein, ${weekStats.carbsPct}% Carbs, ${weekStats.fatPct}% Fat
- Meal Distribution: ${mealDistSnippet}

Daily Breakdown:
${dailyBreakdownSnippet}

Top Foods Eaten:
${topFoodsSnippet}

Return ONLY a valid, minified JSON object with these exact keys:
{
  "weeklyHeadline": "Short punchy title summarizing their weekly progress",
  "consistencyScore": 88,
  "trendSummary": "2-3 sentences analyzing how their weekly food choices align with their ${profile.goal} goal (Avg ${avgCals} kcal/d, ${avgProt}g P/d).",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "weaknesses": ["Specific weakness 1", "Specific weakness 2"],
  "topHabitToFix": "The single most important nutritional or training habit to fix.",
  "mealTimingTip": "One sentence about optimizing when they eat (e.g., protein distribution across meals).",
  "proteinDistributionNote": "One sentence about how well their protein is spread across meals and days.",
  "nextWeekGoal": "A concrete, encouraging milestone for next week.",
  "motivationalQuote": "A short motivational fitness/nutrition quote or phrase."
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (res.status === 429) {
        throw new Error('AI model is currently busy or out of daily quota. Please try again later!');
      }

      const rawText = await res.text();
      const resultData = JSON.parse(rawText);

      if (resultData.error) throw new Error(resultData.error.message || 'Gemini API Error');

      const modelOutput = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanedJson = modelOutput.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsed: WeeklyAIAnalysis = JSON.parse(cleanedJson);
      setWeeklyData(parsed);

      if (parsed.consistencyScore >= 80) {
        setTimeout(() => {
          confetti({ particleCount: 250, spread: 130, origin: { y: 0.5 }, colors: ['#10b981', '#34d399', '#fcd34d'] });
        }, 300);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate weekly AI summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareReport = async () => {
    const avgCals = weekStats.loggedDays > 0 ? Math.round(weekStats.cals / weekStats.loggedDays) : 0;
    const avgProt = weekStats.loggedDays > 0 ? Math.round(weekStats.protein / weekStats.loggedDays) : 0;

    const shareText = `📊 Weekly Nutrition Report (${weekStats.rangeLabel})\n` +
      (weeklyData ? `🔥 Score: ${weeklyData.consistencyScore}/100\n📌 "${weeklyData.weeklyHeadline}"\n\n` : '\n') +
      `• Calories: ${weekStats.cals} / ${weekStats.targetCals} kcal\n` +
      `• Protein: ${weekStats.protein}g / ${weekStats.targetProtein}g\n` +
      `• Days Logged: ${weekStats.loggedDays}/7\n` +
      `• Avg Daily: ${avgCals} kcal, ${avgProt}g protein\n` +
      `• Workouts: ${weekStats.totalWorkoutCount} sessions (${weekStats.burned} kcal burned)\n` +
      (weeklyData ? `\n💡 Key Insight:\n${weeklyData.trendSummary}\n\n🎯 Next Week Goal:\n${weeklyData.nextWeekGoal}` : '') +
      `\n\n— Tracked with NutriPulse 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Weekly Report - ${weekStats.rangeLabel}`, text: shareText });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (clipErr) {
      console.error('Clipboard write failed:', clipErr);
    }
  };

  // Helper: progress bar percentage (capped at 100)
  const pct = (value: number, target: number) => target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0;

  // Helper: get color for calorie bar based on target adherence
  const getCalBarColor = (dayCals: number) => {
    const target = weekStats.dailyCalGoal;
    const diff = Math.abs(dayCals - target) / target;
    if (diff <= 0.05) return 'bg-emerald-400';
    if (diff <= 0.15) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  if (!isMounted) return null;

  const maxDayCals = Math.max(...weekStats.dailyBreakdowns.map(d => d.calories), weekStats.dailyCalGoal);
  const maxDayProt = Math.max(...weekStats.dailyBreakdowns.map(d => d.protein), weekStats.dailyProtGoal);

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-300 ${animateIn ? 'bg-slate-950/85 backdrop-blur-md opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
        <div className={`relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-12'}`}>
          
          {/* Header */}
          <div className="shrink-0 px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100">Weekly AI Report</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Week of {weekStats.rangeLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {weekStats.loggedDays > 0 && (
                <button
                  type="button"
                  onClick={handleShareReport}
                  className="py-1.5 px-2.5 sm:py-2 sm:px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Share Report"
                >
                  {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
                </button>
              )}
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/60">
            
            {/* Top Period Selector Bar */}
            <div className="p-1.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  now.setDate(now.getDate() - 7);
                  setSelectedMonday(getMondayFromDate(formatDateKey(now)));
                }}
                className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 text-slate-400 hover:text-slate-200 transition-all cursor-pointer shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Last Week</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMonday(getMondayFromDate(formatDateKey(new Date())))}
                className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 text-slate-400 hover:text-slate-200 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Current</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(true)}
                className="flex-1 py-2 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Week Picker</span>
              </button>
            </div>

            {/* ──────── OVERVIEW STATS GRID ──────── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">CALORIES (7D)</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 block">{weekStats.cals} / {weekStats.targetCals}</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct(weekStats.cals, weekStats.targetCals)}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{pct(weekStats.cals, weekStats.targetCals)}% of target</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">PROTEIN (7D)</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-cyan-400 block">{weekStats.protein}g / {weekStats.targetProtein}g</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${pct(weekStats.protein, weekStats.targetProtein)}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{pct(weekStats.protein, weekStats.targetProtein)}% of target</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">CARBS (7D)</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-amber-400 block">{weekStats.carbs}g / {weekStats.targetCarbs}g</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct(weekStats.carbs, weekStats.targetCarbs)}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{pct(weekStats.carbs, weekStats.targetCarbs)}% of target</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">FAT (7D)</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-rose-400 block">{weekStats.fat}g / {weekStats.targetFat}g</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${pct(weekStats.fat, weekStats.targetFat)}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{pct(weekStats.fat, weekStats.targetFat)}% of target</span>
              </div>
            </div>

            {/* ──────── DAILY AVERAGES ROW ──────── */}
            {weekStats.loggedDays > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-violet-400" /> Daily Averages ({weekStats.loggedDays} days logged)
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase block">Avg Cal</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400">{Math.round(weekStats.cals / weekStats.loggedDays)}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase block">Avg Prot</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-cyan-400">{Math.round(weekStats.protein / weekStats.loggedDays)}g</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase block">Avg Carb</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-amber-400">{Math.round(weekStats.carbs / weekStats.loggedDays)}g</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase block">Avg Fat</span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-rose-400">{Math.round(weekStats.fat / weekStats.loggedDays)}g</span>
                  </div>
                </div>
              </div>
            )}

            {/* ──────── MACRO SPLIT BAR ──────── */}
            {weekStats.loggedDays > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" /> Macro Split
                </span>
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
                  {weekStats.proteinPct > 0 && (
                    <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${weekStats.proteinPct}%` }} />
                  )}
                  {weekStats.carbsPct > 0 && (
                    <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${weekStats.carbsPct}%` }} />
                  )}
                  {weekStats.fatPct > 0 && (
                    <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${weekStats.fatPct}%` }} />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-500 rounded-sm inline-block"></span> Protein {weekStats.proteinPct}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block"></span> Carbs {weekStats.carbsPct}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block"></span> Fat {weekStats.fatPct}%</span>
                </div>
              </div>
            )}

            {/* ──────── DAY-BY-DAY CALORIE & PROTEIN CHART ──────── */}
            {weekStats.loggedDays > 0 && (
              <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Daily Calorie & Protein Breakdown
                </span>
                <div className="space-y-2">
                  {weekStats.dailyBreakdowns.map((day, idx) => (
                    <div key={idx} className="flex items-center gap-2 sm:gap-3">
                      <span className={`w-8 text-[11px] font-bold font-mono shrink-0 ${day.hasData ? 'text-slate-200' : 'text-slate-600'}`}>
                        {day.dayLabel}
                      </span>
                      <div className="flex-1 space-y-1">
                        {/* Calorie bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-slate-800/80 rounded-full overflow-hidden relative">
                            {day.hasData && (
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${getCalBarColor(day.calories)}`}
                                style={{ width: `${maxDayCals > 0 ? Math.round((day.calories / maxDayCals) * 100) : 0}%` }}
                              />
                            )}
                            {/* Target line */}
                            <div
                              className="absolute top-0 bottom-0 w-px bg-slate-400/40"
                              style={{ left: `${maxDayCals > 0 ? Math.round((weekStats.dailyCalGoal / maxDayCals) * 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 w-14 text-right shrink-0">
                            {day.hasData ? `${day.calories}` : '—'}
                          </span>
                        </div>
                        {/* Protein bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden relative">
                            {day.hasData && (
                              <div
                                className="h-full bg-cyan-500/70 rounded-full transition-all duration-500"
                                style={{ width: `${maxDayProt > 0 ? Math.round((day.protein / maxDayProt) * 100) : 0}%` }}
                              />
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400/70 w-14 text-right shrink-0">
                            {day.hasData ? `${day.protein}g P` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm inline-block"></span>On target</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-sm inline-block"></span>Slight deviation</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-400 rounded-sm inline-block"></span>Off target</span>
                  <span className="flex items-center gap-1"><span className="w-px h-3 bg-slate-400/40 inline-block"></span>Daily goal</span>
                </div>
              </div>
            )}

            {/* ──────── WORKOUT & WATER SUMMARY ──────── */}
            {weekStats.loggedDays > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5" /> Workouts
                  </span>
                  <div className="space-y-1">
                    <span className="text-sm sm:text-base font-extrabold font-mono text-orange-400 block">{weekStats.totalWorkoutCount} sessions</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{weekStats.totalWorkoutMinutes} min total</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{weekStats.burned} kcal burned</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" /> Hydration
                  </span>
                  <div className="space-y-1">
                    <span className="text-sm sm:text-base font-extrabold font-mono text-blue-400 block">{(weekStats.water / 1000).toFixed(1)}L</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Target: {(weekStats.targetWater / 1000).toFixed(1)}L</span>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct(weekStats.water, weekStats.targetWater)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ──────── BEST & WORST DAY ──────── */}
            {weekStats.loggedDays >= 2 && weekStats.bestDay && weekStats.worstDay && weekStats.bestDay.date !== weekStats.worstDay.date && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Best Day
                  </span>
                  <span className="text-xs font-mono text-slate-300 block">
                    {new Date(weekStats.bestDay.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {weekStats.bestDay.calories} kcal · {weekStats.bestDay.protein}g P
                  </span>
                </div>
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" /> Needs Work
                  </span>
                  <span className="text-xs font-mono text-slate-300 block">
                    {new Date(weekStats.worstDay.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {weekStats.worstDay.calories} kcal · {weekStats.worstDay.protein}g P
                  </span>
                </div>
              </div>
            )}

            {/* ──────── MEAL DISTRIBUTION ──────── */}
            {weekStats.loggedDays > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400" /> Meal Distribution
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Breakfast', count: weekStats.mealTypeCounts.breakfast, color: 'text-amber-400' },
                    { label: 'Lunch', count: weekStats.mealTypeCounts.lunch, color: 'text-emerald-400' },
                    { label: 'Dinner', count: weekStats.mealTypeCounts.dinner, color: 'text-cyan-400' },
                    { label: 'Snacks', count: weekStats.mealTypeCounts.snack, color: 'text-pink-400' },
                  ].map((meal, idx) => (
                    <div key={idx} className="p-2 bg-slate-900/80 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 uppercase block">{meal.label}</span>
                      <span className={`text-sm font-bold font-mono ${meal.color}`}>{meal.count}</span>
                      <span className="text-[9px] text-slate-500 block">items</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs sm:text-sm text-rose-300 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {weekStats.loggedDays === 0 ? (
              <div className="p-10 sm:p-14 bg-slate-950 border border-slate-800/90 rounded-3xl text-center space-y-3">
                <Flame className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base sm:text-lg font-bold text-slate-200">No meals logged for week of {weekStats.rangeLabel}</h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">Use the Week Picker above to choose another week or log meals.</p>
              </div>
            ) : (
              <>
                {/* ──────── WHAT YOU ATE (TOP FOODS) ──────── */}
                <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Utensils className="w-4 h-4" /> What You Ate ({weekStats.eatenFoods.length} items across {weekStats.loggedDays} days)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {weekStats.eatenFoods.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs gap-2">
                        <div className="truncate min-w-0">
                          <span className="font-semibold text-slate-100 truncate block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{Math.round(item.count * 10) / 10}x servings · {item.totalCalories} kcal</span>
                        </div>
                        <span className="font-mono font-bold text-cyan-400 shrink-0">+{item.totalProtein}g P</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ──────── CONSISTENCY & ADHERENCE ──────── */}
                <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" /> Consistency & Adherence
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 uppercase block">Days Logged</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">{weekStats.loggedDays}<span className="text-slate-500">/7</span></span>
                    </div>
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 uppercase block">On Target</span>
                      <span className="text-sm font-bold font-mono text-amber-400">{weekStats.adherentDays}<span className="text-slate-500">/{weekStats.loggedDays}</span></span>
                    </div>
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 uppercase block">Net Cal</span>
                      <span className={`text-sm font-bold font-mono ${(weekStats.cals - weekStats.burned) <= weekStats.targetCals ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {weekStats.cals - weekStats.burned}
                      </span>
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="p-10 bg-slate-950 border border-slate-800/90 rounded-3xl flex flex-col items-center justify-center space-y-3 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-sm font-bold text-slate-200">Generating Gemini 3.1 Flash Lite Weekly Report...</p>
                    <p className="text-xs text-slate-500">Analyzing {weekStats.loggedDays} days of nutrition data...</p>
                  </div>
                )}

                {!weeklyData && !loading && (
                  <div className="p-6 bg-slate-950 border border-slate-800/90 rounded-3xl text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-emerald-500/40 mx-auto" />
                    <p className="text-xs sm:text-sm text-slate-400">Tap <strong className="text-emerald-400">Regenerate Report</strong> below to run AI coaching on this week.</p>
                    <p className="text-[10px] text-slate-500">Get personalized strengths, weaknesses, meal timing insights & more.</p>
                  </div>
                )}

                {/* ──────── AI ANALYSIS RESULTS ──────── */}
                {weeklyData && !loading && (
                  <div className="space-y-4">
                    {/* Headline + Score */}
                    <div className="p-5 bg-slate-950 border border-emerald-500/30 rounded-3xl flex flex-col sm:flex-row items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex flex-col items-center justify-center shrink-0">
                        <span className="text-2xl font-extrabold font-mono text-emerald-400">{weeklyData.consistencyScore}</span>
                        <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">Score</span>
                      </div>
                      <div className="space-y-1.5 text-center sm:text-left">
                        <h4 className="text-base sm:text-lg font-bold text-slate-100">{weeklyData.weeklyHeadline}</h4>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{weeklyData.trendSummary}</p>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {weeklyData.strengths && weeklyData.strengths.length > 0 && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/20 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase">
                            <CheckCircle2 className="w-4 h-4" /> What You Nailed
                          </div>
                          <ul className="space-y-1.5">
                            {weeklyData.strengths.map((s, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {weeklyData.weaknesses && weeklyData.weaknesses.length > 0 && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/20 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs uppercase">
                            <AlertCircle className="w-4 h-4" /> Areas to Improve
                          </div>
                          <ul className="space-y-1.5">
                            {weeklyData.weaknesses.map((w, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-rose-400 mt-0.5">•</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Habit to Fix + Next Week Goal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase"><Zap className="w-4 h-4" /> Top Habit to Fix</div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{weeklyData.topHabitToFix}</p>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase"><Award className="w-4 h-4" /> Next Week Goal</div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{weeklyData.nextWeekGoal}</p>
                      </div>
                    </div>

                    {/* Meal Timing & Protein Distribution */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-pink-400 font-bold text-xs uppercase"><Clock className="w-4 h-4" /> Meal Timing</div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{weeklyData.mealTimingTip}</p>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase"><Activity className="w-4 h-4" /> Protein Spread</div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{weeklyData.proteinDistributionNote}</p>
                      </div>
                    </div>

                    {/* Motivational Quote */}
                    {weeklyData.motivationalQuote && (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
                        <p className="text-xs sm:text-sm text-emerald-300 italic leading-relaxed">"{weeklyData.motivationalQuote}"</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">— AI Coach</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center gap-3 z-10">
            <button
              type="button"
              disabled={weekStats.loggedDays === 0 || loading}
              onClick={generateWeeklySummary}
              className={`flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors ${weekStats.loggedDays === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate Report</span>
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer shadow-lg shadow-emerald-500/20">
              Close &amp; Start Day
            </button>
          </div>

        </div>
      </div>

      {/* Calendar Modal configured to enforce Monday selection correctly */}
      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentDate={selectedMonday}
        onDateChange={(chosenDate) => {
          const [y, m, d] = chosenDate.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          if (dt.getDay() !== 1) return; // Prevent closing/updating if not Monday
          
          setSelectedMonday(chosenDate);
          setIsCalendarModalOpen(false); // Only close when a valid Monday is selected
        }}
        logs={logs}
        profile={profile}
        enforceMondayOnly={true}
      />
    </>
  );
};

export default WeeklyReportCard;
