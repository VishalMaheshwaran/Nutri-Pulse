// src/components/NotificationPreviewModal.tsx
import React, { useState } from 'react';
import { X, Bell, Sparkles, CheckCircle2, Flame, Smartphone, Send, ArrowRight } from 'lucide-react';
import { generateMacroCardSvg, type MacroCardData } from '../services/notificationImage';
import { pushPhotoNotification } from '../services/spotifyMediaNotification';
import { updateLiveTrackerNotification } from '../services/notifications';

interface NotificationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardData: MacroCardData;
}

export const NotificationPreviewModal: React.FC<NotificationPreviewModalProps> = ({
  isOpen,
  onClose,
  cardData,
}) => {
  const [activeTab, setActiveTab] = useState<'photo_card' | 'before_after'>('photo_card');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const svgContent = generateMacroCardSvg(cardData);
  const effectiveBudget = (cardData.targetCalories || 2000) + (cardData.burnedCalories || 0);
  const remainingCals = Math.max(0, effectiveBudget - (cardData.eatenCalories || 0));
  const calPct = Math.min(100, Math.round(((cardData.eatenCalories || 0) / effectiveBudget) * 100));
  const protPct = Math.min(100, Math.round(((cardData.proteinGrams || 0) / (cardData.targetProtein || 120)) * 100));

  const handleSendNotification = async () => {
    await pushPhotoNotification(cardData);
    await updateLiveTrackerNotification(cardData);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-linear-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-emerald-500/10 space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Live Notification Bubble &amp; Photo Card
              </h2>
              <p className="text-xs text-slate-400">
                Visual concentric macro rings &amp; eaten nutrition breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800/60 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('photo_card')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'photo_card'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Notification Shade Preview (Photo Card)
          </button>
          <button
            onClick={() => setActiveTab('before_after')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'before_after'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Before vs After Comparison
          </button>
        </div>

        {activeTab === 'photo_card' ? (
          <div className="space-y-4">
            {/* Mobile Notification Shade Simulator */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 sm:p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                <span className="flex items-center gap-1 text-slate-300 font-semibold">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> ANDROID NOTIFICATION SHADE
                </span>
                <span>NOW · PINNED LIVE TRACKER</span>
              </div>

              {/* Notification Header Row */}
              <div className="flex items-center justify-between bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-[10px]">
                    ⚡
                  </div>
                  <span className="text-xs font-bold text-slate-200">NutriPulse</span>
                  <span className="text-[10px] text-slate-500">· Live Tracker</span>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  {remainingCals} kcal left
                </span>
              </div>

              {/* THE PHOTO CARD (SVG Render) */}
              <div
                className="w-full rounded-2xl overflow-hidden shadow-xl border border-slate-700/60 transition-transform"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />

              {/* Notification Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-sans">
                <div className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-center text-xs font-medium text-slate-300">
                  🍽️ Log Meal
                </div>
                <div className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-center text-xs font-medium text-slate-300">
                  💧 +250ml
                </div>
                <div className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-center text-xs font-medium text-cyan-300">
                  📊 AI Report
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">4 Macro Rings</span>
                <p className="text-slate-300 text-[11px] leading-snug">Concentric rings for Calories, Protein, Carbs &amp; Fats.</p>
              </div>
              <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Nutrition Eaten</span>
                <p className="text-slate-300 text-[11px] leading-snug">Photo-style panel displays your recent logged meals.</p>
              </div>
              <div className="col-span-2 sm:col-span-1 p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400">Zero Emoji Clutter</span>
                <p className="text-slate-300 text-[11px] leading-snug">Replaces walls of text with a high-definition photo card.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Before vs After Tab */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* OLD / BEFORE */}
              <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                    ❌ Old Cluttered Bubble
                  </span>
                  <span className="text-[10px] text-slate-500">Text &amp; Emoji Spam</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 leading-relaxed">
                  <p className="font-bold text-amber-400">⚡ NutriPulse • 580 kcal Remaining</p>
                  <p className="text-slate-400 text-[10px]">🟢 Cals: 71% (1420 kcal)  🔵 Protein: 82% (115g)</p>
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                    <p>◎ CALORIE RING: 1420 / 2000 kcal</p>
                    <p>🟢🟢🟢🟢🟢⚫⚫⚫ 71%</p>
                    <p>◎ PROTEIN RING: 115g / 140g</p>
                    <p>🔵🔵🔵🔵🔵🔵⚫⚫ 82%</p>
                    <p>🔥 Burned: -240 kcal  •  💧 Water: 1200ml</p>
                  </div>
                </div>
                <p className="text-[11px] text-rose-300/80">
                  Stretched emoji dots that wrap awkwardly on phone screens.
                </p>
              </div>

              {/* NEW / AFTER */}
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    ✅ New Photo Card
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Clean Visual Card</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <div
                    className="w-full rounded-xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  Concentric rings, actual food items eaten, and high-res layout!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {sentSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Live notification sent to device shade!
              </span>
            ) : (
              <span>Updates automatically as meals &amp; water are logged.</span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSendNotification}
              className="flex-1 sm:flex-none px-4 py-2 bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Test Live Notification
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl cursor-pointer transition-all"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
