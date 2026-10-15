import React from 'react';
import { Sparkles, Barcode, Sliders, Plus, Calendar, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  onOpenBarcode: () => void;
  onOpenGemini: () => void;
  onOpenSavedFoods: () => void;
  onOpenProfile: () => void;
  activeView: 'dashboard' | 'statistics';
  setActiveView: (view: 'dashboard' | 'statistics') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentDate,
  onDateChange,
  onOpenBarcode,
  onOpenGemini,
  onOpenSavedFoods,
  onOpenProfile,
  activeView,
  setActiveView,
}) => {
  const handleShiftDay = (delta: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const isToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return currentDate === `${y}-${m}-${d}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm sm:text-base shadow-md shadow-emerald-500/20">
            N
          </div>
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-100 whitespace-nowrap">
            NutriPulse
          </span>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`transition-colors whitespace-nowrap hover:text-slate-100 cursor-pointer ${
              activeView === 'dashboard' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveView('statistics')}
            className={`transition-colors whitespace-nowrap hover:text-slate-100 flex items-center gap-1.5 cursor-pointer ${
              activeView === 'statistics' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            Statistics &amp; Habits
          </button>
          <button
            onClick={onOpenSavedFoods}
            className="transition-colors whitespace-nowrap hover:text-amber-400 flex items-center gap-1.5 text-slate-300 cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Saved Foods
          </button>
          <button
            onClick={onOpenBarcode}
            className="transition-colors whitespace-nowrap hover:text-emerald-400 flex items-center gap-1.5 text-slate-300 cursor-pointer"
          >
            <Barcode className="w-3.5 h-3.5 text-emerald-400" /> Barcode Scan
          </button>
          <button
            onClick={onOpenGemini}
            className="transition-colors whitespace-nowrap hover:text-indigo-400 flex items-center gap-1.5 text-slate-300 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Estimator
          </button>
          <button
            onClick={onOpenProfile}
            className="transition-colors whitespace-nowrap hover:text-slate-100 flex items-center gap-1 text-slate-300 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" /> Targets
          </button>
        </nav>

        {/* Zone 3: Date Stepper & Primary Action (compact on mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton variant="topbar" />
          </div>

          {/* Day Stepper */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5 sm:p-1 text-xs font-mono">
            <button
              onClick={() => handleShiftDay(-1)}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 sm:px-2 text-slate-200 font-medium whitespace-nowrap text-[11px] sm:text-xs">
              {isToday() ? 'Today' : currentDate.substring(5)}
            </span>
            <button
              onClick={() => handleShiftDay(1)}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next day"
              aria-label="Next day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenGemini}
            className="py-1.5 sm:py-2 px-2.5 sm:px-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Log Food</span>
            <span className="sm:hidden text-xs">Log</span>
          </button>
        </div>
      </div>
    </header>
  );
};
