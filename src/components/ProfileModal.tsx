import React, { useState } from 'react';
import { UserProfile, HealthGoal, ActivityLevel } from '../types/nutrition';
import { calculateRecommendedMacros } from '../services/storage';
import { X, CheckCircle, Calculator, Sliders, User } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });

  if (!isOpen) return null;

  const handleRecalculate = () => {
    const recommended = calculateRecommendedMacros(formData);
    setFormData((prev) => ({
      ...prev,
      targetCalories: recommended.calories,
      targetProtein: recommended.protein,
      targetCarbs: recommended.carbs,
      targetFat: recommended.fat,
      targetFiber: recommended.fiber,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

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
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">Nutrition Profile &amp; Targets</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">TDEE calculator and daily macronutrient targets</p>
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
                  value={formData.weightKg}
                  onChange={(e) =>
                    setFormData({ ...formData, weightKg: parseFloat(e.target.value) || 70 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) =>
                    setFormData({ ...formData, heightCm: parseFloat(e.target.value) || 175 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: parseInt(e.target.value, 10) || 25 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Biological Sex</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as any })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Body Fat % with Lean Body Mass Indicator */}
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
                  onChange={(e) =>
                    setFormData({ ...formData, bodyFatPct: parseFloat(e.target.value) })
                  }
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="60"
                  value={formData.bodyFatPct || ''}
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

              {/* Dynamic Body Composition Breakdown */}
              {formData.bodyFatPct && formData.bodyFatPct > 3 && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Primary Goal</label>
              <select
                value={formData.goal}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value as HealthGoal })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="lose_weight">Fat Loss / Caloric Deficit</option>
                <option value="gain_muscle">Muscle Gain / Lean Bulk</option>
                <option value="maintain">Weight Maintenance</option>
                <option value="high_protein">Athletic High Protein</option>
                <option value="keto">Ketogenic (Low Carb)</option>
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

          {/* Auto Calculate Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleRecalculate}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              Auto-Calculate TDEE Macro Distribution
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              {formData.bodyFatPct && formData.bodyFatPct > 3
                ? `Using Katch-McArdle formula with ${(
                    formData.weightKg *
                    (1 - formData.bodyFatPct / 100)
                  ).toFixed(1)} kg Lean Body Mass`
                : 'Using Mifflin-St Jeor formula based on total bodyweight'}
            </p>
          </div>

          {/* Daily Targets Output Grid */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Daily Target Numbers
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  value={formData.targetCalories}
                  onChange={(e) =>
                    setFormData({ ...formData, targetCalories: parseInt(e.target.value, 10) || 2000 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={formData.targetProtein}
                  onChange={(e) =>
                    setFormData({ ...formData, targetProtein: parseInt(e.target.value, 10) || 140 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={formData.targetCarbs}
                  onChange={(e) =>
                    setFormData({ ...formData, targetCarbs: parseInt(e.target.value, 10) || 200 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">Total Fat (g)</label>
                <input
                  type="number"
                  value={formData.targetFat}
                  onChange={(e) =>
                    setFormData({ ...formData, targetFat: parseInt(e.target.value, 10) || 65 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fiber Target (g)</label>
                <input
                  type="number"
                  value={formData.targetFiber}
                  onChange={(e) =>
                    setFormData({ ...formData, targetFiber: parseInt(e.target.value, 10) || 30 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Water Goal (ml)</label>
                <input
                  type="number"
                  value={formData.waterGoalMl}
                  onChange={(e) =>
                    setFormData({ ...formData, waterGoalMl: parseInt(e.target.value, 10) || 3000 })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
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
