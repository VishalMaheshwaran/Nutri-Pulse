import React, { useState } from 'react';
import { Activity, Flame, RefreshCw, Trash2, Sparkles, Copy, Check, Bookmark } from 'lucide-react';
import { WorkoutItem, UserProfile, SavedWorkout } from '../types/nutrition';

interface WorkoutTrackerProps {
  workouts: WorkoutItem[];
  profile: UserProfile;
  onUpdateWorkouts: (workouts: WorkoutItem[]) => void;
  onCopyWorkout?: (workout: WorkoutItem) => void;
  onSaveRoutine?: (workout: WorkoutItem) => void;
  onOpenSavedWorkouts?: () => void;
}

export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({
  workouts,
  profile,
  onUpdateWorkouts,
  onCopyWorkout,
  onSaveRoutine,
  onOpenSavedWorkouts,
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedRoutineId, setSavedRoutineId] = useState<string | null>(null);

  const totalBurned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);

  const handleAnalyzeWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          userProfile: profile,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze workout');

      const newItem: WorkoutItem = {
        id: `workout-${Date.now()}`,
        description: data.description,
        caloriesBurned: data.caloriesBurned,
        durationMinutes: data.durationMinutes,
        avgBpm: data.avgBpm,
        sets: data.sets || [],
        loggedAt: new Date().toISOString(),
      };

      onUpdateWorkouts([newItem, ...workouts]);
      setInputText('');
    } catch (err: any) {
      console.error('Workout analysis error:', err);
      alert(err.message || 'Failed to estimate calories from AI.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string) => {
    onUpdateWorkouts(workouts.filter((w) => w.id !== id));
  };

  const handleCopy = (workout: WorkoutItem) => {
    if (onCopyWorkout) {
      onCopyWorkout(workout);
      setCopiedId(workout.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSave = (workout: WorkoutItem) => {
    if (onSaveRoutine) {
      onSaveRoutine(workout);
      setSavedRoutineId(workout.id);
      setTimeout(() => setSavedRoutineId(null), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">Workout &amp; Activity Log</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">AI Duration &amp; Calorie Burn Estimator</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenSavedWorkouts && (
            <button
              onClick={onOpenSavedWorkouts}
              className="py-1.5 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Saved Workouts"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Routines</span>
            </button>
          )}

          <div className="text-right font-mono shrink-0">
            <span className="text-xs sm:text-sm font-bold text-orange-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> {totalBurned} kcal
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">Active Burn</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleAnalyzeWorkout} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g. 80 mins biceps, 10 sets..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
          disabled={isAnalyzing}
        />
        <button
          type="submit"
          disabled={isAnalyzing || !inputText.trim()}
          className="px-3 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Log Workout</span>
        </button>
      </form>

      {workouts.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          {workouts.map((workout) => (
            <div key={workout.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">{workout.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                  {workout.durationMinutes && <span>{workout.durationMinutes} mins</span>}
                  {workout.avgBpm && <span className="text-rose-400">❤️ {workout.avgBpm} BPM</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-mono font-bold text-orange-400 mr-1">-{workout.caloriesBurned} kcal</span>
                
                {onSaveRoutine && (
                  <button
                    onClick={() => handleSave(workout)}
                    className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Save as routine"
                  >
                    {savedRoutineId === workout.id ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                  </button>
                )}

                {onCopyWorkout && (
                  <button
                    onClick={() => handleCopy(workout)}
                    className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Copy workout to today"
                  >
                    {copiedId === workout.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}

                <button
                  onClick={() => handleDelete(workout.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete workout"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};  