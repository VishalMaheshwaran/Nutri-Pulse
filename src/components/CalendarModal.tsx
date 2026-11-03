// src/components/CalendarModal.tsx
import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Activity, AlertCircle } from 'lucide-react';
import { DailyLog, UserProfile } from '../types/nutrition';
import { calculateTotals, getTodayDateString } from '../services/storage';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface GoalSuccess {
  success: boolean;
  calories: number;
  protein: number;
}

const formatDDMM = (dateStr: string) => {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
};

const evaluateDayGoalSuccess = (dayLog: DailyLog, profile: UserProfile): GoalSuccess => {
  const dayTotals = calculateTotals(dayLog.items);
  const targetCals = dayLog.targetCalories ?? profile.targetCalories ?? 2000;
  const targetProt = dayLog.targetProtein ?? profile.targetProtein ?? 120;
  
  const burned = (dayLog.workouts || []).reduce((s, w) => s + w.caloriesBurned, 0);
  const budget = targetCals + burned;

  let calsHit = false;
  const protHit = dayTotals.protein >= targetProt * 0.95;

  if (dayLog.items.length > 0) {
    if (profile.goal === 'lose_weight') {
      calsHit = dayTotals.calories > 0 && dayTotals.calories <= budget + 25;
    } else if (profile.goal === 'gain_muscle') {
      calsHit = dayTotals.calories >= budget * 0.95 && dayTotals.calories <= budget + 200;
    } else {
      calsHit = Math.abs(dayTotals.calories - budget) <= 150;
    }
  }
  
  return {
    success: dayLog.items.length > 0 && protHit && calsHit,
    calories: dayTotals.calories,
    protein: dayTotals.protein,
  };
};

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onDateChange: (dateStr: string) => void;
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  isDateSelectable?: (dateStr: string) => { selectable: boolean; message?: string };
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onDateChange,
  logs,
  profile,
  isDateSelectable,
}) => {
  const todayStr = getTodayDateString();

  // Internal state for the picker views
  const [pickerMode, setPickerMode] = useState<'days' | 'months' | 'years'>('days');
  const [viewMonth, setViewMonth] = useState(() => {
    const [y, m, d] = currentDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  });
  const [yearPageStart, setYearPageStart] = useState(() => viewMonth.getFullYear() - 5);
  const [validationError, setValidationError] = useState<string | null>(null);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  const yearsList = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) arr.push(yearPageStart + i);
    return arr;
  }, [yearPageStart]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 w-full max-w-sm shadow-2xl space-y-4 transform transition-all duration-300 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-slate-100">
              {pickerMode === 'days' && 'Select Monday'}
              {pickerMode === 'months' && 'Choose Month'}
              {pickerMode === 'years' && 'Choose Year'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Banner Inside Calendar */}
        {validationError && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

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

                const dayLog = logs[cellDateStr] || { date: cellDateStr, items: [], waterIntakeMl: 0, workouts: [] };
                const hasItems = dayLog.items.length > 0;
                const hasWorkouts = (dayLog.workouts?.length || 0) > 0;
                const goalEval = evaluateDayGoalSuccess(dayLog, profile);

                let indicatorClass = '';
                if (hasItems) {
                  if (goalEval.success) {
                    indicatorClass = 'bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-badge-blink'; 
                  } else if (goalEval.protein >= (profile.targetProtein || 120) * 0.9) {
                    indicatorClass = 'bg-blue-400';
                  } else {
                    indicatorClass = 'bg-emerald-500';
                  }
                }

                return (
                  <button
                    key={cellDateStr}
                    onClick={() => {
                      if (isDateSelectable) {
                        const check = isDateSelectable(cellDateStr);
                        if (!check.selectable) {
                          setValidationError(check.message || 'Invalid date selection');
                          return;
                        }
                      }
                      setValidationError(null);
                      onDateChange(cellDateStr);
                      onClose();
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

                    <div className="flex items-center gap-1 mt-0.5">
                      {hasItems && (
                        <span className={`w-1.5 h-1.5 rounded-full ${indicatorClass}`} />
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

        {pickerMode === 'days' && (
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-mono">
              Selected: {formatDDMM(currentDate)}/{currentDate.split('-')[0]}
            </span>
            <button
              onClick={() => {
                if (isDateSelectable) {
                  const check = isDateSelectable(todayStr);
                  if (!check.selectable) {
                    setValidationError(check.message || 'Invalid date selection');
                    return;
                  }
                }
                setValidationError(null);
                onDateChange(todayStr);
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Today ({formatDDMM(todayStr)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};