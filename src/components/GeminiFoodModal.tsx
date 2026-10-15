import React, { useState, useRef } from 'react';
import { Sparkles, Camera, Upload, X, CheckCircle, RefreshCw, AlertCircle, Info, ChevronRight, Layers } from 'lucide-react';
import { FoodItem, MealType } from '../types/nutrition';

interface GeminiFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodLogged: (item: FoodItem) => void;
  defaultMealType?: MealType;
}

const QUICK_PROMPT_PRESETS = [
  'Grilled salmon fillet (200g) with 1 cup brown rice and steamed broccoli',
  '2 scrambled eggs, 2 slices whole wheat toast with butter, and an orange',
  'Chipotle chicken bowl with brown rice, black beans, salsa, and guacamole',
  'Vanilla whey protein shake with 1 cup almond milk and 1 tablespoon peanut butter',
  'Large Greek chicken salad with feta cheese, kalamata olives, and olive oil vinaigrette',
];

export const GeminiFoodModal: React.FC<GeminiFoodModalProps> = ({
  isOpen,
  onClose,
  onFoodLogged,
  defaultMealType = 'lunch',
}) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMealType);
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [servingMult, setServingMult] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);
    setAnalysisResult(null);

    const hasText = textInput.trim().length > 0;
    const hasImage = !!imagePreview;

    if (!hasText && !hasImage) {
      setErrorMsg('Please describe your food or upload a meal / nutrition label photo.');
      return;
    }

    setIsAnalyzing(true);

    try {
      let imageBase64: string | undefined = undefined;
      if (imagePreview) {
        // Strip data:image/...;base64, prefix
        const commaIndex = imagePreview.indexOf(',');
        if (commaIndex !== -1) {
          imageBase64 = imagePreview.substring(commaIndex + 1);
        }
      }

      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: hasText ? textInput.trim() : undefined,
          imageBase64,
          mimeType: imageMimeType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze food.');
      }

      setAnalysisResult(data);
      setServingMult(1);
    } catch (err: any) {
      console.error('Gemini analysis error:', err);
      setErrorMsg(err.message || 'Analysis error. Please try again or rephrase.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmLog = () => {
    if (!analysisResult) return;

    const newFoodItem: FoodItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: analysisResult.foodName || 'AI Analyzed Food',
      brand: analysisResult.brand !== 'generic' ? analysisResult.brand : undefined,
      servingSize: analysisResult.servingSize || '1 portion',
      servingWeightGrams: Math.round((analysisResult.servingWeightGrams || 150) * servingMult),
      servings: servingMult,
      calories: Math.round(analysisResult.calories * servingMult),
      protein: Math.round(analysisResult.protein * servingMult * 10) / 10,
      carbs: Math.round(analysisResult.carbs * servingMult * 10) / 10,
      fat: Math.round(analysisResult.fat * servingMult * 10) / 10,
      fiber: Math.round(analysisResult.fiber * servingMult * 10) / 10,
      sugar: Math.round((analysisResult.sugar || 0) * servingMult * 10) / 10,
      sodiumMg: Math.round((analysisResult.sodiumMg || 0) * servingMult),
      source: 'ai',
      confidence: analysisResult.confidence || 'high',
      dietaryTags: analysisResult.dietaryTags,
      healthTip: analysisResult.healthTip,
      loggedAt: new Date().toISOString(),
      mealType: selectedMeal,
    };

    onFoodLogged(newFoodItem);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setTextInput('');
    setImagePreview(null);
    setErrorMsg(null);
    setServingMult(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 truncate">
                <span className="truncate">Gemini AI Food Estimator</span>
                <span className="text-[10px] font-mono font-medium px-1.5 sm:px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  3.8 Flash
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Describe in text or upload a photo of your meal or nutrition label
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          {/* Meal Target Selector */}
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
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          {/* If Result Ready, Show Rich Breakdown */}
          {analysisResult ? (
            <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-wide">
                      AI Verified Nutrition
                    </span>
                    {analysisResult.confidence && (
                      <span className="text-[11px] text-slate-400">
                        · Confidence: {analysisResult.confidence}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-slate-100 mt-1">{analysisResult.foodName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estimated Portion: {analysisResult.servingSize} (approx. {analysisResult.servingWeightGrams}g)
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Analyze Another
                </button>
              </div>



              {/* Macro Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 block">Total Energy</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                    {Math.round(analysisResult.calories * servingMult)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">kcal</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 block">Protein</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                    {Math.round(analysisResult.protein * servingMult * 10) / 10}g
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round(analysisResult.protein * servingMult * 4)} kcal
                  </span>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 block">Carbs</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-amber-400">
                    {Math.round(analysisResult.carbs * servingMult * 10) / 10}g
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round(analysisResult.carbs * servingMult * 4)} kcal
                  </span>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 block">Fat</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-rose-400">
                    {Math.round(analysisResult.fat * servingMult * 10) / 10}g
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round(analysisResult.fat * servingMult * 9)} kcal
                  </span>
                </div>
              </div>

              {/* Secondary Nutrients */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1 font-mono">
                <span>Fiber: {Math.round(analysisResult.fiber * servingMult * 10) / 10}g</span>
                <span>Sugar: {Math.round((analysisResult.sugar || 0) * servingMult * 10) / 10}g</span>
                <span>Sodium: {Math.round((analysisResult.sodiumMg || 0) * servingMult)}mg</span>
              </div>

              {/* Itemized Meal Components (if multiple parts) */}
              {analysisResult.breakdown && analysisResult.breakdown.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Detected Ingredients &amp; Portions
                  </span>
                  <div className="space-y-1.5">
                    {analysisResult.breakdown.map((part: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-lg text-xs"
                      >
                        <div className="text-slate-200">
                          <span className="font-medium">{part.item}</span>
                          <span className="text-slate-500 ml-2">({part.portion})</span>
                        </div>
                        <div className="font-mono text-slate-400 flex items-center gap-3">
                          <span className="text-emerald-400 font-semibold">{Math.round(part.calories * servingMult)} kcal</span>
                          <span>P: {Math.round(part.protein * servingMult)}g</span>
                          <span>C: {Math.round(part.carbs * servingMult)}g</span>
                          <span>F: {Math.round(part.fat * servingMult)}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Tags */}
              {analysisResult.dietaryTags && analysisResult.dietaryTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-500">Dietary Profile:</span>
                  {analysisResult.dietaryTags.map((tag: string, i: number) => (
                    <span key={i} className="text-slate-300">
                      {tag}
                      {i < analysisResult.dietaryTags.length - 1 ? ' ·' : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Health & Nutritionist Tip */}
              {analysisResult.healthTip && (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Clinical Nutritionist Insight</span>
                    <span>{analysisResult.healthTip}</span>
                  </div>
                </div>
              )}

              {/* Log Button */}
              <button
                onClick={handleConfirmLog}
                className="w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)} (
                {Math.round(analysisResult.calories * servingMult)} kcal)
              </button>
            </div>
          ) : (
            /* Input Selector Form */
            <div className="space-y-5">
              {/* Tabs: Text vs Image */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-slate-800 text-indigo-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">AI Text Prompt</span>
                </button>
                <button
                  onClick={() => setActiveTab('image')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'image'
                      ? 'bg-slate-800 text-indigo-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Photo Upload</span>
                </button>
              </div>

              {activeTab === 'text' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Describe what you ate or drank:
                    </label>
                    <textarea
                      rows={3}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="e.g. 150g grilled ribeye steak with a baked sweet potato and 1 cup sauteed green beans in butter..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Preset Quick Injections */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Quick Ideas (Click to Test)
                    </span>
                    <div className="space-y-1.5">
                      {QUICK_PROMPT_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setTextInput(preset)}
                          className="w-full p-2.5 text-left text-xs bg-slate-950 hover:bg-slate-800/80 border border-slate-800/70 hover:border-slate-700 rounded-xl text-slate-300 hover:text-indigo-300 transition-all flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">{preset}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-slate-900/40"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="space-y-3">
                        <img
                          src={imagePreview}
                          alt="Meal Preview"
                          className="max-h-56 mx-auto rounded-xl object-contain border border-slate-800 shadow-md"
                        />
                        <p className="text-xs text-indigo-400 font-medium">
                          Click to change or choose a different image
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">
                          Upload Meal Photo or Nutrition Facts Label
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Take a photo of your plate, takeout box, or package label. Gemini will extract portions and compute exact macros.
                        </p>
                      </div>
                    )}
                  </div>

                  {imagePreview && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Optional note or context for AI:
                      </label>
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="e.g. Dressing on the side, cooked in olive oil, no cheese..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Temporary Service Spike</span>
                      <span>{errorMsg}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                  >
                    Retry Now
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!textInput.trim() && !imagePreview)}
                className="w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing nutrition &amp; portion macros...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Calculate Macros with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
