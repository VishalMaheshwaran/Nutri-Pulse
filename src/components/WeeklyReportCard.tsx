// src/components/WeeklyReportCard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, AlertCircle, Award, Zap, Calendar, X, Utensils, Flame } from 'lucide-react';
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
}

interface WeeklyAIAnalysis {
  weeklyHeadline: string;
  consistencyScore: number;
  trendSummary: string;
  topHabitToFix: string;
  nextWeekGoal: string;
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

  const weekStats = useMemo(() => {
    const [y, m, d] = selectedMonday.split('-').map(Number);
    const monday = new Date(y, m - 1, d);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const dates: string[] = [];
    const todayStr = formatDateKey(new Date());

    for (let i = 0; i < 7; i++) {
      const curr = new Date(monday);
      curr.setDate(monday.getDate() + i);
      const dateStr = formatDateKey(curr);
      if (dateStr <= todayStr) {
        dates.push(dateStr);
      }
    }

    let cals = 0, protein = 0, carbs = 0, fat = 0, burned = 0, loggedDays = 0;
    const foodMap: Record<string, EatenFoodSummary> = {};
    const dailySummaries: string[] = [];

    dates.forEach((dateStr) => {
      const dayLog = logs[dateStr];
      if (dayLog && dayLog.items && dayLog.items.length > 0) {
        const totals = calculateTotals(dayLog.items);
        cals += totals.calories;
        protein += totals.protein;
        carbs += totals.carbs;
        fat += totals.fat;
        loggedDays++;

        dayLog.items.forEach((item) => {
          const key = item.name.trim();
          if (!foodMap[key]) {
            foodMap[key] = { name: key, count: 0, totalCalories: 0, totalProtein: 0 };
          }
          foodMap[key].count += item.servings;
          foodMap[key].totalCalories += Math.round(item.calories * item.servings);
          foodMap[key].totalProtein += Math.round(item.protein * item.servings);
        });

        const wList = dayLog.workouts || [];
        const burnedToday = wList.reduce((s, w) => s + w.caloriesBurned, 0);
        burned += burnedToday;

        dailySummaries.push(
          `- ${dateStr}: ${Math.round(totals.calories)} kcal, ${Math.round(totals.protein)}g P`
        );
      }
    });

    const dailyCalGoal = profile.targetCalories || 2600;
    const dailyProtGoal = profile.targetProtein || 160;
    const dailyCarbGoal = (profile as any).targetCarbs || Math.round((dailyCalGoal * 0.45) / 4);
    const dailyFatGoal = (profile as any).targetFat || Math.round((dailyCalGoal * 0.27) / 9);

    const rangeLabel = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

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
      burned: Math.round(burned),
      eatenFoods: Object.values(foodMap).sort((a, b) => b.totalProtein - a.totalProtein),
      dailySummaries,
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
        .map(f => `- ${f.name} (${f.count}x): ${f.totalCalories} kcal, ${f.totalProtein}g P`)
        .join('\n');

      const prompt = `You are an elite sports nutritionist analyzing a user's 7-day weekly nutrition trend (${weekStats.rangeLabel}).

USER PROFILE & 7-DAY GOALS:
- Active Goal: ${profile.goal}
- 7-Day Calorie Target: ${weekStats.targetCals} kcal (${weekStats.cals} eaten)
- 7-Day Protein Target: ${weekStats.targetProtein}g (${weekStats.protein}g eaten)
- Active Days Logged: ${weekStats.loggedDays} / 7 days

Top Foods Eaten:
${topFoodsSnippet}

Return ONLY a valid, minified JSON object with these exact keys:
{
  "weeklyHeadline": "Short punchy title summarizing their weekly progress",
  "consistencyScore": 88,
  "trendSummary": "2 sentences analyzing how their weekly food choices align with their ${profile.goal} goal (Avg ${avgCals} kcal/d, ${avgProt}g P/d).",
  "topHabitToFix": "The single most important nutritional or training habit to fix.",
  "nextWeekGoal": "A concrete, encouraging milestone for next week."
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

  if (!isMounted) return null;

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
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">CALORIES (7D)</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 block">{weekStats.cals} / {weekStats.targetCals}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">PROTEIN (7D)</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-cyan-400 block">{weekStats.protein}g / {weekStats.targetProtein}g</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">CARBS (7D)</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-amber-400 block">{weekStats.carbs}g / {weekStats.targetCarbs}g</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl text-center space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block">FAT (7D)</span>
                <span className="text-sm sm:text-base font-extrabold font-mono text-rose-400 block">{weekStats.fat}g / {weekStats.targetFat}g</span>
              </div>
            </div>

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

                {loading && (
                  <div className="p-10 bg-slate-950 border border-slate-800/90 rounded-3xl flex flex-col items-center justify-center space-y-3 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-sm font-bold text-slate-200">Generating Gemini 3.1 Flash Lite Weekly Report...</p>
                  </div>
                )}

                {!weeklyData && !loading && (
                  <div className="p-6 bg-slate-950 border border-slate-800/90 rounded-3xl text-center space-y-3">
                    <p className="text-xs sm:text-sm text-slate-400">Tap <strong className="text-emerald-400">Regenerate Report</strong> below to run AI coaching on this week.</p>
                  </div>
                )}

                {weeklyData && !loading && (
                  <div className="space-y-4">
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