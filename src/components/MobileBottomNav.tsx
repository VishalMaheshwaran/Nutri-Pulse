import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Plus,
  Bookmark,
  Sliders,
  Barcode,
  Sparkles,
  X,
} from 'lucide-react';

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

  return (
    <>
      {/* Quick Action Floating Drawer / Sheet when Center '+' is tapped on Mobile */}
      {isQuickMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end md:hidden animate-in fade-in duration-200"
          onClick={() => setIsQuickMenuOpen(false)}
        >
          <div
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-slate-100">Log Nutrition</span>
              <button
                onClick={() => setIsQuickMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenBarcode();
                }}
                className="p-3 sm:p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center transition active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Barcode className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200">Barcode</span>
              </button>

              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenGemini();
                }}
                className="p-3 sm:p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-500/60 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center transition active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200">AI Scan</span>
              </button>

              <button
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  onOpenSavedFoods();
                }}
                className="p-3 sm:p-4 rounded-2xl bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center transition active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200">Saved</span>
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
          className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
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
