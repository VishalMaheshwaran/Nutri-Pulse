export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  servingWeightGrams: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodiumMg?: number;
  barcode?: string;
  imageUrl?: string;
  source: 'ai' | 'barcode' | 'manual' | 'preset';
  confidence?: 'high' | 'medium' | 'low';
  dietaryTags?: string[];
  healthTip?: string;
  loggedAt: string;
  mealType: MealType;
}

export type HealthGoal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'keto' | 'high_protein';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  bodyFatPct?: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetFiber: number;
  waterGoalMl: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  items: FoodItem[];
  waterIntakeMl: number;
  workouts?: WorkoutItem[]; // <-- ADD THIS LINE
  notes?: string;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodiumMg: number;
}

export interface SavedFood {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  servingWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodiumMg?: number;
  notes?: string;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  exerciseName: string;
  weightKg?: number;
  reps?: number;
}

export interface SavedWorkout {
  id: string;
  name: string;
  description: string;
  durationMinutes?: number;
  caloriesBurned: number;
  sets?: {
    exerciseName: string;
    weightKg?: number;
    reps?: number;
  }[];
  createdAt: string;
}

export interface WorkoutItem {
  id: string;
  description: string;
  caloriesBurned: number;
  durationMinutes?: number;
  avgBpm?: number;
  sets?: WorkoutSet[]; // <-- ADD THIS LINE
  loggedAt: string;
}