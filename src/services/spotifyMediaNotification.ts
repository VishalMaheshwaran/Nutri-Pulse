// src/services/spotifyMediaNotification.ts
// Powers Spotify-style photo-background notification tracking across Android & Web/PWA.
// 1. In native Android (Capacitor): Uses custom PhotoNotificationPlugin to set a real BigPicture photo background.
// 2. In Web / PWA (Android Chrome): Uses navigator.mediaSession with silent audio to spawn the exact Spotify media player card with the photo as artwork background.
// 3. In Web Notifications: Attaches image: photoDataUrl for full-width photo banner.

import { generateMacroCardImage, type MacroCardData } from './notificationImage';

let silentAudio: HTMLAudioElement | null = null;
let isMediaSessionActive = false;

/**
 * Initializes a looping silent audio track (inaudible 1-second WAV buffer).
 * This allows Android Chrome / PWA to activate the system media session notification widget
 * exactly like Spotify, Soundcloud, and Apple Music.
 */
function getOrCreateSilentAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!silentAudio) {
    try {
      // 1-second silent WAV base64
      const silentWavBase64 =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      silentAudio = new Audio(silentWavBase64);
      silentAudio.loop = true;
      silentAudio.volume = 0.001; // essentially silent
    } catch (e) {
      console.warn('Silent audio initialization skipped:', e);
    }
  }
  return silentAudio;
}

/**
 * Registers or updates the Spotify-style MediaSession notification.
 * On Android, the OS takes the artwork and makes it the colorful background of the media tile!
 */
export async function updateSpotifyMediaSession(
  stats: MacroCardData,
  photoDataUrl: string,
  onAction?: (actionId: string) => void
) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  const effectiveBudget = (stats.targetCalories || 2000) + (stats.burnedCalories || 0);
  const remainingCals = Math.max(0, effectiveBudget - (stats.eatenCalories || 0));
  const calPct = Math.min(100, Math.round(((stats.eatenCalories || 0) / effectiveBudget) * 100));
  const protPct = Math.min(100, Math.round(((stats.proteinGrams || 0) / (stats.targetProtein || 120)) * 100));

  const title = `${remainingCals} kcal left · ${Math.round(stats.eatenCalories)} / ${effectiveBudget} kcal`;
  const artist = `NutriPulse Macro Tracker (Calories ${calPct}% · Protein ${protPct}%)`;
  const album = stats.streakDays ? `🔥 ${stats.streakDays}-Day Goal Streak · NutriPulse` : 'NutriPulse Live Tracker';

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: [
        { src: photoDataUrl, sizes: '800x440', type: 'image/png' },
        { src: photoDataUrl, sizes: '512x512', type: 'image/png' },
      ],
    });

    // Wire up media session controls like Spotify player
    navigator.mediaSession.setActionHandler('play', () => {
      if (onAction) onAction('play');
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (onAction) onAction('pause');
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (onAction) onAction('log_meal');
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (onAction) onAction('add_water');
    });

    // Start silent playback if not already active to keep the Spotify notification pinned
    const audio = getOrCreateSilentAudio();
    if (audio && !isMediaSessionActive) {
      audio.play().then(() => {
        isMediaSessionActive = true;
      }).catch(() => {
        // Autoplay policy may require user interaction first
      });
    }
  } catch (err) {
    console.warn('Could not set mediaSession metadata:', err);
  }
}

/**
 * Pushes the full photo notification across Native Android & Web.
 */
export async function pushPhotoNotification(
  stats: MacroCardData,
  onAction?: (actionId: string) => void
): Promise<boolean> {
  const effectiveBudget = (stats.targetCalories || 2000) + (stats.burnedCalories || 0);
  const remainingCals = Math.max(0, effectiveBudget - (stats.eatenCalories || 0));
  const calPct = Math.min(100, Math.round(((stats.eatenCalories || 0) / effectiveBudget) * 100));
  const protPct = Math.min(100, Math.round(((stats.proteinGrams || 0) / (stats.targetProtein || 120)) * 100));
  const isOver = stats.eatenCalories > effectiveBudget;

  const title = isOver
    ? `NutriPulse  ·  ${Math.abs(stats.eatenCalories - effectiveBudget)} kcal over budget`
    : `NutriPulse  ·  ${remainingCals} kcal remaining`;

  const body = `Calories: ${calPct}% (${Math.round(stats.eatenCalories)} kcal)  ·  Protein: ${protPct}% (${Math.round(stats.proteinGrams)}g)`;
  const summaryText = `${calPct}% Met · Tap to open food logger`;

  // 1. Generate the photo card image
  const photoDataUrl = await generateMacroCardImage(stats);

  // 2. Try native Android PhotoNotificationPlugin first
  const capPlugins = (window as any).Capacitor?.Plugins;
  if (capPlugins?.PhotoNotification) {
    try {
      await capPlugins.PhotoNotification.showPhotoNotification({
        title,
        body,
        summaryText,
        imageBase64: photoDataUrl,
        ongoing: true,
      });
      return true;
    } catch (e) {
      console.warn('Native PhotoNotificationPlugin error:', e);
    }
  }

  // 3. Also update Web MediaSession (creates the Spotify media player notification in Android Chrome)
  await updateSpotifyMediaSession(stats, photoDataUrl, onAction);

  // 4. Try Web Notification with photo `image` property (renders big photo banner in notification shade)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            image: photoDataUrl, // <-- Big picture photo background!
            tag: 'nutripulse-live-photo-notification',
            renotify: false,
            requireInteraction: true,
            silent: true,
            badge: '/pwa-192x192.png',
          } as any);
          return true;
        }
      }

      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        image: photoDataUrl,
        tag: 'nutripulse-live-photo-notification',
        silent: true,
      } as any);
      return true;
    } catch (err) {
      console.warn('Web notification show failed:', err);
    }
  }

  return false;
}

/**
 * Dismisses the notification
 */
export async function dismissPhotoNotification() {
  const capPlugins = (window as any).Capacitor?.Plugins;
  if (capPlugins?.PhotoNotification) {
    try {
      await capPlugins.PhotoNotification.dismissPhotoNotification();
    } catch {}
  }

  if (silentAudio) {
    silentAudio.pause();
    isMediaSessionActive = false;
  }
}
