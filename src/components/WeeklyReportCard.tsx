// src/components/WeeklyReportCard.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, AlertCircle, Award, Zap, Calendar as CalendarIcon, X, Activity, TrendingUp, CheckCircle2, Target, Flame, Share2, Check } from 'lucide-react';
import { DailyLog, UserProfile } from '../types/nutrition';
import { calculateTotals, getTodayDateString } from '../services/storage';
import { getStoredApiKey } from '../utils/geminiStorage';
import { useTheme } from '../hooks/useTheme';
import { CalendarModal } from './CalendarModal';

interface WeeklyReportCardProps {
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface DetailedWeeklyAnalysis {
  weeklyHeadline: string;
  avgCalories: number;
  avgProtein: number;
  avgBurned: number;
  totalWorkouts: number;
  consistencyScore: number;
  macroAdherenceScore: number;
  trainingConsistencyScore: number;
  trendSummary: string;
  topWins: string[];
  topHabitsToFix: string[];
  nextWeekActionPlan: string[];
  dateRangeStr: string;
}

// Persistent module-level cache so reports survive closing/re-opening the modal entirely
const globalWeeklyCache: Record<string, DetailedWeeklyAnalysis> = {};

export const WeeklyReportCard: React.FC<WeeklyReportCardProps> = ({ logs, profile, isOpen, onClose }) => {
  const { t } = useTheme();
  
  const [weeklyAnalyses, setWeeklyAnalyses] = useState<Record<string, DetailedWeeklyAnalysis>>(globalWeeklyCache);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [animateIn, setAnimateIn] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  const getRecentMonday = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now);
    mon.setDate(diffToMonday);
    mon.setHours(0, 0, 0, 0);
    return mon.toISOString().split('T')[0];
  };

  const [selectedStartDate, setSelectedStartDate] = useState<string>(getRecentMonday);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setTimeout(() => setAnimateIn(true), 10);
      setError(null);
      setIsCalendarModalOpen(false);
      setShareCopied(false);
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const formatDDMM = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const currentWeekDatesInfo = useMemo(() => {
    const start = new Date(selectedStartDate + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const rangeStr = `${formatDDMM(startStr)} – ${formatDDMM(endStr)}`;

    return { 
      dates: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d.toISOString().split('T')[0];
      }), 
      rangeStr 
    };
  }, [selectedStartDate]);

  const validateMondaySelection = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 1) {
      return { selectable: false, message: "That weekdays only start on Monday ;)" };
    }
    return { selectable: true };
  };

  const handleDateSelection = (dateStr: string) => {
    setError(null);
    setSelectedStartDate(dateStr);
  };

  const handleShareReport = async () => {
    const data = weeklyAnalyses[selectedStartDate];
    if (!data) return;

    const shareText = `📊 Weekly Nutrition Verdict (${data.dateRangeStr})\n` +
      `🔥 Score: ${data.consistencyScore}/100\n` +
      `📌 "${data.weeklyHeadline}"\n\n` +
      `• Avg Calories: ${data.avgCalories} kcal\n` +
      `• Avg Protein: ${data.avgProtein}g\n` +
      `• Workouts: ${data.totalWorkouts} sessions\n\n` +
      `💡 Next Week Focus:\n${(data.nextWeekActionPlan || []).map((step, idx) => `${idx + 1}. ${step}`).join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Weekly Nutrition Verdict',
          text: shareText,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
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

  const generateWeeklySummary = async (targetStartDate?: string) => {
    const startDateToUse = targetStartDate || selectedStartDate;
    setLoading(true);
    setError(null);

    try {
      const apiKey = getStoredApiKey();
      if (!apiKey) {
        throw new Error('No Gemini API key found. Add your key in Profile Settings.');
      }

      const { dates, rangeStr } = currentWeekDatesInfo;
      let totalCals = 0;
      let totalProtein = 0;
      let loggedDaysCount = 0;
      let totalBurnedCals = 0;
      let totalWorkouts = 0;
      const dailySummaries: string[] = [];

      dates.forEach((dateStr) => {
        const dayLog = logs[dateStr];
        if (dayLog && dayLog.items && dayLog.items.length > 0) {
          const totals = calculateTotals(dayLog.items);
          totalCals += totals.calories || 0;
          totalProtein += totals.protein || 0;
          loggedDaysCount++;

          const workouts = dayLog.workouts || [];
          const burnedToday = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
          totalBurnedCals += burnedToday;
          totalWorkouts += workouts.length;

          dailySummaries.push(
            `- ${dateStr}: Eaten ${Math.round(totals.calories || 0)} kcal, Burned ${burnedToday} kcal, Protein ${Math.round(totals.protein || 0)}g, Workouts: ${workouts.length}`
          );
        }
      });

      if (loggedDaysCount === 0) {
        throw new Error('No food logs found for this selected week. Log some meals first!');
      }

      const avgCals = Math.round(totalCals / loggedDaysCount);
      const avgProt = Math.round(totalProtein / loggedDaysCount);
      const avgBurned = Math.round(totalBurnedCals / loggedDaysCount);

      const prompt = `You are an elite sports nutritionist conducting a weekly review.

USER PROFILE & TARGETS:
- Goal: ${profile.goal || 'maintain'}
- Target Daily Calories: ${profile.targetCalories || 2000} kcal
- Target Daily Protein: ${profile.targetProtein || 120}g

WEEKLY DATA (${loggedDaysCount} active days logged):
- Average Daily Calories Eaten: ${avgCals} kcal
- Average Daily Calories Burned: ${avgBurned} kcal
- Total Workout Sessions: ${totalWorkouts}
- Average Daily Protein: ${avgProt}g

Daily Breakdown:
${dailySummaries.join('\n')}

Analyze compliance and performance. Return ONLY a valid JSON object matching these exact keys:
{
  "weeklyHeadline": "Short punchy headline summarizing performance",
  "avgCalories": ${avgCals},
  "avgProtein": ${avgProt},
  "avgBurned": ${avgBurned},
  "totalWorkouts": ${totalWorkouts},
  "consistencyScore": 88,
  "macroAdherenceScore": 85,
  "trainingConsistencyScore": 90,
  "trendSummary": "3 sentences analyzing how intake and training align with their goal.",
  "topWins": ["Win 1", "Win 2"],
  "topHabitsToFix": ["Primary bottleneck 1", "Adjustment 2"],
  "nextWeekActionPlan": ["Action 1", "Action 2", "Action 3"]
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
      let resultData;
      try {
        resultData = JSON.parse(rawText);
      } catch (e) {
        throw new Error('Could not parse server response.');
      }

      if (resultData.error) {
        throw new Error(resultData.error.message || 'Gemini API Error');
      }

      const modelOutput = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = modelOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini output did not contain valid JSON structure.');
      }

      const parsedRaw = JSON.parse(jsonMatch[0]);

      const parsed: DetailedWeeklyAnalysis = {
        weeklyHeadline: parsedRaw.weeklyHeadline || 'Weekly Review Completed',
        avgCalories: typeof parsedRaw.avgCalories === 'number' ? parsedRaw.avgCalories : avgCals,
        avgProtein: typeof parsedRaw.avgProtein === 'number' ? parsedRaw.avgProtein : avgProt,
        avgBurned: typeof parsedRaw.avgBurned === 'number' ? parsedRaw.avgBurned : avgBurned,
        totalWorkouts: typeof parsedRaw.totalWorkouts === 'number' ? parsedRaw.totalWorkouts : totalWorkouts,
        consistencyScore: typeof parsedRaw.consistencyScore === 'number' ? parsedRaw.consistencyScore : 80,
        macroAdherenceScore: typeof parsedRaw.macroAdherenceScore === 'number' ? parsedRaw.macroAdherenceScore : 75,
        trainingConsistencyScore: typeof parsedRaw.trainingConsistencyScore === 'number' ? parsedRaw.trainingConsistencyScore : 80,
        trendSummary: parsedRaw.trendSummary || 'Consistent effort recorded over this period.',
        topWins: Array.isArray(parsedRaw.topWins) ? parsedRaw.topWins : ['Maintained consistent food logging'],
        topHabitsToFix: Array.isArray(parsedRaw.topHabitsToFix) ? parsedRaw.topHabitsToFix : ['Optimize hydration & protein spread'],
        nextWeekActionPlan: Array.isArray(parsedRaw.nextWeekActionPlan) ? parsedRaw.nextWeekActionPlan : ['Hit daily protein targets', 'Log all daily meals'],
        dateRangeStr: rangeStr,
      };

      globalWeeklyCache[startDateToUse] = parsed;
      setWeeklyAnalyses({ ...globalWeeklyCache });

      if (parsed.consistencyScore >= 80) {
        setTimeout(() => {
          confetti({
            particleCount: 300,
            spread: 140,
            origin: { y: 0.5 },
            colors: ['#10b981', '#34d399', '#fcd34d', '#38bdf8', '#8b5cf6'],
            scalar: 1.8,
            ticks: 350,
          });
        }, 400);
      }
    } catch (err: any) {
      console.error('Weekly Report Error:', err);
      setError(err.message || 'Failed to generate weekly AI summary.');
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = weeklyAnalyses[selectedStartDate] || null;

  const formattedSelectedDateButtonLabel = useMemo(() => {
    if (!selectedStartDate) return 'Select Monday';
    return formatDDMM(selectedStartDate);
  }, [selectedStartDate]);

  if (!isMounted) return null;

  return (
    <>
      <div className={`fixed inset-0 w-screen h-screen z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-300 ${animateIn ? 'bg-slate-950/85 backdrop-blur-md opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
        <div className={`relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-12'}`}>
          
          {/* Header */}
          <div className="shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-extrabold text-slate-100 truncate">
                  Weekly Verdict
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                  {currentWeekDatesInfo.rangeStr}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {weeklyData && !loading && (
                <button
                  onClick={handleShareReport}
                  className="py-1.5 px-2.5 sm:py-2 sm:px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Share Report"
                >
                  {shareCopied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
                  <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setError(null);
                  setIsCalendarModalOpen(true);
                }}
                className="py-1.5 px-2.5 sm:py-2 sm:px-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[85px] sm:max-w-none">{formattedSelectedDateButtonLabel}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto bg-slate-900/50">
            {error && (
              <div className="m-4 sm:m-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-sm text-rose-300 flex items-center justify-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!weeklyData && !loading && (
              <div className="m-4 sm:m-6 p-8 sm:p-16 bg-slate-950 border border-slate-800 rounded-3xl text-center space-y-5 shadow-inner">
                <CalendarIcon className="w-16 h-16 text-slate-700 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-3xl font-bold text-slate-100">Deep-Dive Nutrition Review</h3>
                  <p className="text-xs sm:text-base text-slate-400 max-w-md mx-auto">
                    Generate an exhaustive AI performance audit powered by <span className="text-emerald-400 font-semibold">Gemini 3.1 Flash Lite</span> starting from week of {formatDDMM(selectedStartDate)}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => generateWeeklySummary()}
                  className="py-3 sm:py-3.5 px-6 sm:px-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Detailed Analysis
                </button>
              </div>
            )}

            {loading && (
              <div className="m-4 sm:m-6 p-12 sm:p-16 bg-slate-950 border border-slate-800 rounded-3xl flex flex-col items-center justify-center space-y-5 text-center shadow-inner">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <RefreshCw className="w-16 h-16 text-emerald-500 animate-spin absolute opacity-30" />
                  <Sparkles className="w-8 h-8 text-emerald-400 absolute animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-100">Gemini 3.1 Flash Lite is Auditing...</h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                    Analyzing macro consistency, calculating energy balance, and building your tailored action playbook.
                  </p>
                </div>
              </div>
            )}

            {weeklyData && !loading && (
              <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-200">
                
                {/* Overview */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 bg-slate-950 p-5 sm:p-8 rounded-3xl border border-slate-800">
                  <div className="shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-emerald-500/10 border-4 border-emerald-500/30 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)] relative">
                    <span className="text-3xl sm:text-5xl font-extrabold font-mono text-emerald-400">
                      {weeklyData.consistencyScore}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-500 uppercase tracking-widest font-bold mt-1">
                      Overall Score
                    </span>
                  </div>

                  <div className="text-center sm:text-left space-y-3 pt-1">
                    <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                      Elite Coach Verdict
                    </span>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-slate-100 leading-tight">
                      {weeklyData.weeklyHeadline}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {weeklyData.trendSummary}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Avg Calories</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-slate-200">{weeklyData.avgCalories} <span className="text-xs text-slate-500 font-normal">kcal</span></span>
                    <span className="text-[10px] text-slate-400 block">Target: {profile.targetCalories ?? 2000}</span>
                  </div>
                  <div className="p-3.5 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Avg Protein</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-cyan-400">{weeklyData.avgProtein}g</span>
                    <span className="text-[10px] text-slate-400 block">Target: {profile.targetProtein ?? 120}g</span>
                  </div>
                  <div className="p-3.5 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Workouts</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-orange-400">{weeklyData.totalWorkouts} <span className="text-xs text-slate-500 font-normal">sessions</span></span>
                  </div>
                  <div className="p-3.5 sm:p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Avg Burned</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-amber-400">{weeklyData.avgBurned} <span className="text-xs text-slate-500 font-normal">kcal</span></span>
                  </div>
                </div>

                {/* Macros */}
                <div className="p-5 sm:p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-400" /> Macro Adherence Rating
                    </h4>
                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">{weeklyData.macroAdherenceScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, weeklyData.macroAdherenceScore)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-2">
                    Your caloric intake averaged {weeklyData.avgCalories} kcal with {weeklyData.avgProtein}g of daily protein. Staying within this window directly supports your active goal of <span className="text-slate-200 font-semibold">{(profile.goal || '').replace('_', ' ')}</span>.
                  </p>
                </div>

                <div className="p-5 sm:p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Nutritional Wins This Week
                  </h4>
                  <ul className="space-y-2.5">
                    {(weeklyData.topWins || []).map((win, i) => (
                      <li key={i} className="text-xs sm:text-sm text-slate-300 flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">{i + 1}</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Training */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 sm:p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                      <Activity className="w-4 h-4" /> Training Consistency
                    </div>
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100">{weeklyData.trainingConsistencyScore}%</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You logged {weeklyData.totalWorkouts} sessions, burning an average of {weeklyData.avgBurned} active calories per day.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Flame className="w-4 h-4" /> Energy & Recovery Bottleneck
                    </div>
                    <ul className="space-y-2 pt-1">
                      {(weeklyData.topHabitsToFix || []).map((habit, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{habit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Playbook */}
                <div className="p-5 sm:p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
                  <h4 className="text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Next Week Action Blueprint
                  </h4>
                  <div className="space-y-3">
                    {(weeklyData.nextWeekActionPlan || []).map((action, i) => (
                      <div key={i} className="p-3.5 sm:p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 border border-cyan-500/20">
                          0{i + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-0.5">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer */}
          {weeklyData && !loading && (
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex gap-3 z-10">
              <button
                type="button"
                onClick={() => generateWeeklySummary()}
                className="flex-1 py-3 sm:py-3.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Regenerate Analysis</span>
                <span className="sm:hidden">Regenerate</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 sm:py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentDate={selectedStartDate}
        onDateChange={handleDateSelection}
        logs={logs}
        profile={profile}
        isDateSelectable={validateMondaySelection}
      />
    </>
  );
};