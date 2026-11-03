// src/services/notifications.ts
import { LocalNotifications } from '@capacitor/local-notifications';

export interface LiveNutritionStats {
  eatenCalories: number;
  targetCalories: number;
  burnedCalories: number;
  proteinGrams: number;
  targetProtein: number;
  waterMl?: number;
  targetWaterMl?: number;
  streakDays?: number;
}

const LIVE_CHANNEL_ID = 'nutripulse_live_tracker';
const REMINDER_CHANNEL_ID = 'nutripulse_daily_reminder';
const ACTION_TYPE_ID = 'NUTRIPULSE_PLAYER_CONTROLS';

// Builds a visual 8-segment ring/progress bar with percentage
function buildVisualRing(current: number, target: number, filledEmoji: string): string {
  const safeTarget = target > 0 ? target : 1;
  const pct = Math.min(100, Math.round((current / safeTarget) * 100));
  const totalDots = 8;
  const filledDots = Math.min(totalDots, Math.round((pct / 100) * totalDots));
  const emptyDots = totalDots - filledDots;

  const bar = filledEmoji.repeat(filledDots) + '⚫'.repeat(emptyDots);
  return `${bar} ${pct}%`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== 'granted') return false;

    // 1. Register High-Priority Colourful Channels (Android)
    await LocalNotifications.createChannel({
      id: LIVE_CHANNEL_ID,
      name: 'NutriPulse Live Tracker',
      description: 'Spotify-style pinned live macro & calorie ring tracker',
      importance: 5, // Max priority (top of shade + heads-up)
      visibility: 1, // Public on lock screen
      lights: true,
      lightColor: '#10b981',
      vibration: false,
    });

    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Daily Nutrition Reminders',
      description: 'High-priority daily meal & streak alerts',
      importance: 5,
      visibility: 1,
      lights: true,
      lightColor: '#f59e0b',
      vibration: true,
    });

    // 2. Register Spotify-Style Bottom Action Buttons
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
 * Pins a persistent, colourful Spotify-style live tracker notification
 * with Calorie & Protein rings to the top of the mobile notification shade.
 */
export async function updateLiveTrackerNotification(stats: LiveNutritionStats) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const effectiveBudget = stats.targetCalories + stats.burnedCalories;
  const remainingCals = Math.max(0, effectiveBudget - stats.eatenCalories);
  const calPct = Math.min(100, Math.round((stats.eatenCalories / (effectiveBudget || 2000)) * 100));
  const protPct = Math.min(100, Math.round((stats.proteinGrams / (stats.targetProtein || 120)) * 100));

  const calRing = buildVisualRing(stats.eatenCalories, effectiveBudget, '🟢');
  const protRing = buildVisualRing(stats.proteinGrams, stats.targetProtein, '🔵');

  const isGoalHit = calPct >= 90 && calPct <= 105 && protPct >= 95;
  const statusBadge = isGoalHit
    ? '🏆 PERFECT DAY UNLOCKED'
    : `🎯 ${remainingCals} kcal left  •  💪 ${Math.max(0, stats.targetProtein - Math.round(stats.proteinGrams))}g P to go`;

  const detailedBody = [
    `◎ CALORIE RING: ${Math.round(stats.eatenCalories)} / ${effectiveBudget} kcal`,
    `${calRing}`,
    ``,
    `◎ PROTEIN RING: ${Math.round(stats.proteinGrams)}g / ${stats.targetProtein}g`,
    `${protRing}`,
    ``,
    `🔥 Burned: -${stats.burnedCalories} kcal   •   💧 Water: ${stats.waterMl ?? 0}ml`,
  ].join('\n');

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 100, // Dedicated ID for the live pinned tracker
          title: `⚡ NutriPulse  •  ${remainingCals} kcal Remaining`,
          body: `🟢 Cals: ${calPct}% (${Math.round(stats.eatenCalories)} kcal)   🔵 Protein: ${protPct}% (${Math.round(stats.proteinGrams)}g)`,
          largeBody: detailedBody,
          summaryText: statusBadge,
          channelId: LIVE_CHANNEL_ID,
          iconColor: isGoalHit ? '#f59e0b' : '#10b981', // Gold on Perfect Day, Emerald otherwise
          smallIcon: 'ic_stat_icon_config_sample',
          ongoing: true, // Pins it like Spotify so it stays active at the top
          autoCancel: false,
          actionTypeId: ACTION_TYPE_ID,
        },
      ],
    });
  } catch (err) {
    console.warn('Could not schedule live tracker notification:', err);
  }
}

/**
 * Schedules the daily 8:00 PM reminder with high-priority colourful styling.
 */
export async function scheduleDailyReminder(
  hour = 20,
  minute = 0,
  stats?: LiveNutritionStats
) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

  const calRing = stats
    ? buildVisualRing(stats.eatenCalories, stats.targetCalories + stats.burnedCalories, '🟢')
    : '🟢🟢🟢🟢🟢⚫⚫⚫ 65%';
  const protRing = stats
    ? buildVisualRing(stats.proteinGrams, stats.targetProtein, '🔵')
    : '🔵🔵🔵🔵🔵🔵⚫⚫ 75%';

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: '🔥 Keep Your NutriPulse Streak Alive!',
        body: 'Close your Calorie & Protein rings before bed! Tap to log your dinner.',
        largeBody: [
          `Don't let today's progress slip! Close your daily macro rings:`,
          ``,
          `◎ Calorie Ring:  ${calRing}`,
          `◎ Protein Ring:  ${protRing}`,
          ``,
          `⚡ Tap below to quick-log your final meal or check your AI Coach Report.`,
        ].join('\n'),
        summaryText: '⏰ Daily Ring Check-In',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
        channelId: REMINDER_CHANNEL_ID,
        iconColor: '#f59e0b', // Vibrant Amber/Gold accent
        smallIcon: 'ic_stat_icon_config_sample',
        actionTypeId: ACTION_TYPE_ID,
      },
    ],
  });
}