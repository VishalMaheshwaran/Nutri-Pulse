import React, { useState, useEffect } from 'react';
import { Camera as CameraIcon, X, RefreshCw, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FoodItem, MealType } from '../types/nutrition';
import { getStoredApiKey } from '../utils/geminiStorage';

interface NutritionLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodLogged: (item: FoodItem) => void;
  defaultMealType?: MealType;
}

export const BarcodeScannerModal: React.FC<NutritionLabelModalProps> = ({
  isOpen,
  onClose,
  onFoodLogged,
  defaultMealType = 'lunch',
}) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMealType);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [servings, setServings] = useState<number>(1);

  useEffect(() => {
    setSelectedMeal(defaultMealType);
  }, [defaultMealType]);

  const handleCameraScan = async () => {
    setLoading(true);
    setError(null);

    try {
      // Forces the native Android Camera to open
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (!image.base64String) {
        setLoading(false);
        return;
      }

      const base64Data = image.base64String;

      // Pull dynamic API key from local storage
      const apiKey = getStoredApiKey();
      if (!apiKey) {
        throw new Error("No Gemini API key configured. Please add your key in App Settings.");
      }

      // Direct REST endpoint for Gemini 3.1 Flash Lite
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

      const prompt = `Analyze this nutrition label. Extract the food name, serving size in text, serving weight in grams, calories, protein (g), carbs (g), fat (g), fiber (g), sugar (g), and sodium (mg). Return ONLY a valid, minified JSON object with these exact keys: foodName, servingSize, servingWeightGrams, calories, protein, carbs, fat, fiber, sugar, sodiumMg. No markdown formatting.`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: `image/${image.format || 'jpeg'}`,
                  data: base64Data
                }
              }
            ]
          }
        ]
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const rawText = await res.text();

      if (rawText.trim().startsWith('<')) {
        console.error("HTML Error Page received:", rawText);
        throw new Error("Network returned HTML instead of JSON. Check your internet connection or API Key.");
      }

      const resultData = JSON.parse(rawText);

      if (resultData.error) {
        throw new Error(resultData.error.message || 'Gemini API Error');
      }

      const modelOutput = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!modelOutput) {
        throw new Error("Invalid response format from Gemini");
      }

      const responseText = modelOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(responseText);
      
      setParsedData(data);
      setServings(1);
      
    } catch (err: any) {
      if (err.message && !err.message.includes('User cancelled')) {
        setError(err.message || 'Failed to analyze nutrition label.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLog = () => {
    if (!parsedData) return;

    const newFoodItem: FoodItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: parsedData.foodName || 'Scanned Food Label',
      brand: parsedData.brand || undefined,
      servingSize: `${servings} x ${parsedData.servingSize || 'serving'}`,
      servingWeightGrams: Math.round((parsedData.servingWeightGrams || 100) * servings),
      servings: servings,
      calories: Math.round(parsedData.calories * servings),
      protein: Math.round(parsedData.protein * servings * 10) / 10,
      carbs: Math.round(parsedData.carbs * servings * 10) / 10,
      fat: Math.round(parsedData.fat * servings * 10) / 10,
      fiber: Math.round((parsedData.fiber || 0) * servings * 10) / 10,
      sugar: Math.round((parsedData.sugar || 0) * servings * 10) / 10,
      sodiumMg: Math.round((parsedData.sodiumMg || 0) * servings),
      source: 'ai',
      confidence: 'high',
      loggedAt: new Date().toISOString(),
      mealType: selectedMeal,
    };

    onFoodLogged(newFoodItem);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParsedData(null);
    setError(null);
    setServings(1);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">Nutrition Label Scanner</h3>
              <p className="text-xs text-slate-400">Capture a label to auto-calculate macros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Meal Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Log To Meal
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`py-2 px-3 text-xs font-semibold capitalize rounded-xl border transition-all ${
                    selectedMeal === meal
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          {!parsedData ? (
            <div className="space-y-4">
              <button 
                onClick={handleCameraScan}
                disabled={loading}
                className="relative aspect-video w-full bg-slate-950 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 flex flex-col items-center justify-center cursor-pointer transition-all group p-6 text-center disabled:opacity-80"
              >
                {loading ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-sm font-semibold text-slate-200">Analyzing nutrition label with AI...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                      <CameraIcon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                      Tap to Open Camera
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Instantly scan physical nutrition labels
                    </span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wide">
                    Extracted from Label
                  </span>
                  <h4 className="text-lg font-bold text-slate-100 mt-0.5">{parsedData.foodName}</h4>
                  {parsedData.brand && <p className="text-xs text-slate-400">Brand: {parsedData.brand}</p>}
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retake
                </button>
              </div>

              {/* Serving Size Adjuster */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">How many servings did you eat?</span>
                  <span className="text-xs text-slate-500">Base serving: {parsedData.servingSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="20"
                    value={servings}
                    onChange={(e) => setServings(Math.max(0.25, parseFloat(e.target.value) || 1))}
                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-400">servings</span>
                </div>
              </div>

              {/* Macros Breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Calories</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {Math.round(parsedData.calories * servings)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Protein</span>
                  <span className="text-base font-bold font-mono text-cyan-400">
                    {Math.round(parsedData.protein * servings * 10) / 10}g
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Carbs</span>
                  <span className="text-base font-bold font-mono text-amber-400">
                    {Math.round(parsedData.carbs * servings * 10) / 10}g
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Fat</span>
                  <span className="text-base font-bold font-mono text-rose-400">
                    {Math.round(parsedData.fat * servings * 10) / 10}g
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirmLog}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)} (
                {Math.round(parsedData.calories * servings)} kcal)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};