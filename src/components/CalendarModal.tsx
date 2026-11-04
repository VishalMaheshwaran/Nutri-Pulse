// src/components/CalendarModal.tsx
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Activity } from 'lucide-react';
import { DailyLog, UserProfile } from '../types/nutrition';
import { calculateTotals } from '../services/storage';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onDateChange: (date: string) => void;
  logs: Record<string, DailyLog>;
  profile: UserProfile;
  enforceMondayOnly?: boolean;
  initialMode?: 'days' | 'months';
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onDateChange,
  logs,
  profile,
  enforceMondayOnly = false,
  initialMode = 'days',
}) => {
  if (!isOpen) return null;

  const [activeDate, setActiveDate] = useState(() => {
    const [y, m, d] = (currentDate || '2026-01-01').split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  });

  const [notice, setNotice] = useState<string | null>(
    enforceMondayOnly ? 'The week starts on Monday! Please select any Monday.' : null
  );
  
  const [selectorMode, setSelectorMode] = useState<'days' | 'months'>(initialMode);

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const prevMonth = () => {
    setActiveDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setActiveDate(new Date(year, month + 1, 1));
  };

  const changeYear = (delta: number) => {
    setActiveDate(new Date(year + delta, month, 1));
  };

  const formatKey = (y: number, m: number, d: number = 1) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const standardMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getWeekOfMonthString = (dateStr: string) => {
    const [y, m, d] = (dateStr || '').split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dt = new Date(y, m - 1, d);
    const dayNum = dt.getDate();
    const weekNum = Math.ceil(dayNum / 7);
    const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th'];
    const suffix = suffixes[weekNum] || 'th';
    return `${weekNum}${suffix} Week of ${standardMonthNames[m - 1]} ${y}`;
  };

  const formatSelectedLabel = (dateStr: string) => {
    const [y, m, d] = (dateStr || '').split('-');
    if (!y || !m) return dateStr;
    
    if (initialMode === 'months' || (!d || d === '01') && enforceMondayOnly === false && selectorMode === 'months') {
      const monthIdx = Number(m) - 1;
      return `${standardMonthNames[monthIdx]} ${y}`;
    }

    if (enforceMondayOnly) {
      return getWeekOfMonthString(dateStr);
    }

    return `${d}/${m}/${y}`;
  };

  const todayStr = (() => {
    const now = new Date();
    return formatKey(now.getFullYear(), now.getMonth(), now.getDate());
  })();

  const getMondayFromDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d || 1);
    const dayOfWeek = dt.getDay();
    const diffToMonday = dt.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(dt);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    return formatKey(monday.getFullYear(), monday.getMonth(), monday.getDate());
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              {enforceMondayOnly ? 'Select Monday' : selectorMode === 'months' ? 'Select Month & Year' : 'Select Date'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning / Notice Banner */}
        {notice && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-xs text-amber-300 flex items-center gap-2 animate-in fade-in">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Month & Year Stepper Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {selectorMode === 'days' && (
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border border-slate-800 shrink-0"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 flex-1 justify-center">
            <button
              type="button"
              onClick={() => setSelectorMode(selectorMode === 'months' ? 'days' : 'months')}
              className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400 font-mono transition-colors cursor-pointer"
            >
              {standardMonthNames[month]}
            </button>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => changeYear(-1)}
                className="px-2 py-1.5 text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous Year"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-1.5 text-xs font-bold text-blue-400 font-mono">
                {year}
              </span>
              <button
                type="button"
                onClick={() => changeYear(1)}
                className="px-2 py-1.5 text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next Year"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {selectorMode === 'days' && (
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border border-slate-800 shrink-0"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Month Selection Grid */}
        {selectorMode === 'months' && (
          <div className="grid grid-cols-3 gap-2.5 py-4">
            {standardMonthNames.map((mName, mIdx) => {
              const [selectedY, selectedM] = (currentDate || '').split('-').map(Number);
              const isCurrentYearMatch = year === selectedY;
              const isSelectedMonth = isCurrentYearMatch && mIdx === (selectedM - 1);

              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => {
                    setActiveDate(new Date(year, mIdx, 1));
                    if (initialMode === 'months') {
                      onDateChange(formatKey(year, mIdx, 1));
                      onClose();
                    } else {
                      setSelectorMode('days');
                    }
                  }}
                  className={`py-3 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelectedMonth
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200'
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        )}

        {/* Days View */}
        {selectorMode === 'days' && (
          <>
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-slate-400 pt-2 pb-1">
              <span>SU</span>
              <span>MO</span>
              <span>TU</span>
              <span>WE</span>
              <span>TH</span>
              <span>FR</span>
              <span>SA</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-10" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = formatKey(year, month, dayNum);
                const isSelected = dateStr === currentDate;
                const isMonday = new Date(year, month, dayNum).getDay() === 1;
                
                const dayLog = logs[dateStr];
                const hasLogged = dayLog && dayLog.items && dayLog.items.length > 0;
                const totals = hasLogged ? calculateTotals(dayLog.items) : { calories: 0, protein: 0 };
                const workouts = dayLog?.workouts || [];
                const hasWorkouts = workouts.length > 0;
                
                const targetProt = dayLog?.targetProtein ?? profile.targetProtein ?? 160;
                const dayTargetCals = dayLog?.targetCalories ?? profile.targetCalories ?? 2600;
                const burned = workouts.reduce((s, w) => s + w.caloriesBurned, 0);
                const effectiveBudget = dayTargetCals + burned;

                const hitProt = hasLogged && totals.protein >= targetProt * 0.95;
                const hitCals = hasLogged && Math.abs(totals.calories - effectiveBudget) <= 150;
                const isPerfect = hasLogged && hitProt && hitCals;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      if (enforceMondayOnly && !isMonday) {
                        setNotice(`⚠️ ${Number(dayNum)}/${Number(month) + 1}/${year} is not a Monday. Please select a Monday!`);
                        return;
                      }
                      onDateChange(dateStr);
                      onClose();
                    }}
                    className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md scale-105 z-10'
                        : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold leading-none">{dayNum}</span>
                    
                    <div className="flex items-center gap-1 mt-1.5">
                      {hasWorkouts && <Activity className="w-2.5 h-2.5 text-orange-400" />}
                      {hasLogged && (
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isPerfect 
                            ? 'bg-yellow-400 animate-pulse shadow-[0_0_6px_rgba(250,204,21,0.6)]' 
                            : hitProt 
                            ? 'bg-cyan-400' 
                            : 'bg-emerald-400'
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Bottom Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
          <span className="truncate max-w-[200px]">Selected: {formatSelectedLabel(currentDate)}</span>
          <button
            type="button"
            onClick={() => {
              if (initialMode === 'months') {
                const now = new Date();
                onDateChange(formatKey(now.getFullYear(), now.getMonth(), 1));
              } else {
                const targetDate = enforceMondayOnly ? getMondayFromDate(todayStr) : todayStr;
                onDateChange(targetDate);
              }
              onClose();
            }}
            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            {initialMode === 'months' ? 'Current Month' : enforceMondayOnly ? 'This Week' : 'Today'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CalendarModal;