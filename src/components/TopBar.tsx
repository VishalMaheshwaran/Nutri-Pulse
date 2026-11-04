// src/components/TopBar.tsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Camera, Sliders, Plus, ChevronLeft, ChevronRight, Bookmark, Calendar as CalendarIcon } from 'lucide-react';
import { ApiSettingsModal } from './ApiSettingsModal';
import { hasConnectedApiKey, getStoredApiKey } from '../utils/geminiStorage';
import { DailyLog, UserProfile } from '../types/nutrition';
import { CalendarModal } from './CalendarModal'; 
import { useTheme } from '../hooks/useTheme';

interface TopBarProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  onOpenBarcode: () => void;
  onOpenGemini: () => void;
  onOpenSavedFoods: () => void;
  onOpenProfile: () => void;
  activeView: 'dashboard' | 'statistics';
  setActiveView: (view: 'dashboard' | 'statistics') => void;
  logs?: Record<string, DailyLog>;
  profile: UserProfile; 
}

export const TopBar: React.FC<TopBarProps> = ({
  currentDate, onDateChange, onOpenBarcode, onOpenGemini, onOpenSavedFoods, onOpenProfile, activeView, setActiveView, logs = {}, profile,
}) => {
  const { t } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'busy' | 'disconnected'>('checking');

  useEffect(() => {
    const verifyApiHealth = async () => {
      const key = getStoredApiKey();
      if (!key) {
        setApiStatus('disconnected');
        return;
      }
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (res.status === 200) {
          setApiStatus('connected');
        } else if (res.status === 429) {
          setApiStatus('busy');
        } else {
          setApiStatus('disconnected');
        }
      } catch (err) {
        setApiStatus('disconnected');
      }
    };
    verifyApiHealth();
    const interval = setInterval(verifyApiHealth, 30000);
    return () => clearInterval(interval);
  }, [isSettingsOpen]);

  const parseDate = (dateStr: string) => {
    const parts = (dateStr || '').split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const formatToYYYYMMDD = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDDMM = (dateStr: string) => {
    const parts = (dateStr || '').split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  };

  const handleShiftDay = (delta: number) => {
    const d = parseDate(currentDate);
    d.setDate(d.getDate() + delta);
    onDateChange(formatToYYYYMMDD(d));
  };

  const todayStr = formatToYYYYMMDD(new Date());
  const isToday = currentDate === todayStr;

  const getStatusBadge = () => {
    if (apiStatus === 'connected') {
      return { label: 'Connected', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-500', dot: 'bg-emerald-500' };
    }
    if (apiStatus === 'busy') {
      return { label: 'AI Busy', bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-500', dot: 'bg-amber-500' };
    }
    return { label: 'Disconnected', bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-500', dot: 'bg-rose-500 animate-pulse' };
  };

  const badge = getStatusBadge();
  const allowAi = apiStatus === 'connected' || apiStatus === 'busy';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${t.innerBg} bg-opacity-80 backdrop-blur-md border-b ${t.innerBorder} px-4 pb-3 flex justify-between items-center transition-colors duration-300`}
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 w-full">
          
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-8 h-8 rounded-xl ${t.activeBtnBg} ${t.activeBtnText} flex items-center justify-center font-black text-sm sm:text-base shadow-md transition-colors duration-300`}>
              N
            </div>
            <span className={`text-base sm:text-lg font-extrabold tracking-tight ${t.textPrimary} whitespace-nowrap transition-colors duration-300`}>
              NutriPulse
            </span>
          </div>

          <nav className={`hidden lg:flex items-center gap-5 xl:gap-6 text-xs font-semibold ${t.textSecondary}`}>
            <button onClick={() => setActiveView('dashboard')} className={`transition-colors whitespace-nowrap hover:${t.textPrimary} cursor-pointer ${activeView === 'dashboard' ? `${t.accentCyan} font-bold` : ''}`}>
              Dashboard
            </button>
            <button onClick={() => setActiveView('statistics')} className={`transition-colors whitespace-nowrap hover:${t.textPrimary} flex items-center gap-1.5 cursor-pointer ${activeView === 'statistics' ? `${t.accentCyan} font-bold` : ''}`}>
              Statistics &amp; Habits
            </button>
            <button onClick={onOpenSavedFoods} className={`transition-colors whitespace-nowrap hover:${t.accentAmber} flex items-center gap-1.5 cursor-pointer`}>
              <Bookmark className={`w-3.5 h-3.5 ${t.accentAmber}`} /> Saved Foods
            </button>
            <button disabled={!allowAi} onClick={onOpenBarcode} className={`transition-colors whitespace-nowrap flex items-center gap-1.5 ${allowAi ? `hover:${t.accentCyan} cursor-pointer` : 'opacity-50 cursor-not-allowed'}`}>
              <Camera className={`w-3.5 h-3.5 ${t.accentCyan}`} /> Camera Scan
            </button>
            <button disabled={!allowAi} onClick={onOpenGemini} className={`transition-colors whitespace-nowrap flex items-center gap-1.5 ${allowAi ? `hover:${t.accentIndigo} cursor-pointer` : 'opacity-50 cursor-not-allowed'}`}>
              <Sparkles className={`w-3.5 h-3.5 ${t.accentIndigo}`} /> AI Estimator
            </button>
            
            <button onClick={() => setIsSettingsOpen(true)} className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${badge.bg} ${badge.border} ${badge.text}`}>
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              <span>{apiStatus === 'checking' ? 'Checking...' : badge.label}</span>
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="lg:hidden">
              <button onClick={() => setIsSettingsOpen(true)} className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${badge.bg} ${badge.border} ${badge.text}`}>
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                <span>{badge.label}</span>
              </button>
            </div>

            {/* Day Stepper & Calendar Modal Trigger */}
            <div className={`flex items-center gap-0.5 sm:gap-1 ${t.cardBg} border ${t.innerBorder} rounded-xl p-0.5 sm:p-1 text-xs font-mono transition-colors duration-300`}>
              <button
                type="button"
                onClick={() => handleShiftDay(-1)}
                className={`p-1 sm:p-1.5 ${t.textSecondary} hover:${t.textPrimary} rounded-lg ${t.btnHover} transition-colors cursor-pointer`}
                title="Previous day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                className={`px-1.5 sm:px-2.5 py-1 ${t.textPrimary} hover:${t.accentCyan} ${t.btnHover} rounded-lg font-bold whitespace-nowrap text-xs flex items-center gap-1.5 transition-colors cursor-pointer`}
                title="Open Calendar"
              >
                <CalendarIcon className={`w-3.5 h-3.5 ${t.accentCyan} shrink-0`} />
                <span>{formatDDMM(currentDate)}</span>
                {isToday && <span className={`w-1.5 h-1.5 rounded-full ${t.bgCyan}`} />}
              </button>

              <button
                type="button"
                onClick={() => handleShiftDay(1)}
                className={`p-1 sm:p-1.5 ${t.textSecondary} hover:${t.textPrimary} rounded-lg ${t.btnHover} transition-colors cursor-pointer`}
                title="Next day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button disabled={!allowAi} onClick={onOpenGemini} className={`hidden sm:flex py-2 px-3.5 font-bold text-xs rounded-xl transition-all items-center gap-1.5 whitespace-nowrap shrink-0 ${allowAi ? `${t.activeBtnBg} ${t.activeBtnText} hover:opacity-90 active:scale-95 shadow-md cursor-pointer` : `${t.innerBg} border ${t.innerBorder} ${t.textSecondary} opacity-50 cursor-not-allowed`}`}>
              <Plus className="w-4 h-4 stroke-[2.5]" /> <span>Log Food</span>
            </button>
          </div>
          
        </div>
      </header>

      {/* Main Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentDate={currentDate}
        onDateChange={onDateChange}
        logs={logs}
        profile={profile}
      />

      <ApiSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};