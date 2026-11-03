import React, { useState, useEffect } from 'react';
import { Bookmark, X, Search, Plus, Trash2 } from 'lucide-react';
import { SavedFood, MealType } from '../types/nutrition';

export interface SavedFoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMeal: MealType;
  savedFoods: SavedFood[];
  onLogSavedFood: (savedFood: SavedFood, targetMeal: MealType) => void;
  onDeleteSavedFood?: (id: string) => void;
  onAddCustomSavedFood: (foodData: Omit<SavedFood, "id" | "createdAt">) => void;
}

export function SavedFoodsModal({
  isOpen,
  onClose,
  defaultMeal,
  savedFoods,
  onLogSavedFood,
  onDeleteSavedFood,
  onAddCustomSavedFood,
}: SavedFoodsModalProps) {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMeal);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedMeal(defaultMeal);
      setSearchQuery('');
    }
  }, [isOpen, defaultMeal]);

  if (!isOpen) return null;

  const filteredFoods = savedFoods.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                Saved Meals &amp; Custom Foods
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Search and one-tap log your favorite meals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Target Meal Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Log To Meal
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal) => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => setSelectedMeal(meal)}
                  className={`py-2 px-1 sm:px-2 text-[10px] sm:text-xs font-semibold capitalize rounded-xl border transition-all cursor-pointer ${
                    selectedMeal === meal
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search saved foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-slate-600"
            />
          </div>

          {/* Food List */}
          <div className="space-y-2 pt-2">
            {filteredFoods.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                No saved foods found.
              </div>
            ) : (
              filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">
                      {food.name}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-400">{food.calories} kcal</span>
                      <span className="hidden sm:inline">•</span>
                      <span>P: {food.protein}g</span>
                      <span>C: {food.carbs}g</span>
                      <span>F: {food.fat}g</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                    {onDeleteSavedFood && (
                      <button
                        type="button"
                        onClick={() => onDeleteSavedFood(food.id)}
                        className="p-2 sm:p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete saved food"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Logs to whichever button is selected above (e.g. dinner) */}
                    <button
                      type="button"
                      onClick={() => {
                        onLogSavedFood(food, selectedMeal);
                        onClose();
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate capitalize">Log to {selectedMeal}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}