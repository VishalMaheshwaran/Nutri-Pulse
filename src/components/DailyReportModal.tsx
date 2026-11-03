// src/components/DailyReportModal.tsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Ban,
  ArrowRightLeft,
  Target,
  Flame,
  Calendar,
  Trophy,
  Activity,
  ChevronDown,
  Share2,
  Check
} from 'lucide-react';
import { DailyLog, UserProfile } from '../types/nutrition';
import { calculateTotals, getTodayDateString } from '../services/storage';
import { getStoredApiKey } from '../utils/geminiStorage';
import { CalendarModal } from './CalendarModal'; 

interface DailyReportModalProps {
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface AIReportData {
  headline: string;
  score: number;
  goalSummary: string;
  whatWentWell: string[];
  foodsToAvoid: {
    foodName: string;
    reason: string;
    swapSuggestion: string;
  }[];
  coachTipForToday: string;
}

const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  logs,
  profile,
  isOpen,
  onClose,
}) => {
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const [targetDate, setTargetDate] = useState<string>(yesterdayStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [report, setReport] = useState<AIReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoOpened, setAutoOpened] = useState<boolean>(false);
  const [animateIn, setAnimateIn] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const selectedLog: DailyLog = logs[targetDate] || {
    date: targetDate,
    items: [],
    waterIntakeMl: 0,
    workouts: [],
  };

  const totals = calculateTotals(selectedLog.items);
  const burnedCalories = (selectedLog.workouts || []).reduce(
    (sum, w) => sum + w.caloriesBurned,
    0
  );
  const hasWorkouts = (selectedLog.workouts || []).length > 0;

  const dayTargetCals = selectedLog.targetCalories ?? profile.targetCalories ?? 2000;
  const dayTargetProtein = selectedLog.targetProtein ?? profile.targetProtein ?? 120;
  const effectiveBudget = dayTargetCals + burnedCalories;

  const hitProtein = totals.protein >= dayTargetProtein * 0.95;
  let hitCalories = false;

  if (profile.goal === 'lose_weight') {
    hitCalories = totals.calories > 0 && totals.calories <= effectiveBudget + 25;
  } else if (profile.goal === 'gain_muscle') {
    hitCalories = totals.calories >= effectiveBudget * 0.95 && totals.calories <= effectiveBudget + 200;
  } else {
    hitCalories = Math.abs(totals.calories - effectiveBudget) <= 150;
  }

  const isPerfectDay = hitProtein && hitCalories && selectedLog.items.length > 0;

  const goalLabels: Record<string, string> = {
    lose_weight: 'Fat Loss / Caloric Deficit',
    gain_muscle: 'Muscle Build / Lean Bulk',
    maintain: 'Weight Maintenance & Recomposition',
  };

  const cacheKey = `nutripulse_ai_report_${targetDate}_${profile.goal}`;
  const shouldShow = isOpen || (autoOpened && !loading && report !== null);

  useEffect(() => {
    if (shouldShow) {
      setTimeout(() => setAnimateIn(true), 50);

      if (isPerfectDay) {
        setTimeout(() => {
          confetti({
            particleCount: 400,
            spread: 90,
            origin: { x: 0.5, y: 1 }, 
            startVelocity: 95, 
            colors: ['#fbbf24', '#34d399', '#38bdf8', '#f43f5e'],
            scalar: 1.2, 
            ticks: 500,
            zIndex: 9999, 
          });
        }, 350);
      }
    } else {
      setAnimateIn(false);
    }
  }, [shouldShow, isPerfectDay]);

  useEffect(() => {
    if (autoOpened && error && !isOpen) {
      setAutoOpened(false);
    }
  }, [error, autoOpened, isOpen]);

  useEffect(() => {
    if (!isOpen && !autoOpened) return;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setReport(JSON.parse(cached));
        setError(null);
        return;
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    if (selectedLog.items.length > 0) {
      generateAIReport();
    } else {
      setReport(null);
    }
  }, [isOpen, autoOpened, targetDate, profile.goal]);

  useEffect(() => {
    const seenTodayKey = `nutripulse_report_seen_${todayStr}`;
    const alreadySeen = localStorage.getItem(seenTodayKey);
    const yesterdayHasItems = (logs[yesterdayStr]?.items?.length || 0) > 0;

    if (!alreadySeen && yesterdayHasItems && getStoredApiKey()) {
      localStorage.setItem(seenTodayKey, 'true');
      setTargetDate(yesterdayStr);
      setAutoOpened(true);
    }
  }, [todayStr, yesterdayStr, logs]);

  const handleShareReport = async () => {
    if (!report) return;

    const shareText = `🥗 Daily Nutrition Report (${targetDate})\n` +
      `🔥 Score: ${report.score}/100\n` +
      `📌 "${report.headline}"\n\n` +
      `• Calories: ${Math.round(totals.calories)} / ${dayTargetCals} kcal\n` +
      `• Protein: ${Math.round(totals.protein)} / ${dayTargetProtein}g\n` +
      `• Workouts Burned: ${burnedCalories} kcal\n\n` +
      `💡 Coach Tip:\n${report.coachTipForToday}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Daily Nutrition Report - ${targetDate}`,
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

  const generateAIReport = async () => {
    if (selectedLog.items.length === 0) {
      setError('No food items logged for this date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = getStoredApiKey();
      if (!apiKey) {
        throw new Error('No Gemini API key found. Add your key in Profile Settings.');
      }

      const foodListText = selectedLog.items
        .map(
          (item) =>
            `- [${item.mealType.toUpperCase()}] ${item.name} (${item.servings}x ${item.servingSize || 'serving'}): ${Math.round(item.calories * item.servings)} kcal, P: ${Math.round(item.protein * item.servings)}g, C: ${Math.round(item.carbs * item.servings)}g, F: ${Math.round(item.fat * item.servings)}g`
        )
        .join('\n');

      const workoutListText = (selectedLog.workouts && selectedLog.workouts.length > 0)
        ? selectedLog.workouts
            .map(w => `- ${w.description}: ${w.durationMinutes} mins, ${w.caloriesBurned} kcal burned, Avg BPM: ${w.avgBpm || 'N/A'}`)
            .join('\n')
        : 'No workouts logged today.';

      const prompt = `You are an elite sports nutritionist and fitness coach analyzing a user's daily log.

USER PROFILE & GOAL:
- Active Goal: ${goalLabels[profile.goal] || profile.goal}
- Daily Targets: ${profile.targetCalories} kcal | Protein: ${profile.targetProtein}g

ACTUAL INTAKE FOR ${targetDate}:
- Total Calories Eaten: ${Math.round(totals.calories)} kcal (Burned from workouts: ${burnedCalories} kcal)
- Net Calories: ${Math.round(totals.calories) - burnedCalories} kcal
- Macros: Protein ${Math.round(totals.protein)}g | Carbs ${Math.round(totals.carbs)}g | Fat ${Math.round(totals.fat)}g

LOGGED WORKOUTS:
${workoutListText}

LOGGED FOODS:
${foodListText}

Analyze both their nutrition and training effort relative to their goal. Return ONLY a valid, minified JSON object (no markdown formatting, no backticks) with these exact keys:
{
  "headline": "Short punchy custom title celebrating their progress",
  "score": 88,
  "goalSummary": "2 sentences analyzing performance for this date.",
  "whatWentWell": ["Specific win 1", "Specific win 2"],
  "foodsToAvoid": [
    {
      "foodName": "Exact name of a suboptimal food from their log",
      "reason": "Why this hurts their goal",
      "swapSuggestion": "A better food swap"
    }
  ],
  "coachTipForToday": "One concrete action item for today."
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const rawText = await res.text();
      const resultData = JSON.parse(rawText);

      if (resultData.error) {
        throw new Error(resultData.error.message || 'Gemini API Error');
      }

      const modelOutput = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanedJson = modelOutput.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsed: AIReportData = JSON.parse(cleanedJson);
      setReport(parsed);
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI report.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAutoOpened(false);
    setAnimateIn(false);
    setTimeout(onClose, 300);
  };

  const isCustomDate = targetDate !== todayStr && targetDate !== yesterdayStr;
  const customDateLabel = new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (!isOpen && !autoOpened) return null;

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-300 ${animateIn ? 'bg-slate-950/85 backdrop-blur-md opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
        <div
          className={`relative w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${
            animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
          }`}
        >
          <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  Daily AI Nutrition Report
                </h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {targetDate === yesterdayStr 
                    ? "Yesterday's Recap" 
                    : targetDate === todayStr 
                    ? "Today's Live Report" 
                    : new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {report && !loading && (
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
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {isPerfectDay && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2.5 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.15)] mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">Perfect Day Achieved!</span>
              </div>
            )}
            
            {/* Quick Date Switcher */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetDate(yesterdayStr)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    targetDate === yesterdayStr
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setTargetDate(todayStr)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    targetDate === todayStr
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Today
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isCustomDate
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-900 border border-slate-700/60 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 ${isCustomDate ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="truncate">{customDateLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ${isCustomDate ? 'text-slate-900' : 'text-slate-500'}`} />
                </button>
              </div>
            </div>

            {selectedLog.items.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    isPerfectDay
                      ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 opacity-70'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPerfectDay
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Compliance</span>
                    <strong className={`text-xs sm:text-sm font-bold ${isPerfectDay ? 'text-amber-400' : 'text-slate-300'}`}>
                      {isPerfectDay ? '⭐ Perfect Day!' : 'Good Effort'}
                    </strong>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    hasWorkouts
                      ? 'bg-orange-500/15 border-orange-500/40 shadow-lg shadow-orange-500/10'
                      : 'bg-slate-950 border-slate-800 opacity-70'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      hasWorkouts
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Training</span>
                    <strong className={`text-xs sm:text-sm font-bold ${hasWorkouts ? 'text-orange-400' : 'text-slate-400'}`}>
                      {hasWorkouts ? '🔥 Worked Out!' : 'Rest Day'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase mb-0.5 block">Calories</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400">
                  {Math.round(totals.calories)} / {dayTargetCals}
                </span>
              </div>
              <div className="p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase mb-0.5 block">Protein</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-cyan-400">
                  {Math.round(totals.protein)}g / {dayTargetProtein}g
                </span>
              </div>
              <div className="p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase mb-0.5 block">Carbs</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-amber-400">
                  {Math.round(totals.carbs)}g / {profile.targetCarbs}g
                </span>
              </div>
              <div className="p-2.5 sm:p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase mb-0.5 block">Fat</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-rose-400">
                  {Math.round(totals.fat)}g / {profile.targetFat}g
                </span>
              </div>
            </div>

            {selectedLog.items.length === 0 && !loading && (
              <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
                <Flame className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  No meals logged for {targetDate}
                </p>
                <p className="text-xs text-slate-500">
                  Select another date above where you have meals logged to view its report.
                </p>
              </div>
            )}

            {loading && (
              <div className="p-10 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm font-bold text-slate-200">
                  Analyzing {targetDate} log with AI Coach...
                </p>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {report && !loading && selectedLog.items.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                      AI Verdict ({targetDate})
                    </span>
                    <h4 className="text-base font-bold text-slate-100">
                      {report.headline}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {report.goalSummary}
                    </p>
                  </div>
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold font-mono text-emerald-400">
                      {report.score}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">/100</span>
                  </div>
                </div>

                {report.foodsToAvoid && report.foodsToAvoid.length > 0 && (
                  <div className="p-4 bg-slate-950 border border-rose-500/30 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <Ban className="w-4 h-4" />
                      Foods to Limit / Avoid
                    </div>
                    <div className="space-y-2.5">
                      {report.foodsToAvoid.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5"
                        >
                          <div className="text-xs font-bold text-rose-300">
                            {item.foodName}
                          </div>
                          <p className="text-xs text-slate-400">{item.reason}</p>
                          <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                            <span>Swap: {item.swapSuggestion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.whatWentWell && report.whatWentWell.length > 0 && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      What You Nailed
                    </div>
                    <ul className="space-y-1.5">
                      {report.whatWentWell.map((win, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-300 flex items-start gap-2"
                        >
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-3">
                  <Target className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide block">
                      Coach Action Plan
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {report.coachTipForToday}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 p-4 sm:px-6 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(cacheKey);
                generateAIReport();
              }}
              disabled={loading || selectedLog.items.length === 0}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Regenerate Report
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Close &amp; Start Day
            </button>
          </div>
        </div>
      </div>

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentDate={targetDate}
        onDateChange={setTargetDate}
        logs={logs}
        profile={profile}
      />
    </>
  );
};