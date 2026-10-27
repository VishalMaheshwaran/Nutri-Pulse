// src/components/GoalCelebrationModal.tsx
import React, { useEffect, useState } from 'react';
import { DailyLog, UserProfile, HealthGoal } from '../types/nutrition';
import { calculateTotals } from '../services/storage';
import { callGeminiWithInfiniteRetry, hasConnectedApiKey } from '../utils/geminiStorage';
import { Trophy, Flame, Sparkles, CheckCircle2, X, AlertTriangle } from 'lucide-react';

interface GoalCelebrationModalProps {
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  forceOpenTest?: boolean;
  onCloseTest?: () => void;
}

const CELEBRATED_STORAGE_KEY = 'nutripulse_last_celebrated_date';

export function evaluateDayGoalSuccess(
  log: DailyLog | undefined,
  profile: UserProfile
): {
  success: boolean;
  statusNote: string;
  calories: number;
  protein: number;
  budget: number;
} {
  const burned = (log?.workouts || []).reduce((s, w) => s + w.caloriesBurned, 0);
  const effectiveBudget = (profile.targetCalories || 2000) + burned;
  const proteinTarget = profile.targetProtein || 120;

  if (!log || !log.items || log.items.length === 0) {
    return {
      success: false,
      statusNote: 'Log your meals to start your daily goal check.',
      calories: 0,
      protein: 0,
      budget: effectiveBudget,
    };
  }

  const totals = calculateTotals(log.items);

  switch (profile.goal) {
    case 'lose_weight': {
      const withinCals = totals.calories > 0 && totals.calories <= effectiveBudget + 25;
      const hitProtein = totals.protein >= proteinTarget * 0.95;

      let statusNote = 'Perfect Fat Loss Day: Within calorie limit & protein goal hit!';
      if (!withinCals && !hitProtein) {
        statusNote = `Over calorie limit by ${totals.calories - effectiveBudget} kcal & need ${Math.ceil(proteinTarget - totals.protein)}g more protein.`;
      } else if (!withinCals) {
        statusNote = `Over calorie limit by ${totals.calories - effectiveBudget} kcal.`;
      } else if (!hitProtein) {
        statusNote = `Within calories! Just ${Math.ceil(proteinTarget - totals.protein)}g more protein needed.`;
      }

      return {
        success: withinCals && hitProtein,
        statusNote,
        calories: totals.calories,
        protein: totals.protein,
        budget: effectiveBudget,
      };
    }

    case 'gain_muscle': {
      // Muscle Build: Must hit calorie goal (>= 95%), NOT eat too much (<= budget + 200 kcal), and hit protein goal (>= 95%)
      const minMuscleCals = Math.round(effectiveBudget * 0.95);
      const maxMuscleCals = effectiveBudget + 200;
      const hitCals = totals.calories >= minMuscleCals;
      const notTooMuch = totals.calories <= maxMuscleCals;
      const hitProtein = totals.protein >= proteinTarget * 0.95;

      let statusNote = 'Perfect Lean Bulk Day: Hit calorie target cleanly & crushed protein!';
      if (!hitCals) {
        statusNote = `Eat ${effectiveBudget - totals.calories} more kcal to reach your muscle-building target.`;
      } else if (!notTooMuch) {
        statusNote = `Ate ${totals.calories - maxMuscleCals} kcal over the clean bulk ceiling (+200 kcal max).`;
      } else if (!hitProtein) {
        statusNote = `Calories on point! Need ${Math.ceil(proteinTarget - totals.protein)}g more protein.`;
      }

      return {
        success: hitCals && notTooMuch && hitProtein,
        statusNote,
        calories: totals.calories,
        protein: totals.protein,
        budget: effectiveBudget,
      };
    }

    case 'maintain':
    default: {
      const nearMaintenance = Math.abs(totals.calories - effectiveBudget) <= 150;
      const hitProtein = totals.protein >= proteinTarget * 0.9;

      let statusNote = 'Perfect Maintenance Day: Balanced calories & hit protein!';
      if (!nearMaintenance) {
        statusNote =
          totals.calories < effectiveBudget - 150
            ? `${effectiveBudget - totals.calories} kcal away from maintenance target.`
            : `${totals.calories - effectiveBudget} kcal over maintenance target (±150 kcal window).`;
      } else if (!hitProtein) {
        statusNote = `Calories balanced! Need ${Math.ceil(proteinTarget - totals.protein)}g more protein.`;
      }

      return {
        success: nearMaintenance && hitProtein,
        statusNote,
        calories: totals.calories,
        protein: totals.protein,
        budget: effectiveBudget,
      };
    }
  }
}

export function calculateGoalStreak(
  logs: Record<string, DailyLog>,
  profile: UserProfile
): {
  streak: number;
  yesterdaySuccess: boolean;
  yesterdayStats: ReturnType<typeof evaluateDayGoalSuccess>;
  yesterdayDateStr: string;
} {
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = formatDate(yesterday);
  const yesterdayStats = evaluateDayGoalSuccess(logs[yesterdayDateStr], profile);

  let streak = 0;
  const cursor = new Date(yesterday);

  const todayStats = evaluateDayGoalSuccess(logs[formatDate(new Date())], profile);
  if (todayStats.success) streak++;

  while (true) {
    const dateStr = formatDate(cursor);
    const evalResult = evaluateDayGoalSuccess(logs[dateStr], profile);
    if (evalResult.success) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak, yesterdaySuccess: yesterdayStats.success, yesterdayStats, yesterdayDateStr };
}

const GOAL_LABELS: Record<HealthGoal, string> = {
  lose_weight: 'Fat Loss & Muscle Retention',
  gain_muscle: 'Lean Muscle Build',
  maintain: 'Body Recomposition & Maintenance',
};

export const GoalCelebrationModal: React.FC<GoalCelebrationModalProps> = ({
  logs,
  profile,
  forceOpenTest = false,
  onCloseTest,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { streak, yesterdaySuccess, yesterdayStats, yesterdayDateStr } = calculateGoalStreak(
    logs,
    profile
  );
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStats = evaluateDayGoalSuccess(logs[todayStr], profile);

  useEffect(() => {
    const lastCelebrated = localStorage.getItem(CELEBRATED_STORAGE_KEY);
    if (forceOpenTest) {
      setIsOpen(true);
      generateInnovativeAiCongrats(
        Math.max(1, streak),
        yesterdaySuccess ? yesterdayStats : todayStats
      );
      return;
    }

    if (yesterdaySuccess && lastCelebrated !== yesterdayDateStr) {
      setIsOpen(true);
      localStorage.setItem(CELEBRATED_STORAGE_KEY, yesterdayDateStr);
      generateInnovativeAiCongrats(Math.max(1, streak), yesterdayStats);
    }
  }, [yesterdaySuccess, yesterdayDateStr, forceOpenTest]);

  const generateInnovativeAiCongrats = async (
    currentStreak: number,
    stats: ReturnType<typeof evaluateDayGoalSuccess>
  ) => {
    const safeGoal: HealthGoal =
      profile.goal === 'lose_weight' || profile.goal === 'gain_muscle' || profile.goal === 'maintain'
        ? profile.goal
        : 'maintain';

    const fallbackMessages: Record<HealthGoal, string> = {
      lose_weight: `Day ${currentStreak} locked in! You stayed disciplined at ${stats.calories} kcal (under your ${stats.budget} kcal ceiling) while hitting ${Math.round(stats.protein)}g of protein. Your body is oxidizing fat stores while keeping your muscle tissue 100% protected!`,
      gain_muscle: `${currentStreak}-day Lean Bulk streak! You hit ${stats.calories} kcal without overeating past your clean surplus limit, paired with ${Math.round(stats.protein)}g of protein. Muscle protein synthesis is firing at full capacity with minimal fat spillover!`,
      maintain: `${currentStreak}-day precision streak! Locking in ${stats.calories} kcal and ${Math.round(stats.protein)}g of protein keeps your metabolismprimed and body composition razor-sharp.`,
    };

    setAiMessage(fallbackMessages[safeGoal]);

    if (!hasConnectedApiKey()) return;

    setIsGenerating(true);
    try {
      const customQuote = await callGeminiWithInfiniteRetry(async (apiKey) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
        const prompt = `You are an elite, witty sports nutritionist. The user just completed a PERFECT nutrition day for their specific goal!
        Goal: ${GOAL_LABELS[safeGoal]}
        Streak: ${currentStreak} consecutive day(s)!
        Logged: ${stats.calories} kcal (Target: ${stats.budget} kcal) and ${Math.round(stats.protein)}g Protein (Target: ${profile.targetProtein}g).
        Write a short (2-3 sentences), innovative celebratory message praising their ${currentStreak}-day streak and explaining how hitting both their calorie window and protein target is transforming their physique today. No markdown.`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      });

      if (customQuote) setAiMessage(customQuote);
    } catch {
      // Keep fallback
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;
  const activeStats = yesterdaySuccess ? yesterdayStats : todayStats;
  const safeGoal: HealthGoal =
    profile.goal === 'lose_weight' || profile.goal === 'gain_muscle' || profile.goal === 'maintain'
      ? profile.goal
      : 'maintain';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 text-center space-y-5 overflow-hidden">
        <button
          onClick={() => {
            setIsOpen(false);
            if (onCloseTest) onCloseTest();
          }}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/60 rounded-full cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
            <Trophy className="w-9 h-9 stroke-[2.2]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-mono font-bold">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" />
            { streak > 0 ? `${streak} DAY GOAL STREAK!` : 'GOAL TRACKER PREVIEW' }
          </div>
          <h3 className="text-xl font-extrabold text-slate-100">
            {activeStats.success ? 'Goal Crushed! 🎉' : 'Today’s Goal Progress'}
          </h3>
          <p className="text-xs text-emerald-400 font-semibold">{GOAL_LABELS[safeGoal]}</p>
        </div>

        {/* Status Note Banner */}
        <div
          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 ${
            activeStats.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {!activeStats.success && <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{activeStats.statusNote}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 font-mono">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">CALORIES LOGGED</span>
            <span className="text-sm font-bold text-emerald-400">
              {activeStats.calories} / {activeStats.budget} kcal
            </span>
          </div>
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">PROTEIN TARGET</span>
            <span className="text-sm font-bold text-cyan-400">
              {Math.round(activeStats.protein)}g / {profile.targetProtein}g
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-left space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Gemini Streak Coach
            </span>
            {isGenerating && (
              <span className="text-[10px] text-indigo-400 animate-pulse">Personalizing...</span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">"{aiMessage}"</p>
        </div>

        <button
          onClick={() => {
            setIsOpen(false);
            if (onCloseTest) onCloseTest();
          }}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" /> Keep the Streak Alive!
        </button>
      </div>
    </div>
  );
};