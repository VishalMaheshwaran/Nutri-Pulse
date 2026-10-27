import { UserProfile, DailyLog, FoodItem, SavedFood, SavedWorkout, MacroTotals } from '../types/nutrition';

const PROFILE_KEY = 'nutripulse_user_profile';
const LOGS_KEY = 'nutripulse_daily_logs';
const SAVED_FOODS_KEY = 'nutripulse_saved_foods';
const SAVED_WORKOUTS_KEY = 'nutripulse_saved_workouts_v1';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex',
  gender: 'male',
  age: 28,
  weightKg: 74,
  heightCm: 178,
  activityLevel: 'moderate',
  goal: 'gain_muscle', // Updated to valid HealthGoal
  bodyFatPct: 15,
  targetCalories: 2350,
  targetProtein: 165,
  targetCarbs: 230,
  targetFat: 68,
  targetFiber: 35,
  waterGoalMl: 3000,
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface MacroCalculationResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  bmr: number;
  tdee: number;
  leanBodyMassKg?: number;
  fatMassKg?: number;
  formulaUsed: 'Katch-McArdle (Body Fat %)' | 'Mifflin-St Jeor';
}

export function calculateRecommendedMacros(profile: Partial<UserProfile>): MacroCalculationResult {
  const weight = profile.weightKg || 70;
  const height = profile.heightCm || 175;
  const age = profile.age || 25;
  const gender = profile.gender || 'male';
  const activity = profile.activityLevel || 'moderate';
  const goal = profile.goal || 'maintain';
  const bodyFat = profile.bodyFatPct;

  let bmr: number;
  let leanBodyMassKg: number | undefined;
  let fatMassKg: number | undefined;
  let formulaUsed: 'Katch-McArdle (Body Fat %)' | 'Mifflin-St Jeor';

  if (bodyFat && bodyFat > 3 && bodyFat < 65) {
    leanBodyMassKg = Math.round(weight * (1 - bodyFat / 100) * 10) / 10;
    fatMassKg = Math.round((weight - leanBodyMassKg) * 10) / 10;
    bmr = Math.round(370 + 21.6 * leanBodyMassKg);
    formulaUsed = 'Katch-McArdle (Body Fat %)';
  } else {
    let msj = 10 * weight + 6.25 * height - 5 * age;
    if (gender === 'male') {
      msj += 5;
    } else {
      msj -= 161;
    }
    bmr = Math.round(msj);
    formulaUsed = 'Mifflin-St Jeor';
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };

  const tdee = Math.round(bmr * (activityMultipliers[activity] || 1.4));

  let targetCalories = profile.targetCalories && profile.targetCalories > 0 
    ? profile.targetCalories 
    : tdee;

  if (!profile.targetCalories) {
    if (goal === 'lose_weight') targetCalories -= 450;
    if (goal === 'gain_muscle') targetCalories += 350;
  }

  targetCalories = Math.max(1200, targetCalories);

  let proteinGrams: number;
  let fatGrams: number;
  let carbsGrams: number;

  if (profile.targetCalories && profile.targetCalories > 0) {
    proteinGrams = Math.round((targetCalories * 0.30) / 4);
    carbsGrams = Math.round((targetCalories * 0.45) / 4);
    fatGrams = Math.round((targetCalories * 0.25) / 9);
  } else {
    if (leanBodyMassKg) {
      if (goal === 'lose_weight') {
        proteinGrams = Math.round(leanBodyMassKg * 2.5);
      } else if (goal === 'gain_muscle') {
        proteinGrams = Math.round(leanBodyMassKg * 2.4);
      } else {
        proteinGrams = Math.round(leanBodyMassKg * 2.1);
      }
      fatGrams = Math.round(Math.max(leanBodyMassKg * 0.9, (targetCalories * 0.25) / 9));
    } else {
      proteinGrams = Math.round(weight * 2.0);
      if (goal === 'gain_muscle') {
        proteinGrams = Math.round(weight * 2.2);
      }
      fatGrams = Math.round((targetCalories * 0.25) / 9);
    }

    carbsGrams = Math.round((targetCalories - (proteinGrams * 4 + fatGrams * 9)) / 4);
  }

  return {
    calories: targetCalories,
    protein: Math.max(50, proteinGrams),
    carbs: Math.max(20, carbsGrams),
    fat: Math.max(30, fatGrams),
    fiber: 32,
    bmr,
    tdee,
    leanBodyMassKg,
    fatMassKg,
    formulaUsed,
  };
}

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to parse user profile', e);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function getStoredLogs(): Record<string, DailyLog> {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse logs', e);
  }
  return {};
}

export function saveStoredLogs(logs: Record<string, DailyLog>): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs', e);
  }
}

export function calculateTotals(items: FoodItem[]): MacroTotals {
  return items.reduce(
    (acc, item) => {
      return {
        calories: acc.calories + Math.round(item.calories),
        protein: Math.round((acc.protein + item.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
        fat: Math.round((acc.fat + item.fat) * 10) / 10,
        fiber: Math.round((acc.fiber + item.fiber) * 10) / 10,
        sugar: Math.round((acc.sugar + (item.sugar || 0)) * 10) / 10,
        sodiumMg: acc.sodiumMg + Math.round(item.sodiumMg || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodiumMg: 0 }
  );
}

export function downloadAppDataBackup(): void {
  const backupData: Record<string, any> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const rawValue = localStorage.getItem(key);
      try {
        backupData[key] = rawValue ? JSON.parse(rawValue) : rawValue;
      } catch {
        backupData[key] = rawValue;
      }
    }
  }

  const payload = {
    app: 'NutriPulse',
    exportedAt: new Date().toISOString(),
    data: backupData,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const link = document.createElement('a');
  link.href = url;
  link.download = `nutripulse-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function uploadAppDataBackup(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const rawData = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;

        if (!rawData || typeof rawData !== 'object') {
          throw new Error('Invalid backup file format.');
        }

        if (rawData.profile) {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(rawData.profile));
        }
        if (rawData.logs) {
          localStorage.setItem(LOGS_KEY, JSON.stringify(rawData.logs));
        }
        if (rawData.savedFoods) {
          localStorage.setItem(SAVED_FOODS_KEY, JSON.stringify(rawData.savedFoods));
        }
        if (rawData.savedWorkouts) {
          localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(rawData.savedWorkouts));
        }

        Object.entries(rawData).forEach(([key, value]) => {
          if (key.startsWith('nutripulse_')) {
            if (typeof value === 'string') {
              localStorage.setItem(key, value);
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          }
        });

        resolve();
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

export function playBeepSound(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {}
}

export function getStoredSavedFoods(): any[] {
  try {
    const raw = localStorage.getItem(SAVED_FOODS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse saved foods', e);
  }
  return [];
}

export function saveStoredSavedFoods(foods: any[]): void {
  try {
    localStorage.setItem(SAVED_FOODS_KEY, JSON.stringify(foods));
  } catch (e) {
    console.error('Failed to save saved foods', e);
  }
}

export function getStoredSavedSavedWorkouts(): SavedWorkout[] {
  try {
    const data = localStorage.getItem(SAVED_WORKOUTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load saved workouts', e);
    return [];
  }
}

export function saveStoredSavedWorkouts(workouts: SavedWorkout[]) {
  try {
    localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (e) {
    console.error('Failed to save workouts', e);
  }
}