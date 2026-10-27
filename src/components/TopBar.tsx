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
  X,
  Activity,
} from 'lucide-react';
import { ApiSettingsModal } from './ApiSettingsModal';
import { hasConnectedApiKey } from '../utils/geminiStorage';
import { DailyLog, UserProfile } from '../types/nutrition';
import { evaluateDayGoalSuccess } from './GoalCelebrationModal';

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
  profile: UserProfile; // <--- Needed to evaluate goal success per day
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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
  const [pickerMode, setPickerMode] = useState<'days' | 'months' | 'years'>('days');

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

  const selectedDateObj = parseDate(currentDate);
  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1)
  );
  const [yearPageStart, setYearPageStart] = useState<number>(selectedDateObj.getFullYear() - 5);

  const handleShiftDay = (delta: number) => {
    const d = parseDate(currentDate);
    d.setDate(d.getDate() + delta);
    onDateChange(formatToYYYYMMDD(d));
  };

  const todayStr = formatToYYYYMMDD(new Date());
  const isToday = currentDate === todayStr;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const yearsList = Array.from({ length: 12 }, (_, i) => yearPageStart + i);

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
                onClick={() => {
                  setViewMonth(new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1));
                  setYearPageStart(selectedDateObj.getFullYear() - 5);
                  setPickerMode('days');
                  setIsCalendarOpen(true);
                }}
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

      {/* Interactive Month / Year / Day Calendar Modal */}
      {isCalendarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 w-full max-w-sm shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-slate-100">
                  {pickerMode === 'days' && 'Select Date'}
                  {pickerMode === 'months' && 'Choose Month'}
                  {pickerMode === 'years' && 'Choose Year'}
                </span>
              </div>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (pickerMode === 'years') setYearPageStart((prev) => prev - 12);
                  else setViewMonth(new Date(year, month - 1, 1));
                }}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPickerMode(pickerMode === 'months' ? 'days' : 'months')}
                  className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                    pickerMode === 'months'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800'
                  }`}
                >
                  {MONTH_NAMES[month]}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setYearPageStart(year - 5);
                    setPickerMode(pickerMode === 'years' ? 'days' : 'years');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-mono font-bold transition-colors cursor-pointer ${
                    pickerMode === 'years'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800'
                  }`}
                >
                  {year}
                </button>
              </div>

              <button
                onClick={() => {
                  if (pickerMode === 'years') setYearPageStart((prev) => prev + 12);
                  else setViewMonth(new Date(year, month + 1, 1));
                }}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {pickerMode === 'months' && (
              <div className="grid grid-cols-3 gap-2 py-1">
                {MONTH_NAMES.map((mName, mIdx) => (
                  <button
                    key={mName}
                    onClick={() => {
                      setViewMonth(new Date(year, mIdx, 1));
                      setPickerMode('days');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      mIdx === month
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800/80'
                    }`}
                  >
                    {mName.substring(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {pickerMode === 'years' && (
              <div className="grid grid-cols-3 gap-2 py-1">
                {yearsList.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => {
                      setViewMonth(new Date(yr, month, 1));
                      setPickerMode('days');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                      yr === year
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-400/20'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800/80'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}

            {pickerMode === 'days' && (
              <>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-slate-500">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="h-10" />;
                    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = cellDateStr === currentDate;
                    const isCellToday = cellDateStr === todayStr;

                    const dayLog = logs[cellDateStr];
                    const hasItems = (dayLog?.items?.length || 0) > 0;
                    const hasWorkouts = (dayLog?.workouts?.length || 0) > 0;
                    const goalEval = evaluateDayGoalSuccess(dayLog, profile);

                    // Determine color coding:
                    // Gold = Perfect (Goal Success)
                    // Blue = Protein hit (or partial progress)
                    // Green = No goal hit, but food/data entered
                    let indicatorBg = '';
                    if (hasItems) {
                      if (goalEval.success) {
                        indicatorBg = 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'; // Gold for perfect
                      } else if (goalEval.protein >= (profile.targetProtein || 120) * 0.9) {
                        indicatorBg = 'bg-blue-400'; // Blue for protein hit
                      } else {
                        indicatorBg = 'bg-emerald-500'; // Green for entered weight/food without full goal
                      }
                    }

                    return (
                      <button
                        key={cellDateStr}
                        onClick={() => {
                          onDateChange(cellDateStr);
                          setIsCalendarOpen(false);
                        }}
                        className={`h-10 rounded-xl text-xs font-mono flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400 shadow-md'
                            : isCellToday
                            ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40 font-bold'
                            : 'bg-slate-950/70 hover:bg-slate-800 text-slate-200 border border-slate-800/60'
                        }`}
                      >
                        <span className="text-[11px]">{String(day).padStart(2, '0')}</span>

                        {/* Bottom indicators row: Dot (Gold/Blue/Green) + Workout Icon */}
                        <div className="flex items-center gap-1 mt-0.5">
                          {hasItems && (
                            <span className={`w-1.5 h-1.5 rounded-full ${indicatorBg}`} />
                          )}
                          {hasWorkouts && (
  <span title="Workout logged" className="inline-flex items-center">
    <Activity className="w-2.5 h-2.5 text-orange-400" />
  </span>
)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-mono">Selected: {formatDDMM(currentDate)}/{currentDate.split('-')[0]}</span>
              <button
                onClick={() => {
                  onDateChange(todayStr);
                  setIsCalendarOpen(false);
                }}
                className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Today ({formatDDMM(todayStr)})
              </button>
            </div>
          </div>
        </div>
      )}

      <ApiSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};