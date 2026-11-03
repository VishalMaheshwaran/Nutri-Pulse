// src/components/TopBar.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Sliders,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { ApiSettingsModal } from './ApiSettingsModal';
import { hasConnectedApiKey } from '../utils/geminiStorage';
import { DailyLog, UserProfile } from '../types/nutrition';
import { CalendarModal } from './CalendarModal'; // <--- IMPORT YOUR NEW REUSABLE CALENDAR!

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
  currentDate,
  onDateChange,
  onOpenBarcode,
  onOpenGemini,
  onOpenSavedFoods,
  onOpenProfile,
  activeView,
  setActiveView,
  logs = {},
  profile,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const apiReady = hasConnectedApiKey();

  const parseDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatToYYYYMMDD = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDDMM = (dateStr: string) => {
    const parts = dateStr.split('-');
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

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 pb-3 flex justify-between items-center"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[60px] sm:h-16 flex items-center justify-between gap-2 sm:gap-4 w-full">
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
              disabled={!apiReady}
              onClick={onOpenBarcode}
              title={!apiReady ? 'Connect Gemini API Key first' : 'Camera Scan'}
              className={`transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                apiReady ? 'text-slate-300 hover:text-emerald-400 cursor-pointer' : 'text-slate-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" /> Camera Scan
            </button>
            <button
              disabled={!apiReady}
              onClick={onOpenGemini}
              title={!apiReady ? 'Connect Gemini API Key first' : 'AI Estimator'}
              className={`transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                apiReady ? 'text-slate-300 hover:text-indigo-400 cursor-pointer' : 'text-slate-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Estimator
            </button>
            <button
              onClick={onOpenProfile}
              className="transition-colors whitespace-nowrap hover:text-slate-100 flex items-center gap-1 text-slate-300 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" /> Targets
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                apiReady ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${apiReady ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{apiReady ? 'Connected' : 'Disconnected'}</span>
            </button>
          </nav>

          {/* Zone 3: Date Stepper & Primary Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="lg:hidden">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                  apiReady ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${apiReady ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span>{apiReady ? 'Connected' : 'Disconnected'}</span>
              </button>
            </div>

            {/* Day Stepper (DD/MM) */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5 sm:p-1 text-xs font-mono">
              <button
                onClick={() => handleShiftDay(-1)}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsCalendarOpen(true)}
                className="px-1.5 sm:px-2.5 py-1 text-slate-100 hover:text-emerald-400 hover:bg-slate-800/70 rounded-lg font-bold whitespace-nowrap text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open Calendar"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{formatDDMM(currentDate)}</span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>

              <button
                onClick={() => handleShiftDay(1)}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop Log Button */}
            <button
              disabled={!apiReady}
              onClick={onOpenGemini}
              title={!apiReady ? 'Connect Gemini API Key first to use AI Log' : 'Log Food with AI'}
              className={`hidden sm:flex py-2 px-3.5 font-bold text-xs rounded-xl transition-all items-center gap-1.5 whitespace-nowrap shrink-0 ${
                apiReady
                  ? 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Food</span>
            </button>
          </div>
        </div>
      </header>

      {/* Renders your massive custom Calendar over everything else */}
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