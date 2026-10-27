/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  saveStoredSavedWorkouts
} from './services/storage';
import { TopBar } from './components/TopBar';
import { MacroRings } from './components/MacroRings';
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
import { LiveMacroWidget } from './components/LiveMacroWidget.tsx';

export default function App() {
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
  const [activeMealTarget, setActiveMealTarget] = useState<MealType>('lunch');
  const [activeView, setActiveView] = useState<'dashboard' | 'statistics'>('dashboard');

  // State to track which item we are currently editing via the AI Modal
  const [geminiItemToEdit, setGeminiItemToEdit] = useState<FoodItem | undefined>(undefined);

  // Sync to localStorage
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveStoredLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveStoredSavedFoods(savedFoods);
  }, [savedFoods]);

  useEffect(() => {
    saveStoredSavedWorkouts(savedWorkouts);
  }, [savedWorkouts]);

  const handleSaveRoutine = (workout: WorkoutItem) => {
    const newRoutine: SavedWorkout = {
      id: `routine-${Date.now()}`,
      name: workout.description,
      description: `${workout.sets?.length || 0} exercises/sets recorded`,
      durationMinutes: workout.durationMinutes,
      caloriesBurned: workout.caloriesBurned,
      sets: (workout.sets || []).map((s, i) => ({
        ...s,
        id: `set-${Date.now()}-${i}`,
      })),
      createdAt: new Date().toISOString(),
    };
    setSavedWorkouts((prev) => [newRoutine, ...prev.filter((r) => r.name !== workout.description)]);
  };

  const handleLogSavedWorkout = (routine: SavedWorkout) => {
    const workoutItem: WorkoutItem = {
      id: `workout-routine-${Date.now()}`,
      description: routine.name,
      caloriesBurned: routine.caloriesBurned,
      durationMinutes: routine.durationMinutes,
      sets: (routine.sets || []).map((s, i) => ({
        ...s,
        id: `set-${Date.now()}-${i}`,
      })),
      loggedAt: new Date().toISOString(),
    };
    const updatedWorkouts = [workoutItem, ...(currentLog.workouts || [])];
    handleUpdateWorkouts(updatedWorkouts);
  };

  const handleDeleteSavedWorkout = (id: string) => {
    setSavedWorkouts((prev) => prev.filter((r) => r.id !== id));
  };

  // Current day's log
  const currentLog: DailyLog = logs[currentDate] || {
    date: currentDate,
    items: [],
    waterIntakeMl: 0,
    workouts: [],
  };

  const totals = calculateTotals(currentLog.items);
  const burnedCalories = (currentLog.workouts || []).reduce((sum, workout) => sum + workout.caloriesBurned, 0);
  
  // Handlers
  const handleFoodLogged = (newItem: FoodItem) => {
    const updatedItems = [newItem, ...currentLog.items];
    setLogs((prev) => ({
      ...prev,
      [currentDate]: {
        ...currentLog,
        items: updatedItems,
      },
    }));
  };

  const handleUpdateItem = (updatedItem: FoodItem) => {
    const updatedItems = currentLog.items.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    setLogs((prev) => ({
      ...prev,
      [currentDate]: {
        ...currentLog,
        items: updatedItems,
      },
    }));
  };

  const handleUpdateServing = (itemId: string, newServings: number) => {
    const updatedItems = currentLog.items.map((item) =>
      item.id === itemId ? { ...item, servings: Math.max(0.1, newServings) } : item
    );
    setLogs((prev) => ({
      ...prev,
      [currentDate]: {
        ...currentLog,
        items: updatedItems,
      },
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = currentLog.items.filter((item) => item.id !== itemId);
    setLogs((prev) => ({
      ...prev,
      [currentDate]: {
        ...currentLog,
        items: updatedItems,
      },
    }));
  };

  const handleCopyEntry = (item: FoodItem, targetMeal: MealType) => {
    const todayDate = getTodayDateString();
    const duplicatedItem: FoodItem = {
      ...item,
      id: `copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      mealType: targetMeal,
      loggedAt: new Date().toISOString(),
    };

    setLogs((prev) => {
      const targetLog = prev[todayDate] || {
        date: todayDate,
        items: [],
        waterIntakeMl: 0,
        workouts: [],
      };
      return {
        ...prev,
        [todayDate]: {
          ...targetLog,
          items: [duplicatedItem, ...targetLog.items],
        },
      };
    });
    
    setCurrentDate(todayDate);
  };

  const handleCopyMeal = (sourceMeal: MealType, targetMeal: MealType) => {
    const sourceItems = currentLog.items.filter((i) => i.mealType === sourceMeal);
    if (sourceItems.length === 0) return;

    const duplicatedItems: FoodItem[] = sourceItems.map((item, idx) => ({
      ...item,
      id: `meal-copy-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      mealType: targetMeal,
      loggedAt: new Date().toISOString(),
    }));

    const todayDate = getTodayDateString();

    setLogs((prev) => {
      const targetLog = prev[todayDate] || {
        date: todayDate,
        items: [],
        waterIntakeMl: 0,
        workouts: [],
      };
      return {
        ...prev,
        [todayDate]: {
          ...targetLog,
          items: [...duplicatedItems, ...targetLog.items],
        },
      };
    });
    
    setCurrentDate(todayDate);
  };

  const handleSaveToFavorites = (item: FoodItem) => {
    const newSaved: SavedFood = {
      id: `fav-${Date.now()}`,
      name: item.name,
      brand: item.brand,
      servingSize: item.servingSize,
      servingWeightGrams: item.servingWeightGrams,
      calories: Math.round(item.calories * item.servings),
      protein: Math.round(item.protein * item.servings * 10) / 10,
      carbs: Math.round(item.carbs * item.servings * 10) / 10,
      fat: Math.round(item.fat * item.servings * 10) / 10,
      fiber: Math.round(item.fiber * item.servings * 10) / 10,
      sugar: item.sugar ? Math.round(item.sugar * item.servings * 10) / 10 : undefined,
      sodiumMg: item.sodiumMg ? Math.round(item.sodiumMg * item.servings) : undefined,
      notes: item.healthTip || undefined,
      originalPrompt: item.originalPrompt || undefined,
      createdAt: new Date().toISOString(),
    };

    setSavedFoods((prev) => [newSaved, ...prev.filter((f) => f.name.toLowerCase() !== item.name.toLowerCase())]);
  };

  const handleLogSavedFood = (savedFood: SavedFood, targetMeal: MealType) => {
    const foodItem: FoodItem = {
      id: `saved-log-${Date.now()}`,
      name: savedFood.name,
      brand: savedFood.brand,
      servingSize: savedFood.servingSize,
      servingWeightGrams: savedFood.servingWeightGrams,
      servings: 1,
      calories: savedFood.calories,
      protein: savedFood.protein,
      carbs: savedFood.carbs,
      fat: savedFood.fat,
      fiber: savedFood.fiber,
      sugar: savedFood.sugar,
      sodiumMg: savedFood.sodiumMg,
      source: savedFood.originalPrompt ? 'ai' : 'preset',
      healthTip: savedFood.notes,
      originalPrompt: savedFood.originalPrompt,
      loggedAt: new Date().toISOString(),
      mealType: targetMeal,
    };
    handleFoodLogged(foodItem);
  };

  const handleAddCustomSavedFood = (foodData: Omit<SavedFood, 'id' | 'createdAt'>) => {
    const newFood: SavedFood = {
      ...foodData,
      id: `custom-fav-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSavedFoods((prev) => [newFood, ...prev]);
  };

  const handleDeleteSavedFood = (id: string) => {
    setSavedFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const handleQuickAdd = (
    mealType: MealType,
    name: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  ) => {
    const quickItem: FoodItem = {
      id: `quick-${Date.now()}`,
      name,
      servingSize: '1 serving',
      servingWeightGrams: 100,
      servings: 1,
      calories,
      protein,
      carbs,
      fat,
      fiber: 0,
      source: 'manual',
      loggedAt: new Date().toISOString(),
      mealType,
    };
    handleFoodLogged(quickItem);
  };

  const handleUpdateWater = (newAmount: number) => {
    setLogs((prev) => ({
      ...prev,
      [currentDate]: {
        ...currentLog,
        waterIntakeMl: newAmount,
      },
    }));
  };

  const handleUpdateWorkouts = (newWorkouts: WorkoutItem[]) => {
    setLogs((prev) => ({
      ...prev,
      [currentDate]: {
        ...currentLog,
        workouts: newWorkouts,
      },
    }));
  };

  const openBarcodeForMeal = (meal: MealType) => {
    setActiveMealTarget(meal);
    setIsBarcodeOpen(true);
  };

  const openGeminiForMeal = (meal: MealType, itemToEdit?: FoodItem) => {
    setActiveMealTarget(meal);
    setGeminiItemToEdit(itemToEdit);
    setIsGeminiOpen(true);
  };

  const openSavedFoodsForMeal = (meal: MealType) => {
    setActiveMealTarget(meal);
    setIsSavedFoodsOpen(true);
  };

  // Filter items by meal
  const breakfastItems = currentLog.items.filter((i) => i.mealType === 'breakfast');
  const lunchItems = currentLog.items.filter((i) => i.mealType === 'lunch');
  const dinnerItems = currentLog.items.filter((i) => i.mealType === 'dinner');
  const snackItems = currentLog.items.filter((i) => i.mealType === 'snack');

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 70px)' }}
    >
      {/* Top Bar with DD/MM format and Month Calendar */}
      <TopBar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onOpenBarcode={() => openBarcodeForMeal('lunch')}
        onOpenGemini={() => openGeminiForMeal('lunch')}
        onOpenSavedFoods={() => openSavedFoodsForMeal('breakfast')}
        onOpenProfile={() => setIsProfileOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        logs={logs}
        profile={profile}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-8 space-y-4 sm:space-y-6 overflow-x-hidden">

        {activeView === 'dashboard' && (
          <div className="space-y-5 sm:space-y-7 w-full">
            {/* NEW: Live Macro Widget & Locked Notification Controller */}
            <LiveMacroWidget
              totals={totals}
              profile={profile}
              caloriesBurned={burnedCalories}
              logs={logs}
              onTriggerStreakPreview={() => setIsStreakPreviewOpen(true)}
            />

            {/* Primary Macronutrient Rings & Goals */}
            <MacroRings 
              totals={totals} 
              profile={profile} 
              caloriesBurned={burnedCalories} 
            />

            {/* Meal Sections Grid */}
            <div className="space-y-4 sm:space-y-5 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">Daily Food &amp; Meal Log</h2>
                  <p className="text-xs text-slate-400">
                    Grouped by breakfast, lunch, dinner, and afternoon/evening snacks
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-5 w-full">
                <MealSection
                  mealType="breakfast"
                  items={breakfastItems}
                  onOpenCamera={openBarcodeForMeal}
                  onOpenGemini={openGeminiForMeal}
                  onOpenSavedFoods={openSavedFoodsForMeal}
                  onUpdateServing={handleUpdateServing}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onCopyEntry={handleCopyEntry}
                  onCopyMeal={handleCopyMeal}
                  onSaveToFavorites={handleSaveToFavorites}
                  onQuickAdd={handleQuickAdd}
                />
                <MealSection
                  mealType="lunch"
                  items={lunchItems}
                  onOpenCamera={openBarcodeForMeal}
                  onOpenGemini={openGeminiForMeal}
                  onOpenSavedFoods={openSavedFoodsForMeal}
                  onUpdateServing={handleUpdateServing}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onCopyEntry={handleCopyEntry}
                  onCopyMeal={handleCopyMeal}
                  onSaveToFavorites={handleSaveToFavorites}
                  onQuickAdd={handleQuickAdd}
                />
                <MealSection
                  mealType="dinner"
                  items={dinnerItems}
                  onOpenCamera={openBarcodeForMeal}
                  onOpenGemini={openGeminiForMeal}
                  onOpenSavedFoods={openSavedFoodsForMeal}
                  onUpdateServing={handleUpdateServing}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onCopyEntry={handleCopyEntry}
                  onCopyMeal={handleCopyMeal}
                  onSaveToFavorites={handleSaveToFavorites}
                  onQuickAdd={handleQuickAdd}
                />
                <MealSection
                  mealType="snack"
                  items={snackItems}
                  onOpenCamera={openBarcodeForMeal}
                  onOpenGemini={openGeminiForMeal}
                  onOpenSavedFoods={openSavedFoodsForMeal}
                  onUpdateServing={handleUpdateServing}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onCopyEntry={handleCopyEntry}
                  onCopyMeal={handleCopyMeal}
                  onSaveToFavorites={handleSaveToFavorites}
                  onQuickAdd={handleQuickAdd}
                />
              </div>
            </div>

            {/* Hydration Tracker */}
            <WaterTracker
              waterIntakeMl={currentLog.waterIntakeMl}
              waterGoalMl={profile.waterGoalMl}
              onUpdateWater={handleUpdateWater}
            />

            {/* Workout Tracker */}
            <WorkoutTracker
              workouts={currentLog.workouts || []}
              profile={profile}
              onUpdateWorkouts={handleUpdateWorkouts}
              onCopyWorkout={(workout) => {
                const duplicated: WorkoutItem = {
                  ...workout,
                  id: `workout-copy-${Date.now()}`,
                  loggedAt: new Date().toISOString(),
                };
                const todayDate = getTodayDateString();
                setLogs((prev) => {
                  const targetLog = prev[todayDate] || { date: todayDate, items: [], waterIntakeMl: 0, workouts: [] };
                  return {
                    ...prev,
                    [todayDate]: { ...targetLog, workouts: [duplicated, ...(targetLog.workouts || [])] },
                  };
                });
                setCurrentDate(todayDate);
              }}
              onSaveRoutine={handleSaveRoutine}
              onOpenSavedWorkouts={() => setIsSavedWorkoutsOpen(true)}
            />
          </div>
        )}

        {activeView === 'statistics' && (
          <StatisticsTab
            logs={logs}
            profile={profile}
            currentDate={currentDate}
            onSelectDate={(selectedDate) => {
              setCurrentDate(selectedDate);
              setActiveView('dashboard');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 w-full">
        <p>
          NutriPulse · Powered by Google Gemini 3.1 Flash Lite &amp; AI Vision Intelligence
        </p>
      </footer>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onFoodLogged={handleFoodLogged}
        defaultMealType={activeMealTarget}
      />

      <GeminiFoodModal
        isOpen={isGeminiOpen}
        onClose={() => {
          setIsGeminiOpen(false);
          setGeminiItemToEdit(undefined);
        }}
        onFoodLogged={(newItem) => {
          if (geminiItemToEdit) {
            handleUpdateItem({ ...newItem, id: geminiItemToEdit.id });
          } else {
            handleFoodLogged(newItem);
          }
        }}
        defaultMealType={activeMealTarget}
        itemToEdit={geminiItemToEdit}
      />

      <SavedFoodsModal
        isOpen={isSavedFoodsOpen}
        onClose={() => setIsSavedFoodsOpen(false)}
        savedFoods={savedFoods}
        onLogSavedFood={handleLogSavedFood}
        onDeleteSavedFood={handleDeleteSavedFood}
        onAddCustomSavedFood={handleAddCustomSavedFood}
        defaultMeal={activeMealTarget}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
      />

      <SavedWorkoutsModal
        isOpen={isSavedWorkoutsOpen}
        onClose={() => setIsSavedWorkoutsOpen(false)}
        savedWorkouts={savedWorkouts}
        onLogSavedWorkout={handleLogSavedWorkout}
        onDeleteSavedWorkout={handleDeleteSavedWorkout}
      />

      {/* NEW: Next-Day Goal Streak & AI Celebratory Popup */}
      <GoalCelebrationModal
        logs={logs}
        profile={profile}
        forceOpenTest={isStreakPreviewOpen}
        onCloseTest={() => setIsStreakPreviewOpen(false)}
      />

      {/* Offline Connectivity Toast */}
      <OfflineIndicator />

      {/* Native Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenBarcode={() => openBarcodeForMeal('lunch')}
        onOpenGemini={() => openGeminiForMeal('lunch')}
        onOpenSavedFoods={() => openSavedFoodsForMeal('breakfast')}
        onOpenProfile={() => setIsProfileOpen(true)}
      />
    </div>
  );
}