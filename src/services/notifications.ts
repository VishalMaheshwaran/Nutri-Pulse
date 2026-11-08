// src/services/notifications.ts
import { LocalNotifications } from '@capacitor/local-notifications';
import { generateMacroCardImage, saveMacroCardToFile, type MacroCardData } from './notificationImage';
import { pushPhotoNotification } from './spotifyMediaNotification';

export interface LiveNutritionStats {
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
  recentFoods?: (string | { name: string; calories: number; mealType?: string })[];
}

const LIVE_CHANNEL_ID = 'nutripulse_live_tracker';
const REMINDER_CHANNEL_ID = 'nutripulse_daily_reminder';
const ACTION_TYPE_ID = 'NUTRIPULSE_PLAYER_CONTROLS';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== 'granted') return false;

    // 1. Register High-Priority Colourful Channels (Android)
    await LocalNotifications.createChannel({
      id: LIVE_CHANNEL_ID,
      name: 'NutriPulse Live Tracker',
      description: 'Pinned live macro ring tracker with visual card',
      importance: 5, // Max priority (top of shade + heads-up)
      visibility: 1, // Public on lock screen
      lights: true,
      lightColor: '#10b981',
      vibration: false,
    });

    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Daily Nutrition Reminders',
      description: 'High-priority daily meal & streak alerts with visual progress card',
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: '#f59e0b',
      vibration: true,
    });

    // 2. Register Bottom Action Buttons
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: ACTION_TYPE_ID,
          actions: [
            { id: 'log_meal', title: '🍽️ Log Meal', foreground: true },
            { id: 'add_water', title: '💧 +250ml', foreground: true },
            { id: 'view_stats', title: '📊 AI Report', foreground: true },
          ],
        },
      ],
    });

    return true;
  } catch (err) {
    console.warn('Notification setup skipped (web browser environment):', err);
    return false;
  }
}

/**
 * Builds a compact, clean notification body (no emoji spam).
 * Uses clean Unicode bar and minimal formatting.
 */
function buildCompactBody(stats: LiveNutritionStats): {
  title: string;
  body: string;
  largeBody: string;
  summaryText: string;
} {
  const effectiveBudget = stats.targetCalories + stats.burnedCalories;
  const remainingCals = Math.max(0, effectiveBudget - stats.eatenCalories);
  const isOver = stats.eatenCalories > effectiveBudget;
  const overBy = stats.eatenCalories - effectiveBudget;
  const calPct = Math.min(100, Math.round((stats.eatenCalories / (effectiveBudget || 2000)) * 100));
  const protPct = Math.min(100, Math.round((stats.proteinGrams / (stats.targetProtein || 120)) * 100));

  // Clean unicode progress bars (10 segments)
  const makeBar = (pct: number): string => {
    const filled = Math.round((pct / 100) * 10);
    return '▓'.repeat(filled) + '░'.repeat(10 - filled);
  };

  const calBar = makeBar(calPct);
  const protBar = makeBar(protPct);

  const isGoalHit = calPct >= 90 && calPct <= 105 && protPct >= 95;

  const title = isOver
    ? `NutriPulse  ·  ${Math.abs(overBy)} kcal over budget`
    : `NutriPulse  ·  ${remainingCals} kcal remaining`;

  const body = isGoalHit
    ? `🏆 PERFECT DAY — Calories ${calPct}% · Protein ${protPct}%`
    : `Calories ${calPct}% · Protein ${protPct}% · ${isOver ? `${Math.abs(overBy)} over` : `${remainingCals} left`}`;

  const proteinLeft = Math.max(0, Math.round(stats.targetProtein - stats.proteinGrams));

  const largeBody = [
    `CALORIES  ${calBar}  ${calPct}%`,
    `${Math.round(stats.eatenCalories)} / ${effectiveBudget} kcal`,
    ``,
    `PROTEIN   ${protBar}  ${protPct}%`,
    `${Math.round(stats.proteinGrams)}g / ${stats.targetProtein}g`,
    ``,
    `Burned: -${stats.burnedCalories} kcal  ·  Water: ${stats.waterMl ?? 0}ml`,
  ].join('\n');

  const summaryText = isGoalHit
    ? '🏆 Perfect Day Unlocked'
    : `${remainingCals} kcal left  ·  ${proteinLeft}g protein to go`;

  return { title, body, largeBody, summaryText };
}

/**
 * Pins a persistent live tracker notification with macro ring image card
 * and clean progress text to the top of the mobile notification shade.
 */
export async function updateLiveTrackerNotification(stats: LiveNutritionStats) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const { title, body, largeBody, summaryText } = buildCompactBody(stats);

  const effectiveBudget = stats.targetCalories + stats.burnedCalories;
  const calPct = Math.min(100, Math.round((stats.eatenCalories / (effectiveBudget || 2000)) * 100));
  const protPct = Math.min(100, Math.round((stats.proteinGrams / (stats.targetProtein || 120)) * 100));
  const isGoalHit = calPct >= 90 && calPct <= 105 && protPct >= 95;

  // Generate the macro ring card image and try to attach it
  const cardData: MacroCardData = {
    eatenCalories: stats.eatenCalories,
    targetCalories: stats.targetCalories,
    burnedCalories: stats.burnedCalories,
    proteinGrams: stats.proteinGrams,
    targetProtein: stats.targetProtein,
    carbsGrams: stats.carbsGrams,
    targetCarbs: stats.targetCarbs,
    fatGrams: stats.fatGrams,
    targetFat: stats.targetFat,
    waterMl: stats.waterMl,
    targetWaterMl: stats.targetWaterMl,
    streakDays: stats.streakDays,
    recentFoods: stats.recentFoods,
  };

  let attachments: any[] = [];
  try {
    const imageUri = await saveMacroCardToFile(cardData);
    if (imageUri) {
      attachments = [{ id: 'macro-card', url: imageUri }];
    }
  } catch (err) {
    console.warn('Could not attach macro card image to notification:', err);
  }

  try {
    await pushPhotoNotification(cardData);
  } catch (err) {
    console.warn('pushPhotoNotification fallback:', err);
  }

  try {
    const notifPayload: any = {
      id: 100, // Dedicated ID for the live pinned tracker
      title,
      body,
      largeBody,
      summaryText,
      channelId: LIVE_CHANNEL_ID,
      iconColor: isGoalHit ? '#f59e0b' : '#10b981', // Gold on Perfect Day, Emerald otherwise
      smallIcon: 'ic_stat_icon_config_sample',
      ongoing: true, // Pins it so it stays active at the top
      autoCancel: false,
      actionTypeId: ACTION_TYPE_ID,
    };

    // Attach the image if available (BigPictureStyle on Android)
    if (attachments.length > 0) {
      notifPayload.attachments = attachments;
    }

    await LocalNotifications.schedule({
      notifications: [notifPayload],
    });
  } catch (err) {
    console.warn('Could not schedule live tracker notification:', err);
  }
}

/**
 * Schedules the daily 8:00 PM reminder with visual macro card image.
 */
export async function scheduleDailyReminder(
  hour = 20,
  minute = 0,
  stats?: LiveNutritionStats
) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

  // Build compact text
  const calPct = stats
    ? Math.min(100, Math.round((stats.eatenCalories / ((stats.targetCalories + stats.burnedCalories) || 2000)) * 100))
    : 65;
  const protPct = stats
    ? Math.min(100, Math.round((stats.proteinGrams / (stats.targetProtein || 120)) * 100))
    : 75;

  const makeBar = (pct: number): string => {
    const filled = Math.round((pct / 100) * 10);
    return '▓'.repeat(filled) + '░'.repeat(10 - filled);
  };

  const calBar = makeBar(calPct);
  const protBar = makeBar(protPct);

  // Try to generate and attach image
  let attachments: any[] = [];
  if (stats) {
    try {
      const cardData: MacroCardData = {
        eatenCalories: stats.eatenCalories,
        targetCalories: stats.targetCalories,
        burnedCalories: stats.burnedCalories,
        proteinGrams: stats.proteinGrams,
        targetProtein: stats.targetProtein,
        carbsGrams: stats.carbsGrams,
        targetCarbs: stats.targetCarbs,
        fatGrams: stats.fatGrams,
        targetFat: stats.targetFat,
        waterMl: stats.waterMl,
        targetWaterMl: stats.targetWaterMl,
      };
      const imageUri = await saveMacroCardToFile(cardData);
      if (imageUri) {
        attachments = [{ id: 'macro-card-reminder', url: imageUri }];
      }
    } catch {}
  }

  const notifPayload: any = {
    id: 1,
    title: 'NutriPulse · Close Your Rings Before Bed',
    body: `Calories ${calPct}% · Protein ${protPct}% — Log your dinner to close your rings!`,
    largeBody: [
      `Close your daily macro rings before bed:`,
      ``,
      `CALORIES  ${calBar}  ${calPct}%`,
      `PROTEIN   ${protBar}  ${protPct}%`,
      ``,
      `Tap below to quick-log your final meal or check your AI Coach Report.`,
    ].join('\n'),
    summaryText: 'Daily Ring Check-In',
    schedule: { on: { hour, minute }, allowWhileIdle: true },
    channelId: REMINDER_CHANNEL_ID,
    iconColor: '#f59e0b', // Vibrant Amber/Gold accent
    smallIcon: 'ic_stat_icon_config_sample',
    actionTypeId: ACTION_TYPE_ID,
  };

  if (attachments.length > 0) {
    notifPayload.attachments = attachments;
  }

  await LocalNotifications.schedule({
    notifications: [notifPayload],
  });
}
