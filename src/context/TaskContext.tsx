// src/context/TaskContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export type TaskStatus = 'running' | 'success' | 'error';

export interface BackgroundTask {
  id: string;
  title: string;
  status: TaskStatus;
  message?: string;
}

interface TaskContextType {
  tasks: BackgroundTask[];
  runTask: (title: string, asyncFunction: () => Promise<void>) => void;
  removeTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const runTask = useCallback(async (title: string, asyncFunction: () => Promise<void>) => {
    const id = Math.random().toString(36).substring(7);
    
    // Add to running tasks
    setTasks((prev) => [...prev, { id, title, status: 'running' }]);

    try {
      await asyncFunction();
      // Update to success
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'success' } : t)));
      
      // Auto-remove success after 3 seconds
      setTimeout(() => removeTask(id), 3000);
    } catch (error: any) {
      // Update to error
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'error', message: error.message } : t)));
      
      // Auto-remove error after 5 seconds
      setTimeout(() => removeTask(id), 5000);
    }
  }, [removeTask]);

  return (
    <TaskContext.Provider value={{ tasks, runTask, removeTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};