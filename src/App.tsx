// src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Trophy, Flame, Bell } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DailyLog, FoodItem, MealType, UserProfile, SavedFood, WorkoutItem, SavedWorkout } from './types/nutrition';
import {
  getStoredProfile,
  saveStoredProfile,
  getStoredLogs,
  saveStoredLogs,
  getStoredSavedFoods,
  saveStoredSavedFoods,
  getTodayDateString,
  calculateTotals,
  getStoredSavedSavedWorkouts,
  saveStoredSavedWorkouts,
} from './services/storage';
import { TopBar } from './components/TopBar';
import { MacroRings } from './components/MacroRings';
import { LiveMacroWidget } from './components/LiveMacroWidget';
import { MealSection } from './components/MealSection';
import { WaterTracker } from './components/WaterTracker';
import { WorkoutTracker } from './components/WorkoutTracker';
import { StatisticsTab } from './components/StatisticsTab';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { GeminiFoodModal } from './components/GeminiFoodModal';
import { ProfileModal } from './components/ProfileModal';
import { SavedFoodsModal } from './components/SavedFoodsModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SavedWorkoutsModal } from './components/SavedWorkoutsModal';
import { GoalCelebrationModal } from './components/GoalCelebrationModal';
import { DailyReportModal } from './components/DailyReportModal';
import { NotificationPreviewModal } from './components/NotificationPreviewModal';
import { updateLiveTrackerNotification } from './services/notifications';
import { useTheme } from './hooks/useTheme';

// Import the new background task manager and context
import { TaskProvider } from './context/TaskContext';
import { TaskManager } from './components/TaskManager';

export default function App() {
  const { t } = useTheme();
  
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [logs, setLogs] = useState<Record<string, DailyLog>>(getStoredLogs);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>(getStoredSavedFoods);
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>(getStoredSavedSavedWorkouts);
  const [isSavedWorkoutsOpen, setIsSavedWorkoutsOpen] = useState<boolean>(false);

  // Modals state
  const [isBarcodeOpen, setIsBarcodeOpen] = useState<boolean>(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSavedFoodsOpen, setIsSavedFoodsOpen] = useState<boolean>(false);
  const [isStreakPreviewOpen, setIsStreakPreviewOpen] = useState<boolean>(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState<boolean>(false);
  const [isNotifPreviewOpen, setIsNotifPreviewOpen] = useState<boolean>(false);
  const [activeMealTarget, setActiveMealTarget] = useState<MealType>('lunch');
  const [activeView, setActiveView] = useState<'dashboard' | 'statistics'>('dashboard');

  const [geminiItemToEdit, setGeminiItemToEdit] = useState<FoodItem | undefined>(undefined);

  useEffect(() => {
    const handleGlobalHaptics = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest('button');
      if (button && !button.disabled) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }
    };
    window.addEventListener('click', handleGlobalHaptics, true);
    return () => window.removeEventListener('click', handleGlobalHaptics, true);
  }, []);

  useEffect(() => saveStoredProfile(profile), [profile]);
  useEffect(() => saveStoredLogs(logs), [logs]);
  useEffect(() => saveStoredSavedFoods(savedFoods), [savedFoods]);
  useEffect(() => saveStoredSavedWorkouts(savedWorkouts), [savedWorkouts]);

  const currentLog: DailyLog = logs[currentDate] || { date: currentDate, items: [], waterIntakeMl: 0, workouts: [] };
  const totals = calculateTotals(currentLog.items);
  const burnedCalories = (currentLog.workouts || []).reduce((sum, workout) => sum + workout.caloriesBurned, 0);

  // Calculate Perfect Day Streak & Total Perfect Days for Home Page Banner
  const { perfectStreak, totalPerfectDays } = useMemo(() => {
    const isDayPerfect = (dateStr: string) => {
      const dLog = logs[dateStr];
      if (!dLog || !dLog.items || dLog.items.length === 0) return false;
      const dTotals = calculateTotals(dLog.items);
      const tCals = dLog.targetCalories ?? profile.targetCalories ?? 2000;
      const tProt = dLog.targetProtein ?? profile.targetProtein ?? 120;
      const burned = (dLog.workouts || []).reduce((s, w) => s + w.caloriesBurned, 0);
      const budget = tCals + burned;

      const hitProt = dTotals.protein >= tProt * 0.95;
      let hitCals = false;
      if (profile.goal === 'lose_weight') hitCals = dTotals.calories > 0 && dTotals.calories <= budget + 25;
      else if (profile.goal === 'gain_muscle') hitCals = dTotals.calories >= budget * 0.95 && dTotals.calories <= budget + 200;
      else hitCals = Math.abs(dTotals.calories - budget) <= 150;

      return hitProt && hitCals;
    };

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (isDayPerfect(dateStr)) {
        streak++;
      } else if (i === 0) {
        // If today isn't finished yet, keep checking from yesterday
        continue;
      } else {
        break;
      }
    }

    const total = Object.keys(logs).filter(isDayPerfect).length;
    return { perfectStreak: streak, totalPerfectDays: total };
  }, [logs, profile]);

  useEffect(() => {
    updateLiveTrackerNotification({
      eatenCalories: totals.calories,
      targetCalories: currentLog.targetCalories ?? profile.targetCalories ?? 2600,
      burnedCalories: burnedCalories,
      proteinGrams: totals.protein,
      targetProtein: currentLog.targetProtein ?? profile.targetProtein ?? 150,
      carbsGrams: totals.carbs,
      targetCarbs: profile.targetCarbs,
      fatGrams: totals.fat,
      targetFat: profile.targetFat,
      waterMl: currentLog.waterIntakeMl || 0,
      targetWaterMl: profile.waterGoalMl,
      streakDays: perfectStreak,
      recentFoods: currentLog.items.slice(0, 4).map((item) => ({
        name: item.name,
        calories: Math.round(item.calories * item.servings),
        mealType: item.mealType,
      })),
    });
  }, [totals, burnedCalories, currentLog, profile, perfectStreak]);

  const handleFoodLogged = (newItem: FoodItem) => {
    setLogs((prev) => {
      const dayLog = prev[currentDate] || { date: currentDate, items: [], waterIntakeMl: 0, workouts: [] };
      return { ...prev, [currentDate]: { ...dayLog, items: [newItem, ...dayLog.items] } };
    });
  };

  const handleUpdateItem = (updatedItem: FoodItem) => {
    setLogs((prev) => {
      const dayLog = prev[currentDate];
      if (!dayLog) return prev;
      return { ...prev, [currentDate]: { ...dayLog, items: dayLog.items.map((item) => (item.id === updatedItem.id ? updatedItem : item)) } };
    });
  };

  const handleUpdateServing = (itemId: string, newServings: number) => {
    setLogs((prev) => {
      const dayLog = prev[currentDate];
      if (!dayLog) return prev;
      return { ...prev, [currentDate]: { ...dayLog, items: dayLog.items.map((item) => item.id === itemId ? { ...item, servings: Math.max(0.1, newServings) } : item) } };
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setLogs((prev) => {
      const dayLog = prev[currentDate];
      if (!dayLog) return prev;
      return { ...prev, [currentDate]: { ...dayLog, items: dayLog.items.filter((item) => item.id !== itemId) } };
    });
  };

  const handleUpdateWater = (newAmount: number) => {
    setLogs((prev) => {
      const dayLog = prev[currentDate] || { date: currentDate, items: [], waterIntakeMl: 0, workouts: [] };
      return { ...prev, [currentDate]: { ...dayLog, waterIntakeMl: newAmount } };
    });
  };

  const handleUpdateWorkouts = (newWorkouts: WorkoutItem[]) => {
    setLogs((prev) => {
      const dayLog = prev[currentDate] || { date: currentDate, items: [], waterIntakeMl: 0, workouts: [] };
      return { ...prev, [currentDate]: { ...dayLog, workouts: newWorkouts } };
    });
  };

  const handleSaveRoutine = (workout: WorkoutItem) => {
    const newRoutine: SavedWorkout = {
      id: `routine-${Date.now()}`, name: workout.description, description: `${workout.sets?.length || 0} exercises/sets recorded`,
      durationMinutes: workout.durationMinutes, caloriesBurned: workout.caloriesBurned,
      sets: (workout.sets || []).map((s, i) => ({ ...s, id: `set-${Date.now()}-${i}` })), createdAt: new Date().toISOString(),
    };
    setSavedWorkouts((prev) => [newRoutine, ...prev.filter((r) => r.name !== workout.description)]);
  };

  const handleLogSavedWorkout = (routine: SavedWorkout) => {
    const workoutItem: WorkoutItem = {
      id: `workout-routine-${Date.now()}`, description: routine.name, caloriesBurned: routine.caloriesBurned,
      durationMinutes: routine.durationMinutes, sets: (routine.sets || []).map((s, i) => ({ ...s, id: `set-${Date.now()}-${i}` })),
      loggedAt: new Date().toISOString(),
    };
    setLogs((prev) => {
      const dayLog = prev[currentDate] || { date: currentDate, items: [], waterIntakeMl: 0, workouts: [] };
      return { ...prev, [currentDate]: { ...dayLog, workouts: [workoutItem, ...(dayLog.workouts || [])] } };
    });
  };

  const handleDeleteSavedWorkout = (id: string) => setSavedWorkouts((prev) => prev.filter((r) => r.id !== id));

  const handleCopyEntry = (item: FoodItem, targetMeal: MealType) => {
    const todayDate = getTodayDateString();
    const duplicatedItem: FoodItem = { ...item, id: `copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, mealType: targetMeal, loggedAt: new Date().toISOString() };
    setLogs((prev) => {
      const targetLog = prev[todayDate] || { date: todayDate, items: [], waterIntakeMl: 0, workouts: [] };
      return { ...prev, [todayDate]: { ...targetLog, items: [duplicatedItem, ...targetLog.items] } };
    });
    setCurrentDate(todayDate);
  };

  const handleCopyMeal = (sourceMeal: MealType, targetMeal: MealType) => {
    const sourceItems = currentLog.items.filter((i) => i.mealType === sourceMeal);
    if (sourceItems.length === 0) return;
    const duplicatedItems: FoodItem[] = sourceItems.map((item, idx) => ({
      ...item, id: `meal-copy-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`, mealType: targetMeal, loggedAt: new Date().toISOString(),
    }));
    const todayDate = getTodayDateString();
    setLogs((prev) => {
      const targetLog = prev[todayDate] || { date: todayDate, items: [], waterIntakeMl: 0, workouts: [] };
      return { ...prev, [todayDate]: { ...targetLog, items: [...duplicatedItems, ...targetLog.items] } };
    });
    setCurrentDate(todayDate);
  };

  const handleSaveToFavorites = (item: FoodItem) => {
    const newSaved: SavedFood = {
      id: `fav-${Date.now()}`, name: item.name, brand: item.brand, servingSize: item.servingSize, servingWeightGrams: item.servingWeightGrams,
      calories: Math.round(item.calories * item.servings), protein: Math.round(item.protein * item.servings * 10) / 10,
      carbs: Math.round(item.carbs * item.servings * 10) / 10, fat: Math.round(item.fat * item.servings * 10) / 10,
      fiber: Math.round(item.fiber * item.servings * 10) / 10, sugar: item.sugar ? Math.round(item.sugar * item.servings * 10) / 10 : undefined,
      sodiumMg: item.sodiumMg ? Math.round(item.sodiumMg * item.servings) : undefined, notes: item.healthTip || undefined,
      originalPrompt: item.originalPrompt || undefined, createdAt: new Date().toISOString(),
    };
    setSavedFoods((prev) => [newSaved, ...prev.filter((f) => f.name.toLowerCase() !== item.name.toLowerCase())]);
  };

  const handleLogSavedFood = (savedFood: SavedFood, targetMeal: MealType) => {
    const foodItem: FoodItem = {
      id: `saved-log-${Date.now()}`, name: savedFood.name, brand: savedFood.brand, servingSize: savedFood.servingSize,
      servingWeightGrams: savedFood.servingWeightGrams, servings: 1, calories: savedFood.calories, protein: savedFood.protein,
      carbs: savedFood.carbs, fat: savedFood.fat, fiber: savedFood.fiber, sugar: savedFood.sugar, sodiumMg: savedFood.sodiumMg,
      source: savedFood.originalPrompt ? 'ai' : 'preset', healthTip: savedFood.notes, originalPrompt: savedFood.originalPrompt,
      loggedAt: new Date().toISOString(), mealType: targetMeal,
    };
    handleFoodLogged(foodItem);
  };

  const handleAddCustomSavedFood = (foodData: Omit<SavedFood, 'id' | 'createdAt'>) => {
    setSavedFoods((prev) => [{ ...foodData, id: `custom-fav-${Date.now()}`, createdAt: new Date().toISOString() }, ...prev]);
  };

  const handleDeleteSavedFood = (id: string) => setSavedFoods((prev) => prev.filter((f) => f.id !== id));

  const handleQuickAdd = (mealType: MealType, name: string, calories: number, protein: number, carbs: number, fat: number) => {
    handleFoodLogged({ id: `quick-${Date.now()}`, name, servingSize: '1 serving', servingWeightGrams: 100, servings: 1, calories, protein, carbs, fat, fiber: 0, source: 'manual', loggedAt: new Date().toISOString(), mealType });
  };

  const openBarcodeForMeal = (meal: MealType) => { setActiveMealTarget(meal); setIsBarcodeOpen(true); };
  const openGeminiForMeal = (meal: MealType, itemToEdit?: FoodItem) => { setActiveMealTarget(meal); setGeminiItemToEdit(itemToEdit); setIsGeminiOpen(true); };
  const openSavedFoodsForMeal = (meal: MealType) => { setActiveMealTarget(meal); setIsSavedFoodsOpen(true); };

  const breakfastItems = currentLog.items.filter((i) => i.mealType === 'breakfast');
  const lunchItems = currentLog.items.filter((i) => i.mealType === 'lunch');
  const dinnerItems = currentLog.items.filter((i) => i.mealType === 'dinner');
  const snackItems = currentLog.items.filter((i) => i.mealType === 'snack');

  return (
    <TaskProvider>
      <div
        className={`min-h-screen ${t.globalBg} ${t.textPrimary} flex flex-col font-sans w-full transition-colors duration-300`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 70px)' }}
      >
        <TopBar
          currentDate={currentDate} onDateChange={setCurrentDate}
          onOpenBarcode={() => openBarcodeForMeal(activeMealTarget)} onOpenGemini={() => openGeminiForMeal(activeMealTarget)}
          onOpenSavedFoods={() => openSavedFoodsForMeal(activeMealTarget)} onOpenProfile={() => setIsProfileOpen(true)}
          activeView={activeView} setActiveView={setActiveView} logs={logs} profile={profile}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-8 space-y-4 sm:space-y-6 overflow-x-hidden">
          {activeView === 'dashboard' && (
            <div className="space-y-5 sm:space-y-7 w-full">
              
              {/* PERFECT DAY STREAK BANNER ON HOME PAGE */}
              <div className={`p-3.5 sm:p-4 ${t.cardBg} border ${t.cardBorder} rounded-2xl ${t.shadow} flex items-center justify-between gap-3 transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${t.innerBg} border ${t.innerBorder} flex items-center justify-center ${t.accentAmber} shrink-0`}>
                    {/* Updated to native tailwind animate-pulse */}
                    <Trophy className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs sm:text-sm font-extrabold ${t.textPrimary}`}>
                        Perfect Day Streak
                      </h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${t.innerBg} border ${t.innerBorder} ${t.accentAmber}`}>
                        {totalPerfectDays} Gold Badges
                      </span>
                    </div>
                    <p className={`text-[11px] ${t.textSecondary} mt-0.5`}>
                      Hit both your Calorie &amp; Protein targets to unlock a Perfect Day
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNotifPreviewOpen(true)}
                    className="py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Preview Notification Photo Card"
                  >
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Notification Card</span>
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 shrink-0">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-sm sm:text-base font-extrabold font-mono text-amber-400">
                      {perfectStreak}d
                    </span>
                  </div>
                </div>
              </div>

              <LiveMacroWidget totals={totals} profile={profile} caloriesBurned={burnedCalories} logs={logs} onTriggerStreakPreview={() => setIsStreakPreviewOpen(true)} onOpenPhotoPreview={() => setIsNotifPreviewOpen(true)} />
              <MacroRings totals={totals} profile={profile} caloriesBurned={burnedCalories} />

              <div className="space-y-4 sm:space-y-5 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold">Daily Food &amp; Meal Log</h2>
                    <p className={`text-xs ${t.textSecondary}`}>Grouped by breakfast, lunch, dinner, and snacks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDailyReportOpen(true)}
                    className={`shrink-0 py-2 px-3.5 ${t.innerBg} border ${t.innerBorder} hover:${t.cardBg} rounded-xl text-xs font-bold ${t.accentCyan} flex items-center gap-1.5 transition-colors cursor-pointer`}
                  >
                    {/* Updated to native tailwind animate-pulse */}
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    AI Daily Report
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 w-full">
                  <MealSection mealType="breakfast" items={breakfastItems} onOpenCamera={openBarcodeForMeal} onOpenGemini={openGeminiForMeal} onOpenSavedFoods={openSavedFoodsForMeal} onUpdateServing={handleUpdateServing} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} onCopyEntry={handleCopyEntry} onCopyMeal={handleCopyMeal} onSaveToFavorites={handleSaveToFavorites} onQuickAdd={handleQuickAdd} />
                  <MealSection mealType="lunch" items={lunchItems} onOpenCamera={openBarcodeForMeal} onOpenGemini={openGeminiForMeal} onOpenSavedFoods={openSavedFoodsForMeal} onUpdateServing={handleUpdateServing} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} onCopyEntry={handleCopyEntry} onCopyMeal={handleCopyMeal} onSaveToFavorites={handleSaveToFavorites} onQuickAdd={handleQuickAdd} />
                  <MealSection mealType="dinner" items={dinnerItems} onOpenCamera={openBarcodeForMeal} onOpenGemini={openGeminiForMeal} onOpenSavedFoods={openSavedFoodsForMeal} onUpdateServing={handleUpdateServing} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} onCopyEntry={handleCopyEntry} onCopyMeal={handleCopyMeal} onSaveToFavorites={handleSaveToFavorites} onQuickAdd={handleQuickAdd} />
                  <MealSection mealType="snack" items={snackItems} onOpenCamera={openBarcodeForMeal} onOpenGemini={openGeminiForMeal} onOpenSavedFoods={openSavedFoodsForMeal} onUpdateServing={handleUpdateServing} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} onCopyEntry={handleCopyEntry} onCopyMeal={handleCopyMeal} onSaveToFavorites={handleSaveToFavorites} onQuickAdd={handleQuickAdd} />
                </div>
              </div>

              <WaterTracker waterIntakeMl={currentLog.waterIntakeMl} waterGoalMl={profile.waterGoalMl} onUpdateWater={handleUpdateWater} />
              <WorkoutTracker workouts={currentLog.workouts || []} profile={profile} onUpdateWorkouts={handleUpdateWorkouts} onCopyWorkout={(workout) => { const duplicated: WorkoutItem = { ...workout, id: `workout-copy-${Date.now()}`, loggedAt: new Date().toISOString() }; const todayDate = getTodayDateString(); setLogs((prev) => { const targetLog = prev[todayDate] || { date: todayDate, items: [], waterIntakeMl: 0, workouts: [] }; return { ...prev, [todayDate]: { ...targetLog, workouts: [duplicated, ...(targetLog.workouts || [])] } }; }); setCurrentDate(todayDate); }} onSaveRoutine={handleSaveRoutine} onOpenSavedWorkouts={() => setIsSavedWorkoutsOpen(true)} />
            </div>
          )}

          {activeView === 'statistics' && (
            <StatisticsTab logs={logs} profile={profile} currentDate={currentDate} onSelectDate={(selectedDate) => { setCurrentDate(selectedDate); setActiveView('dashboard'); }} onOpenDailyReport={() => setIsDailyReportOpen(true)} />
          )}
        </main>

        <footer className={`border-t ${t.innerBorder} ${t.innerBg} py-6 px-4 text-center text-xs ${t.textSecondary} w-full transition-colors`}>
          <p>NutriPulse · Powered by Google Gemini 1.5 Flash &amp; AI Vision Intelligence</p>
        </footer>

        <BarcodeScannerModal isOpen={isBarcodeOpen} onClose={() => setIsBarcodeOpen(false)} onFoodLogged={handleFoodLogged} defaultMealType={activeMealTarget} />
        <GeminiFoodModal isOpen={isGeminiOpen} onClose={() => { setIsGeminiOpen(false); setGeminiItemToEdit(undefined); }} onFoodLogged={(newItem) => { if (geminiItemToEdit) { handleUpdateItem({ ...newItem, id: geminiItemToEdit.id }); } else { handleFoodLogged(newItem); } }} defaultMealType={activeMealTarget} itemToEdit={geminiItemToEdit} />
        <SavedFoodsModal key={activeMealTarget} isOpen={isSavedFoodsOpen} onClose={() => setIsSavedFoodsOpen(false)} savedFoods={savedFoods as any} onLogSavedFood={handleLogSavedFood as any} onDeleteSavedFood={handleDeleteSavedFood} onAddCustomSavedFood={handleAddCustomSavedFood as any} defaultMeal={activeMealTarget} />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={profile} onSaveProfile={setProfile} />
        <SavedWorkoutsModal isOpen={isSavedWorkoutsOpen} onClose={() => setIsSavedWorkoutsOpen(false)} savedWorkouts={savedWorkouts} onLogSavedWorkout={handleLogSavedWorkout} onDeleteSavedWorkout={handleDeleteSavedWorkout} />
        <GoalCelebrationModal logs={logs} profile={profile} forceOpenTest={isStreakPreviewOpen} onCloseTest={() => setIsStreakPreviewOpen(false)} />
        <DailyReportModal logs={logs} profile={profile} isOpen={isDailyReportOpen} onClose={() => setIsDailyReportOpen(false)} />
                <NotificationPreviewModal
          isOpen={isNotifPreviewOpen}
          onClose={() => setIsNotifPreviewOpen(false)}
          cardData={{
            eatenCalories: totals.calories,
            targetCalories: currentLog.targetCalories ?? profile.targetCalories ?? 2600,
            burnedCalories: burnedCalories,
            proteinGrams: totals.protein,
            targetProtein: currentLog.targetProtein ?? profile.targetProtein ?? 150,
            carbsGrams: totals.carbs,
            targetCarbs: profile.targetCarbs,
            fatGrams: totals.fat,
            targetFat: profile.targetFat,
            waterMl: currentLog.waterIntakeMl || 0,
            targetWaterMl: profile.waterGoalMl,
            streakDays: perfectStreak,
            recentFoods: currentLog.items.slice(0, 4).map((item) => ({
              name: item.name,
              calories: Math.round(item.calories * item.servings),
              mealType: item.mealType,
            })),
          }}
        />
        <OfflineIndicator />

        <MobileBottomNav
          activeView={activeView} setActiveView={setActiveView}
          onOpenBarcode={() => openBarcodeForMeal(activeMealTarget)} onOpenGemini={() => openGeminiForMeal(activeMealTarget)}
          onOpenSavedFoods={() => openSavedFoodsForMeal(activeMealTarget)} onOpenProfile={() => setIsProfileOpen(true)}
        />
        
        {/* Floating Task Manager at the bottom */}
        <TaskManager />
      </div>
    </TaskProvider>
  );
}