// src/components/GeminiFoodModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Camera, Upload, X, ChevronRight } from 'lucide-react';
import { FoodItem, MealType } from '../types/nutrition';
import { callGeminiWithInfiniteRetry } from '../utils/geminiStorage';
import { useTasks } from '../context/TaskContext';

interface GeminiFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodLogged: (item: FoodItem) => void;
  defaultMealType?: MealType;
  itemToEdit?: FoodItem;
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
  itemToEdit,
}) => {
  const { runTask } = useTasks(); // <-- Bringing in the background manager!
  
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMealType);
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMeal(itemToEdit?.mealType || defaultMealType);
      if (itemToEdit) {
        setActiveTab('text');
        setTextInput(itemToEdit.originalPrompt || itemToEdit.name || '');
      } else {
        handleReset();
      }
    }
  }, [isOpen, itemToEdit, defaultMealType]);

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
      setImagePreview(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleStartBackgroundAnalysis = () => {
    setErrorMsg(null);
    const hasText = textInput.trim().length > 0;
    const hasImage = !!imagePreview;

    if (!hasText && !hasImage) {
      setErrorMsg('Please describe your food or upload a meal / nutrition label photo.');
      return;
    }

    // Capture the current states before the modal closes
    const promptTextValue = textInput.trim();
    const targetMeal = selectedMeal;
    const existingEditItem = itemToEdit;
    
    let capturedImageBase64: string | undefined = undefined;
    if (imagePreview) {
      const commaIndex = imagePreview.indexOf(',');
      if (commaIndex !== -1) {
        capturedImageBase64 = imagePreview.substring(commaIndex + 1);
      }
    }
    const capturedMimeType = imageMimeType;

    // 1. Give the heavy lifting to the background task manager
    runTask(`AI Logging: ${promptTextValue.substring(0, 20)}...`, async () => {
      const parsedNutritionData = await callGeminiWithInfiniteRetry(
        async (apiKey) => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

          const promptText = `Analyze this food based on the provided ${hasImage ? 'image and text' : 'text'}. Extract or estimate the nutritional values.
          User Input: ${hasText ? promptTextValue : 'No text provided'}
          
          IMPORTANT RULE FOR QUANTITIES: If the user specifies multiple servings (e.g. "3 eggs" or "2 bowls"), you MUST calculate and return the TOTAL combined macros for the entire quantity described. 

          Return ONLY a raw, valid, minified JSON object. Do not use Markdown formatting or code blocks like \`\`\`json. The JSON must have these exact keys:
          foodName, brand (string or 'generic'), servingSize, servingWeightGrams (number), calories (number), protein (number), carbs (number), fat (number), fiber (number), sugar (number), sodiumMg (number), confidence ('high', 'medium', 'low'), dietaryTags (array of strings), healthTip (string), breakdown (array of objects with keys: item, portion, calories, protein, carbs, fat).`;

          const parts: any[] = [{ text: promptText }];
          if (capturedImageBase64) {
            parts.push({
              inlineData: {
                mimeType: capturedMimeType || 'image/jpeg',
                data: capturedImageBase64,
              }
            });
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
          });

          const rawText = await res.text();
          if (rawText.trim().startsWith('<')) throw new Error("Network returned HTML instead of JSON. Check your internet connection.");
          
          const resultData = JSON.parse(rawText);
          if (resultData.error) throw new Error(resultData.error.message || 'Gemini API Error');
          
          const modelOutput = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!modelOutput) throw new Error("Invalid response format from Gemini");

          const cleanedJson = modelOutput.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleanedJson);
        },
        (attempt, retryMsg) => {
          // You could optionally update a global task message here if you expand the task context
          console.log(`Retry ${attempt}: ${retryMsg}`);
        }
      );

      // Once the AI is done, immediately build and save the food item
      const newFoodItem: FoodItem = {
        id: existingEditItem ? existingEditItem.id : `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: parsedNutritionData.foodName || 'AI Analyzed Food',
        brand: parsedNutritionData.brand !== 'generic' ? parsedNutritionData.brand : undefined,
        servingSize: parsedNutritionData.servingSize || '1 portion',
        servingWeightGrams: Math.round(parsedNutritionData.servingWeightGrams || 150),
        servings: 1, // Defaulting to 1 since we told AI to calculate total combined macros
        calories: Math.round(parsedNutritionData.calories),
        protein: Math.round(parsedNutritionData.protein * 10) / 10,
        carbs: Math.round(parsedNutritionData.carbs * 10) / 10,
        fat: Math.round(parsedNutritionData.fat * 10) / 10,
        fiber: Math.round(parsedNutritionData.fiber * 10) / 10,
        sugar: Math.round((parsedNutritionData.sugar || 0) * 10) / 10,
        sodiumMg: Math.round((parsedNutritionData.sodiumMg || 0)),
        source: 'ai',
        originalPrompt: promptTextValue || undefined,
        confidence: parsedNutritionData.confidence || 'high',
        dietaryTags: parsedNutritionData.dietaryTags,
        healthTip: parsedNutritionData.healthTip,
        loggedAt: existingEditItem ? existingEditItem.loggedAt : new Date().toISOString(),
        mealType: targetMeal,
      };

      onFoodLogged(newFoodItem);
    });

    // 2. Close the modal instantly so the user can go back to their dashboard while it runs!
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setTextInput('');
    setImagePreview(null);
    setErrorMsg(null);
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
                <span className="truncate">{itemToEdit ? 'Edit AI Entry' : 'Gemini AI Food Estimator'}</span>
                <span className="text-[10px] font-mono font-medium px-1.5 sm:px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  3.1 Flash Lite
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {itemToEdit ? 'Update your prompt to fix macros' : 'Describe in text or upload a photo of your meal'}
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
                  className={`py-2 px-3 text-xs font-semibold capitalize rounded-xl border transition-all cursor-pointer ${
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
                    {itemToEdit ? 'Modify your previous prompt:' : 'Describe what you ate or drank:'}
                  </label>
                  <textarea
                    rows={4}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="e.g. 150g grilled ribeye steak with a baked sweet potato and 1 cup sauteed green beans in butter..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                {/* Preset Quick Injections (Hide when editing) */}
                {!itemToEdit && (
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
                          className="w-full p-2.5 text-left text-xs bg-slate-950 hover:bg-slate-800/80 border border-slate-800/70 hover:border-slate-700 rounded-xl text-slate-300 hover:text-indigo-300 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate pr-2">{preset}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 bg-slate-950/60 rounded-2xl p-6 text-center transition-all hover:border-indigo-500/80 hover:bg-slate-900/40 cursor-pointer"
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
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <span className="font-semibold block shrink-0">Error:</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleStartBackgroundAnalysis}
              disabled={!textInput.trim() && !imagePreview}
              className="w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{itemToEdit ? 'Save Edit in Background' : 'Calculate & Log in Background'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};