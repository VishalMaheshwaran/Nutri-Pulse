// src/services/notificationImage.ts
// Generates a Spotify-style photo-background notification card.
// Features ambient blur album-art glow, concentric neon macro rings,
// a Spotify-style track queue showing "What You Ate", and audio-scrubber style calorie progress.

export interface EatenFoodSummary {
  name: string;
  calories: number;
  mealType?: string;
}

export interface MacroCardData {
  eatenCalories: number;
  targetCalories: number;
  burnedCalories: number;
  proteinGrams: number;
  targetProtein: number;
  carbsGrams?: number;
  targetCarbs?: number;
  fatGrams?: number;
  targetFat?: number;
  waterMl?: number;
  targetWaterMl?: number;
  streakDays?: number;
  recentFoods?: (string | EatenFoodSummary)[];
}

/**
 * Generates an SVG string of the Spotify-style photo-background notification card.
 */
export function generateMacroCardSvg(data: MacroCardData): string {
  const width = 800;
  const height = 440;

  const effectiveBudget = Math.max(1, (data.targetCalories || 2000) + (data.burnedCalories || 0));
  const remainingCals = Math.max(0, effectiveBudget - (data.eatenCalories || 0));
  const isOver = data.eatenCalories > effectiveBudget;

  const calPct = Math.min(100, Math.round(((data.eatenCalories || 0) / effectiveBudget) * 100));
  const protTarget = Math.max(1, data.targetProtein || 120);
  const protPct = Math.min(100, Math.round(((data.proteinGrams || 0) / protTarget) * 100));
  const carbTarget = Math.max(1, data.targetCarbs || 200);
  const carbPct = Math.min(100, Math.round(((data.carbsGrams || 0) / carbTarget) * 100));
  const fatTarget = Math.max(1, data.targetFat || 65);
  const fatPct = Math.min(100, Math.round(((data.fatGrams || 0) / fatTarget) * 100));

  // Concentric ring parameters
  const cx = 175;
  const cy = 205;

  const rings = [
    { r: 92, stroke: 14, pct: calPct, color: calPct > 100 ? '#f43f5e' : '#1db954', bg: '#064e3b' },
    { r: 72, stroke: 12, pct: protPct, color: '#06b6d4', bg: '#164e63' },
    { r: 54, stroke: 10, pct: carbPct, color: '#f59e0b', bg: '#78350f' },
    { r: 38, stroke: 9, pct: fatPct, color: '#ec4899', bg: '#831843' },
  ];

  const calcDash = (r: number, pct: number) => {
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - Math.min(100, pct) / 100);
    return { circ, offset };
  };

  // Recent foods list formatting
  const foodsList: EatenFoodSummary[] = (data.recentFoods || []).map((f) => {
    if (typeof f === 'string') {
      return { name: f, calories: 0 };
    }
    return f;
  }).slice(0, 4);

  const defaultFoods = [
    { name: 'Grilled Chicken & Rice', calories: 520, mealType: 'Lunch' },
    { name: 'Blueberry Protein Oats', calories: 380, mealType: 'Breakfast' },
    { name: 'Greek Yogurt & Berries', calories: 260, mealType: 'Snack' },
    { name: 'Almonds & Banana', calories: 320, mealType: 'Snack' },
  ];

  const displayFoods = foodsList.length > 0 ? foodsList : defaultFoods;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Spotify Style Rich Ambient Photo Gradient Background -->
    <linearGradient id="spotifyBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1f14"/>
      <stop offset="35%" stop-color="#0f172a"/>
      <stop offset="70%" stop-color="#09111e"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Radial Emerald Ambient Glow (Spotify-style Album Lighting) -->
    <radialGradient id="spotifyGlow" cx="15%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#1db954" stop-opacity="0.32"/>
      <stop offset="50%" stop-color="#059669" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="cyanAmbient" cx="85%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>

    <!-- Glowing Accents -->
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <filter id="albumShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000000" flood-opacity="0.75"/>
    </filter>
  </defs>

  <style>
    .title-bold { font-family: -apple-system, BlinkMacSystemFont, "Circular Std", "Segoe UI", Roboto, sans-serif; font-weight: 800; fill: #ffffff; }
    .title-med { font-family: -apple-system, BlinkMacSystemFont, "Circular Std", "Segoe UI", Roboto, sans-serif; font-weight: 700; fill: #ffffff; }
    .sub-text { font-family: -apple-system, BlinkMacSystemFont, "Circular Std", "Segoe UI", Roboto, sans-serif; font-weight: 500; fill: #a1a1aa; }
    .mono-bold { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; }
    .spotify-green { fill: #1db954; }
  </style>

  <!-- Photo Background Base -->
  <rect x="0" y="0" width="${width}" height="${height}" rx="28" fill="url(#spotifyBg)"/>
  <!-- Ambient Glow Layers (gives that Spotify Canvas photo look) -->
  <rect x="0" y="0" width="${width}" height="${height}" rx="28" fill="url(#spotifyGlow)"/>
  <rect x="0" y="0" width="${width}" height="${height}" rx="28" fill="url(#cyanAmbient)"/>
  
  <!-- Subtle border outline -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="27" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <!-- Top Spotify Player Header -->
  <g transform="translate(32, 28)">
    <!-- Spotify-style Wave Icon / Dot -->
    <circle cx="8" cy="14" r="5" fill="#1db954" filter="url(#neonGlow)"/>
    <text x="24" y="19" class="title-bold" font-size="15" letter-spacing="0.8">NUTRIPULSE LIVE PLAYER</text>
    <text x="240" y="19" class="sub-text" font-size="12">·  Spotify Photo Background Mode</text>
    
    <!-- Status Pill -->
    <rect x="${width - 250}" y="2" width="154" height="26" rx="13" fill="${isOver ? 'rgba(244, 63, 94, 0.2)' : 'rgba(29, 185, 84, 0.2)'}" stroke="${isOver ? 'rgba(244, 63, 94, 0.5)' : 'rgba(29, 185, 84, 0.5)'}" stroke-width="1.2"/>
    <text x="${width - 173}" y="19" class="mono-bold" font-size="11" text-anchor="middle" fill="${isOver ? '#fb7185' : '#1db954'}">
      ${isOver ? '⚠️ OVER TARGET' : '🎯 GOAL ON TRACK'}
    </text>
  </g>

  <!-- Divider -->
  <line x1="32" y1="64" x2="${width - 32}" y2="64" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- LEFT SECTION: VINYL / ALBUM-ART CONCENTRIC MACRO RINGS -->
  <g id="ringsGroup" filter="url(#albumShadow)">
    <!-- Background disc simulating vinyl album art -->
    <circle cx="${cx}" cy="${cy}" r="106" fill="#090d16" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="22" fill="#020617" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

    ${rings.map((ring) => {
      const { circ, offset } = calcDash(ring.r, ring.pct);
      return `
      <!-- Track -->
      <circle cx="${cx}" cy="${cy}" r="${ring.r}" fill="none" stroke="${ring.bg}" stroke-width="${ring.stroke}" stroke-opacity="0.45"/>
      <!-- Filled Arc -->
      <circle cx="${cx}" cy="${cy}" r="${ring.r}" fill="none" stroke="${ring.color}" stroke-width="${ring.stroke}"
        stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
        stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"/>
      `;
    }).join('')}

    <!-- Center Display: Calories Left -->
    <text x="${cx}" y="${cy - 8}" class="mono-bold" font-size="28" text-anchor="middle" fill="${isOver ? '#fb7185' : '#ffffff'}">
      ${remainingCals}
    </text>
    <text x="${cx}" y="${cy + 12}" class="sub-text" font-size="10" text-anchor="middle" fill="#94a3b8">
      ${isOver ? 'KCAL OVER' : 'KCAL LEFT'}
    </text>
    <text x="${cx}" y="${cy + 28}" class="mono-bold" font-size="12" text-anchor="middle" fill="#1db954">
      ${calPct}% MET
    </text>
  </g>

  <!-- CENTER SECTION: "NOW PLAYING" MACRO BARS (Spotify Scrubber Style) -->
  <g transform="translate(320, 78)">
    <text x="0" y="14" class="title-bold" font-size="14" fill="#f8fafc">NOW TRACKING · DAILY FUEL</text>

    <!-- Calories Bar Row -->
    <g transform="translate(0, 30)">
      <circle cx="8" cy="8" r="6" fill="#1db954"/>
      <text x="22" y="12" class="title-med" font-size="13">Calories</text>
      <text x="210" y="12" class="mono" font-size="12" text-anchor="end" fill="#ffffff">${Math.round(data.eatenCalories)} / ${effectiveBudget} kcal</text>
      <rect x="22" y="20" width="190" height="6" rx="3" fill="rgba(255,255,255,0.12)"/>
      <rect x="22" y="20" width="${Math.min(190, (calPct / 100) * 190)}" height="6" rx="3" fill="#1db954"/>
      <text x="220" y="26" class="mono" font-size="10" fill="#a1a1aa">${calPct}%</text>
    </g>

    <!-- Protein Bar Row -->
    <g transform="translate(0, 70)">
      <circle cx="8" cy="8" r="6" fill="#06b6d4"/>
      <text x="22" y="12" class="title-med" font-size="13">Protein</text>
      <text x="210" y="12" class="mono" font-size="12" text-anchor="end" fill="#ffffff">${Math.round(data.proteinGrams)}g / ${protTarget}g</text>
      <rect x="22" y="20" width="190" height="6" rx="3" fill="rgba(255,255,255,0.12)"/>
      <rect x="22" y="20" width="${Math.min(190, (protPct / 100) * 190)}" height="6" rx="3" fill="#06b6d4"/>
      <text x="220" y="26" class="mono" font-size="10" fill="#a1a1aa">${protPct}%</text>
    </g>

    <!-- Carbs Bar Row -->
    <g transform="translate(0, 110)">
      <circle cx="8" cy="8" r="6" fill="#f59e0b"/>
      <text x="22" y="12" class="title-med" font-size="13">Carbs</text>
      <text x="210" y="12" class="mono" font-size="12" text-anchor="end" fill="#ffffff">${Math.round(data.carbsGrams || 0)}g / ${carbTarget}g</text>
      <rect x="22" y="20" width="190" height="6" rx="3" fill="rgba(255,255,255,0.12)"/>
      <rect x="22" y="20" width="${Math.min(190, (carbPct / 100) * 190)}" height="6" rx="3" fill="#f59e0b"/>
      <text x="220" y="26" class="mono" font-size="10" fill="#a1a1aa">${carbPct}%</text>
    </g>

    <!-- Fat Bar Row -->
    <g transform="translate(0, 150)">
      <circle cx="8" cy="8" r="6" fill="#ec4899"/>
      <text x="22" y="12" class="title-med" font-size="13">Healthy Fats</text>
      <text x="210" y="12" class="mono" font-size="12" text-anchor="end" fill="#ffffff">${Math.round(data.fatGrams || 0)}g / ${fatTarget}g</text>
      <rect x="22" y="20" width="190" height="6" rx="3" fill="rgba(255,255,255,0.12)"/>
      <rect x="22" y="20" width="${Math.min(190, (fatPct / 100) * 190)}" height="6" rx="3" fill="#ec4899"/>
      <text x="220" y="26" class="mono" font-size="10" fill="#a1a1aa">${fatPct}%</text>
    </g>
  </g>

  <!-- RIGHT SECTION: "WHAT NUTRITION I ATE" (Spotify Track Queue Style) -->
  <g transform="translate(585, 78)">
    <rect x="0" y="0" width="185" height="216" rx="16" fill="rgba(15, 23, 42, 0.70)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    
    <text x="14" y="24" class="title-bold" font-size="12" fill="#38bdf8">🍽️ WHAT YOU ATE</text>
    <text x="14" y="38" class="sub-text" font-size="10">Today's Meal Queue</text>

    <!-- Foods List (Track Queue) -->
    ${displayFoods.map((f, idx) => `
    <g transform="translate(14, ${50 + idx * 38})">
      <rect x="0" y="0" width="157" height="32" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
      <!-- Track Number -->
      <text x="8" y="20" class="mono-bold" font-size="10" fill="#1db954">${idx + 1}</text>
      <!-- Food Name -->
      <text x="24" y="16" class="title-med" font-size="11" fill="#f1f5f9">
        ${f.name.length > 15 ? f.name.substring(0, 14) + '…' : f.name}
      </text>
      <!-- Meal Type -->
      <text x="24" y="27" class="sub-text" font-size="9" fill="#94a3b8">
        ${f.mealType || 'Meal'}
      </text>
      <!-- Calories as Duration -->
      <text x="148" y="20" class="mono-bold" font-size="11" text-anchor="end" fill="#1db954">
        ${f.calories > 0 ? `${f.calories}` : '✓'} <tspan font-size="8" fill="#64748b">${f.calories > 0 ? 'kcal' : ''}</tspan>
      </text>
    </g>
    `).join('')}
  </g>

  <!-- BOTTOM SPOTIFY PLAYER CONTROLS & STATS STRIP -->
  <g transform="translate(32, 326)">
    <!-- Pill 1: Eaten Calories -->
    <rect x="0" y="0" width="170" height="52" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="16" y="20" class="sub-text" font-size="10">EATEN TODAY</text>
    <text x="16" y="40" class="mono-bold" font-size="16" fill="#1db954">${Math.round(data.eatenCalories)} <tspan font-size="10" fill="#64748b">kcal</tspan></text>

    <!-- Pill 2: Workout Burn -->
    <rect x="188" y="0" width="170" height="52" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="204" y="20" class="sub-text" font-size="10">WORKOUT BURN</text>
    <text x="204" y="40" class="mono-bold" font-size="16" fill="#fb923c">-${data.burnedCalories || 0} <tspan font-size="10" fill="#64748b">kcal</tspan></text>

    <!-- Pill 3: Hydration -->
    <rect x="376" y="0" width="170" height="52" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="392" y="20" class="sub-text" font-size="10">HYDRATION</text>
    <text x="392" y="40" class="mono-bold" font-size="16" fill="#38bdf8">${data.waterMl || 0} <tspan font-size="10" fill="#64748b">ml</tspan></text>

    <!-- Pill 4: Goal Streak -->
    <rect x="564" y="0" width="172" height="52" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <text x="580" y="20" class="sub-text" font-size="10">PERFECT STREAK</text>
    <text x="580" y="40" class="mono-bold" font-size="16" fill="#f59e0b">🔥 ${data.streakDays || 1} <tspan font-size="10" fill="#64748b">days</tspan></text>
  </g>

  <!-- Bottom Brand Subtitle -->
  <text x="${width / 2}" y="${height - 18}" class="sub-text" font-size="10" text-anchor="middle" fill="#64748b">
    NutriPulse · Live Spotify-Style Background Tracker · Pinned Notification
  </text>
</svg>`;
}

/**
 * Returns a data URL (PNG) representing the macro card photo.
 */
export async function generateMacroCardImage(data: MacroCardData): Promise<string> {
  const svgString = generateMacroCardSvg(data);
  const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

  if (typeof document !== 'undefined') {
    try {
      const img = new Image();
      const loaded = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      img.src = svgBase64;
      const success = await loaded;

      if (success) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 440;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          return canvas.toDataURL('image/png');
        }
      }
    } catch {
      // Fallback
    }
  }

  return svgBase64;
}

/**
 * Saves the macro card photo to local cache or filesystem for Capacitor BigPicture notification.
 */
export async function saveMacroCardToFile(data: MacroCardData): Promise<string | null> {
  try {
    const dataUrl = await generateMacroCardImage(data);

    const Filesystem = (window as any).Capacitor?.Plugins?.Filesystem;
    if (Filesystem && dataUrl.startsWith('data:image/png;base64,')) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const result = await Filesystem.writeFile({
        path: 'nutripulse_macro_card.png',
        data: base64Data,
        directory: 'CACHE',
        recursive: true,
      });
      return result.uri;
    }

    return dataUrl;
  } catch (err) {
    console.warn('Could not save macro card file:', err);
    return null;
  }
}
