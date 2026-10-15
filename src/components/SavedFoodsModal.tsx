import React, { useState } from 'react';
import { SavedFood, MealType, FoodItem } from '../types/nutrition';
import { Bookmark, Plus, Trash2, X, Check, Coffee, Sparkles, ChevronRight, Edit3 } from 'lucide-react';

interface SavedFoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedFoods: SavedFood[];
  onLogSavedFood: (savedFood: SavedFood, targetMeal: MealType) => void;
  onDeleteSavedFood: (id: string) => void;
  onAddCustomSavedFood: (newFood: Omit<SavedFood, 'id' | 'createdAt'>) => void;
  defaultMeal?: MealType;
}

export const SavedFoodsModal: React.FC<SavedFoodsModalProps> = ({
  isOpen,
  onClose,
  savedFoods,
  onLogSavedFood,
  onDeleteSavedFood,
  onAddCustomSavedFood,
  defaultMeal = 'breakfast',
}) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMeal);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // New food form state
  const [name, setName] = useState<string>('');
  const [servingSize, setServingSize] = useState<string>('1 serving');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [fiber, setFiber] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !calories) return;

    onAddCustomSavedFood({
      name: name.trim(),
      servingSize: servingSize.trim() || '1 serving',
      servingWeightGrams: 100,
      calories: parseInt(calories, 10) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
      notes: notes.trim() || undefined,
    });

    setName('');
    setServingSize('1 serving');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('0');
    setNotes('');
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                Saved Foods &amp; Custom Recipes
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Quickly repeat measured favorites (cold coffee, shakes, custom meals)
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          {/* Target Meal Selector for Quick Logging */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Target Meal for 1-Tap Log:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal) => (
                  <button
                    key={meal}
                    onClick={() => setSelectedMeal(meal)}
                    className={`py-1 px-2.5 sm:px-3 text-xs font-semibold capitalize rounded-lg border transition-all cursor-pointer ${
                      selectedMeal === meal
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="py-1.5 sm:py-2 px-3 sm:px-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all self-start xs:self-end cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              {isCreatingNew ? 'View List' : 'Create Custom Food'}
            </button>
          </div>

          {/* New Custom Food Form */}
          {isCreatingNew ? (
            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
                  Save Repeat Food with Exact Measurements
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Food / Recipe Name (e.g. &quot;My Cold Coffee with Whey &amp; Almond Milk&quot;)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Signature Cold Coffee"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Portion / Serving Size Description
                </label>
                <input
                  type="text"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  placeholder="e.g. 1 glass (350ml) or 1 shaker"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs text-slate-400 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="200"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs text-slate-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="25"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs text-slate-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="15"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs text-slate-400 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="4"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Custom Recipe Notes / Exact Ingredients
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 200ml unsweetened almond milk, 1 scoop vanilla whey, double shot espresso, ice."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Save to My Custom Library
              </button>
            </form>
          ) : (
            /* Saved Foods List */
            <div className="space-y-2.5 sm:space-y-3">
              {savedFoods.length === 0 ? (
                <div className="p-6 sm:p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-300 font-semibold">No Saved Foods Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Save any logged meal entry by tapping the bookmark icon, or create custom repeat recipes above.
                  </p>
                </div>
              ) : (
                savedFoods.map((food) => (
                  <div
                    key={food.id}
                    className="p-3.5 sm:p-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-amber-400 transition-colors break-words">
                          {food.name}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Saved
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-400">
                        {food.servingSize}
                      </div>
                      {food.notes && (
                        <p className="text-[11px] sm:text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-850 line-clamp-2">
                          {food.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 font-mono pt-1 sm:pt-0 border-t border-slate-900 sm:border-t-0">
                      <div className="text-left sm:text-right">
                        <span className="text-sm sm:text-base font-bold text-emerald-400 block tabular-nums">
                          {food.calories} <span className="text-[10px] sm:text-xs text-slate-500 font-normal">kcal</span>
                        </span>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 sm:gap-2">
                          <span className="text-cyan-400">P:{food.protein}g</span>
                          <span className="text-amber-400">C:{food.carbs}g</span>
                          <span className="text-rose-400">F:{food.fat}g</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* 1-Click Log Button */}
                        <button
                          onClick={() => {
                            onLogSavedFood(food, selectedMeal);
                            onClose();
                          }}
                          className="py-1.5 sm:py-2 px-2.5 sm:px-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                          title={`Log to ${selectedMeal}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="capitalize">Log to {selectedMeal}</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteSavedFood(food.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete saved recipe"
                          aria-label="Delete saved recipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
