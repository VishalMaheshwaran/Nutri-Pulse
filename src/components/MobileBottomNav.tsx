// src/components/MobileBottomNav.tsx
import React from 'react';
import { Home, BarChart2, Sparkles, Bookmark, Target } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

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
  onOpenGemini,
  onOpenSavedFoods,
  onOpenProfile,
}) => {
  const { t } = useTheme();

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 ${t.innerBg} bg-opacity-95 backdrop-blur-xl border-t ${t.innerBorder} pb-safe transition-colors duration-300`}>
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* 1. HOME */}
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center justify-center w-12 gap-1 transition-all ${
            activeView === 'dashboard' ? `${t.accentCyan} scale-110` : `${t.textSecondary} hover:${t.textPrimary}`
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-semibold tracking-wide">Home</span>
        </button>

        {/* 2. STATS (Moved to the left) */}
        <button
          onClick={() => setActiveView('statistics')}
          className={`flex flex-col items-center justify-center w-12 gap-1 transition-all ${
            activeView === 'statistics' ? `${t.accentCyan} scale-110` : `${t.textSecondary} hover:${t.textPrimary}`
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[9px] font-semibold tracking-wide">Stats</span>
        </button>

        {/* 3. GENERATE (Center) */}
        <button
          onClick={onOpenGemini}
          className={`relative -top-5 flex items-center justify-center w-14 h-14 rounded-full ${t.activeBtnBg} ${t.activeBtnText} shadow-lg hover:scale-105 transition-all duration-300 shrink-0`}
        >
          <Sparkles className="w-6 h-6" />
        </button>

        {/* 4. SAVED */}
        <button
          onClick={onOpenSavedFoods}
          className={`flex flex-col items-center justify-center w-12 gap-1 transition-all ${t.textSecondary} hover:${t.accentCyan}`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[9px] font-semibold tracking-wide">Saved</span>
        </button>

        {/* 5. TARGET / GOALS (Moved to the far right) */}
        <button
          onClick={onOpenProfile}
          className={`flex flex-col items-center justify-center w-12 gap-1 transition-all ${t.textSecondary} hover:${t.accentCyan}`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[9px] font-semibold tracking-wide">Goals</span>
        </button>
        
      </div>
    </nav>
  );
};