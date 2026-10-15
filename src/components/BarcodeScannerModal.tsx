import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle, Search, Sparkles, ChevronRight, Barcode } from 'lucide-react';
import { FoodItem, MealType } from '../types/nutrition';
import { playBeepSound } from '../services/storage';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodLogged: (item: FoodItem) => void;
  defaultMealType?: MealType;
}

const POPULAR_SAMPLE_BARCODES = [
  { name: 'Nutella Hazelnut Spread', code: '3017620422003', hint: 'Ferrero / 15g serving' },
  { name: 'Gold Standard Whey Protein', code: '748927028669', hint: 'Optimum Nutrition / 32g scoop' },
  { name: 'Heinz Beanz in Tomato Sauce', code: '5000157024671', hint: 'Kraft Heinz / 415g can' },
  { name: 'Barilla Spaghetti No. 5', code: '8076800195057', hint: 'Barilla / 85g portion' },
];

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onFoodLogged,
  defaultMealType = 'lunch',
}) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMealType);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [loadingProduct, setLoadingProduct] = useState<boolean>(false);
  const [productData, setProductData] = useState<any | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [servingMult, setServingMult] = useState<number>(1);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    setSelectedMeal(defaultMealType);
  }, [defaultMealType]);

  // Start scanner when modal opens and in scanning mode
  useEffect(() => {
    if (!isOpen || !isScanning || productData) {
      stopScanner();
      return;
    }

    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const videoElement = videoRef.current;
        if (!videoElement) return;

        await codeReader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoElement,
          (result, error) => {
            if (!isMounted) return;
            if (result) {
              const scannedText = result.getText();
              handleBarcodeDetected(scannedText);
            }
            if (error && !(error instanceof NotFoundException)) {
              // Non-critical decoding frame miss
            }
          }
        );
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (isMounted) {
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access or use the manual barcode search below.'
              : 'Unable to start camera preview. You can manually enter or test sample barcodes below.'
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, isScanning, facingMode, productData]);

  const stopScanner = () => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    } catch (e) {
      // ignore
    }
  };

  const handleBarcodeDetected = (code: string) => {
    stopScanner();
    playBeepSound();
    fetchProductDetails(code);
  };

  const fetchProductDetails = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setLoadingProduct(true);
    setProductError(null);
    setProductData(null);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(cleanCode)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Barcode not found in OpenFoodFacts database.');
      }

      setProductData(data);
      setServingMult(1);
    } catch (err: any) {
      setProductError(err.message || 'Failed to lookup product information.');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleConfirmLog = () => {
    if (!productData) return;

    const newFoodItem: FoodItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: productData.foodName || 'Scanned Food',
      brand: productData.brand || undefined,
      servingSize: productData.servingSize || '1 serving',
      servingWeightGrams: Math.round((productData.servingWeightGrams || 100) * servingMult),
      servings: servingMult,
      calories: Math.round(productData.calories * servingMult),
      protein: Math.round(productData.protein * servingMult * 10) / 10,
      carbs: Math.round(productData.carbs * servingMult * 10) / 10,
      fat: Math.round(productData.fat * servingMult * 10) / 10,
      fiber: Math.round(productData.fiber * servingMult * 10) / 10,
      sugar: Math.round((productData.sugar || 0) * servingMult * 10) / 10,
      sodiumMg: Math.round((productData.sodiumMg || 0) * servingMult),
      barcode: productData.barcode,
      imageUrl: productData.imageUrl,
      source: 'barcode',
      confidence: 'high',
      healthTip: productData.healthTip,
      loggedAt: new Date().toISOString(),
      mealType: selectedMeal,
    };

    onFoodLogged(newFoodItem);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setProductData(null);
    setProductError(null);
    setManualCode('');
    setIsScanning(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Barcode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">Barcode Scanner &amp; Database</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">Instant macro lookup from OpenFoodFacts &amp; Gemini</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          {/* Meal Category Selector */}
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
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          {/* Product Result Preview (if product loaded) */}
          {productData ? (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {productData.imageUrl ? (
                    <img
                      src={productData.imageUrl}
                      alt={productData.foodName}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-800 bg-slate-900 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Barcode className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 uppercase tracking-wide">
                        Verified Barcode {productData.barcode}
                      </span>
                      {productData.nutriscoreGrade && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Score {productData.nutriscoreGrade}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-slate-100 mt-1">{productData.foodName}</h4>
                    {productData.brand && (
                      <p className="text-xs text-slate-400">Brand: {productData.brand}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      Base Serving: {productData.servingSize} ({productData.servingWeightGrams}g)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Scan Another
                </button>
              </div>



              {/* Macro breakdown grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 block">Calories</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                    {Math.round(productData.calories * servingMult)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">kcal</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 block">Protein</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-cyan-400">
                    {Math.round(productData.protein * servingMult * 10) / 10}g
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round(productData.protein * servingMult * 4)} kcal
                  </span>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 block">Carbs</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-amber-400">
                    {Math.round(productData.carbs * servingMult * 10) / 10}g
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round(productData.carbs * servingMult * 4)} kcal
                  </span>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] sm:text-xs text-slate-400 block">Fat</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-rose-400">
                    {Math.round(productData.fat * servingMult * 10) / 10}g
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {Math.round(productData.fat * servingMult * 9)} kcal
                  </span>
                </div>
              </div>

              {/* Secondary Nutrients */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1 font-mono">
                <span>Fiber: {Math.round((productData.fiber || 0) * servingMult * 10) / 10}g</span>
                <span>Sugar: {Math.round((productData.sugar || 0) * servingMult * 10) / 10}g</span>
                <span>Sodium: {Math.round((productData.sodiumMg || 0) * servingMult)}mg</span>
              </div>

              {productData.healthTip && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{productData.healthTip}</span>
                </div>
              )}

              {/* Confirm Add Button */}
              <button
                onClick={handleConfirmLog}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)} (
                {Math.round(productData.calories * servingMult)} kcal)
              </button>
            </div>
          ) : (
            /* Active Camera Scanner Viewport */
            <div className="space-y-5">
              <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {cameraError ? (
                  <div className="p-6 text-center max-w-md space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-sm text-slate-300 font-medium">{cameraError}</p>
                    <p className="text-xs text-slate-500">
                      Use the instant manual search or click any test barcode below.
                    </p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />

                    {/* Laser Scanner Reticle Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-64 h-40 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1" />

                        {/* Animated Laser Scan Line */}
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-[0_0_8px_#34d399]" />
                      </div>
                    </div>

                    {/* Camera Control Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        onClick={() =>
                          setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                        }
                        className="p-2 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Switch camera"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 inset-x-0 text-center">
                      <span className="text-xs font-medium text-slate-200 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-800">
                        Align barcode within the target box
                      </span>
                    </div>
                  </>
                )}

                {loadingProduct && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-sm font-semibold text-slate-200">
                      Querying OpenFoodFacts database...
                    </p>
                  </div>
                )}
              </div>

              {productError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{productError}</span>
                </div>
              )}

              {/* Manual Barcode Input Form */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Manual Barcode Number Lookup
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualCode.trim()) fetchProductDetails(manualCode);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter 12 or 13-digit barcode (e.g. 748927028669)..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualCode.trim() || loadingProduct}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" /> Lookup
                  </button>
                </form>
              </div>

              {/* Sample Preloaded Barcodes for Instant Testing */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Test Products (Click to Test Barcode Engine)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_SAMPLE_BARCODES.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => fetchProductDetails(item.code)}
                      className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-xl text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.code} · {item.hint}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
