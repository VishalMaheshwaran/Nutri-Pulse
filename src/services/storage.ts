import { UserProfile, DailyLog, FoodItem, SavedFood, SavedWorkout, MacroTotals } from '../types/nutrition';

const PROFILE_KEY = 'nutripulse_user_profile';
const LOGS_KEY = 'nutripulse_daily_logs';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex',
  gender: 'male',
  age: 28,
  weightKg: 74,
  heightCm: 178,
  activityLevel: 'moderate',
  goal: 'high_protein',
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

  // If Body Fat % is provided and valid, use Katch-McArdle (Gold standard based on Lean Body Mass)
  if (bodyFat && bodyFat > 3 && bodyFat < 65) {
    leanBodyMassKg = Math.round(weight * (1 - bodyFat / 100) * 10) / 10;
    fatMassKg = Math.round((weight - leanBodyMassKg) * 10) / 10;
    bmr = Math.round(370 + 21.6 * leanBodyMassKg);
    formulaUsed = 'Katch-McArdle (Body Fat %)';
  } else {
    // Mifflin-St Jeor equation fallback
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

  let targetCalories = tdee;
  if (goal === 'lose_weight') targetCalories -= 450;
  if (goal === 'gain_muscle') targetCalories += 350;

  targetCalories = Math.max(1200, targetCalories);

  let proteinGrams: number;
  let fatGrams: number;
  let carbsGrams: number;

  if (leanBodyMassKg) {
    // Protein tailored to Lean Body Mass
    if (goal === 'lose_weight') {
      proteinGrams = Math.round(leanBodyMassKg * 2.5); // Higher protein during deficit prevents muscle catabolism
    } else if (goal === 'gain_muscle' || goal === 'high_protein') {
      proteinGrams = Math.round(leanBodyMassKg * 2.4);
    } else {
      proteinGrams = Math.round(leanBodyMassKg * 2.1);
    }

    // Healthy dietary fat: 0.9g - 1.0g per kg of LBM or 25% of calories
    fatGrams = Math.round(Math.max(leanBodyMassKg * 0.9, (targetCalories * 0.25) / 9));
  } else {
    // Baseline scaling to total bodyweight
    proteinGrams = Math.round(weight * 2.0);
    if (goal === 'high_protein' || goal === 'gain_muscle') {
      proteinGrams = Math.round(weight * 2.2);
    }
    fatGrams = Math.round((targetCalories * 0.25) / 9);
  }

  carbsGrams = Math.round((targetCalories - (proteinGrams * 4 + fatGrams * 9)) / 4);

  if (goal === 'keto') {
    carbsGrams = 30;
    if (leanBodyMassKg) {
      proteinGrams = Math.round(leanBodyMassKg * 2.0);
    } else {
      proteinGrams = Math.round(weight * 1.8);
    }
    fatGrams = Math.round((targetCalories - (proteinGrams * 4 + carbsGrams * 4)) / 9);
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
      const parsed = JSON.parse(raw);
      if (Object.keys(parsed).length >= 3) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse logs', e);
  }

  // Pre-seed realistic multi-day historical data for immediate rich analytics
  const todayDate = new Date();
  const initialLogs: Record<string, DailyLog> = {};

  const historyTemplates = [
    {
      offset: 6,
      water: 2750,
      items: [
        { name: 'Oatmeal with Blueberries & Whey', cal: 420, p: 32, c: 58, f: 6, meal: 'breakfast' as const },
        { name: 'Chicken Breast with Quinoa & Greens', cal: 580, p: 48, c: 45, f: 12, meal: 'lunch' as const },
        { name: 'Cold Coffee with Protein', cal: 190, p: 24, c: 15, f: 3, meal: 'snack' as const },
        { name: 'Grilled Salmon & Sweet Potato', cal: 640, p: 44, c: 52, f: 20, meal: 'dinner' as const },
        { name: 'Greek Yogurt Bowl', cal: 210, p: 20, c: 18, f: 4, meal: 'snack' as const },
      ],
    },
    {
      offset: 5,
      water: 3000,
      items: [
        { name: 'Scrambled Eggs with Avocado Toast', cal: 480, p: 28, c: 38, f: 22, meal: 'breakfast' as const },
        { name: 'Turkey & Brown Rice Bowl', cal: 590, p: 46, c: 62, f: 11, meal: 'lunch' as const },
        { name: 'Whey Protein Shake', cal: 140, p: 25, c: 3, f: 2, meal: 'snack' as const },
        { name: 'Lean Beef Sirloin with Asparagus', cal: 620, p: 52, c: 24, f: 24, meal: 'dinner' as const },
        { name: 'Mixed Berries with Cottage Cheese', cal: 180, p: 18, c: 14, f: 3, meal: 'snack' as const },
      ],
    },
    {
      offset: 4,
      water: 2500,
      items: [
        { name: 'Protein Pancakes with Maple Syrup', cal: 450, p: 35, c: 55, f: 7, meal: 'breakfast' as const },
        { name: 'Tuna Salad with Olive Oil & Quinoa', cal: 520, p: 42, c: 40, f: 16, meal: 'lunch' as const },
        { name: 'Roasted Almonds & Apple', cal: 240, p: 6, c: 28, f: 14, meal: 'snack' as const },
        { name: 'Baked Chicken Thighs with Broccoli', cal: 610, p: 45, c: 22, f: 26, meal: 'dinner' as const },
      ],
    },
    {
      offset: 3,
      water: 3250,
      items: [
        { name: 'Egg White Omelette with Spinach & Feta', cal: 380, p: 34, c: 12, f: 14, meal: 'breakfast' as const },
        { name: 'Chipotle Chicken Bowl with Brown Rice', cal: 680, p: 54, c: 68, f: 18, meal: 'lunch' as const },
        { name: 'Cold Coffee with Vanilla Whey', cal: 195, p: 24, c: 16, f: 3.5, meal: 'snack' as const },
        { name: 'Grilled Cod with Jasmine Rice', cal: 560, p: 42, c: 58, f: 8, meal: 'dinner' as const },
        { name: 'Protein Bar', cal: 210, p: 20, c: 22, f: 7, meal: 'snack' as const },
      ],
    },
    {
      offset: 2,
      water: 2800,
      items: [
        { name: 'Rolled Oats with Greek Yogurt & Berries', cal: 420, p: 26, c: 62, f: 7, meal: 'breakfast' as const },
        { name: 'Grilled Salmon with Quinoa & Asparagus', cal: 580, p: 42, c: 38, f: 22, meal: 'lunch' as const },
        { name: 'Whey Protein Shake', cal: 130, p: 25, c: 3, f: 1.5, meal: 'snack' as const },
        { name: 'Chicken Breast with Roasted Potatoes', cal: 630, p: 48, c: 54, f: 14, meal: 'dinner' as const },
        { name: 'Low Fat String Cheese & Apple', cal: 160, p: 10, c: 20, f: 4, meal: 'snack' as const },
      ],
    },
    {
      offset: 1, // Yesterday
      water: 3100,
      items: [
        { name: 'Avocado & Poached Egg Sourdough', cal: 460, p: 24, c: 42, f: 18, meal: 'breakfast' as const },
        { name: 'Chicken & Sweet Potato Bowl', cal: 610, p: 50, c: 56, f: 12, meal: 'lunch' as const },
        { name: 'My Signature Cold Coffee', cal: 195, p: 24, c: 16, f: 3.5, meal: 'snack' as const },
        { name: 'Steak with Green Beans & Rice', cal: 640, p: 46, c: 48, f: 22, meal: 'dinner' as const },
        { name: 'Greek Yogurt with Honey', cal: 180, p: 18, c: 16, f: 3, meal: 'snack' as const },
      ],
    },
    {
      offset: 0, // Today
      water: 2250,
      items: [
        { name: 'Rolled Oats with Greek Yogurt & Berries', cal: 420, p: 26, c: 62, f: 7, meal: 'breakfast' as const },
        { name: 'Grilled Salmon with Quinoa & Asparagus', cal: 580, p: 42, c: 38, f: 22, meal: 'lunch' as const },
        { name: 'Whey Protein Isolate Shake', cal: 130, p: 25, c: 3, f: 1.5, meal: 'snack' as const },
      ],
    },
  ];

  historyTemplates.forEach((t) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - t.offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;

    initialLogs[dateStr] = {
      date: dateStr,
      waterIntakeMl: t.water,
      items: t.items.map((it, idx) => ({
        id: `seed-${dateStr}-${idx}`,
        name: it.name,
        servingSize: '1 serving',
        servingWeightGrams: 200,
        servings: 1,
        calories: it.cal,
        protein: it.p,
        carbs: it.c,
        fat: it.f,
        fiber: Math.round(it.c * 0.15),
        source: 'preset',
        loggedAt: new Date(d.getTime() + (idx + 1) * 3600000).toISOString(),
        mealType: it.meal,
      })),
    };
  });

  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(initialLogs));
  } catch (e) {
    // ignore
  }
  return initialLogs;
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
      const mult = item.servings || 1;
      return {
        calories: acc.calories + Math.round(item.calories * mult),
        protein: Math.round((acc.protein + item.protein * mult) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbs * mult) * 10) / 10,
        fat: Math.round((acc.fat + item.fat * mult) * 10) / 10,
        fiber: Math.round((acc.fiber + item.fiber * mult) * 10) / 10,
        sugar: Math.round((acc.sugar + (item.sugar || 0) * mult) * 10) / 10,
        sodiumMg: acc.sodiumMg + Math.round((item.sodiumMg || 0) * mult),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodiumMg: 0 }
  );
}

// Clean Web Audio beep on successful scan
export function playBeepSound(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    // audio context might be blocked if no user interaction yet
  }
}

const SAVED_FOODS_KEY = 'nutripulse_saved_foods';

export const INITIAL_SAVED_FOODS = [
  {
    id: 'fav-cold-coffee',
    name: 'My Signature Cold Coffee',
    brand: 'Custom Recipe',
    servingSize: '1 glass (350ml)',
    servingWeightGrams: 350,
    calories: 195,
    protein: 24,
    carbs: 16,
    fat: 3.5,
    fiber: 1,
    sugar: 8,
    sodiumMg: 110,
    notes: 'Double espresso, 200ml unsweetened almond milk, 1 scoop vanilla whey protein, 1 tsp maple syrup, ice.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fav-protein-oats',
    name: 'Morning Protein Oatmeal',
    brand: 'Homemade',
    servingSize: '1 bowl (300g)',
    servingWeightGrams: 300,
    calories: 430,
    protein: 34,
    carbs: 52,
    fat: 9,
    fiber: 8,
    sugar: 6,
    sodiumMg: 120,
    notes: '60g rolled oats, 1 scoop whey, 15g natural peanut butter, cinnamon, water.',
    createdAt: new Date().toISOString(),
  },
];

export function getStoredSavedFoods(): any[] {
  try {
    const raw = localStorage.getItem(SAVED_FOODS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse saved foods', e);
  }
  return INITIAL_SAVED_FOODS;
}

export function saveStoredSavedFoods(foods: any[]): void {
  try {
    localStorage.setItem(SAVED_FOODS_KEY, JSON.stringify(foods));
  } catch (e) {
    console.error('Failed to save saved foods', e);
  }
}

export const SAVED_WORKOUTS_KEY = 'nutripulse_saved_workouts_v1';

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
