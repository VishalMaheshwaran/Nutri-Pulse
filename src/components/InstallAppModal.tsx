import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share,
  Check,
  Zap,
  ExternalLink,
  Copy,
  QrCode,
  AlertTriangle,
  Monitor,
  MoreVertical,
  CheckCircle2,
  ShieldCheck,
  Package,
  ArrowRight,
  Info,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Code,
  FolderArchive,
  Terminal,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'android' | 'apk' | 'code' | 'ios' | 'qr';

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInIframe, directUrl, install } =
    usePWAInstall();
  const [activeTab, setActiveTab] = useState<TabType>('android');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [apkCopied, setApkCopied] = useState(false);
  const [manifestCopied, setManifestCopied] = useState(false);
  const [showManifestJson, setShowManifestJson] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleDownloadZip = () => {
    setDownloadingZip(true);
    window.location.href = '/api/download-project-zip';
    setTimeout(() => setDownloadingZip(false), 2500);
  };


  // Generate QR code for direct URL
  useEffect(() => {
    if (directUrl) {
      QRCode.toDataURL(directUrl, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [directUrl]);

  // Set default tab based on device context
  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else if (isAndroid) {
      setActiveTab('android');
    } else if (isInIframe) {
      setActiveTab('qr');
    } else {
      setActiveTab('android');
    }
  }, [isIOS, isAndroid, isInIframe]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyForApk = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setApkCopied(true);
      setTimeout(() => setApkCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const openDirectTab = () => {
    if (directUrl) {
      window.open(directUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const openPWABuilder = () => {
    window.open('https://www.pwabuilder.com', '_blank', 'noopener,noreferrer');
  };

  const baseUrl = useMemo(() => {
    if (directUrl) return directUrl.replace(/\/$/, '');
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  }, [directUrl]);

  const manifestData = useMemo(() => ({
    name: 'NutriPulse - AI Calorie & Macro Tracker',
    short_name: 'NutriPulse',
    description: 'Smart nutrition and macronutrient tracker powered by Gemini AI, featuring barcode scanning and daily macro targets.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    lang: 'en',
    scope: '/',
    id: '/',
    orientation: 'portrait-primary',
    categories: ['health', 'fitness', 'lifestyle', 'food'],
    icons: [
      {
        src: `${baseUrl}/pwa-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${baseUrl}/pwa-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${baseUrl}/pwa-maskable-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Log Meal',
        short_name: 'Log Meal',
        description: 'Quickly log a meal or food entry',
        url: '/',
        icons: [{ src: `${baseUrl}/pwa-192x192.png`, sizes: '192x192' }],
      },
    ],
  }), [baseUrl]);

  const manifestJsonString = useMemo(() => JSON.stringify(manifestData, null, 2), [manifestData]);

  const handleCopyManifest = async () => {
    try {
      await navigator.clipboard.writeText(manifestJsonString);
      setManifestCopied(true);
      setTimeout(() => setManifestCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownloadManifest = () => {
    try {
      const blob = new Blob([manifestJsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manifest.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800 transition cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pr-8 shrink-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                N
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 flex-wrap">
              <span>Install NutriPulse</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono rounded-full border border-emerald-500/30">
                Android &amp; iOS
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate">
              Native app experience · Works offline · Barcode Scanner
            </p>
          </div>
        </div>

        {/* Iframe Notice */}
        {isInIframe && (
          <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-0.5">
              <p className="font-semibold text-amber-300 text-[11px]">
                Currently in Preview Mode
              </p>
              <p className="text-[11px] text-slate-400 leading-snug">
                To install on your mobile device, scan the <strong>Scan QR</strong> tab or tap <strong>&quot;Open in Direct Tab&quot;</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs - 5 compact responsive tabs */}
        <div className="grid grid-cols-5 gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mb-3 text-[11px] shrink-0">
          <button
            onClick={() => setActiveTab('android')}
            className={`py-2 px-0.5 rounded-xl font-semibold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
              activeTab === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Android</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-0.5 rounded-xl font-semibold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
              activeTab === 'apk'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Get APK</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2 px-0.5 rounded-xl font-semibold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
              activeTab === 'code'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Full Code</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`py-2 px-0.5 rounded-xl font-semibold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
              activeTab === 'ios'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">iPhone</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-0.5 rounded-xl font-semibold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
              activeTab === 'qr'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Scan QR</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto pr-0.5 space-y-3 flex-1 text-slate-200">
          {/* TAB 1: Android Phone Instructions */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              {isInstalled ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-1.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">
                    NutriPulse is Installed!
                  </p>
                  <p className="text-xs text-slate-400">
                    Running in native standalone app mode on your device.
                  </p>
                </div>
              ) : (
                <>
                  {/* CRITICAL TROUBLESHOOTING BANNER: For "This app can't be installed" */}
                  <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Did you see &quot;This app can&apos;t be installed&quot;?</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      When you tap <strong>&quot;Install&quot;</strong>, Google Play tries to compile a WebAPK on Google&apos;s cloud servers, which gets blocked on development preview domains.
                    </p>
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-emerald-500/40 text-[11px] text-slate-200 space-y-1">
                      <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>The 5-Second Solution:</span>
                      </p>
                      <p className="text-slate-300">
                        In the Chrome 3-dots menu (<span className="font-mono text-emerald-300 font-bold">⋮</span>), tap{' '}
                        <strong className="text-white underline decoration-emerald-400 decoration-2">
                          &quot;Create shortcut&quot;
                        </strong>{' '}
                        (or &quot;Add to Home screen&quot;) instead of &quot;Install&quot;.
                      </p>
                      <p className="text-[10px] text-emerald-300/90">
                        ✓ Bypasses Google Play restrictions · Puts NutriPulse icon on your phone home screen · Opens full-screen!
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Install Button if available */}
                  {isInstallable && (
                    <button
                      onClick={async () => {
                        const res = await install();
                        if (res) onClose();
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>Try One-Tap Install</span>
                    </button>
                  )}

                  {/* Step by Step Guide for Android Phone */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3 text-xs">
                    <p className="font-bold text-slate-100 flex items-center gap-1.5 text-xs text-emerald-400">
                      <Smartphone className="w-3.5 h-3.5" />
                      Step-by-Step Installation on Android:
                    </p>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-200">
                          Open in Google Chrome
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Make sure the link is opened in the actual <strong>Google Chrome</strong> app, not a quick camera browser or Google Lens viewer.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-900">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-200 flex items-center gap-1.5 flex-wrap">
                          <span>Tap the Chrome menu</span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-[10px]">
                            <MoreVertical className="w-3 h-3 text-cyan-400" /> 3 dots (⋮)
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Located at the top-right corner of Google Chrome.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-900">
                      <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-200">
                          Tap <strong className="text-emerald-400">&quot;Create shortcut&quot;</strong> or &quot;Add to Home screen&quot;
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          If &quot;Install app&quot; gave an error, <strong>&quot;Create shortcut&quot;</strong> will always succeed instantly.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-900">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                        4
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-200">
                          Tap <strong className="text-indigo-300">&quot;Add&quot;</strong>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          The NutriPulse app icon is placed on your home screen. Tapping it opens full-screen without address bars!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={handleCopy}
                      className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Link Copied!' : 'Copy Link for Chrome'}</span>
                    </button>
                    <button
                      onClick={openDirectTab}
                      className="flex-1 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Direct Tab</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Get APK File Information & PWABuilder */}
          {activeTab === 'apk' && (
            <div className="space-y-3">
              {/* Critical Alert for PWABuilder Manifest error */}
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>PWABuilder says &quot;did not find a Web Manifest&quot;?</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  PWABuilder&apos;s crawler cannot scan private Cloud Run preview domains automatically. Fix it in 10 seconds: click <strong>&quot;1-Click Copy Manifest JSON&quot;</strong> below and paste it into PWABuilder&apos;s Manifest Editor!
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleCopyManifest}
                    className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-450 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    {manifestCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{manifestCopied ? 'Manifest JSON Copied!' : '1-Click Copy Manifest JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownloadManifest}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>

              {/* Step-by-step PWABuilder guide */}
              <div className="p-3.5 bg-gradient-to-br from-slate-950 to-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                    <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>How to generate your APK in PWABuilder</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Free Tool
                  </span>
                </div>

                <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-white">Open PWABuilder and start analysis</p>
                      <p className="text-slate-400">
                        Paste your App URL: <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded text-[10px]">{directUrl || 'Loading URL...'}</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1.5 border-t border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-white">Click &quot;Manifest Editor&quot; &rarr; Paste JSON</p>
                      <p className="text-slate-400">
                        When PWABuilder asks for a manifest, tap <strong>&quot;Use our Manifest Editor&quot;</strong>, switch to the <strong>JSON tab</strong>, paste the copied JSON, and click <strong>Done/Save</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1.5 border-t border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-white">Download APK package</p>
                      <p className="text-slate-400">
                        Click <strong>&quot;Package for Stores&quot;</strong> &rarr; select <strong>&quot;Android&quot;</strong> &rarr; click <strong>&quot;Download APK&quot;</strong>!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={openPWABuilder}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-xs transition cursor-pointer"
                  >
                    <span>Open PWABuilder.com</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCopyForApk}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Copy App URL"
                  >
                    {apkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{apkCopied ? 'URL Copied!' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {/* Manifest JSON Inspector collapsible */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowManifestJson(!showManifestJson)}
                  className="w-full p-2.5 px-3.5 flex items-center justify-between text-xs text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View / Copy Raw Manifest JSON</span>
                  </span>
                  {showManifestJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showManifestJson && (
                  <div className="p-3 pt-0 border-t border-slate-800 space-y-2">
                    <pre className="p-2.5 bg-slate-950 rounded-xl text-[10px] text-emerald-400 font-mono overflow-x-auto max-h-48 border border-slate-850">
                      {manifestJsonString}
                    </pre>
                    <button
                      onClick={handleCopyManifest}
                      className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {manifestCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{manifestCopied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Instant Home Screen alternative */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-[11px] text-slate-300 space-y-1.5">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Faster Alternative (No APK or Downloads Needed):</span>
                </p>
                <p className="text-slate-300 leading-snug">
                  On your Android phone in Chrome, open the 3-dots menu (<strong>⋮</strong>) and tap{' '}
                  <strong className="text-white underline decoration-emerald-400">
                    &quot;Create shortcut&quot;
                  </strong>{' '}
                  (or &quot;Add to Home screen&quot;). It installs the exact same standalone full-screen app on your phone home screen immediately!
                </p>
              </div>

              {/* Direct Full Code Download Option */}
              <div className="pt-1">
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-450 hover:to-cyan-450 active:scale-98 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <FolderArchive className="w-4 h-4 text-slate-950" />
                  <span>{downloadingZip ? 'Preparing ZIP File...' : 'Download Full Codebase (.ZIP)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Full Code & Project ZIP Archive */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              {/* Primary ZIP Download Banner */}
              <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <FolderArchive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>NutriPulse Complete Source Code</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                          .ZIP
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        All 40+ project files, components, configs, and manifest.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{downloadingZip ? 'Generating ZIP...' : 'Download Complete Project (.ZIP)'}</span>
                </button>
              </div>

              {/* Manifest JSON File Section */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Web Manifest (manifest.json)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">PWA Ready</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Required by PWABuilder and mobile browsers for standalone installation.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCopyManifest}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {manifestCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{manifestCopied ? 'Copied JSON!' : 'Copy manifest.json'}</span>
                  </button>
                  <button
                    onClick={handleDownloadManifest}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>

              {/* Included File Architecture Breakdown */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-[11px]">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Codebase Architecture Included</span>
                </p>
                <div className="space-y-1 text-slate-400 font-mono text-[10.5px]">
                  <div className="flex items-center justify-between py-1 border-b border-slate-900">
                    <span className="text-emerald-400 font-medium">server.ts</span>
                    <span className="text-slate-500 font-sans">Express + Gemini AI + Barcode API</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-900">
                    <span className="text-emerald-400 font-medium">public/manifest.json</span>
                    <span className="text-slate-500 font-sans">PWA standalone configuration</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-900">
                    <span className="text-emerald-400 font-medium">src/App.tsx</span>
                    <span className="text-slate-500 font-sans">Nutrition tracker & state engine</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-900">
                    <span className="text-emerald-400 font-medium">src/components/</span>
                    <span className="text-slate-500 font-sans">13 UI components (Scanner, AI, Rings)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-900">
                    <span className="text-emerald-400 font-medium">vite.config.ts</span>
                    <span className="text-slate-500 font-sans">Vite + Tailwind + VitePWA plugins</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-emerald-400 font-medium">package.json</span>
                    <span className="text-slate-500 font-sans">Dependencies & build scripts</span>
                  </div>
                </div>
              </div>

              {/* Local Quickstart */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5 text-[11px]">
                <p className="font-semibold text-slate-200">How to run locally:</p>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-slate-300 font-mono text-[10px] space-y-0.5">
                  <p className="text-emerald-400"># 1. Unzip nutripulse-complete-project.zip</p>
                  <p className="text-indigo-300">cd nutripulse-project</p>
                  <p className="text-emerald-400"># 2. Install dependencies & start</p>
                  <p className="text-slate-200">npm install</p>
                  <p className="text-slate-200">npm run dev</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: iOS / Safari */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1">
                <p className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5 text-indigo-400" />
                  iPhone &amp; iPad Instructions (Safari)
                </p>
                <p className="text-[11px] text-slate-400">
                  Apple requires using Safari browser to install web applications to the home screen.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">
                      Open this URL in <strong className="text-indigo-300">Safari</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-900">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">
                      Tap the <strong className="text-emerald-300">Share</strong> icon (box with upward arrow) at the bottom toolbar
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-900">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">
                      Scroll down and tap <strong className="text-cyan-300">Add to Home Screen</strong>, then tap <strong>Add</strong>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied! Paste into Safari' : 'Copy URL for Safari'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: Phone QR / Desktop */}
          {activeTab === 'qr' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
                {/* QR Code Canvas */}
                {qrCodeDataUrl ? (
                  <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                    <img
                      src={qrCodeDataUrl}
                      alt="NutriPulse Mobile QR Code"
                      className="w-28 h-28 sm:w-32 sm:h-32 block"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-800 rounded-xl animate-pulse shrink-0" />
                )}

                <div className="space-y-1.5 text-xs flex-1">
                  <p className="font-bold text-slate-100 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    Scan with Phone Camera
                  </p>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    1. Open phone camera &amp; scan QR.
                    <br />
                    2. In Chrome, tap <strong>⋮ (3 dots) &rarr; &quot;Create shortcut&quot;</strong>.
                    <br />
                    3. App installs directly to your home screen!
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={handleCopy}
                      className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer mx-auto sm:mx-0"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Link Copied!' : 'Copy App URL'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Chrome Install Guide */}
              <div className="text-xs text-slate-300 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  Installing on Desktop Computer:
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Open in a dedicated tab &rarr; Click the <strong>Install icon</strong> in Chrome&apos;s address bar, or Chrome Menu (⋮) &rarr; <strong>Cast, save, and share &rarr; Install NutriPulse</strong>.
                </p>
              </div>

              <button
                onClick={openDirectTab}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 text-slate-200 font-semibold rounded-2xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Open App in Direct Browser Tab</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>NutriPulse PWA v1.2 · Fast &amp; Offline Ready</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
