// src/components/ProfileModal.tsx
import React, { useState } from 'react';
import { UserProfile, HealthGoal, ActivityLevel } from '../types/nutrition';
import { calculateRecommendedMacros, downloadAppDataBackup, uploadAppDataBackup } from '../services/storage';
import { getStoredApiKey, setStoredApiKey, hasConnectedApiKey } from '../utils/geminiStorage';
import { X, CheckCircle, Calculator, Sliders, Droplets, ShieldCheck } from 'lucide-react';
import { scheduleDailyReminder } from '../services/notifications';
import { useTheme } from '../hooks/useTheme';

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
  const { theme, t, setTheme } = useTheme(); // Initialize Theme Engine

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
      <div className={`relative w-full max-w-xl ${t.cardBg} border ${t.cardBorder} rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto transition-colors`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b ${t.innerBorder} ${t.cardBg} shrink-0 transition-colors`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${t.innerBg} border ${t.innerBorder} flex items-center justify-center ${t.accentEmerald} shrink-0 transition-colors`}>
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold ${t.textPrimary} truncate transition-colors`}>
                Nutrition Profile &amp; Targets
              </h3>
              <p className={`text-[11px] sm:text-xs ${t.textSecondary} truncate transition-colors`}>
                TDEE calculator and daily macronutrient targets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 ${t.inactiveBtnText} ${t.btnHover} rounded-lg transition-colors cursor-pointer shrink-0`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full overflow-hidden">
          
          {/* 1. SCROLLABLE CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Global App Theme Selector */}
            <div className="space-y-2">
              <span className={`text-xs font-semibold ${t.textSecondary} uppercase tracking-wider block transition-colors`}>
                App Theme Settings
              </span>
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${t.innerBorder} ${t.innerBg} transition-colors`}>
                <button 
                  type="button"
                  onClick={() => setTheme('default')} 
                  className={`w-8 h-8 rounded-full bg-slate-900 border-2 transition-all cursor-pointer ${theme === 'default' ? 'border-emerald-500 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`} 
                  title="Dark Theme" 
                />
                <button 
                  type="button"
                  onClick={() => setTheme('white')} 
                  className={`w-8 h-8 rounded-full bg-white border-2 transition-all cursor-pointer ${theme === 'white' ? 'border-emerald-500 scale-110 shadow-md' : 'border-slate-300 hover:scale-105'}`} 
                  title="Light Theme" 
                />
                <button 
                  type="button"
                  onClick={() => setTheme('baby_pink')} 
                  className={`w-8 h-8 rounded-full bg-pink-100 border-2 transition-all cursor-pointer ${theme === 'baby_pink' ? 'border-pink-500 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`} 
                  title="Baby Pink Theme" 
                />
              </div>
            </div>

            {/* Biometrics */}
            <div className="space-y-4 border-t border-slate-800/40 pt-4">
              <span className={`text-xs font-semibold ${t.textSecondary} uppercase tracking-wider block transition-colors`}>
                Personal Body Metrics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={`block text-xs ${t.textSecondary} mb-1 transition-colors`}>Weight (kg)</label>
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
                    className={`w-full ${t.innerBg} border ${t.innerBorder} rounded-xl px-3 py-2 text-xs font-mono ${t.textPrimary} focus:outline-none focus:border-emerald-500 transition-colors`}
                  />
                </div>
                <div>
                  <label className={`block text-xs ${t.textSecondary} mb-1 transition-colors`}>Height (cm)</label>
                  <input
                    type="number"
                    value={formData.heightCm ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        heightCm: e.target.value === '' ? ('' as any) : parseFloat(e.target.value),
                      })
                    }
                    className={`w-full ${t.innerBg} border ${t.innerBorder} rounded-xl px-3 py-2 text-xs font-mono ${t.textPrimary} focus:outline-none focus:border-emerald-500 transition-colors`}
                  />
                </div>
                <div>
                  <label className={`block text-xs ${t.textSecondary} mb-1 transition-colors`}>Age</label>
                  <input
                    type="number"
                    value={formData.age ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10),
                      })
                    }
                    className={`w-full ${t.innerBg} border ${t.innerBorder} rounded-xl px-3 py-2 text-xs font-mono ${t.textPrimary} focus:outline-none focus:border-emerald-500 transition-colors`}
                  />
                </div>
                <div>
                  <label className={`block text-xs ${t.textSecondary} mb-1 transition-colors`}>Biological Sex</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className={`w-full ${t.innerBg} border ${t.innerBorder} rounded-xl px-3 py-2 text-xs ${t.textPrimary} focus:outline-none focus:border-emerald-500 transition-colors`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Body Fat % */}
              <div className={`p-4 ${t.innerBg} border ${t.innerBorder} rounded-xl space-y-3 transition-colors`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${t.textPrimary} transition-colors`}>
                    Body Fat Percentage (Used for Katch-McArdle)
                  </span>
                  <span className={`font-mono ${t.accentEmerald} font-bold text-sm transition-colors`}>
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
                    className={`flex-1 accent-emerald-500 cursor-pointer h-2 ${t.cardBg} rounded-lg transition-colors`}
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
                    className={`w-20 ${t.cardBg} border ${t.cardBorder} rounded-lg px-2 py-1 text-xs font-mono text-right ${t.accentEmerald} font-bold focus:outline-none focus:border-emerald-500 transition-colors`}
                  />
                  <span className={`text-xs ${t.textSecondary} font-mono transition-colors`}>%</span>
                </div>

                {formData.bodyFatPct && formData.bodyFatPct > 3 && formData.weightKg && (
                  <div className={`pt-2 border-t ${t.innerBorder} flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-mono transition-colors`}>
                    <div className={t.textSecondary}>
                      Lean Body Mass (LBM):{' '}
                      <strong className={t.accentCyan}>
                        {(formData.weightKg * (1 - formData.bodyFatPct / 100)).toFixed(1)} kg
                      </strong>
                    </div>
                    <div className={t.textSecondary}>
                      Fat Mass:{' '}
                      <strong className={t.accentAmber}>
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
                  <label className={`block text-xs ${t.textSecondary} mb-1.5 font-semibold transition-colors`}>Primary Goal</label>
                  <select
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value as HealthGoal })}
                    className={`w-full ${t.innerBg} border ${t.innerBorder} rounded-xl px-3 py-2.5 text-xs ${t.textPrimary} focus:outline-none focus:border-emerald-500 transition-colors`}
                  >
                    <option value="lose_weight">Fat Loss / Caloric Deficit</option>
                    <option value="gain_muscle">Muscle Build / Lean Bulk</option>
                    <option value="maintain">Weight Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs ${t.textSecondary} mb-1.5 font-semibold transition-colors`}>Activity Level</label>
                  <select
                    value={formData.activityLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })
                    }
                    className={`w-full ${t.innerBg} border ${t.innerBorder} rounded-xl px-3 py-2.5 text-xs ${t.textPrimary} focus:outline-none focus:border-emerald-500 transition-colors`}
                  >
                    <option value="sedentary">Sedentary (Desk Job)</option>
                    <option value="light">Lightly Active (1-3 days/wk)</option>
                    <option value="moderate">Moderately Active (3-5 days/wk)</option>
                    <option value="very_active">Very Active (6-7 days/wk)</option>
                  </select>
                </div>
              </div>

              {/* Active Plan Streak Requirement Banner */}
              <div className={`p-3 ${t.innerBg} border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs transition-colors`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-500 block">{activeGoalBehavior.title}</span>
                  <span className={t.textSecondary}>{activeGoalBehavior.rule}</span>
                </div>
              </div>
            </div>

            {/* Auto Calculate Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleRecalculate}
                className={`w-full py-2.5 px-4 ${t.innerBg} ${t.btnHover} border ${t.innerBorder} rounded-xl text-xs font-semibold ${t.accentEmerald} flex items-center justify-center gap-2 transition-colors cursor-pointer`}
              >
                <Calculator className="w-4 h-4" />
                Auto-Calculate TDEE, Macros &amp; Water
              </button>
              {lastCalculatedTdee && (
                <div className="text-[11px] text-center p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 font-medium">
                  Expected Maintenance (TDEE): <strong>{lastCalculatedTdee} kcal</strong>. Target adjusted for your goal below.
                </div>
              )}
            </div>

            {/* Daily Targets & Sliders */}
            <div className={`space-y-4 pt-3 border-t ${t.innerBorder} transition-colors`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t.textSecondary} uppercase tracking-wider transition-colors`}>
                  Daily Calorie Target &amp; Macro Sliders
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border ${
                    Math.abs(totalMacroCals - currentCals) < 25
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  }`}
                >
                  Sum: {totalMacroCals} / {currentCals} kcal
                </span>
              </div>

              <div className={`p-3 ${t.innerBg} rounded-xl border ${t.innerBorder} transition-colors`}>
                <label className={`block text-[11px] ${t.textSecondary} mb-1 font-medium transition-colors`}>
                  Target Calories (kcal)
                </label>
                <input
                  type="number"
                  value={formData.targetCalories ?? ''}
                  onChange={(e) => handleCaloriesChange(e.target.value)}
                  className={`w-full ${t.cardBg} border ${t.cardBorder} rounded-lg px-3 py-2 text-base font-mono ${t.accentEmerald} font-bold focus:outline-none focus:border-emerald-500 transition-colors`}
                />
              </div>

              {/* Protein Slider */}
              <div className={`p-3.5 ${t.innerBg} rounded-xl border ${t.innerBorder} space-y-2.5 transition-colors`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${t.accentCyan} font-bold flex items-center gap-1.5 transition-colors`}>
                    <span className={`w-2 h-2 rounded-full ${t.bgCyan} inline-block transition-colors`}></span> Protein Target
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
                      className={`w-16 ${t.cardBg} border ${t.cardBorder} rounded-md px-1.5 py-0.5 text-xs ${t.accentCyan} font-bold text-center focus:outline-none focus:border-cyan-500 transition-colors`}
                    />
                    <span className={`${t.textSecondary} text-[11px] transition-colors`}>g ({proteinCals} kcal)</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxProteinLimit > 0 ? maxProteinLimit : 500}
                  step="5"
                  value={formData.targetProtein || 0}
                  onChange={(e) => handleProteinChange(parseInt(e.target.value, 10) || 0)}
                  className={`w-full accent-cyan-400 cursor-pointer h-2 ${t.cardBg} rounded-lg transition-colors`}
                />
              </div>

              {/* Carbs Slider */}
              <div className={`p-3.5 ${t.innerBg} rounded-xl border ${t.innerBorder} space-y-2.5 transition-colors`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${t.accentAmber} font-bold flex items-center gap-1.5 transition-colors`}>
                    <span className={`w-2 h-2 rounded-full ${t.bgAmber} inline-block transition-colors`}></span> Carbohydrates Target
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
                      className={`w-16 ${t.cardBg} border ${t.cardBorder} rounded-md px-1.5 py-0.5 text-xs ${t.accentAmber} font-bold text-center focus:outline-none focus:border-amber-500 transition-colors`}
                    />
                    <span className={`${t.textSecondary} text-[11px] transition-colors`}>g ({carbCals} kcal)</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.floor(currentCals / 4) > 0 ? Math.floor(currentCals / 4) : 500}
                  step="5"
                  value={formData.targetCarbs || 0}
                  onChange={(e) => handleCarbChange(parseInt(e.target.value, 10) || 0)}
                  className={`w-full accent-amber-400 cursor-pointer h-2 ${t.cardBg} rounded-lg transition-colors`}
                />
              </div>

              {/* Fat Slider */}
              <div className={`p-3.5 ${t.innerBg} rounded-xl border ${t.innerBorder} space-y-2.5 transition-colors`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${t.accentRose} font-bold flex items-center gap-1.5 transition-colors`}>
                    <span className={`w-2 h-2 rounded-full ${t.bgRose} inline-block transition-colors`}></span> Fats Target
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
                      className={`w-16 ${t.cardBg} border ${t.cardBorder} rounded-md px-1.5 py-0.5 text-xs ${t.accentRose} font-bold text-center focus:outline-none focus:border-rose-500 transition-colors`}
                    />
                    <span className={`${t.textSecondary} text-[11px] transition-colors`}>g ({fatCals} kcal)</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.floor(currentCals / 9) > 0 ? Math.floor(currentCals / 9) : 200}
                  step="5"
                  value={formData.targetFat || 0}
                  onChange={(e) => handleFatChange(parseInt(e.target.value, 10) || 0)}
                  className={`w-full accent-rose-400 cursor-pointer h-2 ${t.cardBg} rounded-lg transition-colors`}
                />
              </div>

              {/* Fiber & Water */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className={`block text-xs ${t.textSecondary} mb-1 transition-colors`}>Fiber Target (g)</label>
                  <input
                    type="number"
                    value={formData.targetFiber ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetFiber: e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10),
                      })
                    }
                    className={`w-full ${t.innerBg} border ${t.innerBorder} rounded-xl px-3 py-2 text-xs font-mono ${t.textPrimary} focus:outline-none focus:border-emerald-500 transition-colors`}
                  />
                </div>
                <div>
                  <label className={`flex text-xs ${t.textSecondary} mb-1 items-center gap-1 transition-colors`}>
                    <Droplets className="w-3.5 h-3.5 text-blue-500" /> Water Goal (ml)
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
                    className={`w-full ${t.innerBg} border ${t.innerBorder} rounded-xl px-3 py-2 text-xs font-mono text-blue-500 font-bold focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                </div>
              </div>
            </div>

            {/* AI Connection & Data Backup Section */}
            <div className={`space-y-3 pt-4 border-t ${t.innerBorder} transition-colors`}>
              <span className={`text-xs font-semibold ${t.textSecondary} uppercase tracking-wider block transition-colors`}>
                AI Connection &amp; Data Backup
              </span>

              <div className={`p-3 ${t.innerBg} rounded-xl border ${t.innerBorder} space-y-1.5 transition-colors`}>
                <div className="flex items-center justify-between text-xs">
                  <label className={`${t.textPrimary} font-medium transition-colors`}>Gemini API Key</label>
                  <span
                    className={`font-mono text-[11px] ${
                      hasConnectedApiKey() ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {hasConnectedApiKey() ? '● Connected (AI Enabled)' : '○ Not Connected (AI Locked)'}
                  </span>
                </div>
                <input
                  type="text"
                  defaultValue={getStoredApiKey()}
                  onChange={(e) => setStoredApiKey(e.target.value)}
                  placeholder="Paste your Gemini API key (AIzaSy...)"
                  className={`w-full ${t.cardBg} border ${t.cardBorder} rounded-lg px-3 py-2 text-xs font-mono ${t.textPrimary} focus:outline-none focus:border-emerald-500 transition-colors`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => downloadAppDataBackup()}
                  className={`py-2.5 px-3 ${t.innerBg} ${t.btnHover} border ${t.innerBorder} rounded-xl text-xs font-semibold ${t.accentEmerald} flex items-center justify-center gap-2 transition-colors cursor-pointer`}
                >
                  Download Data (.json)
                </button>

                <label className={`py-2.5 px-3 ${t.innerBg} ${t.btnHover} border ${t.innerBorder} rounded-xl text-xs font-semibold ${t.accentCyan} flex items-center justify-center gap-2 transition-colors cursor-pointer text-center`}>
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

            {/* Daily Phone Reminders */}
            <div className={`p-3 ${t.innerBg} rounded-xl border ${t.innerBorder} flex items-center justify-between transition-colors`}>
              <div className="text-xs">
                <span className={`font-bold ${t.textPrimary} block transition-colors`}>Daily Phone Reminders</span>
                <span className={t.textSecondary}>Receive a push notification at 8:00 PM</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await scheduleDailyReminder(20, 0);
                  alert('Phone notifications enabled for 8:00 PM!');
                }}
                className={`py-1.5 px-3 ${t.bgIndigo} hover:opacity-90 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 ml-2`}
              >
                Turn On
              </button>
            </div>
          </div>
          
          {/* 2. FIXED BOTTOM BUTTON AREA (Never overlaps text) */}
          <div className={`shrink-0 p-4 sm:p-6 ${t.innerBg} border-t ${t.innerBorder} transition-colors`}>
            <button
              type="submit"
              className={`w-full py-3.5 px-4 ${t.activeBtnBg} ${t.activeBtnText} hover:opacity-90 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer`}
            >
              <CheckCircle className="w-5 h-5" />
              Save Profile &amp; Update Goals
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};