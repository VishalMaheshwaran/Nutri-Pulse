// src/services/notifications.ts
import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestNotificationPermission() {
  const permStatus = await LocalNotifications.requestPermissions();
  return permStatus.display === 'granted';
}

export async function scheduleDailyReminder(hour = 20, minute = 0) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Cancel existing reminders to prevent duplicates
  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

  await LocalNotifications.schedule({
    notifications: [
      {
        title: "NutriPulse",
        body: "Don't forget to log your meals and keep your streak alive! 🔥",
        id: 1,
        schedule: { on: { hour, minute } }, // Repeats daily at specified time
        smallIcon: "ic_stat_icon_config_sample", // Uses default Android icon
      }
    ]
  });
}