// src/components/MobileBottomNav.tsx
import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Plus,
  Bookmark,
  Sliders,
  Camera,
  Sparkles,
  X,
} from 'lucide-react';
import { hasConnectedApiKey } from '../utils/geminiStorage';

interface MobileBottomNavProps {
  activeView: 'dashboard' | 'statistics';
  setActiveView: (view: 'dashboard' | 'statistics') => void;
  onOpenBarcode: () => void;
  onOpenGemini: () => void;
  onOpenSavedFoods: () => void;
  onOpenProfile: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  onOpenBarcode,
  onOpenGemini,
  onOpenSavedFoods,
  onOpenProfile,
}) => {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const apiReady = hasConnectedApiKey();

  return (
    <>
      {/* Centered Quick Action Modal when Center '+' is tapped on Mobile */}
      {isQuickMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsQuickMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-base font-extrabold text-slate-100 block">Log Nutrition</span>
                <span className="text-[11px] text-slate-400">Choose how you want to add your food</span>
              </div>
              <button
                onClick={() => setIsQuickMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/70 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Option 1: Camera Scan */}
              <button
                disabled={!apiReady}
                title={!apiReady ? 'Connect Gemini API Key in Settings to unlock' : 'Scan Label'}
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenBarcode();
                }}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition ${
                  apiReady
                    ? 'bg-slate-950 border-emerald-500/30 hover:border-emerald-500/60 active:scale-95 cursor-pointer'
                    : 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    apiReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-bold ${
                    apiReady ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  Scan Label
                </span>
              </button>

              {/* Option 2: AI Prompt */}
              <button
                disabled={!apiReady}
                title={!apiReady ? 'Connect Gemini API Key in Settings to unlock' : 'AI Scan'}
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenGemini();
                }}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition ${
                  apiReady
                    ? 'bg-slate-950 border-indigo-500/30 hover:border-indigo-500/60 active:scale-95 cursor-pointer'
                    : 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    apiReady ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-bold ${
                    apiReady ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  AI Prompt
                </span>
              </button>

              {/* Option 3: Saved Foods */}
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenSavedFoods();
                }}
                className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 flex flex-col items-center justify-center gap-2 text-center transition active:scale-95 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Bookmark className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-200">Saved</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Mobile Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 md:hidden px-3 py-2 flex items-center justify-around"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            activeView === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveView('statistics')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            activeView === 'statistics' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Statistics</span>
        </button>

        {/* Center Floating Plus Button */}
        <button
          onClick={() => setIsQuickMenuOpen(true)}
          className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform cursor-pointer"
          aria-label="Quick Log Food"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={onOpenSavedFoods}
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px]">Saved</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center gap-1 py-1 px-3 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px]">Targets</span>
        </button>
      </nav>
    </>
  );
};