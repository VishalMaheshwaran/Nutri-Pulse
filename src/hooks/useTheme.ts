// src/hooks/useTheme.ts
import { useState, useEffect } from 'react';

export const THEMES = {
  default: {
    cardBg: 'bg-slate-900', cardBorder: 'border-slate-800', shadow: 'shadow-xl',
    innerBg: 'bg-slate-950', innerBorder: 'border-slate-800',
    textPrimary: 'text-slate-100', textSecondary: 'text-slate-400', textTertiary: 'text-slate-500',
    activeBtnBg: 'bg-emerald-500', activeBtnText: 'text-slate-950', inactiveBtnText: 'text-slate-400 hover:text-slate-200',
    heatmapEmpty: 'bg-slate-850', heatmapLogged: 'bg-slate-700',
    heatmapCellHover: 'hover:bg-slate-800 hover:border-slate-700', heatmapCellActive: 'bg-slate-800 border-emerald-400 ring-emerald-400/50',
    btnHover: 'hover:bg-slate-800', progressBg: 'bg-slate-950',
    accentCyan: 'text-cyan-400', accentEmerald: 'text-emerald-400', accentAmber: 'text-amber-400',
    accentIndigo: 'text-indigo-400', accentOrange: 'text-orange-400', accentRose: 'text-rose-400',
    bgCyan: 'bg-cyan-400', bgEmerald: 'bg-emerald-400', bgAmber: 'bg-amber-400', bgIndigo: 'bg-indigo-400', bgRose: 'bg-rose-400',
    gradientProtein: 'bg-gradient-to-r from-cyan-500 to-emerald-400',
    globalBg: 'theme-default',
  },
  white: {
    cardBg: 'bg-white', cardBorder: 'border-slate-200', shadow: 'shadow-sm shadow-slate-200/50',
    innerBg: 'bg-slate-100', innerBorder: 'border-slate-200', 
    textPrimary: 'text-slate-900', textSecondary: 'text-slate-500', textTertiary: 'text-slate-400',
    activeBtnBg: 'bg-emerald-500', activeBtnText: 'text-white', inactiveBtnText: 'text-slate-500 hover:text-slate-700',
    heatmapEmpty: 'bg-slate-100', heatmapLogged: 'bg-slate-300',
    heatmapCellHover: 'hover:bg-slate-50 hover:border-slate-300', heatmapCellActive: 'bg-slate-50 border-emerald-500 ring-emerald-500/30',
    btnHover: 'hover:bg-slate-200', progressBg: 'bg-slate-100', 
    accentCyan: 'text-cyan-600', accentEmerald: 'text-emerald-600', accentAmber: 'text-amber-500',
    accentIndigo: 'text-indigo-600', accentOrange: 'text-orange-500', accentRose: 'text-rose-500',
    bgCyan: 'bg-cyan-500', bgEmerald: 'bg-emerald-500', bgAmber: 'bg-amber-400', bgIndigo: 'bg-indigo-500', bgRose: 'bg-rose-500',
    gradientProtein: 'bg-gradient-to-r from-cyan-500 to-emerald-500',
    globalBg: 'theme-white',
  },
  baby_pink: {
    cardBg: 'bg-white', cardBorder: 'border-pink-200', shadow: 'shadow-md shadow-pink-200/40',
    innerBg: 'bg-pink-50', innerBorder: 'border-pink-100', 
    textPrimary: 'text-pink-950', textSecondary: 'text-pink-600', textTertiary: 'text-pink-400',
    activeBtnBg: 'bg-pink-500', activeBtnText: 'text-white', inactiveBtnText: 'text-pink-500 hover:text-pink-700',
    heatmapEmpty: 'bg-pink-100/60', heatmapLogged: 'bg-pink-300',
    heatmapCellHover: 'hover:bg-pink-100 hover:border-pink-300', heatmapCellActive: 'bg-white border-pink-500 ring-pink-500/30',
    btnHover: 'hover:bg-pink-100', progressBg: 'bg-pink-100', 
    accentCyan: 'text-pink-600', accentEmerald: 'text-emerald-500', accentAmber: 'text-orange-500',
    accentIndigo: 'text-fuchsia-600', accentOrange: 'text-orange-500', accentRose: 'text-rose-600',
    bgCyan: 'bg-pink-400', bgEmerald: 'bg-emerald-400', bgAmber: 'bg-orange-400', bgIndigo: 'bg-fuchsia-400', bgRose: 'bg-rose-400',
    gradientProtein: 'bg-gradient-to-r from-pink-400 to-rose-400',
    globalBg: 'theme-baby_pink',
  }
};

export type ThemeName = keyof typeof THEMES;

const GLOBAL_CSS = `
  :root {
    --theme-950: #020617; --theme-900: #0f172a; --theme-850: #162032; --theme-800: #1e293b;
    --theme-700: #334155; --theme-600: #475569; --theme-500: #64748b;
    --theme-400: #94a3b8; --theme-300: #cbd5e1; --theme-200: #e2e8f0; --theme-100: #f1f5f9; --theme-50: #f8fafc;
    --theme-em-400: #34d399; --theme-em-500: #10b981; 
  }
  body.theme-white {
    --theme-950: #f8fafc; --theme-900: #ffffff; --theme-850: #f1f5f9; --theme-800: #e2e8f0;
    --theme-700: #cbd5e1; --theme-600: #94a3b8; --theme-500: #64748b;
    --theme-400: #475569; --theme-300: #334155; --theme-200: #1e293b; --theme-100: #0f172a; --theme-50: #020617;
    --theme-em-400: #10b981; --theme-em-500: #059669; 
  }
  body.theme-baby_pink {
    --theme-950: #fff1f2; --theme-900: #ffffff; --theme-850: #fce7f3; --theme-800: #fbcfe8; 
    --theme-700: #f9a8d4; --theme-600: #f472b6; --theme-500: #ec4899;
    --theme-400: #db2777; --theme-300: #be185d; --theme-200: #9d174d; --theme-100: #831843; --theme-50: #500724;
    --theme-em-400: #34d399; --theme-em-500: #10b981; 
  }

  body { background-color: var(--theme-950) !important; transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease; }

  /* TARGETED BLINK / FLASH ANIMATION FOR KEY BADGES & REPORTS */
  @keyframes badge-blink {
    0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 2px currentColor); }
    50% { opacity: 0.35; transform: scale(0.9); filter: drop-shadow(0 0 0px transparent); }
  }
  .animate-badge-blink {
    animation: badge-blink 1.8s ease-in-out infinite !important;
  }

  /* Backgrounds */
  .bg-slate-950 { background-color: var(--theme-950) !important; }
  .hover\\:bg-slate-950:hover { background-color: var(--theme-950) !important; }
  .bg-slate-950\\/10 { background-color: color-mix(in srgb, var(--theme-950) 10%, transparent) !important; }
  .bg-slate-950\\/20 { background-color: color-mix(in srgb, var(--theme-950) 20%, transparent) !important; }
  .bg-slate-950\\/30 { background-color: color-mix(in srgb, var(--theme-950) 30%, transparent) !important; }
  .bg-slate-950\\/40 { background-color: color-mix(in srgb, var(--theme-950) 40%, transparent) !important; }
  .bg-slate-950\\/50 { background-color: color-mix(in srgb, var(--theme-950) 50%, transparent) !important; }
  .bg-slate-950\\/60 { background-color: color-mix(in srgb, var(--theme-950) 60%, transparent) !important; }
  .bg-slate-950\\/70 { background-color: color-mix(in srgb, var(--theme-950) 70%, transparent) !important; }
  .bg-slate-950\\/80 { background-color: color-mix(in srgb, var(--theme-950) 80%, transparent) !important; }
  .bg-slate-950\\/90 { background-color: color-mix(in srgb, var(--theme-950) 90%, transparent) !important; }
  .bg-slate-900 { background-color: var(--theme-900) !important; }
  .hover\\:bg-slate-900:hover { background-color: var(--theme-900) !important; }
  .bg-slate-900\\/10 { background-color: color-mix(in srgb, var(--theme-900) 10%, transparent) !important; }
  .bg-slate-900\\/20 { background-color: color-mix(in srgb, var(--theme-900) 20%, transparent) !important; }
  .bg-slate-900\\/30 { background-color: color-mix(in srgb, var(--theme-900) 30%, transparent) !important; }
  .bg-slate-900\\/40 { background-color: color-mix(in srgb, var(--theme-900) 40%, transparent) !important; }
  .bg-slate-900\\/50 { background-color: color-mix(in srgb, var(--theme-900) 50%, transparent) !important; }
  .bg-slate-900\\/60 { background-color: color-mix(in srgb, var(--theme-900) 60%, transparent) !important; }
  .bg-slate-900\\/70 { background-color: color-mix(in srgb, var(--theme-900) 70%, transparent) !important; }
  .bg-slate-900\\/80 { background-color: color-mix(in srgb, var(--theme-900) 80%, transparent) !important; }
  .bg-slate-900\\/90 { background-color: color-mix(in srgb, var(--theme-900) 90%, transparent) !important; }
  .bg-slate-850 { background-color: var(--theme-850) !important; }
  .hover\\:bg-slate-850:hover { background-color: var(--theme-850) !important; }
  .bg-slate-850\\/10 { background-color: color-mix(in srgb, var(--theme-850) 10%, transparent) !important; }
  .bg-slate-850\\/20 { background-color: color-mix(in srgb, var(--theme-850) 20%, transparent) !important; }
  .bg-slate-850\\/30 { background-color: color-mix(in srgb, var(--theme-850) 30%, transparent) !important; }
  .bg-slate-850\\/40 { background-color: color-mix(in srgb, var(--theme-850) 40%, transparent) !important; }
  .bg-slate-850\\/50 { background-color: color-mix(in srgb, var(--theme-850) 50%, transparent) !important; }
  .bg-slate-850\\/60 { background-color: color-mix(in srgb, var(--theme-850) 60%, transparent) !important; }
  .bg-slate-850\\/70 { background-color: color-mix(in srgb, var(--theme-850) 70%, transparent) !important; }
  .bg-slate-850\\/80 { background-color: color-mix(in srgb, var(--theme-850) 80%, transparent) !important; }
  .bg-slate-850\\/90 { background-color: color-mix(in srgb, var(--theme-850) 90%, transparent) !important; }
  .bg-slate-800 { background-color: var(--theme-800) !important; }
  .hover\\:bg-slate-800:hover { background-color: var(--theme-800) !important; }
  .bg-slate-800\\/10 { background-color: color-mix(in srgb, var(--theme-800) 10%, transparent) !important; }
  .bg-slate-800\\/20 { background-color: color-mix(in srgb, var(--theme-800) 20%, transparent) !important; }
  .bg-slate-800\\/30 { background-color: color-mix(in srgb, var(--theme-800) 30%, transparent) !important; }
  .bg-slate-800\\/40 { background-color: color-mix(in srgb, var(--theme-800) 40%, transparent) !important; }
  .bg-slate-800\\/50 { background-color: color-mix(in srgb, var(--theme-800) 50%, transparent) !important; }
  .bg-slate-800\\/60 { background-color: color-mix(in srgb, var(--theme-800) 60%, transparent) !important; }
  .bg-slate-800\\/70 { background-color: color-mix(in srgb, var(--theme-800) 70%, transparent) !important; }
  .bg-slate-800\\/80 { background-color: color-mix(in srgb, var(--theme-800) 80%, transparent) !important; }
  .bg-slate-800\\/90 { background-color: color-mix(in srgb, var(--theme-800) 90%, transparent) !important; }
  .bg-slate-700 { background-color: var(--theme-700) !important; }
  .hover\\:bg-slate-700:hover { background-color: var(--theme-700) !important; }
  .bg-slate-700\\/10 { background-color: color-mix(in srgb, var(--theme-700) 10%, transparent) !important; }
  .bg-slate-700\\/20 { background-color: color-mix(in srgb, var(--theme-700) 20%, transparent) !important; }
  .bg-slate-700\\/30 { background-color: color-mix(in srgb, var(--theme-700) 30%, transparent) !important; }
  .bg-slate-700\\/40 { background-color: color-mix(in srgb, var(--theme-700) 40%, transparent) !important; }
  .bg-slate-700\\/50 { background-color: color-mix(in srgb, var(--theme-700) 50%, transparent) !important; }
  .bg-slate-700\\/60 { background-color: color-mix(in srgb, var(--theme-700) 60%, transparent) !important; }
  .bg-slate-700\\/70 { background-color: color-mix(in srgb, var(--theme-700) 70%, transparent) !important; }
  .bg-slate-700\\/80 { background-color: color-mix(in srgb, var(--theme-700) 80%, transparent) !important; }
  .bg-slate-700\\/90 { background-color: color-mix(in srgb, var(--theme-700) 90%, transparent) !important; }
  .bg-slate-600 { background-color: var(--theme-600) !important; }
  .hover\\:bg-slate-600:hover { background-color: var(--theme-600) !important; }
  .bg-slate-600\\/10 { background-color: color-mix(in srgb, var(--theme-600) 10%, transparent) !important; }
  .bg-slate-600\\/20 { background-color: color-mix(in srgb, var(--theme-600) 20%, transparent) !important; }
  .bg-slate-600\\/30 { background-color: color-mix(in srgb, var(--theme-600) 30%, transparent) !important; }
  .bg-slate-600\\/40 { background-color: color-mix(in srgb, var(--theme-600) 40%, transparent) !important; }
  .bg-slate-600\\/50 { background-color: color-mix(in srgb, var(--theme-600) 50%, transparent) !important; }
  .bg-slate-600\\/60 { background-color: color-mix(in srgb, var(--theme-600) 60%, transparent) !important; }
  .bg-slate-600\\/70 { background-color: color-mix(in srgb, var(--theme-600) 70%, transparent) !important; }
  .bg-slate-600\\/80 { background-color: color-mix(in srgb, var(--theme-600) 80%, transparent) !important; }
  .bg-slate-600\\/90 { background-color: color-mix(in srgb, var(--theme-600) 90%, transparent) !important; }
  .bg-slate-500 { background-color: var(--theme-500) !important; }
  .hover\\:bg-slate-500:hover { background-color: var(--theme-500) !important; }
  .bg-slate-500\\/10 { background-color: color-mix(in srgb, var(--theme-500) 10%, transparent) !important; }
  .bg-slate-500\\/20 { background-color: color-mix(in srgb, var(--theme-500) 20%, transparent) !important; }
  .bg-slate-500\\/30 { background-color: color-mix(in srgb, var(--theme-500) 30%, transparent) !important; }
  .bg-slate-500\\/40 { background-color: color-mix(in srgb, var(--theme-500) 40%, transparent) !important; }
  .bg-slate-500\\/50 { background-color: color-mix(in srgb, var(--theme-500) 50%, transparent) !important; }
  .bg-slate-500\\/60 { background-color: color-mix(in srgb, var(--theme-500) 60%, transparent) !important; }
  .bg-slate-500\\/70 { background-color: color-mix(in srgb, var(--theme-500) 70%, transparent) !important; }
  .bg-slate-500\\/80 { background-color: color-mix(in srgb, var(--theme-500) 80%, transparent) !important; }
  .bg-slate-500\\/90 { background-color: color-mix(in srgb, var(--theme-500) 90%, transparent) !important; }
  .bg-slate-400 { background-color: var(--theme-400) !important; }
  .hover\\:bg-slate-400:hover { background-color: var(--theme-400) !important; }
  .bg-slate-400\\/10 { background-color: color-mix(in srgb, var(--theme-400) 10%, transparent) !important; }
  .bg-slate-400\\/20 { background-color: color-mix(in srgb, var(--theme-400) 20%, transparent) !important; }
  .bg-slate-400\\/30 { background-color: color-mix(in srgb, var(--theme-400) 30%, transparent) !important; }
  .bg-slate-400\\/40 { background-color: color-mix(in srgb, var(--theme-400) 40%, transparent) !important; }
  .bg-slate-400\\/50 { background-color: color-mix(in srgb, var(--theme-400) 50%, transparent) !important; }
  .bg-slate-400\\/60 { background-color: color-mix(in srgb, var(--theme-400) 60%, transparent) !important; }
  .bg-slate-400\\/70 { background-color: color-mix(in srgb, var(--theme-400) 70%, transparent) !important; }
  .bg-slate-400\\/80 { background-color: color-mix(in srgb, var(--theme-400) 80%, transparent) !important; }
  .bg-slate-400\\/90 { background-color: color-mix(in srgb, var(--theme-400) 90%, transparent) !important; }
  .bg-slate-300 { background-color: var(--theme-300) !important; }
  .hover\\:bg-slate-300:hover { background-color: var(--theme-300) !important; }
  .bg-slate-300\\/10 { background-color: color-mix(in srgb, var(--theme-300) 10%, transparent) !important; }
  .bg-slate-300\\/20 { background-color: color-mix(in srgb, var(--theme-300) 20%, transparent) !important; }
  .bg-slate-300\\/30 { background-color: color-mix(in srgb, var(--theme-300) 30%, transparent) !important; }
  .bg-slate-300\\/40 { background-color: color-mix(in srgb, var(--theme-300) 40%, transparent) !important; }
  .bg-slate-300\\/50 { background-color: color-mix(in srgb, var(--theme-300) 50%, transparent) !important; }
  .bg-slate-300\\/60 { background-color: color-mix(in srgb, var(--theme-300) 60%, transparent) !important; }
  .bg-slate-300\\/70 { background-color: color-mix(in srgb, var(--theme-300) 70%, transparent) !important; }
  .bg-slate-300\\/80 { background-color: color-mix(in srgb, var(--theme-300) 80%, transparent) !important; }
  .bg-slate-300\\/90 { background-color: color-mix(in srgb, var(--theme-300) 90%, transparent) !important; }
  .bg-slate-200 { background-color: var(--theme-200) !important; }
  .hover\\:bg-slate-200:hover { background-color: var(--theme-200) !important; }
  .bg-slate-200\\/10 { background-color: color-mix(in srgb, var(--theme-200) 10%, transparent) !important; }
  .bg-slate-200\\/20 { background-color: color-mix(in srgb, var(--theme-200) 20%, transparent) !important; }
  .bg-slate-200\\/30 { background-color: color-mix(in srgb, var(--theme-200) 30%, transparent) !important; }
  .bg-slate-200\\/40 { background-color: color-mix(in srgb, var(--theme-200) 40%, transparent) !important; }
  .bg-slate-200\\/50 { background-color: color-mix(in srgb, var(--theme-200) 50%, transparent) !important; }
  .bg-slate-200\\/60 { background-color: color-mix(in srgb, var(--theme-200) 60%, transparent) !important; }
  .bg-slate-200\\/70 { background-color: color-mix(in srgb, var(--theme-200) 70%, transparent) !important; }
  .bg-slate-200\\/80 { background-color: color-mix(in srgb, var(--theme-200) 80%, transparent) !important; }
  .bg-slate-200\\/90 { background-color: color-mix(in srgb, var(--theme-200) 90%, transparent) !important; }
  .bg-slate-100 { background-color: var(--theme-100) !important; }
  .hover\\:bg-slate-100:hover { background-color: var(--theme-100) !important; }
  .bg-slate-100\\/10 { background-color: color-mix(in srgb, var(--theme-100) 10%, transparent) !important; }
  .bg-slate-100\\/20 { background-color: color-mix(in srgb, var(--theme-100) 20%, transparent) !important; }
  .bg-slate-100\\/30 { background-color: color-mix(in srgb, var(--theme-100) 30%, transparent) !important; }
  .bg-slate-100\\/40 { background-color: color-mix(in srgb, var(--theme-100) 40%, transparent) !important; }
  .bg-slate-100\\/50 { background-color: color-mix(in srgb, var(--theme-100) 50%, transparent) !important; }
  .bg-slate-100\\/60 { background-color: color-mix(in srgb, var(--theme-100) 60%, transparent) !important; }
  .bg-slate-100\\/70 { background-color: color-mix(in srgb, var(--theme-100) 70%, transparent) !important; }
  .bg-slate-100\\/80 { background-color: color-mix(in srgb, var(--theme-100) 80%, transparent) !important; }
  .bg-slate-100\\/90 { background-color: color-mix(in srgb, var(--theme-100) 90%, transparent) !important; }
  .bg-slate-50 { background-color: var(--theme-50) !important; }
  .hover\\:bg-slate-50:hover { background-color: var(--theme-50) !important; }
  .bg-slate-50\\/10 { background-color: color-mix(in srgb, var(--theme-50) 10%, transparent) !important; }
  .bg-slate-50\\/20 { background-color: color-mix(in srgb, var(--theme-50) 20%, transparent) !important; }
  .bg-slate-50\\/30 { background-color: color-mix(in srgb, var(--theme-50) 30%, transparent) !important; }
  .bg-slate-50\\/40 { background-color: color-mix(in srgb, var(--theme-50) 40%, transparent) !important; }
  .bg-slate-50\\/50 { background-color: color-mix(in srgb, var(--theme-50) 50%, transparent) !important; }
  .bg-slate-50\\/60 { background-color: color-mix(in srgb, var(--theme-50) 60%, transparent) !important; }
  .bg-slate-50\\/70 { background-color: color-mix(in srgb, var(--theme-50) 70%, transparent) !important; }
  .bg-slate-50\\/80 { background-color: color-mix(in srgb, var(--theme-50) 80%, transparent) !important; }
  .bg-slate-50\\/90 { background-color: color-mix(in srgb, var(--theme-50) 90%, transparent) !important; }

  /* Borders & Divides */
  .border-slate-950 { border-color: var(--theme-950) !important; }
  .divide-slate-950 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-950) !important; }
  .hover\\:border-slate-950:hover { border-color: var(--theme-950) !important; }
  .border-slate-950\\/10 { border-color: color-mix(in srgb, var(--theme-950) 10%, transparent) !important; }
  .border-slate-950\\/20 { border-color: color-mix(in srgb, var(--theme-950) 20%, transparent) !important; }
  .border-slate-950\\/30 { border-color: color-mix(in srgb, var(--theme-950) 30%, transparent) !important; }
  .border-slate-950\\/40 { border-color: color-mix(in srgb, var(--theme-950) 40%, transparent) !important; }
  .border-slate-950\\/50 { border-color: color-mix(in srgb, var(--theme-950) 50%, transparent) !important; }
  .border-slate-950\\/60 { border-color: color-mix(in srgb, var(--theme-950) 60%, transparent) !important; }
  .border-slate-950\\/70 { border-color: color-mix(in srgb, var(--theme-950) 70%, transparent) !important; }
  .border-slate-950\\/80 { border-color: color-mix(in srgb, var(--theme-950) 80%, transparent) !important; }
  .border-slate-950\\/90 { border-color: color-mix(in srgb, var(--theme-950) 90%, transparent) !important; }
  .border-slate-900 { border-color: var(--theme-900) !important; }
  .divide-slate-900 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-900) !important; }
  .hover\\:border-slate-900:hover { border-color: var(--theme-900) !important; }
  .border-slate-900\\/10 { border-color: color-mix(in srgb, var(--theme-900) 10%, transparent) !important; }
  .border-slate-900\\/20 { border-color: color-mix(in srgb, var(--theme-900) 20%, transparent) !important; }
  .border-slate-900\\/30 { border-color: color-mix(in srgb, var(--theme-900) 30%, transparent) !important; }
  .border-slate-900\\/40 { border-color: color-mix(in srgb, var(--theme-900) 40%, transparent) !important; }
  .border-slate-900\\/50 { border-color: color-mix(in srgb, var(--theme-900) 50%, transparent) !important; }
  .border-slate-900\\/60 { border-color: color-mix(in srgb, var(--theme-900) 60%, transparent) !important; }
  .border-slate-900\\/70 { border-color: color-mix(in srgb, var(--theme-900) 70%, transparent) !important; }
  .border-slate-900\\/80 { border-color: color-mix(in srgb, var(--theme-900) 80%, transparent) !important; }
  .border-slate-900\\/90 { border-color: color-mix(in srgb, var(--theme-900) 90%, transparent) !important; }
  .border-slate-850 { border-color: var(--theme-850) !important; }
  .divide-slate-850 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-850) !important; }
  .hover\\:border-slate-850:hover { border-color: var(--theme-850) !important; }
  .border-slate-850\\/10 { border-color: color-mix(in srgb, var(--theme-850) 10%, transparent) !important; }
  .border-slate-850\\/20 { border-color: color-mix(in srgb, var(--theme-850) 20%, transparent) !important; }
  .border-slate-850\\/30 { border-color: color-mix(in srgb, var(--theme-850) 30%, transparent) !important; }
  .border-slate-850\\/40 { border-color: color-mix(in srgb, var(--theme-850) 40%, transparent) !important; }
  .border-slate-850\\/50 { border-color: color-mix(in srgb, var(--theme-850) 50%, transparent) !important; }
  .border-slate-850\\/60 { border-color: color-mix(in srgb, var(--theme-850) 60%, transparent) !important; }
  .border-slate-850\\/70 { border-color: color-mix(in srgb, var(--theme-850) 70%, transparent) !important; }
  .border-slate-850\\/80 { border-color: color-mix(in srgb, var(--theme-850) 80%, transparent) !important; }
  .border-slate-850\\/90 { border-color: color-mix(in srgb, var(--theme-850) 90%, transparent) !important; }
  .border-slate-800 { border-color: var(--theme-800) !important; }
  .divide-slate-800 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-800) !important; }
  .hover\\:border-slate-800:hover { border-color: var(--theme-800) !important; }
  .border-slate-800\\/10 { border-color: color-mix(in srgb, var(--theme-800) 10%, transparent) !important; }
  .border-slate-800\\/20 { border-color: color-mix(in srgb, var(--theme-800) 20%, transparent) !important; }
  .border-slate-800\\/30 { border-color: color-mix(in srgb, var(--theme-800) 30%, transparent) !important; }
  .border-slate-800\\/40 { border-color: color-mix(in srgb, var(--theme-800) 40%, transparent) !important; }
  .border-slate-800\\/50 { border-color: color-mix(in srgb, var(--theme-800) 50%, transparent) !important; }
  .border-slate-800\\/60 { border-color: color-mix(in srgb, var(--theme-800) 60%, transparent) !important; }
  .border-slate-800\\/70 { border-color: color-mix(in srgb, var(--theme-800) 70%, transparent) !important; }
  .border-slate-800\\/80 { border-color: color-mix(in srgb, var(--theme-800) 80%, transparent) !important; }
  .border-slate-800\\/90 { border-color: color-mix(in srgb, var(--theme-800) 90%, transparent) !important; }
  .border-slate-700 { border-color: var(--theme-700) !important; }
  .divide-slate-700 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-700) !important; }
  .hover\\:border-slate-700:hover { border-color: var(--theme-700) !important; }
  .border-slate-700\\/10 { border-color: color-mix(in srgb, var(--theme-700) 10%, transparent) !important; }
  .border-slate-700\\/20 { border-color: color-mix(in srgb, var(--theme-700) 20%, transparent) !important; }
  .border-slate-700\\/30 { border-color: color-mix(in srgb, var(--theme-700) 30%, transparent) !important; }
  .border-slate-700\\/40 { border-color: color-mix(in srgb, var(--theme-700) 40%, transparent) !important; }
  .border-slate-700\\/50 { border-color: color-mix(in srgb, var(--theme-700) 50%, transparent) !important; }
  .border-slate-700\\/60 { border-color: color-mix(in srgb, var(--theme-700) 60%, transparent) !important; }
  .border-slate-700\\/70 { border-color: color-mix(in srgb, var(--theme-700) 70%, transparent) !important; }
  .border-slate-700\\/80 { border-color: color-mix(in srgb, var(--theme-700) 80%, transparent) !important; }
  .border-slate-700\\/90 { border-color: color-mix(in srgb, var(--theme-700) 90%, transparent) !important; }
  .border-slate-600 { border-color: var(--theme-600) !important; }
  .divide-slate-600 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-600) !important; }
  .hover\\:border-slate-600:hover { border-color: var(--theme-600) !important; }
  .border-slate-600\\/10 { border-color: color-mix(in srgb, var(--theme-600) 10%, transparent) !important; }
  .border-slate-600\\/20 { border-color: color-mix(in srgb, var(--theme-600) 20%, transparent) !important; }
  .border-slate-600\\/30 { border-color: color-mix(in srgb, var(--theme-600) 30%, transparent) !important; }
  .border-slate-600\\/40 { border-color: color-mix(in srgb, var(--theme-600) 40%, transparent) !important; }
  .border-slate-600\\/50 { border-color: color-mix(in srgb, var(--theme-600) 50%, transparent) !important; }
  .border-slate-600\\/60 { border-color: color-mix(in srgb, var(--theme-600) 60%, transparent) !important; }
  .border-slate-600\\/70 { border-color: color-mix(in srgb, var(--theme-600) 70%, transparent) !important; }
  .border-slate-600\\/80 { border-color: color-mix(in srgb, var(--theme-600) 80%, transparent) !important; }
  .border-slate-600\\/90 { border-color: color-mix(in srgb, var(--theme-600) 90%, transparent) !important; }
  .border-slate-500 { border-color: var(--theme-500) !important; }
  .divide-slate-500 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-500) !important; }
  .hover\\:border-slate-500:hover { border-color: var(--theme-500) !important; }
  .border-slate-500\\/10 { border-color: color-mix(in srgb, var(--theme-500) 10%, transparent) !important; }
  .border-slate-500\\/20 { border-color: color-mix(in srgb, var(--theme-500) 20%, transparent) !important; }
  .border-slate-500\\/30 { border-color: color-mix(in srgb, var(--theme-500) 30%, transparent) !important; }
  .border-slate-500\\/40 { border-color: color-mix(in srgb, var(--theme-500) 40%, transparent) !important; }
  .border-slate-500\\/50 { border-color: color-mix(in srgb, var(--theme-500) 50%, transparent) !important; }
  .border-slate-500\\/60 { border-color: color-mix(in srgb, var(--theme-500) 60%, transparent) !important; }
  .border-slate-500\\/70 { border-color: color-mix(in srgb, var(--theme-500) 70%, transparent) !important; }
  .border-slate-500\\/80 { border-color: color-mix(in srgb, var(--theme-500) 80%, transparent) !important; }
  .border-slate-500\\/90 { border-color: color-mix(in srgb, var(--theme-500) 90%, transparent) !important; }
  .border-slate-400 { border-color: var(--theme-400) !important; }
  .divide-slate-400 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-400) !important; }
  .hover\\:border-slate-400:hover { border-color: var(--theme-400) !important; }
  .border-slate-400\\/10 { border-color: color-mix(in srgb, var(--theme-400) 10%, transparent) !important; }
  .border-slate-400\\/20 { border-color: color-mix(in srgb, var(--theme-400) 20%, transparent) !important; }
  .border-slate-400\\/30 { border-color: color-mix(in srgb, var(--theme-400) 30%, transparent) !important; }
  .border-slate-400\\/40 { border-color: color-mix(in srgb, var(--theme-400) 40%, transparent) !important; }
  .border-slate-400\\/50 { border-color: color-mix(in srgb, var(--theme-400) 50%, transparent) !important; }
  .border-slate-400\\/60 { border-color: color-mix(in srgb, var(--theme-400) 60%, transparent) !important; }
  .border-slate-400\\/70 { border-color: color-mix(in srgb, var(--theme-400) 70%, transparent) !important; }
  .border-slate-400\\/80 { border-color: color-mix(in srgb, var(--theme-400) 80%, transparent) !important; }
  .border-slate-400\\/90 { border-color: color-mix(in srgb, var(--theme-400) 90%, transparent) !important; }
  .border-slate-300 { border-color: var(--theme-300) !important; }
  .divide-slate-300 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-300) !important; }
  .hover\\:border-slate-300:hover { border-color: var(--theme-300) !important; }
  .border-slate-300\\/10 { border-color: color-mix(in srgb, var(--theme-300) 10%, transparent) !important; }
  .border-slate-300\\/20 { border-color: color-mix(in srgb, var(--theme-300) 20%, transparent) !important; }
  .border-slate-300\\/30 { border-color: color-mix(in srgb, var(--theme-300) 30%, transparent) !important; }
  .border-slate-300\\/40 { border-color: color-mix(in srgb, var(--theme-300) 40%, transparent) !important; }
  .border-slate-300\\/50 { border-color: color-mix(in srgb, var(--theme-300) 50%, transparent) !important; }
  .border-slate-300\\/60 { border-color: color-mix(in srgb, var(--theme-300) 60%, transparent) !important; }
  .border-slate-300\\/70 { border-color: color-mix(in srgb, var(--theme-300) 70%, transparent) !important; }
  .border-slate-300\\/80 { border-color: color-mix(in srgb, var(--theme-300) 80%, transparent) !important; }
  .border-slate-300\\/90 { border-color: color-mix(in srgb, var(--theme-300) 90%, transparent) !important; }
  .border-slate-200 { border-color: var(--theme-200) !important; }
  .divide-slate-200 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-200) !important; }
  .hover\\:border-slate-200:hover { border-color: var(--theme-200) !important; }
  .border-slate-200\\/10 { border-color: color-mix(in srgb, var(--theme-200) 10%, transparent) !important; }
  .border-slate-200\\/20 { border-color: color-mix(in srgb, var(--theme-200) 20%, transparent) !important; }
  .border-slate-200\\/30 { border-color: color-mix(in srgb, var(--theme-200) 30%, transparent) !important; }
  .border-slate-200\\/40 { border-color: color-mix(in srgb, var(--theme-200) 40%, transparent) !important; }
  .border-slate-200\\/50 { border-color: color-mix(in srgb, var(--theme-200) 50%, transparent) !important; }
  .border-slate-200\\/60 { border-color: color-mix(in srgb, var(--theme-200) 60%, transparent) !important; }
  .border-slate-200\\/70 { border-color: color-mix(in srgb, var(--theme-200) 70%, transparent) !important; }
  .border-slate-200\\/80 { border-color: color-mix(in srgb, var(--theme-200) 80%, transparent) !important; }
  .border-slate-200\\/90 { border-color: color-mix(in srgb, var(--theme-200) 90%, transparent) !important; }
  .border-slate-100 { border-color: var(--theme-100) !important; }
  .divide-slate-100 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-100) !important; }
  .hover\\:border-slate-100:hover { border-color: var(--theme-100) !important; }
  .border-slate-100\\/10 { border-color: color-mix(in srgb, var(--theme-100) 10%, transparent) !important; }
  .border-slate-100\\/20 { border-color: color-mix(in srgb, var(--theme-100) 20%, transparent) !important; }
  .border-slate-100\\/30 { border-color: color-mix(in srgb, var(--theme-100) 30%, transparent) !important; }
  .border-slate-100\\/40 { border-color: color-mix(in srgb, var(--theme-100) 40%, transparent) !important; }
  .border-slate-100\\/50 { border-color: color-mix(in srgb, var(--theme-100) 50%, transparent) !important; }
  .border-slate-100\\/60 { border-color: color-mix(in srgb, var(--theme-100) 60%, transparent) !important; }
  .border-slate-100\\/70 { border-color: color-mix(in srgb, var(--theme-100) 70%, transparent) !important; }
  .border-slate-100\\/80 { border-color: color-mix(in srgb, var(--theme-100) 80%, transparent) !important; }
  .border-slate-100\\/90 { border-color: color-mix(in srgb, var(--theme-100) 90%, transparent) !important; }
  .border-slate-50 { border-color: var(--theme-50) !important; }
  .divide-slate-50 > :not([hidden]) ~ :not([hidden]) { border-color: var(--theme-50) !important; }
  .hover\\:border-slate-50:hover { border-color: var(--theme-50) !important; }
  .border-slate-50\\/10 { border-color: color-mix(in srgb, var(--theme-50) 10%, transparent) !important; }
  .border-slate-50\\/20 { border-color: color-mix(in srgb, var(--theme-50) 20%, transparent) !important; }
  .border-slate-50\\/30 { border-color: color-mix(in srgb, var(--theme-50) 30%, transparent) !important; }
  .border-slate-50\\/40 { border-color: color-mix(in srgb, var(--theme-50) 40%, transparent) !important; }
  .border-slate-50\\/50 { border-color: color-mix(in srgb, var(--theme-50) 50%, transparent) !important; }
  .border-slate-50\\/60 { border-color: color-mix(in srgb, var(--theme-50) 60%, transparent) !important; }
  .border-slate-50\\/70 { border-color: color-mix(in srgb, var(--theme-50) 70%, transparent) !important; }
  .border-slate-50\\/80 { border-color: color-mix(in srgb, var(--theme-50) 80%, transparent) !important; }
  .border-slate-50\\/90 { border-color: color-mix(in srgb, var(--theme-50) 90%, transparent) !important; }

  /* Text & Strokes */
  .text-slate-950 { color: var(--theme-950) !important; }
  .stroke-slate-950 { stroke: var(--theme-950) !important; }
  .hover\\:text-slate-950:hover { color: var(--theme-950) !important; }
  .text-slate-950\\/10 { color: color-mix(in srgb, var(--theme-950) 10%, transparent) !important; }
  .stroke-slate-950\\/10 { stroke: color-mix(in srgb, var(--theme-950) 10%, transparent) !important; }
  .text-slate-950\\/20 { color: color-mix(in srgb, var(--theme-950) 20%, transparent) !important; }
  .stroke-slate-950\\/20 { stroke: color-mix(in srgb, var(--theme-950) 20%, transparent) !important; }
  .text-slate-950\\/30 { color: color-mix(in srgb, var(--theme-950) 30%, transparent) !important; }
  .stroke-slate-950\\/30 { stroke: color-mix(in srgb, var(--theme-950) 30%, transparent) !important; }
  .text-slate-950\\/40 { color: color-mix(in srgb, var(--theme-950) 40%, transparent) !important; }
  .stroke-slate-950\\/40 { stroke: color-mix(in srgb, var(--theme-950) 40%, transparent) !important; }
  .text-slate-950\\/50 { color: color-mix(in srgb, var(--theme-950) 50%, transparent) !important; }
  .stroke-slate-950\\/50 { stroke: color-mix(in srgb, var(--theme-950) 50%, transparent) !important; }
  .text-slate-950\\/60 { color: color-mix(in srgb, var(--theme-950) 60%, transparent) !important; }
  .stroke-slate-950\\/60 { stroke: color-mix(in srgb, var(--theme-950) 60%, transparent) !important; }
  .text-slate-950\\/70 { color: color-mix(in srgb, var(--theme-950) 70%, transparent) !important; }
  .stroke-slate-950\\/70 { stroke: color-mix(in srgb, var(--theme-950) 70%, transparent) !important; }
  .text-slate-950\\/80 { color: color-mix(in srgb, var(--theme-950) 80%, transparent) !important; }
  .stroke-slate-950\\/80 { stroke: color-mix(in srgb, var(--theme-950) 80%, transparent) !important; }
  .text-slate-950\\/90 { color: color-mix(in srgb, var(--theme-950) 90%, transparent) !important; }
  .stroke-slate-950\\/90 { stroke: color-mix(in srgb, var(--theme-950) 90%, transparent) !important; }
  .text-slate-900 { color: var(--theme-900) !important; }
  .stroke-slate-900 { stroke: var(--theme-900) !important; }
  .hover\\:text-slate-900:hover { color: var(--theme-900) !important; }
  .text-slate-900\\/10 { color: color-mix(in srgb, var(--theme-900) 10%, transparent) !important; }
  .stroke-slate-900\\/10 { stroke: color-mix(in srgb, var(--theme-900) 10%, transparent) !important; }
  .text-slate-900\\/20 { color: color-mix(in srgb, var(--theme-900) 20%, transparent) !important; }
  .stroke-slate-900\\/20 { stroke: color-mix(in srgb, var(--theme-900) 20%, transparent) !important; }
  .text-slate-900\\/30 { color: color-mix(in srgb, var(--theme-900) 30%, transparent) !important; }
  .stroke-slate-900\\/30 { stroke: color-mix(in srgb, var(--theme-900) 30%, transparent) !important; }
  .text-slate-900\\/40 { color: color-mix(in srgb, var(--theme-900) 40%, transparent) !important; }
  .stroke-slate-900\\/40 { stroke: color-mix(in srgb, var(--theme-900) 40%, transparent) !important; }
  .text-slate-900\\/50 { color: color-mix(in srgb, var(--theme-900) 50%, transparent) !important; }
  .stroke-slate-900\\/50 { stroke: color-mix(in srgb, var(--theme-900) 50%, transparent) !important; }
  .text-slate-900\\/60 { color: color-mix(in srgb, var(--theme-900) 60%, transparent) !important; }
  .stroke-slate-900\\/60 { stroke: color-mix(in srgb, var(--theme-900) 60%, transparent) !important; }
  .text-slate-900\\/70 { color: color-mix(in srgb, var(--theme-900) 70%, transparent) !important; }
  .stroke-slate-900\\/70 { stroke: color-mix(in srgb, var(--theme-900) 70%, transparent) !important; }
  .text-slate-900\\/80 { color: color-mix(in srgb, var(--theme-900) 80%, transparent) !important; }
  .stroke-slate-900\\/80 { stroke: color-mix(in srgb, var(--theme-900) 80%, transparent) !important; }
  .text-slate-900\\/90 { color: color-mix(in srgb, var(--theme-900) 90%, transparent) !important; }
  .stroke-slate-900\\/90 { stroke: color-mix(in srgb, var(--theme-900) 90%, transparent) !important; }
  .text-slate-850 { color: var(--theme-850) !important; }
  .stroke-slate-850 { stroke: var(--theme-850) !important; }
  .hover\\:text-slate-850:hover { color: var(--theme-850) !important; }
  .text-slate-850\\/10 { color: color-mix(in srgb, var(--theme-850) 10%, transparent) !important; }
  .stroke-slate-850\\/10 { stroke: color-mix(in srgb, var(--theme-850) 10%, transparent) !important; }
  .text-slate-850\\/20 { color: color-mix(in srgb, var(--theme-850) 20%, transparent) !important; }
  .stroke-slate-850\\/20 { stroke: color-mix(in srgb, var(--theme-850) 20%, transparent) !important; }
  .text-slate-850\\/30 { color: color-mix(in srgb, var(--theme-850) 30%, transparent) !important; }
  .stroke-slate-850\\/30 { stroke: color-mix(in srgb, var(--theme-850) 30%, transparent) !important; }
  .text-slate-850\\/40 { color: color-mix(in srgb, var(--theme-850) 40%, transparent) !important; }
  .stroke-slate-850\\/40 { stroke: color-mix(in srgb, var(--theme-850) 40%, transparent) !important; }
  .text-slate-850\\/50 { color: color-mix(in srgb, var(--theme-850) 50%, transparent) !important; }
  .stroke-slate-850\\/50 { stroke: color-mix(in srgb, var(--theme-850) 50%, transparent) !important; }
  .text-slate-850\\/60 { color: color-mix(in srgb, var(--theme-850) 60%, transparent) !important; }
  .stroke-slate-850\\/60 { stroke: color-mix(in srgb, var(--theme-850) 60%, transparent) !important; }
  .text-slate-850\\/70 { color: color-mix(in srgb, var(--theme-850) 70%, transparent) !important; }
  .stroke-slate-850\\/70 { stroke: color-mix(in srgb, var(--theme-850) 70%, transparent) !important; }
  .text-slate-850\\/80 { color: color-mix(in srgb, var(--theme-850) 80%, transparent) !important; }
  .stroke-slate-850\\/80 { stroke: color-mix(in srgb, var(--theme-850) 80%, transparent) !important; }
  .text-slate-850\\/90 { color: color-mix(in srgb, var(--theme-850) 90%, transparent) !important; }
  .stroke-slate-850\\/90 { stroke: color-mix(in srgb, var(--theme-850) 90%, transparent) !important; }
  .text-slate-800 { color: var(--theme-800) !important; }
  .stroke-slate-800 { stroke: var(--theme-800) !important; }
  .hover\\:text-slate-800:hover { color: var(--theme-800) !important; }
  .text-slate-800\\/10 { color: color-mix(in srgb, var(--theme-800) 10%, transparent) !important; }
  .stroke-slate-800\\/10 { stroke: color-mix(in srgb, var(--theme-800) 10%, transparent) !important; }
  .text-slate-800\\/20 { color: color-mix(in srgb, var(--theme-800) 20%, transparent) !important; }
  .stroke-slate-800\\/20 { stroke: color-mix(in srgb, var(--theme-800) 20%, transparent) !important; }
  .text-slate-800\\/30 { color: color-mix(in srgb, var(--theme-800) 30%, transparent) !important; }
  .stroke-slate-800\\/30 { stroke: color-mix(in srgb, var(--theme-800) 30%, transparent) !important; }
  .text-slate-800\\/40 { color: color-mix(in srgb, var(--theme-800) 40%, transparent) !important; }
  .stroke-slate-800\\/40 { stroke: color-mix(in srgb, var(--theme-800) 40%, transparent) !important; }
  .text-slate-800\\/50 { color: color-mix(in srgb, var(--theme-800) 50%, transparent) !important; }
  .stroke-slate-800\\/50 { stroke: color-mix(in srgb, var(--theme-800) 50%, transparent) !important; }
  .text-slate-800\\/60 { color: color-mix(in srgb, var(--theme-800) 60%, transparent) !important; }
  .stroke-slate-800\\/60 { stroke: color-mix(in srgb, var(--theme-800) 60%, transparent) !important; }
  .text-slate-800\\/70 { color: color-mix(in srgb, var(--theme-800) 70%, transparent) !important; }
  .stroke-slate-800\\/70 { stroke: color-mix(in srgb, var(--theme-800) 70%, transparent) !important; }
  .text-slate-800\\/80 { color: color-mix(in srgb, var(--theme-800) 80%, transparent) !important; }
  .stroke-slate-800\\/80 { stroke: color-mix(in srgb, var(--theme-800) 80%, transparent) !important; }
  .text-slate-800\\/90 { color: color-mix(in srgb, var(--theme-800) 90%, transparent) !important; }
  .stroke-slate-800\\/90 { stroke: color-mix(in srgb, var(--theme-800) 90%, transparent) !important; }
  .text-slate-700 { color: var(--theme-700) !important; }
  .stroke-slate-700 { stroke: var(--theme-700) !important; }
  .hover\\:text-slate-700:hover { color: var(--theme-700) !important; }
  .text-slate-700\\/10 { color: color-mix(in srgb, var(--theme-700) 10%, transparent) !important; }
  .stroke-slate-700\\/10 { stroke: color-mix(in srgb, var(--theme-700) 10%, transparent) !important; }
  .text-slate-700\\/20 { color: color-mix(in srgb, var(--theme-700) 20%, transparent) !important; }
  .stroke-slate-700\\/20 { stroke: color-mix(in srgb, var(--theme-700) 20%, transparent) !important; }
  .text-slate-700\\/30 { color: color-mix(in srgb, var(--theme-700) 30%, transparent) !important; }
  .stroke-slate-700\\/30 { stroke: color-mix(in srgb, var(--theme-700) 30%, transparent) !important; }
  .text-slate-700\\/40 { color: color-mix(in srgb, var(--theme-700) 40%, transparent) !important; }
  .stroke-slate-700\\/40 { stroke: color-mix(in srgb, var(--theme-700) 40%, transparent) !important; }
  .text-slate-700\\/50 { color: color-mix(in srgb, var(--theme-700) 50%, transparent) !important; }
  .stroke-slate-700\\/50 { stroke: color-mix(in srgb, var(--theme-700) 50%, transparent) !important; }
  .text-slate-700\\/60 { color: color-mix(in srgb, var(--theme-700) 60%, transparent) !important; }
  .stroke-slate-700\\/60 { stroke: color-mix(in srgb, var(--theme-700) 60%, transparent) !important; }
  .text-slate-700\\/70 { color: color-mix(in srgb, var(--theme-700) 70%, transparent) !important; }
  .stroke-slate-700\\/70 { stroke: color-mix(in srgb, var(--theme-700) 70%, transparent) !important; }
  .text-slate-700\\/80 { color: color-mix(in srgb, var(--theme-700) 80%, transparent) !important; }
  .stroke-slate-700\\/80 { stroke: color-mix(in srgb, var(--theme-700) 80%, transparent) !important; }
  .text-slate-700\\/90 { color: color-mix(in srgb, var(--theme-700) 90%, transparent) !important; }
  .stroke-slate-700\\/90 { stroke: color-mix(in srgb, var(--theme-700) 90%, transparent) !important; }
  .text-slate-600 { color: var(--theme-600) !important; }
  .stroke-slate-600 { stroke: var(--theme-600) !important; }
  .hover\\:text-slate-600:hover { color: var(--theme-600) !important; }
  .text-slate-600\\/10 { color: color-mix(in srgb, var(--theme-600) 10%, transparent) !important; }
  .stroke-slate-600\\/10 { stroke: color-mix(in srgb, var(--theme-600) 10%, transparent) !important; }
  .text-slate-600\\/20 { color: color-mix(in srgb, var(--theme-600) 20%, transparent) !important; }
  .stroke-slate-600\\/20 { stroke: color-mix(in srgb, var(--theme-600) 20%, transparent) !important; }
  .text-slate-600\\/30 { color: color-mix(in srgb, var(--theme-600) 30%, transparent) !important; }
  .stroke-slate-600\\/30 { stroke: color-mix(in srgb, var(--theme-600) 30%, transparent) !important; }
  .text-slate-600\\/40 { color: color-mix(in srgb, var(--theme-600) 40%, transparent) !important; }
  .stroke-slate-600\\/40 { stroke: color-mix(in srgb, var(--theme-600) 40%, transparent) !important; }
  .text-slate-600\\/50 { color: color-mix(in srgb, var(--theme-600) 50%, transparent) !important; }
  .stroke-slate-600\\/50 { stroke: color-mix(in srgb, var(--theme-600) 50%, transparent) !important; }
  .text-slate-600\\/60 { color: color-mix(in srgb, var(--theme-600) 60%, transparent) !important; }
  .stroke-slate-600\\/60 { stroke: color-mix(in srgb, var(--theme-600) 60%, transparent) !important; }
  .text-slate-600\\/70 { color: color-mix(in srgb, var(--theme-600) 70%, transparent) !important; }
  .stroke-slate-600\\/70 { stroke: color-mix(in srgb, var(--theme-600) 70%, transparent) !important; }
  .text-slate-600\\/80 { color: color-mix(in srgb, var(--theme-600) 80%, transparent) !important; }
  .stroke-slate-600\\/80 { stroke: color-mix(in srgb, var(--theme-600) 80%, transparent) !important; }
  .text-slate-600\\/90 { color: color-mix(in srgb, var(--theme-600) 90%, transparent) !important; }
  .stroke-slate-600\\/90 { stroke: color-mix(in srgb, var(--theme-600) 90%, transparent) !important; }
  .text-slate-500 { color: var(--theme-500) !important; }
  .stroke-slate-500 { stroke: var(--theme-500) !important; }
  .hover\\:text-slate-500:hover { color: var(--theme-500) !important; }
  .text-slate-500\\/10 { color: color-mix(in srgb, var(--theme-500) 10%, transparent) !important; }
  .stroke-slate-500\\/10 { stroke: color-mix(in srgb, var(--theme-500) 10%, transparent) !important; }
  .text-slate-500\\/20 { color: color-mix(in srgb, var(--theme-500) 20%, transparent) !important; }
  .stroke-slate-500\\/20 { stroke: color-mix(in srgb, var(--theme-500) 20%, transparent) !important; }
  .text-slate-500\\/30 { color: color-mix(in srgb, var(--theme-500) 30%, transparent) !important; }
  .stroke-slate-500\\/30 { stroke: color-mix(in srgb, var(--theme-500) 30%, transparent) !important; }
  .text-slate-500\\/40 { color: color-mix(in srgb, var(--theme-500) 40%, transparent) !important; }
  .stroke-slate-500\\/40 { stroke: color-mix(in srgb, var(--theme-500) 40%, transparent) !important; }
  .text-slate-500\\/50 { color: color-mix(in srgb, var(--theme-500) 50%, transparent) !important; }
  .stroke-slate-500\\/50 { stroke: color-mix(in srgb, var(--theme-500) 50%, transparent) !important; }
  .text-slate-500\\/60 { color: color-mix(in srgb, var(--theme-500) 60%, transparent) !important; }
  .stroke-slate-500\\/60 { stroke: color-mix(in srgb, var(--theme-500) 60%, transparent) !important; }
  .text-slate-500\\/70 { color: color-mix(in srgb, var(--theme-500) 70%, transparent) !important; }
  .stroke-slate-500\\/70 { stroke: color-mix(in srgb, var(--theme-500) 70%, transparent) !important; }
  .text-slate-500\\/80 { color: color-mix(in srgb, var(--theme-500) 80%, transparent) !important; }
  .stroke-slate-500\\/80 { stroke: color-mix(in srgb, var(--theme-500) 80%, transparent) !important; }
  .text-slate-500\\/90 { color: color-mix(in srgb, var(--theme-500) 90%, transparent) !important; }
  .stroke-slate-500\\/90 { stroke: color-mix(in srgb, var(--theme-500) 90%, transparent) !important; }
  .text-slate-400 { color: var(--theme-400) !important; }
  .stroke-slate-400 { stroke: var(--theme-400) !important; }
  .hover\\:text-slate-400:hover { color: var(--theme-400) !important; }
  .text-slate-400\\/10 { color: color-mix(in srgb, var(--theme-400) 10%, transparent) !important; }
  .stroke-slate-400\\/10 { stroke: color-mix(in srgb, var(--theme-400) 10%, transparent) !important; }
  .text-slate-400\\/20 { color: color-mix(in srgb, var(--theme-400) 20%, transparent) !important; }
  .stroke-slate-400\\/20 { stroke: color-mix(in srgb, var(--theme-400) 20%, transparent) !important; }
  .text-slate-400\\/30 { color: color-mix(in srgb, var(--theme-400) 30%, transparent) !important; }
  .stroke-slate-400\\/30 { stroke: color-mix(in srgb, var(--theme-400) 30%, transparent) !important; }
  .text-slate-400\\/40 { color: color-mix(in srgb, var(--theme-400) 40%, transparent) !important; }
  .stroke-slate-400\\/40 { stroke: color-mix(in srgb, var(--theme-400) 40%, transparent) !important; }
  .text-slate-400\\/50 { color: color-mix(in srgb, var(--theme-400) 50%, transparent) !important; }
  .stroke-slate-400\\/50 { stroke: color-mix(in srgb, var(--theme-400) 50%, transparent) !important; }
  .text-slate-400\\/60 { color: color-mix(in srgb, var(--theme-400) 60%, transparent) !important; }
  .stroke-slate-400\\/60 { stroke: color-mix(in srgb, var(--theme-400) 60%, transparent) !important; }
  .text-slate-400\\/70 { color: color-mix(in srgb, var(--theme-400) 70%, transparent) !important; }
  .stroke-slate-400\\/70 { stroke: color-mix(in srgb, var(--theme-400) 70%, transparent) !important; }
  .text-slate-400\\/80 { color: color-mix(in srgb, var(--theme-400) 80%, transparent) !important; }
  .stroke-slate-400\\/80 { stroke: color-mix(in srgb, var(--theme-400) 80%, transparent) !important; }
  .text-slate-400\\/90 { color: color-mix(in srgb, var(--theme-400) 90%, transparent) !important; }
  .stroke-slate-400\\/90 { stroke: color-mix(in srgb, var(--theme-400) 90%, transparent) !important; }
  .text-slate-300 { color: var(--theme-300) !important; }
  .stroke-slate-300 { stroke: var(--theme-300) !important; }
  .hover\\:text-slate-300:hover { color: var(--theme-300) !important; }
  .text-slate-300\\/10 { color: color-mix(in srgb, var(--theme-300) 10%, transparent) !important; }
  .stroke-slate-300\\/10 { stroke: color-mix(in srgb, var(--theme-300) 10%, transparent) !important; }
  .text-slate-300\\/20 { color: color-mix(in srgb, var(--theme-300) 20%, transparent) !important; }
  .stroke-slate-300\\/20 { stroke: color-mix(in srgb, var(--theme-300) 20%, transparent) !important; }
  .text-slate-300\\/30 { color: color-mix(in srgb, var(--theme-300) 30%, transparent) !important; }
  .stroke-slate-300\\/30 { stroke: color-mix(in srgb, var(--theme-300) 30%, transparent) !important; }
  .text-slate-300\\/40 { color: color-mix(in srgb, var(--theme-300) 40%, transparent) !important; }
  .stroke-slate-300\\/40 { stroke: color-mix(in srgb, var(--theme-300) 40%, transparent) !important; }
  .text-slate-300\\/50 { color: color-mix(in srgb, var(--theme-300) 50%, transparent) !important; }
  .stroke-slate-300\\/50 { stroke: color-mix(in srgb, var(--theme-300) 50%, transparent) !important; }
  .text-slate-300\\/60 { color: color-mix(in srgb, var(--theme-300) 60%, transparent) !important; }
  .stroke-slate-300\\/60 { stroke: color-mix(in srgb, var(--theme-300) 60%, transparent) !important; }
  .text-slate-300\\/70 { color: color-mix(in srgb, var(--theme-300) 70%, transparent) !important; }
  .stroke-slate-300\\/70 { stroke: color-mix(in srgb, var(--theme-300) 70%, transparent) !important; }
  .text-slate-300\\/80 { color: color-mix(in srgb, var(--theme-300) 80%, transparent) !important; }
  .stroke-slate-300\\/80 { stroke: color-mix(in srgb, var(--theme-300) 80%, transparent) !important; }
  .text-slate-300\\/90 { color: color-mix(in srgb, var(--theme-300) 90%, transparent) !important; }
  .stroke-slate-300\\/90 { stroke: color-mix(in srgb, var(--theme-300) 90%, transparent) !important; }
  .text-slate-200 { color: var(--theme-200) !important; }
  .stroke-slate-200 { stroke: var(--theme-200) !important; }
  .hover\\:text-slate-200:hover { color: var(--theme-200) !important; }
  .text-slate-200\\/10 { color: color-mix(in srgb, var(--theme-200) 10%, transparent) !important; }
  .stroke-slate-200\\/10 { stroke: color-mix(in srgb, var(--theme-200) 10%, transparent) !important; }
  .text-slate-200\\/20 { color: color-mix(in srgb, var(--theme-200) 20%, transparent) !important; }
  .stroke-slate-200\\/20 { stroke: color-mix(in srgb, var(--theme-200) 20%, transparent) !important; }
  .text-slate-200\\/30 { color: color-mix(in srgb, var(--theme-200) 30%, transparent) !important; }
  .stroke-slate-200\\/30 { stroke: color-mix(in srgb, var(--theme-200) 30%, transparent) !important; }
  .text-slate-200\\/40 { color: color-mix(in srgb, var(--theme-200) 40%, transparent) !important; }
  .stroke-slate-200\\/40 { stroke: color-mix(in srgb, var(--theme-200) 40%, transparent) !important; }
  .text-slate-200\\/50 { color: color-mix(in srgb, var(--theme-200) 50%, transparent) !important; }
  .stroke-slate-200\\/50 { stroke: color-mix(in srgb, var(--theme-200) 50%, transparent) !important; }
  .text-slate-200\\/60 { color: color-mix(in srgb, var(--theme-200) 60%, transparent) !important; }
  .stroke-slate-200\\/60 { stroke: color-mix(in srgb, var(--theme-200) 60%, transparent) !important; }
  .text-slate-200\\/70 { color: color-mix(in srgb, var(--theme-200) 70%, transparent) !important; }
  .stroke-slate-200\\/70 { stroke: color-mix(in srgb, var(--theme-200) 70%, transparent) !important; }
  .text-slate-200\\/80 { color: color-mix(in srgb, var(--theme-200) 80%, transparent) !important; }
  .stroke-slate-200\\/80 { stroke: color-mix(in srgb, var(--theme-200) 80%, transparent) !important; }
  .text-slate-200\\/90 { color: color-mix(in srgb, var(--theme-200) 90%, transparent) !important; }
  .stroke-slate-200\\/90 { stroke: color-mix(in srgb, var(--theme-200) 90%, transparent) !important; }
  .text-slate-100 { color: var(--theme-100) !important; }
  .stroke-slate-100 { stroke: var(--theme-100) !important; }
  .hover\\:text-slate-100:hover { color: var(--theme-100) !important; }
  .text-slate-100\\/10 { color: color-mix(in srgb, var(--theme-100) 10%, transparent) !important; }
  .stroke-slate-100\\/10 { stroke: color-mix(in srgb, var(--theme-100) 10%, transparent) !important; }
  .text-slate-100\\/20 { color: color-mix(in srgb, var(--theme-100) 20%, transparent) !important; }
  .stroke-slate-100\\/20 { stroke: color-mix(in srgb, var(--theme-100) 20%, transparent) !important; }
  .text-slate-100\\/30 { color: color-mix(in srgb, var(--theme-100) 30%, transparent) !important; }
  .stroke-slate-100\\/30 { stroke: color-mix(in srgb, var(--theme-100) 30%, transparent) !important; }
  .text-slate-100\\/40 { color: color-mix(in srgb, var(--theme-100) 40%, transparent) !important; }
  .stroke-slate-100\\/40 { stroke: color-mix(in srgb, var(--theme-100) 40%, transparent) !important; }
  .text-slate-100\\/50 { color: color-mix(in srgb, var(--theme-100) 50%, transparent) !important; }
  .stroke-slate-100\\/50 { stroke: color-mix(in srgb, var(--theme-100) 50%, transparent) !important; }
  .text-slate-100\\/60 { color: color-mix(in srgb, var(--theme-100) 60%, transparent) !important; }
  .stroke-slate-100\\/60 { stroke: color-mix(in srgb, var(--theme-100) 60%, transparent) !important; }
  .text-slate-100\\/70 { color: color-mix(in srgb, var(--theme-100) 70%, transparent) !important; }
  .stroke-slate-100\\/70 { stroke: color-mix(in srgb, var(--theme-100) 70%, transparent) !important; }
  .text-slate-100\\/80 { color: color-mix(in srgb, var(--theme-100) 80%, transparent) !important; }
  .stroke-slate-100\\/80 { stroke: color-mix(in srgb, var(--theme-100) 80%, transparent) !important; }
  .text-slate-100\\/90 { color: color-mix(in srgb, var(--theme-100) 90%, transparent) !important; }
  .stroke-slate-100\\/90 { stroke: color-mix(in srgb, var(--theme-100) 90%, transparent) !important; }
  .text-slate-50 { color: var(--theme-50) !important; }
  .stroke-slate-50 { stroke: var(--theme-50) !important; }
  .hover\\:text-slate-50:hover { color: var(--theme-50) !important; }
  .text-slate-50\\/10 { color: color-mix(in srgb, var(--theme-50) 10%, transparent) !important; }
  .stroke-slate-50\\/10 { stroke: color-mix(in srgb, var(--theme-50) 10%, transparent) !important; }
  .text-slate-50\\/20 { color: color-mix(in srgb, var(--theme-50) 20%, transparent) !important; }
  .stroke-slate-50\\/20 { stroke: color-mix(in srgb, var(--theme-50) 20%, transparent) !important; }
  .text-slate-50\\/30 { color: color-mix(in srgb, var(--theme-50) 30%, transparent) !important; }
  .stroke-slate-50\\/30 { stroke: color-mix(in srgb, var(--theme-50) 30%, transparent) !important; }
  .text-slate-50\\/40 { color: color-mix(in srgb, var(--theme-50) 40%, transparent) !important; }
  .stroke-slate-50\\/40 { stroke: color-mix(in srgb, var(--theme-50) 40%, transparent) !important; }
  .text-slate-50\\/50 { color: color-mix(in srgb, var(--theme-50) 50%, transparent) !important; }
  .stroke-slate-50\\/50 { stroke: color-mix(in srgb, var(--theme-50) 50%, transparent) !important; }
  .text-slate-50\\/60 { color: color-mix(in srgb, var(--theme-50) 60%, transparent) !important; }
  .stroke-slate-50\\/60 { stroke: color-mix(in srgb, var(--theme-50) 60%, transparent) !important; }
  .text-slate-50\\/70 { color: color-mix(in srgb, var(--theme-50) 70%, transparent) !important; }
  .stroke-slate-50\\/70 { stroke: color-mix(in srgb, var(--theme-50) 70%, transparent) !important; }
  .text-slate-50\\/80 { color: color-mix(in srgb, var(--theme-50) 80%, transparent) !important; }
  .stroke-slate-50\\/80 { stroke: color-mix(in srgb, var(--theme-50) 80%, transparent) !important; }
  .text-slate-50\\/90 { color: color-mix(in srgb, var(--theme-50) 90%, transparent) !important; }
  .stroke-slate-50\\/90 { stroke: color-mix(in srgb, var(--theme-50) 90%, transparent) !important; }

  /* Emerald UI Overrides */
  .text-emerald-400 { color: var(--theme-em-400) !important; }
  .text-emerald-500 { color: var(--theme-em-500) !important; }
  .bg-emerald-500 { background-color: var(--theme-em-500) !important; }
  .hover\\:bg-emerald-400:hover { background-color: var(--theme-em-400) !important; }
  .border-emerald-500 { border-color: var(--theme-em-500) !important; }
  .border-emerald-400 { border-color: var(--theme-em-400) !important; }
  .bg-emerald-500\\/10 { background-color: color-mix(in srgb, var(--theme-em-500) 10%, transparent) !important; }
  .border-emerald-500\\/10 { border-color: color-mix(in srgb, var(--theme-em-500) 10%, transparent) !important; }
  .shadow-emerald-500\\/10 { --tw-shadow-color: color-mix(in srgb, var(--theme-em-500) 10%, transparent) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
  .bg-emerald-500\\/15 { background-color: color-mix(in srgb, var(--theme-em-500) 15%, transparent) !important; }
  .border-emerald-500\\/15 { border-color: color-mix(in srgb, var(--theme-em-500) 15%, transparent) !important; }
  .shadow-emerald-500\\/15 { --tw-shadow-color: color-mix(in srgb, var(--theme-em-500) 15%, transparent) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
  .bg-emerald-500\\/20 { background-color: color-mix(in srgb, var(--theme-em-500) 20%, transparent) !important; }
  .border-emerald-500\\/20 { border-color: color-mix(in srgb, var(--theme-em-500) 20%, transparent) !important; }
  .shadow-emerald-500\\/20 { --tw-shadow-color: color-mix(in srgb, var(--theme-em-500) 20%, transparent) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
  .bg-emerald-500\\/25 { background-color: color-mix(in srgb, var(--theme-em-500) 25%, transparent) !important; }
  .border-emerald-500\\/25 { border-color: color-mix(in srgb, var(--theme-em-500) 25%, transparent) !important; }
  .shadow-emerald-500\\/25 { --tw-shadow-color: color-mix(in srgb, var(--theme-em-500) 25%, transparent) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
  .bg-emerald-500\\/30 { background-color: color-mix(in srgb, var(--theme-em-500) 30%, transparent) !important; }
  .border-emerald-500\\/30 { border-color: color-mix(in srgb, var(--theme-em-500) 30%, transparent) !important; }
  .shadow-emerald-500\\/30 { --tw-shadow-color: color-mix(in srgb, var(--theme-em-500) 30%, transparent) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
  .bg-emerald-500\\/40 { background-color: color-mix(in srgb, var(--theme-em-500) 40%, transparent) !important; }
  .border-emerald-500\\/40 { border-color: color-mix(in srgb, var(--theme-em-500) 40%, transparent) !important; }
  .shadow-emerald-500\\/40 { --tw-shadow-color: color-mix(in srgb, var(--theme-em-500) 40%, transparent) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
  .bg-emerald-500\\/50 { background-color: color-mix(in srgb, var(--theme-em-500) 50%, transparent) !important; }
  .border-emerald-500\\/50 { border-color: color-mix(in srgb, var(--theme-em-500) 50%, transparent) !important; }
  .shadow-emerald-500\\/50 { --tw-shadow-color: color-mix(in srgb, var(--theme-em-500) 50%, transparent) !important; --tw-shadow: var(--tw-shadow-colored) !important; }
`;

let currentTheme: ThemeName = (localStorage.getItem('nutripulse_theme') as ThemeName) || 'default';
const listeners = new Set<(theme: ThemeName) => void>();

if (typeof document !== 'undefined') {
  const styleId = 'nutripulse-theme-magic';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = GLOBAL_CSS;
    document.head.appendChild(styleEl);
  }
  document.body.className = THEMES[currentTheme].globalBg;
}

export const useTheme = () => {
  const [theme, setLocalTheme] = useState<ThemeName>(currentTheme);

  useEffect(() => {
    listeners.add(setLocalTheme);
    return () => {
      listeners.delete(setLocalTheme);
    };
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    currentTheme = newTheme;
    localStorage.setItem('nutripulse_theme', newTheme);
    document.body.className = THEMES[newTheme].globalBg;
    listeners.forEach(listener => listener(newTheme));
  };

  return { theme, t: THEMES[theme], setTheme };
};