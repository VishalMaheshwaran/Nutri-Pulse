// src/components/MealSection.tsx
import React, { useState } from 'react';
import { FoodItem, MealType } from '../types/nutrition';
import { hasConnectedApiKey } from '../utils/geminiStorage';
import {
  Sparkles,
  Camera,
  Plus,
  Minus,
  Edit2,
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
  onOpenCamera: (meal: MealType) => void;
  onOpenGemini: (meal: MealType, itemToEdit?: FoodItem) => void;
  onOpenSavedFoods: (meal: MealType) => void;
  onUpdateServing: (itemId: string, newServings: number) => void;
  onUpdateItem?: (updatedItem: FoodItem) => void;
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
  onOpenCamera,
  onOpenGemini,
  onOpenSavedFoods,
  onUpdateServing,
  onUpdateItem,
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

  const [editForm, setEditForm] = useState<FoodItem | null>(null);

  // Allows users to delete serving input to empty string "" while typing
  const [servingDrafts, setServingDrafts] = useState<Record<string, string>>({});

  const [quickName, setQuickName] = useState<string>('');
  const [quickCals, setQuickCals] = useState<string>('');
  const [quickProtein, setQuickProtein] = useState<string>('');
  const [quickCarbs, setQuickCarbs] = useState<string>('');
  const [quickFat, setQuickFat] = useState<string>('');

  const config = MEAL_CONFIG[mealType];
  const apiReady = hasConnectedApiKey();

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

  // Auto-calculation logic for Quick Add or Edit forms
  const calculateAutoMacros = (
    field: 'cals' | 'protein' | 'carbs' | 'fat',
    val: string,
    current: { cals: string; protein: string; carbs: string; fat: string }
  ) => {
    const next = { ...current, [field]: val };
    const cNum = parseFloat(next.cals) || 0;
    const pNum = parseFloat(next.protein) || 0;
    const cCarb = parseFloat(next.carbs) || 0;
    const cFat = parseFloat(next.fat) || 0;

    if (field === 'protein' || field === 'carbs' || field === 'fat') {
      // If typing macros, auto-calculate total calories
      const calcCals = Math.round(pNum * 4 + cCarb * 4 + cFat * 9);
      if (calcCals > 0) {
        next.cals = String(calcCals);
      }
    } else if (field === 'cals') {
      // If typing calories and protein, assign balanced placeholder values for carbs/fat if empty
      const proteinCals = pNum * 4;
      const remainingCals = Math.max(0, cNum - proteinCals);
      if (remainingCals > 0 && cCarb === 0 && cFat === 0) {
        next.carbs = String(Math.round((remainingCals * 0.6) / 4));
        next.fat = String(Math.round((remainingCals * 0.4) / 9));
      }
    }
    return next;
  };

  const handleQuickFieldChange = (field: 'cals' | 'protein' | 'carbs' | 'fat', val: string) => {
    const res = calculateAutoMacros(field, val, {
      cals: quickCals,
      protein: quickProtein,
      carbs: quickCarbs,
      fat: quickFat,
    });
    setQuickCals(res.cals);
    setQuickProtein(res.protein);
    setQuickCarbs(res.carbs);
    setQuickFat(res.fat);
  };

  const handleEditFieldChange = (field: 'cals' | 'protein' | 'carbs' | 'fat', val: string) => {
    if (!editForm) return;
    const currentVals = {
      cals: String(editForm.calories),
      protein: String(editForm.protein),
      carbs: String(editForm.carbs),
      fat: String(editForm.fat),
    };
    const res = calculateAutoMacros(field, val, currentVals);
    setEditForm({
      ...editForm,
      calories: res.cals === '' ? 0 : Number(res.cals),
      protein: res.protein === '' ? 0 : Number(res.protein),
      carbs: res.carbs === '' ? 0 : Number(res.carbs),
      fat: res.fat === '' ? 0 : Number(res.fat),
    });
  };

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

  const handleSaveEdit = () => {
    if (editForm && onUpdateItem) {
      onUpdateItem(editForm);
    }
    setEditForm(null);
  };

  const handleServingInputChange = (itemId: string, rawValue: string) => {
    setServingDrafts((prev) => ({ ...prev, [itemId]: rawValue }));
    const parsed = parseFloat(rawValue);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateServing(itemId, parsed);
    }
  };

  const handleServingInputBlur = (item: FoodItem) => {
    const draft = servingDrafts[item.id];
    if (draft !== undefined) {
      const parsed = parseFloat(draft);
      if (isNaN(parsed) || parsed <= 0) {
        onUpdateServing(item.id, item.servings || 1);
      }
      setServingDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all w-full">
      {/* Meal Header */}
      <div className="p-3.5 sm:p-5 border-b border-slate-800/80 bg-slate-900/70">
        <div className="flex items-center justify-between gap-2">
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

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right font-mono">
              <span className="text-xs sm:text-sm font-bold text-slate-100 tabular-nums">
                {totalCalories}{' '}
                <span className="text-[10px] sm:text-xs text-slate-400 font-normal">kcal</span>
              </span>
              <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 sm:gap-2 justify-end">
                <span className="text-cyan-400 font-semibold">P:{Math.round(totalProtein)}g</span>
                <span className="text-amber-400 hidden xs:inline">C:{Math.round(totalCarbs)}g</span>
                <span className="text-rose-400 hidden xs:inline">F:{Math.round(totalFat)}g</span>
              </div>
            </div>

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
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
          {items.length === 0 ? (
            <div className="py-6 px-3 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <p className="text-xs text-slate-400">No foods logged in {config.label} yet.</p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                {/* Dynamically passing mealType back up to the parent! */}
                <button
                  onClick={() => onOpenSavedFoods(mealType)}
                  className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" /> From Saved Foods
                </button>
                <span className="text-slate-600">·</span>

                <button
                  disabled={!apiReady}
                  onClick={() => onOpenGemini(mealType)}
                  title={!apiReady ? 'Connect Gemini API Key in Settings to unlock AI' : 'Gemini AI'}
                  className={`font-medium inline-flex items-center gap-1 text-indigo-400 ${
                    apiReady ? 'hover:text-indigo-300 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Gemini AI
                </button>

                <span className="text-slate-600">·</span>

                <button
                  disabled={!apiReady}
                  onClick={() => onOpenCamera(mealType)}
                  title={!apiReady ? 'Connect Gemini API Key in Settings to unlock Camera Scan' : 'Snap Photo'}
                  className={`font-medium inline-flex items-center gap-1 text-emerald-400 ${
                    apiReady ? 'hover:text-emerald-300 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> Snap Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <React.Fragment key={item.id}>
                  {editForm?.id === item.id ? (
                    <div className="p-3 sm:p-4 bg-slate-900 border border-blue-500/40 rounded-xl space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" /> Edit Food Entry
                        </span>
                        <button
                          onClick={() => setEditForm(null)}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        placeholder="Food name"
                      />

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Calories</label>
                          <input
                            type="number"
                            value={editForm.calories === 0 ? '' : editForm.calories}
                            onChange={(e) => handleEditFieldChange('cals', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Protein</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.protein === 0 ? '' : editForm.protein}
                            onChange={(e) => handleEditFieldChange('protein', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-cyan-400 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Carbs</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.carbs === 0 ? '' : editForm.carbs}
                            onChange={(e) => handleEditFieldChange('carbs', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Fat</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.fat === 0 ? '' : editForm.fat}
                            onChange={(e) => handleEditFieldChange('fat', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-rose-400 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSaveEdit}
                        className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group relative">
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
                              Camera
                            </span>
                          )}
                          {item.source === 'preset' && (
                            <span className="text-[9px] sm:text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Saved
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] sm:text-xs text-slate-400 flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                          {/* Editable Serving Input (Can be deleted to empty while typing) */}
                          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg px-1 py-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.max(0.25, Math.round((item.servings - 0.25) * 100) / 100);
                                setServingDrafts((prev) => {
                                  const copy = { ...prev };
                                  delete copy[item.id];
                                  return copy;
                                });
                                onUpdateServing(item.id, nextVal);
                              }}
                              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>

                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              value={
                                servingDrafts[item.id] !== undefined
                                  ? servingDrafts[item.id]
                                  : String(item.servings)
                              }
                              onChange={(e) => handleServingInputChange(item.id, e.target.value)}
                              onBlur={() => handleServingInputBlur(item)}
                              className="w-12 bg-transparent text-[11px] font-mono text-center text-emerald-400 font-bold focus:outline-none focus:bg-slate-950 rounded"
                              aria-label="Servings"
                            />
                            <span className="text-[10px] font-mono text-slate-500 pr-1">x</span>

                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.round((item.servings + 0.25) * 100) / 100;
                                setServingDrafts((prev) => {
                                  const copy = { ...prev };
                                  delete copy[item.id];
                                  return copy;
                                });
                                onUpdateServing(item.id, nextVal);
                              }}
                              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <span>{item.servingSize}</span>
                          {item.servingWeightGrams > 0 && (
                            <span>({Math.round(item.servingWeightGrams * item.servings)}g)</span>
                          )}
                        </div>

                        {item.healthTip && (
                          <p className="text-[10px] sm:text-[11px] text-slate-400 italic line-clamp-2 mt-1">
                            {item.healthTip}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 font-mono pt-2 sm:pt-0 border-t border-slate-900 sm:border-t-0">
                        <div className="text-left sm:text-right">
                          <span className="text-xs sm:text-sm font-bold text-slate-100 block tabular-nums">
                            {Math.round(item.calories * item.servings)} kcal
                          </span>
                          <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 sm:gap-2">
                            <span className="text-cyan-400 font-semibold">
                              P:{Math.round(item.protein * item.servings)}g
                            </span>
                            <span className="text-amber-400">
                              C:{Math.round(item.carbs * item.servings)}g
                            </span>
                            <span className="text-rose-400">
                              F:{Math.round(item.fat * item.servings)}g
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveItemAsFavorite(item)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              savedSuccessId === item.id
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'text-slate-500 hover:text-amber-400 border-transparent hover:bg-slate-800'
                            }`}
                            title="Save to My Custom Foods"
                          >
                            {savedSuccessId === item.id ? (
                              <Check className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              if (item.source === 'ai') {
                                onOpenGemini(mealType, item);
                              } else {
                                setEditForm(item);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit food entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveCopyItemId(activeCopyItemId === item.id ? null : item.id)
                              }
                              className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Duplicate entry"
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

                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Remove food"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

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
                  className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
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
                  onChange={(e) => handleQuickFieldChange('cals', e.target.value)}
                  className="col-span-2 sm:col-span-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Protein (g)"
                  value={quickProtein}
                  onChange={(e) => handleQuickFieldChange('protein', e.target.value)}
                  className="col-span-1 sm:col-span-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <div className="col-span-1 sm:col-span-1 flex gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Carbs (g)"
                    value={quickCarbs}
                    onChange={(e) => handleQuickFieldChange('carbs', e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Fat (g)"
                    value={quickFat}
                    onChange={(e) => handleQuickFieldChange('fat', e.target.value)}
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

          {/* Action Buttons Bar */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onOpenSavedFoods(mealType)}
              className="py-2 px-2.5 sm:px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Saved Foods</span>
            </button>

            <button
              disabled={!apiReady}
              onClick={() => onOpenGemini(mealType)}
              title={!apiReady ? 'Connect Gemini API Key in Settings to unlock AI' : 'AI Prompt'}
              className={`py-2 px-2.5 sm:px-3 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all truncate ${
                apiReady ? 'hover:bg-indigo-500/20 cursor-pointer' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">AI Prompt</span>
            </button>

            <button
              disabled={!apiReady}
              onClick={() => onOpenCamera(mealType)}
              title={!apiReady ? 'Connect Gemini API Key in Settings to unlock Camera Scan' : 'Camera Scan'}
              className={`py-2 px-2.5 sm:px-3 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all truncate ${
                apiReady ? 'hover:bg-emerald-500/20 cursor-pointer' : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Camera Scan</span>
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