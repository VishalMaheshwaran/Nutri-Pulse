import React from 'react';
import { X, Dumbbell, Flame, Trash2, Plus, Bookmark } from 'lucide-react';
import { SavedWorkout } from '../types/nutrition';

interface SavedWorkoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedWorkouts: SavedWorkout[];
  onLogSavedWorkout: (workout: SavedWorkout) => void;
  onDeleteSavedWorkout: (id: string) => void;
}

export const SavedWorkoutsModal: React.FC<SavedWorkoutsModalProps> = ({
  isOpen,
  onClose,
  savedWorkouts,
  onLogSavedWorkout,
  onDeleteSavedWorkout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">Saved Workout Routines</h2>
              <p className="text-xs text-slate-400">Quick-log your favorite training sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {savedWorkouts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500">
                <Dumbbell className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400">
                No saved workouts yet. Click the bookmark icon on any logged workout to save it as a routine!
              </p>
            </div>
          ) : (
            savedWorkouts.map((routine) => (
              <div
                key={routine.id}
                className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2.5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">{routine.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{routine.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-1">
                      {routine.durationMinutes && <span>⏱️ {routine.durationMinutes} mins</span>}
                      <span className="text-orange-400 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {routine.caloriesBurned} kcal
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onLogSavedWorkout(routine);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Log Routine
                    </button>
                    <button
                      onClick={() => onDeleteSavedWorkout(routine.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {routine.sets && routine.sets.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-2 border-t border-slate-900">
                    {routine.sets.map((set, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-0.5 bg-slate-900 rounded text-[10px]">
                        <span className="text-slate-300 truncate">{set.exerciseName}</span>
                        <span className="text-slate-400 font-mono shrink-0">
                          {set.weightKg ? `${set.weightKg}kg` : ''} {set.reps ? `× ${set.reps}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};