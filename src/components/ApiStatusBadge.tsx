// src/components/ApiStatusBadge.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ApiStatusBadgeProps {
  onClick: () => void;
  status?: 'connected' | 'disconnected' | 'testing';
}

export const ApiStatusBadge: React.FC<ApiStatusBadgeProps> = ({ onClick, status = 'disconnected' }) => {
  const isConnected = status === 'connected';
  const isTesting = status === 'testing';

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
        isTesting
          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 hover:bg-amber-500/25'
          : isConnected
          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25'
          : 'bg-rose-500/20 border-rose-500/60 text-rose-200 hover:bg-rose-500/30 animate-pulse'
      }`}
      title="Click to configure Gemini API Key"
    >
      {isTesting ? (
        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-spin shrink-0" />
      ) : (
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-400 shadow-[0_0_10px_#fb7185]'
          }`}
        />
      )}
      <span className="tracking-wide">
        {isTesting ? 'Testing...' : isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </button>
  );
};