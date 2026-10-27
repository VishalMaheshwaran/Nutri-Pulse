// src/components/ProfileModal.tsx
import React, { useState } from 'react';
import { UserProfile, HealthGoal, ActivityLevel } from '../types/nutrition';
import { calculateRecommendedMacros, downloadAppDataBackup, uploadAppDataBackup } from '../services/storage';
import { getStoredApiKey, setStoredApiKey, hasConnectedApiKey } from '../utils/geminiStorage';
import { X, CheckCircle, Calculator, Sliders, Droplets, ShieldCheck } from 'lucide-react';
import { scheduleDailyReminder } from '../services/notifications';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const GOAL_BEHAVIOR_DESCRIPTIONS: Record<HealthGoal, { title: string; rule: string }> = {
  lose_weight: {
    title: 'Fat Loss Protocol',
    rule: 'Stay at or below your daily calorie limit AND hit at least 95% of your protein goal to burn fat while protecting lean muscle.',
  },
  gain_muscle: {
    title: 'Lean Muscle Build Protocol',
    rule: 'Hit your calorie target (within 95% to +200 kcal max so you don’t over-bulk) AND hit at least 95% of your protein goal.',
  },
  maintain: {
    title: 'Recomposition & Maintenance Protocol',
    rule: 'Stay within ±150 kcal of your daily target AND hit at least 90% of your protein goal.',
  },
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const normalizedGoal: HealthGoal =
    profile.goal === 'lose_weight' || profile.goal === 'gain_muscle' || profile.goal === 'maintain'
      ? profile.goal
      : 'maintain';

  const [formData, setFormData] = useState<UserProfile>({ ...profile, goal: normalizedGoal });
  const [lastCalculatedTdee, setLastCalculatedTdee] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentCals = typeof formData.targetCalories === 'number' ? formData.targetCalories : 0;
  const maxProteinLimit = Math.floor(currentCals / 4);

  const balanceMacros = (
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    changedField: 'protein' | 'carbs' | 'fat' | 'calories'
  ) => {
    const safeCals = Math.max(0, calories);
    const safeProtein = Math.min(Math.max(0, protein), Math.floor(safeCals / 4));

    const proteinCals = safeProtein * 4;
    const remainingCals = Math.max(0, safeCals - proteinCals);

    let safeCarbs = carbs;
    let safeFat = fat;

    if (changedField === 'protein' || changedField === 'calories') {
      const carbCalsBudget = remainingCals * 0.6;
      const fatCalsBudget = remainingCals * 0.4;
      safeCarbs = Math.round(carbCalsBudget / 4);
      safeFat = Math.round(fatCalsBudget / 9);
    } else if (changedField === 'carbs') {
      safeCarbs = Math.min(Math.max(0, carbs), Math.floor(remainingCals / 4));
      const carbCals = safeCarbs * 4;
      const fatCals = Math.max(0, remainingCals - carbCals);
      safeFat = Math.round(fatCals / 9);
    } else if (changedField === 'fat') {
      safeFat = Math.min(Math.max(0, fat), Math.floor(remainingCals / 9));
      const fatCals = safeFat * 9;
      const carbCals = Math.max(0, remainingCals - fatCals);
      safeCarbs = Math.round(carbCals / 4);
    }

    return {
      targetCalories: safeCals,
      targetProtein: safeProtein,
      targetCarbs: safeCarbs,
      targetFat: safeFat,
    };
  };

  const handleRecalculate = () => {
    const recommended = calculateRecommendedMacros(formData);
    setLastCalculatedTdee(recommended.tdee);

    const calculatedFiber = Math.max(20, Math.round((recommended.calories / 1000) * 14));
    const activityWaterBonus: Record<ActivityLevel, number> = {
      sedentary: 0,
      light: 400,
      moderate: 800,
      very_active: 1200,
    };
    const weight = formData.weightKg || 70;
    const activity = formData.activityLevel || 'moderate';
    const calculatedWater = Math.round((weight * 35 + activityWaterBonus[activity]) / 100) * 100;

    setFormData((prev) => ({
      ...prev,
      targetCalories: recommended.calories,
      targetProtein: recommended.protein,
      targetCarbs: recommended.carbs,
      targetFat: recommended.fat,
      targetFiber: calculatedFiber,
      waterGoalMl: calculatedWater,
    }));
  };

  const handleCaloriesChange = (val: string) => {
    if (val === '') {
      setFormData((prev) => ({ ...prev, targetCalories: '' as any }));
      return;
    }
    const cals = parseInt(val, 10) || 0;
    const updated = balanceMacros(
      cals,
      formData.targetProtein || 0,
      formData.targetCarbs || 0,
      formData.targetFat || 0,
      'calories'
    );
    const updatedFiber = Math.max(0, Math.round((cals / 1000) * 14));
    setFormData((prev) => ({ ...prev, ...updated, targetFiber: updatedFiber }));
  };

  const handleProteinChange = (newProtein: number) => {
    const updated = balanceMacros(
      currentCals,
      newProtein,
      formData.targetCarbs || 0,
      formData.targetFat || 0,
      'protein'
    );
    setFormData((prev) => ({ ...prev, ...updated }));
  };

  const handleCarbChange = (newCarbs: number) => {
    const updated = balanceMacros(
      currentCals,
      formData.targetProtein || 0,
      newCarbs,
      formData.targetFat || 0,
      'carbs'
    );
    setFormData((prev) => ({ ...prev, ...updated }));
  };

  const handleFatChange = (newFat: number) => {
    const updated = balanceMacros(
      currentCals,
      formData.targetProtein || 0,
      formData.targetCarbs || 0,
      newFat,
      'fat'
    );
    setFormData((prev) => ({ ...prev, ...updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  const proteinCals = (formData.targetProtein || 0) * 4;
  const carbCals = (formData.targetCarbs || 0) * 4;
  const fatCals = (formData.targetFat || 0) * 9;
  const totalMacroCals = proteinCals + carbCals + fatCals;

  const activeGoalBehavior =
    GOAL_BEHAVIOR_DESCRIPTIONS[formData.goal] || GOAL_BEHAVIOR_DESCRIPTIONS.maintain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                Nutrition Profile &amp; Targets
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                TDEE calculator and daily macronutrient targets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          {/* Biometrics */}
          <div className="space-y-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Personal Body Metrics
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weightKg ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weightKg: e.target.value === '' ? ('' as any) : parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.heightCm ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heightCm: e.target.value === '' ? ('' as any) : parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      age: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Biological Sex</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Body Fat % */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Body Fat Percentage (Used for Katch-McArdle Formula)
                </span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {formData.bodyFatPct ? `${formData.bodyFatPct}%` : 'Not specified'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="0.5"
                  value={formData.bodyFatPct || 15}
                  onChange={(e) => setFormData({ ...formData, bodyFatPct: parseFloat(e.target.value) })}
                  className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
                />
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="60"
                  value={formData.bodyFatPct ?? ''}
                  placeholder="e.g. 15"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bodyFatPct: e.target.value === '' ? undefined : parseFloat(e.target.value),
                    })
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-right text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-mono">%</span>
              </div>

              {formData.bodyFatPct && formData.bodyFatPct > 3 && formData.weightKg && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-mono">
                  <div className="text-slate-400">
                    Lean Body Mass (LBM):{' '}
                    <strong className="text-cyan-400">
                      {(formData.weightKg * (1 - formData.bodyFatPct / 100)).toFixed(1)} kg
                    </strong>
                  </div>
                  <div className="text-slate-400">
                    Fat Mass:{' '}
                    <strong className="text-amber-400">
                      {(formData.weightKg * (formData.bodyFatPct / 100)).toFixed(1)} kg
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Goal & Activity */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Primary Goal</label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value as HealthGoal })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="lose_weight">Fat Loss / Caloric Deficit</option>
                  <option value="gain_muscle">Muscle Build / Lean Bulk</option>
                  <option value="maintain">Weight Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Activity Level</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="sedentary">Sedentary (Desk Job)</option>
                  <option value="light">Lightly Active (1-3 days/wk)</option>
                  <option value="moderate">Moderately Active (3-5 days/wk)</option>
                  <option value="very_active">Very Active (6-7 days/wk)</option>
                </select>
              </div>
            </div>

            {/* Active Plan Streak Requirement Banner */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 block">{activeGoalBehavior.title}</span>
                <span className="text-slate-300 text-[11px]">{activeGoalBehavior.rule}</span>
              </div>
            </div>
          </div>

          {/* Auto Calculate Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleRecalculate}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              Auto-Calculate TDEE, Macros &amp; Water
            </button>
            {lastCalculatedTdee && (
              <div className="text-[11px] text-center p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-medium">
                Expected Maintenance (TDEE): <strong>{lastCalculatedTdee} kcal</strong>. Target adjusted for your goal below.
              </div>
            )}
          </div>

          {/* Daily Targets & Sliders */}
          <div className="space-y-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Daily Calorie Target &amp; Macro Sliders
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border ${
                  Math.abs(totalMacroCals - currentCals) < 25
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                Sum: {totalMacroCals} / {currentCals} kcal
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                Target Calories (kcal)
              </label>
              <input
                type="number"
                value={formData.targetCalories ?? ''}
                onChange={(e) => handleCaloriesChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-base font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Protein Slider */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Protein Target
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <input
                    type="number"
                    min="0"
                    max={maxProteinLimit > 0 ? maxProteinLimit : 500}
                    value={formData.targetProtein ?? ''}
                    onChange={(e) =>
                      handleProteinChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 text-xs text-cyan-400 font-bold text-center focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-slate-400 text-[11px]">g ({proteinCals} kcal)</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={maxProteinLimit > 0 ? maxProteinLimit : 500}
                step="5"
                value={formData.targetProtein || 0}
                onChange={(e) => handleProteinChange(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
            </div>

            {/* Carbs Slider */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Carbohydrates Target
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <input
                    type="number"
                    min="0"
                    max={Math.floor(currentCals / 4)}
                    value={formData.targetCarbs ?? ''}
                    onChange={(e) =>
                      handleCarbChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 text-xs text-amber-400 font-bold text-center focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 text-[11px]">g ({carbCals} kcal)</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={Math.floor(currentCals / 4) > 0 ? Math.floor(currentCals / 4) : 500}
                step="5"
                value={formData.targetCarbs || 0}
                onChange={(e) => handleCarbChange(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
            </div>

            {/* Fat Slider */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span> Fats Target
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <input
                    type="number"
                    min="0"
                    max={Math.floor(currentCals / 9)}
                    value={formData.targetFat ?? ''}
                    onChange={(e) =>
                      handleFatChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 text-xs text-rose-400 font-bold text-center focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-slate-400 text-[11px]">g ({fatCals} kcal)</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={Math.floor(currentCals / 9) > 0 ? Math.floor(currentCals / 9) : 200}
                step="5"
                value={formData.targetFat || 0}
                onChange={(e) => handleFatChange(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-rose-400 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
            </div>

            {/* Fiber & Water */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fiber Target (g)</label>
                <input
                  type="number"
                  value={formData.targetFiber ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetFiber: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" /> Water Goal (ml)
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  max="10000"
                  value={formData.waterGoalMl ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      waterGoalMl: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* AI Connection & Data Backup Section */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              AI Connection &amp; Data Backup
            </span>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="text-slate-300 font-medium">Gemini API Key</label>
                <span
                  className={`font-mono text-[11px] ${
                    hasConnectedApiKey() ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {hasConnectedApiKey() ? '● Connected (AI Enabled)' : '○ Not Connected (AI Locked)'}
                </span>
              </div>
              {/* Changed type="password" to type="text" */}
              <input
                type="text"
                defaultValue={getStoredApiKey()}
                onChange={(e) => setStoredApiKey(e.target.value)}
                placeholder="Paste your Gemini API key (AIzaSy...)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => downloadAppDataBackup()}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                Download Data (.json)
              </button>

              <label className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-cyan-400 flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
                Upload Backup (.json)
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      await uploadAppDataBackup(file);
                      alert('Backup uploaded successfully!');
                      window.location.reload();
                    } catch (err: any) {
                      console.error('Upload backup failed:', err);
                      alert(`Upload failed: ${err.message || 'Please check if the file is a valid NutriPulse JSON backup.'}`);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          {/* Inside ProfileModal.tsx form, above the submit button */}
<div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between mb-4">
  <div className="text-xs">
    <span className="font-bold text-slate-100 block">Daily Phone Reminders</span>
    <span className="text-slate-400">Receive a native push notification at 8:00 PM</span>
  </div>
  <button
    type="button"
    onClick={async () => {
      await scheduleDailyReminder(20, 0);
      alert('Phone notifications enabled for 8:00 PM!');
    }}
    className="py-1.5 px-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
  >
    Turn On
  </button>
</div>
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            Save Profile &amp; Update Goals
          </button>
        </form>
      </div>
    </div>
  );
};