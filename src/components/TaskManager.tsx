// src/components/TaskManager.tsx
import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export const TaskManager: React.FC = () => {
  const { tasks, removeTask } = useTasks();

  if (tasks.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-none sm:w-80 items-center sm:items-end">
      {/* 
        Mobile: Positioned above bottom nav (bottom-24), spans width with margins (left-4 right-4).
        Desktop (sm+): Pinned to bottom right corner. 
      */}
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-3.5 pr-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3.5 pointer-events-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-right-8 fade-in duration-300 w-full max-w-sm"
        >
          {/* Status Icon with subtle background pulse */}
          <div className={`shrink-0 p-1.5 rounded-full ${task.status === 'running' ? 'bg-emerald-500/10' : task.status === 'success' ? 'bg-cyan-500/10' : 'bg-rose-500/10'}`}>
            {task.status === 'running' && <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />}
            {task.status === 'success' && <CheckCircle className="w-5 h-5 text-cyan-400" />}
            {task.status === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
          </div>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-100 truncate">
              {task.title}
            </p>
            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
              {task.status === 'running' && 'Running in background...'}
              {task.status === 'success' && 'Completed successfully!'}
              {task.status === 'error' && (task.message || 'Task failed.')}
            </p>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => removeTask(task.id)}
            className="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};