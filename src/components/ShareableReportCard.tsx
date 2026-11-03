// src/components/ShareableReportCard.tsx
import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Sparkles, Download, Share2, Award, Zap } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ShareableReportCardProps {
  title: string;
  headline: string;
  score: number;
  avgCalories: number;
  avgProtein: number;
  summary: string;
  onClose: () => void;
}

export const ShareableReportCard: React.FC<ShareableReportCardProps> = ({
  title,
  headline,
  score,
  avgCalories,
  avgProtein,
  summary,
  onClose,
}) => {
  const { t } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 0.95 });
        const link = document.createElement('a');
        link.download = `nutripulse-report-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to generate image', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 space-y-6">
        
        {/* The Visual Card Container (This exact element gets exported as a photo) */}
        <div 
          ref={cardRef} 
          className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl overflow-hidden flex flex-col justify-between space-y-6"
        >
          {/* Ambient Glow Effects */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-emerald-400">
                NutriPulse AI
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
              {title}
            </span>
          </div>

          {/* Main Score Section */}
          <div className="flex items-center gap-5 z-10 py-2">
            <div className="shrink-0 w-24 h-24 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 flex flex-col items-center justify-center shadow-lg relative">
              <span className="text-4xl font-extrabold font-mono text-emerald-400">
                {score}
              </span>
              <span className="text-[9px] text-emerald-500 uppercase tracking-widest font-bold">
                Score
              </span>
            </div>
            <div className="space-y-1.5 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Weekly Verdict
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug truncate">
                {headline}
              </h3>
            </div>
          </div>

          {/* Summary Quote */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 z-10">
            &ldquo;{summary}&rdquo;
          </p>

          {/* Averages Footer Grid */}
          <div className="grid grid-cols-2 gap-3 z-10">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Avg Calories</span>
              <span className="text-base font-bold font-mono text-slate-200">{avgCalories} <span className="text-xs font-normal text-slate-500">kcal</span></span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Avg Protein</span>
              <span className="text-base font-bold font-mono text-cyan-400">{avgProtein}<span className="text-xs font-normal text-slate-500">g</span></span>
            </div>
          </div>

          {/* Watermark Branding */}
          <div className="text-center pt-1 z-10">
            <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
              Tracked with NutriPulse 🚀
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDownloadImage}
            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Photo Card
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};