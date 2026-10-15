import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-xl border border-amber-400">
      <WifiOff className="w-4 h-4 text-slate-950 shrink-0 animate-pulse" />
      <span>Offline Mode — Logged meals &amp; saved foods are safely stored locally.</span>
    </div>
  );
};
