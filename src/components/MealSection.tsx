import React, { useState } from 'react';
import { FoodItem, MealType } from '../types/nutrition';
import {
  Sparkles,
  Barcode,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Coffee,
  Sun,
  Moon,
  Apple,
  Copy,
  Bookmark,
  Check,
} from 'lucide-react';

interface MealSectionProps {
  mealType: MealType;
  items: FoodItem[];
  onOpenBarcode: (meal: MealType) => void;
  onOpenGemini: (meal: MealType) => void;
  onOpenSavedFoods: (meal: MealType) => void;
  onUpdateServing: (itemId: string, newServings: number) => void;
  onDeleteItem: (itemId: string) => void;
  onCopyEntry: (item: FoodItem, targetMeal: MealType) => void;
  onCopyMeal: (sourceMeal: MealType, targetMeal: MealType) => void;
  onSaveToFavorites: (item: FoodItem) => void;
  onQuickAdd: (
    mealType: MealType,
    name: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  ) => void;
}

const MEAL_CONFIG: Record<
  MealType,
  { label: string; icon: React.ReactNode; color: string; desc: string }
> = {
  breakfast: {
    label: 'Breakfast',
    icon: <Coffee className="w-4 h-4 text-amber-400" />,
    color: 'border-amber-500/20',
    desc: 'Metabolic energy & protein',
  },
  lunch: {
    label: 'Lunch',
    icon: <Sun className="w-4 h-4 text-emerald-400" />,
    color: 'border-emerald-500/20',
    desc: 'Midday sustained energy',
  },
  dinner: {
    label: 'Dinner',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    color: 'border-indigo-500/20',
    desc: 'Recovery & evening satiety',
  },
  snack: {
    label: 'Snacks & Extras',
    icon: <Apple className="w-4 h-4 text-rose-400" />,
    color: 'border-rose-500/20',
    desc: 'Protein boosts & hydration',
  },
};

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  items,
  onOpenBarcode,
  onOpenGemini,
  onOpenSavedFoods,
  onUpdateServing,
  onDeleteItem,
  onCopyEntry,
  onCopyMeal,
  onSaveToFavorites,
  onQuickAdd,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showQuickAddForm, setShowQuickAddForm] = useState<boolean>(false);
  const [showCopyMealMenu, setShowCopyMealMenu] = useState<boolean>(false);
  const [activeCopyItemId, setActiveCopyItemId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Quick Add form state
  const [quickName, setQuickName] = useState<string>('');
  const [quickCals, setQuickCals] = useState<string>('');
  const [quickProtein, setQuickProtein] = useState<string>('');
  const [quickCarbs, setQuickCarbs] = useState<string>('');
  const [quickFat, setQuickFat] = useState<string>('');

  const config = MEAL_CONFIG[mealType];

  const totalCalories = items.reduce(
    (sum, item) => sum + Math.round(item.calories * item.servings),
    0
  );
  const totalProtein = items.reduce(
    (sum, item) => sum + Math.round(item.protein * item.servings * 10) / 10,
    0
  );
  const totalCarbs = items.reduce(
    (sum, item) => sum + Math.round(item.carbs * item.servings * 10) / 10,
    0
  );
  const totalFat = items.reduce(
    (sum, item) => sum + Math.round(item.fat * item.servings * 10) / 10,
    0
  );

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickCals) return;

    onQuickAdd(
      mealType,
      quickName.trim(),
      parseInt(quickCals, 10) || 0,
      parseFloat(quickProtein) || 0,
      parseFloat(quickCarbs) || 0,
      parseFloat(quickFat) || 0
    );

    setQuickName('');
    setQuickCals('');
    setQuickProtein('');
    setQuickCarbs('');
    setQuickFat('');
    setShowQuickAddForm(false);
  };

  const handleSaveItemAsFavorite = (item: FoodItem) => {
    onSaveToFavorites(item);
    setSavedSuccessId(item.id);
    setTimeout(() => setSavedSuccessId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all w-full">
      {/* Meal Header */}
      <div className="p-3.5 sm:p-5 border-b border-slate-800/80 bg-slate-900/70">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Meal Label & Icon */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0">
              {config.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                  {config.label}
                </h3>
                <span className="text-[11px] sm:text-xs text-slate-500 font-mono shrink-0">
                  ({items.length})
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block truncate">
                {config.desc}
              </p>
            </div>
          </div>

          {/* Right: Calories & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right font-mono">
              <span className="text-xs sm:text-sm font-bold text-slate-100 tabular-nums">
                {totalCalories} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">kcal</span>
              </span>
              <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 sm:gap-2 justify-end">
                <span className="text-cyan-400 font-semibold">P:{Math.round(totalProtein)}g</span>
                <span className="text-amber-400 hidden xs:inline">C:{Math.round(totalCarbs)}g</span>
                <span className="text-rose-400 hidden xs:inline">F:{Math.round(totalFat)}g</span>
              </div>
            </div>

            {/* Copy Entire Meal Button */}
            {items.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowCopyMealMenu(!showCopyMealMenu)}
                  className="py-1 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy all items from this meal"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline">Copy</span>
                </button>

                {showCopyMealMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-20 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
                      Copy {items.length} items to:
                    </div>
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])
                      .filter((m) => m !== mealType)
                      .map((target) => (
                        <button
                          key={target}
                          onClick={() => {
                            onCopyMeal(mealType, target);
                            setShowCopyMealMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:text-emerald-400 hover:bg-slate-900 rounded-lg capitalize transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{target}</span>
                          <ChevronDown className="w-3 h-3 -rotate-90 text-slate-600" />
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle section"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile visible macro chips row if items present */}
        {items.length > 0 && (
          <div className="xs:hidden flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
            <span className="text-cyan-400">Protein: {Math.round(totalProtein)}g</span>
            <span className="text-amber-400">Carbs: {Math.round(totalCarbs)}g</span>
            <span className="text-rose-400">Fats: {Math.round(totalFat)}g</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
          {/* Food items list */}
          {items.length === 0 ? (
            <div className="py-6 px-3 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <p className="text-xs text-slate-400">No foods logged in {config.label} yet.</p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <button
                  onClick={() => onOpenSavedFoods(mealType)}
                  className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" /> From Saved Foods
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => onOpenGemini(mealType)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Gemini AI
                </button>
                <span className="text-slate-600">·</span>
                <button
                  onClick={() => onOpenBarcode(mealType)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Barcode className="w-3.5 h-3.5" /> Scan Barcode
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 sm:p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group relative"
                >
                  {/* Left Food Details */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-semibold text-xs sm:text-sm text-slate-200 break-words">
                        {item.name}
                      </span>
                      {item.source === 'ai' && (
                        <span className="text-[9px] sm:text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          AI
                        </span>
                      )}
                      {item.source === 'barcode' && (
                        <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Barcode
                        </span>
                      )}
                      {item.source === 'preset' && (
                        <span className="text-[9px] sm:text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Saved
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-400 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {item.brand && <span>{item.brand} ·</span>}
                      <span>{item.servingSize}</span>
                      {item.servingWeightGrams > 0 && (
                        <span>({Math.round(item.servingWeightGrams * item.servings)}g)</span>
                      )}
                    </div>
                    {item.healthTip && (
                      <p className="text-[10px] sm:text-[11px] text-slate-400 italic line-clamp-2">
                        {item.healthTip}
                      </p>
                    )}
                  </div>

                  {/* Right Nutrition & Actions (aligned on mobile) */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 font-mono pt-1 sm:pt-0 border-t border-slate-900 sm:border-t-0">
                    <div className="text-left sm:text-right">
                      <span className="text-xs sm:text-sm font-bold text-slate-100 block tabular-nums">
                        {Math.round(item.calories * item.servings)} kcal
                      </span>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 sm:gap-2">
                        <span className="text-cyan-400 font-semibold">P:{Math.round(item.protein * item.servings)}g</span>
                        <span className="text-amber-400">C:{Math.round(item.carbs * item.servings)}g</span>
                        <span className="text-rose-400">F:{Math.round(item.fat * item.servings)}g</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Bookmark to Saved Favorites Button */}
                      <button
                        onClick={() => handleSaveItemAsFavorite(item)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          savedSuccessId === item.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'text-slate-500 hover:text-amber-400 border-transparent hover:bg-slate-800'
                        }`}
                        title="Save to My Custom Foods"
                        aria-label="Save to My Custom Foods"
                      >
                        {savedSuccessId === item.id ? (
                          <Check className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      {/* Copy / Duplicate Entry Button */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveCopyItemId(activeCopyItemId === item.id ? null : item.id)
                          }
                          className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate entry"
                          aria-label="Duplicate entry"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {activeCopyItemId === item.id && (
                          <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-20 space-y-1">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
                              Copy entry to:
                            </div>
                            <button
                              onClick={() => {
                                onCopyEntry(item, mealType);
                                setActiveCopyItemId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:text-emerald-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                            >
                              Duplicate here
                            </button>
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])
                              .filter((m) => m !== mealType)
                              .map((target) => (
                                <button
                                  key={target}
                                  onClick={() => {
                                    onCopyEntry(item, target);
                                    setActiveCopyItemId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:text-emerald-400 hover:bg-slate-900 rounded-lg capitalize transition-colors cursor-pointer"
                                >
                                  Copy to {target}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Delete Item */}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Remove food"
                        aria-label="Remove food"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Form Drawer */}
          {showQuickAddForm && (
            <form
              onSubmit={handleQuickAddSubmit}
              className="p-3 sm:p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Quick Manual Entry</span>
                <button
                  type="button"
                  onClick={() => setShowQuickAddForm(false)}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Food name (e.g. Protein Bar)"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="col-span-2 sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  required
                  placeholder="Calories (kcal)"
                  value={quickCals}
                  onChange={(e) => setQuickCals(e.target.value)}
                  className="col-span-2 sm:col-span-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Protein (g)"
                  value={quickProtein}
                  onChange={(e) => setQuickProtein(e.target.value)}
                  className="col-span-1 sm:col-span-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <div className="col-span-1 sm:col-span-1 flex gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Carbs (g)"
                    value={quickCarbs}
                    onChange={(e) => setQuickCarbs(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Fat (g)"
                    value={quickFat}
                    onChange={(e) => setQuickFat(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Save Food Entry
              </button>
            </form>
          )}

          {/* Action Buttons Bar: Responsive 2x2 Grid on Mobile, Flex on Desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onOpenSavedFoods(mealType)}
              className="py-2 px-2.5 sm:px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Saved Foods</span>
            </button>
            <button
              onClick={() => onOpenGemini(mealType)}
              className="py-2 px-2.5 sm:px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">AI Photo/Prompt</span>
            </button>
            <button
              onClick={() => onOpenBarcode(mealType)}
              className="py-2 px-2.5 sm:px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
            >
              <Barcode className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Barcode Scan</span>
            </button>
            <button
              onClick={() => setShowQuickAddForm(!showQuickAddForm)}
              className="py-2 px-2.5 sm:px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Quick Add</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
