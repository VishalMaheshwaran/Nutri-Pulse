import React, { useState } from 'react';
import { Download, Smartphone, Check, QrCode } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';

interface PWAInstallButtonProps {
  variant?: 'topbar' | 'banner' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'topbar' }) => {
  const { isInstallable, isInstalled, isInIframe, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in standalone mode, show a small verified app indicator
  if (isInstalled) {
    if (variant === 'topbar') {
      return (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] font-medium text-emerald-400">
          <Check className="w-3.5 h-3.5" />
          <span>App Installed</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    // If inside an iframe (like AI Studio preview), opening the guidance modal with QR code & direct tab is the only reliable path
    if (isInIframe) {
      setIsModalOpen(true);
      return;
    }

    if (isInstallable) {
      const res = await install();
      if (!res) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 p-3 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl shadow-lg w-full">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 truncate">
                Use NutriPulse as a Mobile App
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1 sm:line-clamp-none">
                {isInIframe
                  ? 'Scan QR code with phone or open direct tab to install on home screen.'
                  : 'Add to home screen for camera barcode scanning & offline mode.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            {isInIframe ? <QrCode className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isInIframe ? 'Get App' : 'Install'}</span>
          </button>
        </div>

        <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="py-1.5 px-2.5 sm:px-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
        title="Install as mobile / desktop app"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Use as App</span>
        <span className="sm:hidden">Install</span>
      </button>

      <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
