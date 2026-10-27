// src/components/ApiSettingsModal.tsx
import React, { useState } from 'react';
import { X, Check, AlertCircle, Loader2, Key, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../utils/geminiStorage';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestStateChange?: (state: 'idle' | 'testing' | 'success' | 'error') => void;
  onRedirectHome?: () => void; // <--- Callback to go home
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  onTestStateChange,
  onRedirectHome,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!isOpen) return null;

  const updateTestState = (state: 'idle' | 'testing' | 'success' | 'error') => {
    setTestState(state);
    if (onTestStateChange) onTestStateChange(state);
  };

  const handleTestAndSave = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      updateTestState('error');
      setErrorText('wrong api key please check and paste the proper one :)');
      return;
    }

    updateTestState('testing');
    setErrorText(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${trimmed}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.error || !res.ok) {
        throw new Error('wrong api key please check and paste the proper one :)');
      }

      setStoredApiKey(trimmed);
      updateTestState('success');
      setTimeout(() => {
        onClose();
        if (onRedirectHome) {
          onRedirectHome();
        } else {
          window.location.href = '/'; // Redirects cleanly to home page
        }
      }, 800);
    } catch (err: any) {
      clearTimeout(timeoutId);
      updateTestState('error');
      setErrorText('wrong api key please check and paste the proper one :)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-100">Gemini API Settings</span>
          </div>
          <button
            onClick={() => {
              updateTestState('idle');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/60 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Google AI Studio API Key
          </label>
          <input
            type="text"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Your key is stored securely in local browser storage and used directly for AI food estimation and streak coaching.
          </p>
        </div>

        {testState === 'error' && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {testState === 'success' && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>API Key verified successfully! Connected.</span>
          </div>
        )}

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              updateTestState('idle');
              onClose();
            }}
            className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={testState === 'testing'}
            onClick={handleTestAndSave}
            className="w-1/2 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {testState === 'testing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Testing...</span>
              </>
            ) : testState === 'success' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </>
            ) : (
              <span>Test &amp; Save Key</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};