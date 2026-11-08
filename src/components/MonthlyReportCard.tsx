// src/components/MonthlyReportCard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles, RefreshCw, AlertCircle, Award, Zap, Calendar, X, Utensils, Flame,
  TrendingUp, TrendingDown, Minus, Target, Droplets, Activity, BarChart3,
  CheckCircle2, Ban, ArrowRightLeft, Trophy, Heart, Dumbbell, ChevronDown,
  ChevronUp, Share2, Check, Percent, Clock, Apple, Pizza, Coffee, Moon, Sun
} from 'lucide-react';
import { DailyLog, UserProfile, MealType } from '../types/nutrition';
import { calculateTotals } from '../services/storage';
import { getStoredApiKey } from '../utils/geminiStorage';
import { CalendarModal } from './CalendarModal';
import { useTheme } from '../hooks/useTheme';

interface MonthlyReportCardProps {
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
  totalFiber: number;
}

interface MealTypeBreakdown {
  mealType: MealType;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  itemCount: number;
}

interface DayDetail {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
  workoutsBurned: number;
  itemCount: number;
  hitCalories: boolean;
  hitProtein: boolean;
}

interface WeekSummary {
  weekLabel: string;
  avgCalories: number;
  avgProtein: number;
  loggedDays: number;
  totalBurned: number;
  calGoalHit: boolean;
  protGoalHit: boolean;
  goalStatus: 'crushed' | 'on_track' | 'needs_work';
  goalSummaryText: string;
}

interface MonthlyAIAnalysis {
  monthlyHeadline: string;
  consistencyScore: number;
  trendSummary: string;
  macroBalance: string;
  topStrengths: string[];
  topWeaknesses: string[];
  topHabitToFix: string;
  mealTimingInsight: string;
  hydrationNote: string;
  workoutNutritionSync: string;
  nextMonthGoal: string;
  motivationalQuote: string;
}

export const MonthlyReportCard: React.FC<MonthlyReportCardProps> = ({ logs, profile, currentDate, isOpen, onClose }) => {
  const { t } = useTheme();

  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  const [monthlyData, setMonthlyData] = useState<MonthlyAIAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [animateIn, setAnimateIn] = useState<boolean>(false);
  const [showAllFoods, setShowAllFoods] = useState<boolean>(false);
  const [showDayBreakdown, setShowDayBreakdown] = useState<boolean>(false);
  const [showMealBreakdown, setShowMealBreakdown] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

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
    setSelectedDate(currentDate);
  }, [currentDate]);

  const formatDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const monthStats = useMemo(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    const targetMonthDate = new Date(y, m - 1, 1);
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dates: string[] = [];
    const todayStr = formatDateKey(new Date());

    for (let i = 1; i <= daysInMonth; i++) {
      const curr = new Date(year, month, i);
      const dateStr = formatDateKey(curr);
      if (dateStr <= todayStr) {
        dates.push(dateStr);
      }
    }

    let cals = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = 0, sodiumMg = 0;
    let burned = 0, loggedDays = 0, totalWater = 0;
    let totalWorkoutMinutes = 0, workoutDays = 0;
    let perfectDays = 0;
    const foodMap: Record<string, EatenFoodSummary> = {};
    const mealMap: Record<MealType, MealTypeBreakdown> = {
      breakfast: { mealType: 'breakfast', totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, itemCount: 0 },
      lunch: { mealType: 'lunch', totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, itemCount: 0 },
      dinner: { mealType: 'dinner', totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, itemCount: 0 },
      snack: { mealType: 'snack', totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, itemCount: 0 },
    };
    const dailySummaries: string[] = [];
    const dayDetails: DayDetail[] = [];
    const dailyCalValues: number[] = [];
    const dailyProtValues: number[] = [];

    const dailyCalGoal = profile.targetCalories || 2600;
    const dailyProtGoal = profile.targetProtein || 160;
    const dailyCarbGoal = profile.targetCarbs || Math.round((dailyCalGoal * 0.45) / 4);
    const dailyFatGoal = profile.targetFat || Math.round((dailyCalGoal * 0.27) / 9);
    const dailyFiberGoal = profile.targetFiber || 30;

    dates.forEach((dateStr) => {
      const dayLog = logs[dateStr];
      if (dayLog && dayLog.items && dayLog.items.length > 0) {
        const totals = calculateTotals(dayLog.items);
        cals += totals.calories;
        protein += totals.protein;
        carbs += totals.carbs;
        fat += totals.fat;
        fiber += totals.fiber;
        sugar += totals.sugar || 0;
        sodiumMg += totals.sodiumMg || 0;
        loggedDays++;

        dailyCalValues.push(Math.round(totals.calories));
        dailyProtValues.push(Math.round(totals.protein));

        const wList = dayLog.workouts || [];
        const burnedToday = wList.reduce((s, w) => s + w.caloriesBurned, 0);
        const workoutMinsToday = wList.reduce((s, w) => s + (w.durationMinutes || 0), 0);
        burned += burnedToday;
        if (wList.length > 0) {
          workoutDays++;
          totalWorkoutMinutes += workoutMinsToday;
        }

        const waterToday = dayLog.waterIntakeMl || 0;
        totalWater += waterToday;

        // Check perfect day
        const effectiveBudget = dailyCalGoal + burnedToday;
        let dayHitCals = false;
        if (profile.goal === 'lose_weight') {
          dayHitCals = totals.calories > 0 && totals.calories <= effectiveBudget + 25;
        } else if (profile.goal === 'gain_muscle') {
          dayHitCals = totals.calories >= effectiveBudget * 0.95 && totals.calories <= effectiveBudget + 200;
        } else {
          dayHitCals = Math.abs(totals.calories - effectiveBudget) <= 150;
        }
        const dayHitProt = totals.protein >= dailyProtGoal * 0.95;
        if (dayHitCals && dayHitProt) perfectDays++;

        dayDetails.push({
          date: dateStr,
          calories: Math.round(totals.calories),
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
          fiber: Math.round(totals.fiber),
          water: waterToday,
          workoutsBurned: burnedToday,
          itemCount: dayLog.items.length,
          hitCalories: dayHitCals,
          hitProtein: dayHitProt,
        });

        dayLog.items.forEach((item) => {
          const key = item.name.trim();
          if (!foodMap[key]) {
            foodMap[key] = { name: key, count: 0, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 };
          }
          foodMap[key].count += item.servings;
          foodMap[key].totalCalories += Math.round(item.calories * item.servings);
          foodMap[key].totalProtein += Math.round(item.protein * item.servings);
          foodMap[key].totalCarbs += Math.round(item.carbs * item.servings);
          foodMap[key].totalFat += Math.round(item.fat * item.servings);
          foodMap[key].totalFiber += Math.round(item.fiber * item.servings);

          // Meal type breakdown
          const mt = item.mealType || 'snack';
          if (mealMap[mt]) {
            mealMap[mt].totalCalories += Math.round(item.calories * item.servings);
            mealMap[mt].totalProtein += Math.round(item.protein * item.servings);
            mealMap[mt].totalCarbs += Math.round(item.carbs * item.servings);
            mealMap[mt].totalFat += Math.round(item.fat * item.servings);
            mealMap[mt].itemCount += 1;
          }
        });

        dailySummaries.push(
          `- ${dateStr}: ${Math.round(totals.calories)} kcal, ${Math.round(totals.protein)}g P, ${Math.round(totals.carbs)}g C, ${Math.round(totals.fat)}g F`
        );
      }
    });

    // Weekly summaries
    const weekSummaries: WeekSummary[] = [];
    for (let w = 0; w < Math.ceil(daysInMonth / 7); w++) {
      const weekStart = w * 7;
      const weekEnd = Math.min(weekStart + 7, dayDetails.length);
      const weekDays = dayDetails.slice(weekStart, weekEnd);
      if (weekDays.length > 0) {
        const wCals = weekDays.reduce((s, d) => s + d.calories, 0);
        const wProt = weekDays.reduce((s, d) => s + d.protein, 0);
        const wBurned = weekDays.reduce((s, d) => s + d.workoutsBurned, 0);
        const avgCal = Math.round(wCals / weekDays.length);
        const avgP = Math.round(wProt / weekDays.length);

        // Check goal hit based on user's active goal
        const avgBurnedDaily = Math.round(wBurned / weekDays.length);
        const targetBudget = dailyCalGoal + avgBurnedDaily;
        let calGoalHit = false;
        if (profile.goal === 'lose_weight') {
          calGoalHit = avgCal > 0 && avgCal <= targetBudget + 50;
        } else if (profile.goal === 'gain_muscle') {
          calGoalHit = avgCal >= targetBudget * 0.95 && avgCal <= targetBudget + 250;
        } else {
          calGoalHit = Math.abs(avgCal - targetBudget) <= 200;
        }
        const protGoalHit = avgP >= dailyProtGoal * 0.92;

        let goalStatus: 'crushed' | 'on_track' | 'needs_work' = 'needs_work';
        let goalSummaryText = '';

        if (calGoalHit && protGoalHit) {
          goalStatus = 'crushed';
          goalSummaryText = profile.goal === 'lose_weight' 
            ? 'Deficit & Protein Hit 🎯' 
            : profile.goal === 'gain_muscle' 
            ? 'Surplus & Protein Hit 💪' 
            : 'Maintenance Hit ⚖️';
        } else if (calGoalHit || protGoalHit) {
          goalStatus = 'on_track';
          goalSummaryText = calGoalHit 
            ? 'Calorie Target Met' 
            : 'Protein Target Met';
        } else {
          goalStatus = 'needs_work';
          goalSummaryText = avgCal > targetBudget + 200 
            ? 'Above Calorie Budget' 
            : avgP < dailyProtGoal * 0.8 
            ? 'Low Protein' 
            : 'Needs Alignment';
        }

        weekSummaries.push({
          weekLabel: `Week ${w + 1}`,
          avgCalories: avgCal,
          avgProtein: avgP,
          loggedDays: weekDays.length,
          totalBurned: wBurned,
          calGoalHit,
          protGoalHit,
          goalStatus,
          goalSummaryText,
        });
      }
    }

    // Calorie consistency (std deviation)
    const avgDailyCals = loggedDays > 0 ? cals / loggedDays : 0;
    const avgDailyProt = loggedDays > 0 ? protein / loggedDays : 0;
    const calVariance = loggedDays > 0 ? dailyCalValues.reduce((s, v) => s + Math.pow(v - avgDailyCals, 2), 0) / loggedDays : 0;
    const calStdDev = Math.round(Math.sqrt(calVariance));

    // Calorie adherence percentage
    const calAdherence = loggedDays > 0 ? Math.round((dayDetails.filter(d => d.hitCalories).length / loggedDays) * 100) : 0;
    const protAdherence = loggedDays > 0 ? Math.round((dayDetails.filter(d => d.hitProtein).length / loggedDays) * 100) : 0;

    // Best and worst day
    const bestDay = dayDetails.length > 0 ? dayDetails.reduce((best, d) => (d.hitCalories && d.hitProtein && d.protein > best.protein) ? d : best, dayDetails[0]) : null;
    const highestCalDay = dayDetails.length > 0 ? dayDetails.reduce((highest, d) => d.calories > highest.calories ? d : highest, dayDetails[0]) : null;
    const lowestCalDay = dayDetails.length > 0 ? dayDetails.reduce((lowest, d) => d.calories < lowest.calories ? d : lowest, dayDetails[0]) : null;

    // Top protein foods
    const topProteinFoods = Object.values(foodMap).sort((a, b) => b.totalProtein - a.totalProtein).slice(0, 5);
    // Top calorie foods
    const topCalorieFoods = Object.values(foodMap).sort((a, b) => b.totalCalories - a.totalCalories).slice(0, 5);
    // Most frequently eaten
    const mostFrequent = Object.values(foodMap).sort((a, b) => b.count - a.count).slice(0, 5);

    const monthLabel = targetMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Macro split percentages
    const totalMacroCals = (protein * 4) + (carbs * 4) + (fat * 9);
    const proteinPct = totalMacroCals > 0 ? Math.round((protein * 4 / totalMacroCals) * 100) : 0;
    const carbsPct = totalMacroCals > 0 ? Math.round((carbs * 4 / totalMacroCals) * 100) : 0;
    const fatPct = totalMacroCals > 0 ? Math.round((fat * 9 / totalMacroCals) * 100) : 0;

    return {
      monthLabel,
      daysInMonth,
      daysElapsed: dates.length,
      loggedDays,
      missedDays: dates.length - loggedDays,
      perfectDays,
      cals: Math.round(cals),
      targetCals: dailyCalGoal * daysInMonth,
      avgDailyCals: Math.round(avgDailyCals),
      protein: Math.round(protein),
      targetProtein: dailyProtGoal * daysInMonth,
      avgDailyProt: Math.round(avgDailyProt),
      carbs: Math.round(carbs),
      targetCarbs: dailyCarbGoal * daysInMonth,
      avgDailyCarbs: loggedDays > 0 ? Math.round(carbs / loggedDays) : 0,
      fat: Math.round(fat),
      targetFat: dailyFatGoal * daysInMonth,
      avgDailyFat: loggedDays > 0 ? Math.round(fat / loggedDays) : 0,
      fiber: Math.round(fiber),
      targetFiber: dailyFiberGoal * daysInMonth,
      avgDailyFiber: loggedDays > 0 ? Math.round(fiber / loggedDays) : 0,
      sugar: Math.round(sugar),
      sodiumMg: Math.round(sodiumMg),
      burned: Math.round(burned),
      totalWater,
      avgDailyWater: loggedDays > 0 ? Math.round(totalWater / loggedDays) : 0,
      workoutDays,
      totalWorkoutMinutes,
      calStdDev,
      calAdherence,
      protAdherence,
      proteinPct,
      carbsPct,
      fatPct,
      bestDay,
      highestCalDay,
      lowestCalDay,
      eatenFoods: Object.values(foodMap).sort((a, b) => b.totalProtein - a.totalProtein),
      topProteinFoods,
      topCalorieFoods,
      mostFrequent,
      mealBreakdown: Object.values(mealMap).filter(m => m.itemCount > 0),
      dayDetails,
      weekSummaries,
      dailySummaries,
      dailyCalGoal,
      dailyProtGoal,
      dailyCarbGoal,
      dailyFatGoal,
    };
  }, [logs, profile, selectedDate]);

  const monthKey = selectedDate.substring(0, 7);
  const cacheKey = `nutripulse_monthly_report_${monthKey}_${profile.goal}`;

  useEffect(() => {
    if (!isOpen) return;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setMonthlyData(JSON.parse(cached));
        setError(null);
        return;
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }
    setMonthlyData(null);
    setError(null);
    setShowAllFoods(false);
    setShowDayBreakdown(false);
    setShowMealBreakdown(false);
  }, [selectedDate, isOpen, profile.goal, cacheKey]);

  const handleShareReport = async () => {
    if (!monthlyData) return;

    const shareText = `📊 Monthly Nutrition Report (${monthStats.monthLabel})\n` +
      `🔥 Consistency Score: ${monthlyData.consistencyScore}/100\n` +
      `📌 "${monthlyData.monthlyHeadline}"\n\n` +
      `• Calories: ${monthStats.cals} / ${monthStats.targetCals} kcal (Avg ${monthStats.avgDailyCals}/day)\n` +
      `• Protein: ${monthStats.protein}g / ${monthStats.targetProtein}g (Avg ${monthStats.avgDailyProt}g/day)\n` +
      `• Days Logged: ${monthStats.loggedDays} / ${monthStats.daysElapsed}\n` +
      `• Perfect Days: ${monthStats.perfectDays} 🏆\n` +
      `• Workouts: ${monthStats.workoutDays} sessions, ${monthStats.burned} kcal burned\n\n` +
      `💡 Coach Insight:\n${monthlyData.trendSummary}\n\n` +
      `🎯 Next Month Goal:\n${monthlyData.nextMonthGoal}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Monthly Nutrition Report - ${monthStats.monthLabel}`,
          text: shareText,
        });
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

  const generateMonthlySummary = async () => {
    if (monthStats.loggedDays === 0) return;
    setLoading(true);
    setError(null);

    try {
      const apiKey = getStoredApiKey();
      if (!apiKey) {
        throw new Error('No Gemini API key found. Add your key in Profile Settings.');
      }

      const avgCals = monthStats.avgDailyCals;
      const avgProt = monthStats.avgDailyProt;

      const topFoodsSnippet = monthStats.eatenFoods
        .slice(0, 15)
        .map(f => `- ${f.name} (${f.count}x): ${f.totalCalories} kcal, ${f.totalProtein}g P, ${f.totalCarbs}g C, ${f.totalFat}g F`)
        .join('\n');

      const mealBreakdownSnippet = monthStats.mealBreakdown
        .map(m => `- ${m.mealType}: ${m.totalCalories} kcal total, ${m.totalProtein}g P, ${m.itemCount} items`)
        .join('\n');

      const weeklyTrendSnippet = monthStats.weekSummaries
        .map(w => `- ${w.weekLabel}: Avg ${w.avgCalories} kcal/d, Avg ${w.avgProtein}g P/d, ${w.loggedDays} days logged, ${w.totalBurned} kcal burned, Goal Status: ${w.goalSummaryText}`)
        .join('\n');

      const prompt = `You are an elite sports nutritionist and fitness coach analyzing a user's comprehensive Monthly nutrition & fitness data (${monthStats.monthLabel}).

USER PROFILE & ${monthStats.daysInMonth}-DAY MONTHLY GOALS:
- Name: ${profile.name || 'User'}
- Active Goal: ${profile.goal} (${profile.goal === 'lose_weight' ? 'Fat Loss / Caloric Deficit' : profile.goal === 'gain_muscle' ? 'Muscle Build / Lean Bulk' : 'Weight Maintenance & Recomposition'})
- Age: ${profile.age}, Weight: ${profile.weightKg}kg, Height: ${profile.heightCm}cm, Activity: ${profile.activityLevel}
- Daily Targets: ${monthStats.dailyCalGoal} kcal | ${monthStats.dailyProtGoal}g P | ${monthStats.dailyCarbGoal}g C | ${monthStats.dailyFatGoal}g F

MONTHLY TOTALS:
- Calories: ${monthStats.cals} / ${monthStats.targetCals} kcal target (Avg ${avgCals} kcal/day)
- Protein: ${monthStats.protein}g / ${monthStats.targetProtein}g target (Avg ${avgProt}g/day)
- Carbs: ${monthStats.carbs}g (Avg ${monthStats.avgDailyCarbs}g/day)
- Fat: ${monthStats.fat}g (Avg ${monthStats.avgDailyFat}g/day)
- Fiber: ${monthStats.fiber}g (Avg ${monthStats.avgDailyFiber}g/day)
- Macro Split: ${monthStats.proteinPct}% P / ${monthStats.carbsPct}% C / ${monthStats.fatPct}% F

CONSISTENCY METRICS:
- Days Logged: ${monthStats.loggedDays} / ${monthStats.daysElapsed} days elapsed
- Missed Logging Days: ${monthStats.missedDays}
- Perfect Days (Hit Both Cal + Protein): ${monthStats.perfectDays}
- Calorie Adherence Rate: ${monthStats.calAdherence}%
- Protein Adherence Rate: ${monthStats.protAdherence}%
- Calorie Consistency (Std Dev): ±${monthStats.calStdDev} kcal

WORKOUT STATS:
- Workout Days: ${monthStats.workoutDays}
- Total Calories Burned: ${monthStats.burned} kcal
- Total Workout Duration: ${monthStats.totalWorkoutMinutes} minutes

HYDRATION:
- Total Water: ${monthStats.totalWater}ml (Avg ${monthStats.avgDailyWater}ml/day, Goal: ${profile.waterGoalMl}ml/day)

MEAL DISTRIBUTION:
${mealBreakdownSnippet}

WEEKLY TRENDS:
${weeklyTrendSnippet}

Top Foods Eaten:
${topFoodsSnippet}

Return ONLY a valid, minified JSON object with these exact keys:
{
  "monthlyHeadline": "Short punchy title summarizing their month (max 8 words)",
  "consistencyScore": 88,
  "trendSummary": "3-4 sentences deep-diving into how their monthly food choices, consistency, and macro balance align with their ${profile.goal} goal. Reference specific numbers.",
  "macroBalance": "2 sentences analyzing their protein/carb/fat split (${monthStats.proteinPct}%/${monthStats.carbsPct}%/${monthStats.fatPct}%) relative to their goal.",
  "topStrengths": ["Specific strength 1 with data", "Specific strength 2 with data", "Specific strength 3"],
  "topWeaknesses": ["Specific weakness 1 with data", "Specific weakness 2 with data"],
  "topHabitToFix": "The single most important nutritional or training habit to correct, with specific actionable steps.",
  "mealTimingInsight": "1-2 sentences about their meal distribution pattern (breakfast vs lunch vs dinner vs snack calories) and what to optimize.",
  "hydrationNote": "1 sentence about their hydration relative to ${profile.waterGoalMl}ml daily goal.",
  "workoutNutritionSync": "1-2 sentences analyzing if their workout frequency (${monthStats.workoutDays} days) and calorie burn (${monthStats.burned} kcal) syncs well with their nutrition intake.",
  "nextMonthGoal": "A concrete, specific, measurable milestone for next month with a number target.",
  "motivationalQuote": "A short motivational fitness/nutrition quote to end on a high note."
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (res.status === 429) {
        throw new Error("AI model is currently busy or out of daily quota. Please try again later!");
      }

      const rawText = await res.text();
      const resultData = JSON.parse(rawText);

      if (resultData.error) throw new Error(resultData.error.message || 'Gemini API Error');

      const modelOutput = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanedJson = modelOutput.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsed: MonthlyAIAnalysis = JSON.parse(cleanedJson);
      setMonthlyData(parsed);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      } catch (e) {
        console.warn('Failed to cache monthly report', e);
      }

      if (parsed.consistencyScore >= 80) {
        setTimeout(() => {
          confetti({ particleCount: 300, spread: 150, origin: { y: 0.5 }, colors: ['#10b981', '#34d399', '#fcd34d'] });
        }, 300);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate monthly AI summary.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: trend icon
  const TrendIcon = ({ value, target }: { value: number; target: number }) => {
    const pct = target > 0 ? (value / target) * 100 : 0;
    if (pct >= 90 && pct <= 110) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (pct > 110) return <TrendingUp className="w-3.5 h-3.5 text-amber-400" />;
    return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
  };

  // Helper: progress bar
  const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  // Meal type icon
  const MealIcon = ({ mealType }: { mealType: string }) => {
    switch (mealType) {
      case 'breakfast': return <Coffee className="w-4 h-4" />;
      case 'lunch': return <Sun className="w-4 h-4" />;
      case 'dinner': return <Moon className="w-4 h-4" />;
      case 'snack': return <Apple className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-300 ${animateIn ? 'bg-slate-950/85 backdrop-blur-md opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
        <div className={`relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-12'}`}>

          {/* Header */}
          <div className="shrink-0 px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100">Monthly Macro Audit</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">{monthStats.monthLabel} · {monthStats.loggedDays}/{monthStats.daysElapsed} days logged</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {monthlyData && !loading && (
                <button
                  type="button"
                  onClick={handleShareReport}
                  className="py-1.5 px-2.5 sm:py-2 sm:px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Share Report"
                >
                  {shareCopied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
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
                  now.setMonth(now.getMonth() - 1);
                  setSelectedDate(formatDateKey(now));
                }}
                className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 text-slate-400 hover:text-slate-200 transition-all cursor-pointer shrink-0"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Last Month</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(formatDateKey(new Date()))}
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
                <span>Month Picker</span>
              </button>
            </div>

            {/* Perfect Days & Logging Streak Banner */}
            {monthStats.loggedDays > 0 && (
              <div className="flex items-center gap-2">
                {monthStats.perfectDays > 0 && (
                  <div className="flex-1 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{monthStats.perfectDays} Perfect Day{monthStats.perfectDays !== 1 ? 's' : ''}!</span>
                  </div>
                )}
                <div className="flex-1 p-3 bg-slate-950 border border-slate-800/90 rounded-2xl flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-300">{monthStats.loggedDays}/{monthStats.daysElapsed} Days Tracked</span>
                </div>
              </div>
            )}

            {/* Main Macro Grid — 4 cards with progress bars */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">CALORIES</span>
                  <TrendIcon value={monthStats.cals} target={monthStats.targetCals} />
                </div>
                <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 block">{monthStats.cals.toLocaleString()} / {monthStats.targetCals.toLocaleString()}</span>
                <ProgressBar value={monthStats.cals} max={monthStats.targetCals} color="bg-emerald-500" />
                <span className="text-[10px] text-slate-500 font-mono">Avg {monthStats.avgDailyCals}/day · ±{monthStats.calStdDev} variation</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">PROTEIN</span>
                  <TrendIcon value={monthStats.protein} target={monthStats.targetProtein} />
                </div>
                <span className="text-sm sm:text-base font-extrabold font-mono text-cyan-400 block">{monthStats.protein}g / {monthStats.targetProtein}g</span>
                <ProgressBar value={monthStats.protein} max={monthStats.targetProtein} color="bg-cyan-500" />
                <span className="text-[10px] text-slate-500 font-mono">Avg {monthStats.avgDailyProt}g/day</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">CARBS</span>
                  <TrendIcon value={monthStats.carbs} target={monthStats.targetCarbs} />
                </div>
                <span className="text-sm sm:text-base font-extrabold font-mono text-amber-400 block">{monthStats.carbs}g / {monthStats.targetCarbs}g</span>
                <ProgressBar value={monthStats.carbs} max={monthStats.targetCarbs} color="bg-amber-500" />
                <span className="text-[10px] text-slate-500 font-mono">Avg {monthStats.avgDailyCarbs}g/day</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">FAT</span>
                  <TrendIcon value={monthStats.fat} target={monthStats.targetFat} />
                </div>
                <span className="text-sm sm:text-base font-extrabold font-mono text-rose-400 block">{monthStats.fat}g / {monthStats.targetFat}g</span>
                <ProgressBar value={monthStats.fat} max={monthStats.targetFat} color="bg-rose-500" />
                <span className="text-[10px] text-slate-500 font-mono">Avg {monthStats.avgDailyFat}g/day</span>
              </div>
            </div>

            {/* Macro Split & Adherence Strip */}
            {monthStats.loggedDays > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Macro Split</span>
                  <span className="text-xs font-bold font-mono text-slate-200 block">
                    <span className="text-cyan-400">{monthStats.proteinPct}%</span> / <span className="text-amber-400">{monthStats.carbsPct}%</span> / <span className="text-rose-400">{monthStats.fatPct}%</span>
                  </span>
                  <span className="text-[9px] text-slate-500 block">P / C / F</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cal Adherence</span>
                  <span className={`text-sm font-extrabold font-mono block ${monthStats.calAdherence >= 70 ? 'text-emerald-400' : monthStats.calAdherence >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{monthStats.calAdherence}%</span>
                  <span className="text-[9px] text-slate-500 block">of days on target</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Prot Adherence</span>
                  <span className={`text-sm font-extrabold font-mono block ${monthStats.protAdherence >= 70 ? 'text-emerald-400' : monthStats.protAdherence >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{monthStats.protAdherence}%</span>
                  <span className="text-[9px] text-slate-500 block">of days on target</span>
                </div>
              </div>
            )}

            {/* Secondary Stats: Fiber, Water, Workouts, Burned */}
            {monthStats.loggedDays > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                  <Heart className="w-4 h-4 text-green-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 uppercase block">Fiber</span>
                  <span className="text-xs font-bold font-mono text-green-400">{monthStats.avgDailyFiber}g/day</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                  <Droplets className="w-4 h-4 text-blue-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 uppercase block">Water</span>
                  <span className="text-xs font-bold font-mono text-blue-400">{monthStats.avgDailyWater}ml/day</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                  <Dumbbell className="w-4 h-4 text-orange-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 uppercase block">Workouts</span>
                  <span className="text-xs font-bold font-mono text-orange-400">{monthStats.workoutDays} sessions</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                  <Flame className="w-4 h-4 text-red-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 uppercase block">Burned</span>
                  <span className="text-xs font-bold font-mono text-red-400">{monthStats.burned.toLocaleString()} kcal</span>
                </div>
              </div>
            )}

            {/* Best / Highest / Lowest Day Cards */}
            {monthStats.loggedDays > 0 && (monthStats.bestDay || monthStats.highestCalDay || monthStats.lowestCalDay) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {monthStats.bestDay && (
                  <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase">
                      <Trophy className="w-3.5 h-3.5" /> Best Day
                    </div>
                    <span className="text-xs font-mono text-slate-200 block">{monthStats.bestDay.date}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{monthStats.bestDay.calories} kcal · {monthStats.bestDay.protein}g P</span>
                  </div>
                )}
                {monthStats.highestCalDay && (
                  <div className="p-3 bg-slate-950 border border-amber-500/20 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase">
                      <TrendingUp className="w-3.5 h-3.5" /> Highest Cal Day
                    </div>
                    <span className="text-xs font-mono text-slate-200 block">{monthStats.highestCalDay.date}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{monthStats.highestCalDay.calories} kcal · {monthStats.highestCalDay.protein}g P</span>
                  </div>
                )}
                {monthStats.lowestCalDay && (
                  <div className="p-3 bg-slate-950 border border-blue-500/20 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase">
                      <TrendingDown className="w-3.5 h-3.5" /> Lowest Cal Day
                    </div>
                    <span className="text-xs font-mono text-slate-200 block">{monthStats.lowestCalDay.date}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{monthStats.lowestCalDay.calories} kcal · {monthStats.lowestCalDay.protein}g P</span>
                  </div>
                )}
              </div>
            )}

            {/* Weekly Trends */}
            {monthStats.weekSummaries.length > 0 && (
              <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Weekly Trends &amp; Goal Alignment
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    Target: {profile.goal === 'lose_weight' ? 'Deficit' : profile.goal === 'gain_muscle' ? 'Surplus' : 'Maintenance'}
                  </span>
                </div>
                <div className="space-y-2">
                  {monthStats.weekSummaries.map((week, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{week.weekLabel}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{week.loggedDays}d logged</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          week.goalStatus === 'crushed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : week.goalStatus === 'on_track'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {week.goalSummaryText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-emerald-400">{week.avgCalories} kcal/d</span>
                          <span className="font-mono text-cyan-400">{week.avgProtein}g P/d</span>
                        </div>
                        {week.totalBurned > 0 && (
                          <span className="font-mono text-orange-400 text-[10px]">🔥 {week.totalBurned} kcal burned</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Type Breakdown (collapsible) */}
            {monthStats.mealBreakdown.length > 0 && (
              <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                <button
                  type="button"
                  onClick={() => setShowMealBreakdown(!showMealBreakdown)}
                  className="w-full text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Pizza className="w-4 h-4" /> Meal Distribution ({monthStats.mealBreakdown.length} meal types)
                  </span>
                  {showMealBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showMealBreakdown && (
                  <div className="space-y-2 pt-1">
                    {monthStats.mealBreakdown.map((meal, idx) => {
                      const mealCalPct = monthStats.cals > 0 ? Math.round((meal.totalCalories / monthStats.cals) * 100) : 0;
                      return (
                        <div key={idx} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-200">
                              <MealIcon mealType={meal.mealType} />
                              <span className="font-semibold text-xs capitalize">{meal.mealType}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({meal.itemCount} items)</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-300">{mealCalPct}% of cals</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
                            <span className="text-emerald-400">{meal.totalCalories} kcal</span>
                            <span className="text-cyan-400">{meal.totalProtein}g P</span>
                            <span className="text-amber-400">{meal.totalCarbs}g C</span>
                            <span className="text-rose-400">{meal.totalFat}g F</span>
                          </div>
                          <ProgressBar value={meal.totalCalories} max={monthStats.cals} color="bg-pink-500/70" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs sm:text-sm text-rose-300 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {monthStats.loggedDays === 0 ? (
              <div className="p-10 sm:p-14 bg-slate-950 border border-slate-800/90 rounded-3xl text-center space-y-3">
                <Flame className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base sm:text-lg font-bold text-slate-200">No meals logged for {monthStats.monthLabel}</h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">Use the Month Picker above to choose another month or log meals.</p>
              </div>
            ) : (
              <>
                {/* Top Foods (3 categories) */}
                <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowAllFoods(!showAllFoods)}
                    className="w-full text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Utensils className="w-4 h-4" /> What You Ate ({monthStats.eatenFoods.length} items across {monthStats.loggedDays} days)
                    </span>
                    {showAllFoods ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Most Frequent Foods */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">🔄 Most Frequent</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {monthStats.mostFrequent.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs gap-2">
                          <div className="truncate min-w-0">
                            <span className="font-semibold text-slate-100 truncate block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{Math.round(item.count * 10) / 10}x · {item.totalCalories} kcal</span>
                          </div>
                          <span className="font-mono font-bold text-cyan-400 shrink-0">+{item.totalProtein}g P</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Protein Foods */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">💪 Top Protein Sources</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {monthStats.topProteinFoods.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900/90 rounded-xl border border-cyan-500/20 flex items-center justify-between text-xs gap-2">
                          <div className="truncate min-w-0">
                            <span className="font-semibold text-slate-100 truncate block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.totalCalories} kcal total</span>
                          </div>
                          <span className="font-mono font-bold text-cyan-400 shrink-0">{item.totalProtein}g P</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* All Foods (collapsible) */}
                  {showAllFoods && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">📋 All Foods Logged</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                        {monthStats.eatenFoods.map((item, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs gap-2">
                            <div className="truncate min-w-0">
                              <span className="font-semibold text-slate-100 truncate block">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{Math.round(item.count * 10) / 10}x · {item.totalCalories} kcal · {item.totalCarbs}g C · {item.totalFat}g F</span>
                            </div>
                            <span className="font-mono font-bold text-cyan-400 shrink-0">+{item.totalProtein}g P</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Day-by-Day Breakdown (collapsible) */}
                {monthStats.dayDetails.length > 0 && (
                  <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowDayBreakdown(!showDayBreakdown)}
                      className="w-full text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Day-by-Day Breakdown ({monthStats.dayDetails.length} days)
                      </span>
                      {showDayBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showDayBreakdown && (
                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {monthStats.dayDetails.map((day, idx) => (
                          <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs gap-2 ${day.hitCalories && day.hitProtein ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/90 border-slate-800/80'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              {day.hitCalories && day.hitProtein ? (
                                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="font-mono text-slate-300">{day.date}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{day.itemCount} items</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-emerald-400">{day.calories}</span>
                              <span className="font-mono text-cyan-400">{day.protein}g P</span>
                              {day.workoutsBurned > 0 && <span className="font-mono text-orange-400 text-[10px]">🔥{day.workoutsBurned}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Loading State */}
                {loading && (
                  <div className="p-10 bg-slate-950 border border-slate-800/90 rounded-3xl flex flex-col items-center justify-center space-y-3 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-sm font-bold text-slate-200">Generating Comprehensive Monthly AI Audit...</p>
                    <p className="text-[11px] text-slate-500">Analyzing {monthStats.loggedDays} days of data with {monthStats.eatenFoods.length} food items...</p>
                  </div>
                )}

                {/* CTA to generate */}
                {!monthlyData && !loading && (
                  <div className="p-6 bg-slate-950 border border-slate-800/90 rounded-3xl text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs sm:text-sm text-slate-400">Tap <strong className="text-emerald-400">Regenerate Report</strong> below to run full AI coaching analysis on this month.</p>
                    <p className="text-[10px] text-slate-500">Includes trend analysis, strengths, weaknesses, meal timing insights, and a personalized next-month goal.</p>
                  </div>
                )}

                {/* AI Analysis Results */}
                {monthlyData && !loading && (
                  <div className="space-y-4">

                    {/* Score + Headline */}
                    <div className="p-5 bg-slate-950 border border-emerald-500/30 rounded-3xl flex flex-col sm:flex-row items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex flex-col items-center justify-center shrink-0">
                        <span className="text-2xl font-extrabold font-mono text-emerald-400">{monthlyData.consistencyScore}</span>
                        <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">Score</span>
                      </div>
                      <div className="space-y-1.5 text-center sm:text-left">
                        <h4 className="text-base sm:text-lg font-bold text-slate-100">{monthlyData.monthlyHeadline}</h4>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{monthlyData.trendSummary}</p>
                      </div>
                    </div>

                    {/* Macro Balance Insight */}
                    {monthlyData.macroBalance && (
                      <div className="p-4 bg-slate-950 border border-violet-500/25 rounded-2xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-violet-400 font-bold text-xs uppercase">
                          <Percent className="w-4 h-4" /> Macro Balance Analysis
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{monthlyData.macroBalance}</p>
                      </div>
                    )}

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {monthlyData.topStrengths && monthlyData.topStrengths.length > 0 && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/20 space-y-2">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase">
                            <CheckCircle2 className="w-4 h-4" /> Your Strengths
                          </div>
                          <ul className="space-y-1.5">
                            {monthlyData.topStrengths.map((str, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">✓</span>
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {monthlyData.topWeaknesses && monthlyData.topWeaknesses.length > 0 && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/20 space-y-2">
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs uppercase">
                            <Ban className="w-4 h-4" /> Areas to Improve
                          </div>
                          <ul className="space-y-1.5">
                            {monthlyData.topWeaknesses.map((weak, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <span className="text-rose-400 mt-0.5">•</span>
                                <span>{weak}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Habit to Fix */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/25 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase"><Zap className="w-4 h-4" /> #1 Habit to Fix</div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{monthlyData.topHabitToFix}</p>
                    </div>

                    {/* Meal Timing + Hydration + Workout Sync */}
                    <div className="grid grid-cols-1 gap-3">
                      {monthlyData.mealTimingInsight && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-pink-400 font-bold text-xs uppercase"><Clock className="w-4 h-4" /> Meal Timing</div>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{monthlyData.mealTimingInsight}</p>
                        </div>
                      )}
                      {monthlyData.hydrationNote && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase"><Droplets className="w-4 h-4" /> Hydration</div>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{monthlyData.hydrationNote}</p>
                        </div>
                      )}
                      {monthlyData.workoutNutritionSync && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs uppercase"><Activity className="w-4 h-4" /> Workout × Nutrition Sync</div>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{monthlyData.workoutNutritionSync}</p>
                        </div>
                      )}
                    </div>

                    {/* Next Month Goal */}
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-3">
                      <Target className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide block">Next Month Goal</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{monthlyData.nextMonthGoal}</p>
                      </div>
                    </div>

                    {/* Motivational Quote */}
                    {monthlyData.motivationalQuote && (
                      <div className="p-4 bg-slate-950 border border-slate-700/50 rounded-2xl text-center">
                        <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">&ldquo;{monthlyData.motivationalQuote}&rdquo;</p>
                        <span className="text-[10px] text-slate-600 mt-1 block">— AI Coach</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center gap-3 z-10">
            <button
              type="button"
              disabled={monthStats.loggedDays === 0 || loading}
              onClick={() => {
                try {
                  localStorage.removeItem(cacheKey);
                } catch {
                  // ignore
                }
                generateMonthlySummary();
              }}
              className={`flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors ${monthStats.loggedDays === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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

      {/* Calendar Modal configured in months mode */}
      {isCalendarModalOpen && (
        <CalendarModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          currentDate={selectedDate}
          onDateChange={(chosenDate: string) => {
            setSelectedDate(chosenDate);
            setIsCalendarModalOpen(false);
          }}
          logs={logs}
          profile={profile}
          initialMode="months"
        />
      )}
    </>
  );
};

export default MonthlyReportCard;
