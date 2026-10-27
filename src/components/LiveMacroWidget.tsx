import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog } from '../types/nutrition';
import { Flame, Bell, BellOff, Trophy, Minimize2, Maximize2, ShieldCheck } from 'lucide-react';
import { calculateGoalStreak, evaluateDayGoalSuccess } from './GoalCelebrationModal';

interface LiveMacroWidgetProps {
  totals: { calories: number; protein: number; carbs: number; fat: number; };
  profile: UserProfile;
  caloriesBurned: number;
  logs: Record<string, DailyLog>;
  onTriggerStreakPreview: () => void;
}

const LOCKED_NOTIF_PREF_KEY = 'nutripulse_locked_notification_enabled';
export const WIDGET_SYNC_STORAGE_KEY = 'nutripulse_widget_live_data';

export const LiveMacroWidget: React.FC<LiveMacroWidgetProps> = ({ totals, profile, caloriesBurned, logs, onTriggerStreakPreview }) => {
  const [isPinnedNotifEnabled, setIsPinnedNotifEnabled] = useState<boolean>(() => localStorage.getItem(LOCKED_NOTIF_PREF_KEY) === 'true');
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [notifStatusText, setNotifStatusText] = useState<string | null>(null);

  const totalBudget = (profile.targetCalories || 2000) + caloriesBurned;
  const caloriesLeft = totalBudget - totals.calories;
  const proteinLeft = Math.max(0, Math.round((profile.targetProtein || 120) - totals.protein));

  const calPct = Math.min(100, Math.round((totals.calories / Math.max(1, totalBudget)) * 100));
  const proPct = Math.min(100, Math.round((totals.protein / Math.max(1, profile.targetProtein || 1)) * 100));

  const { streak } = calculateGoalStreak(logs, profile);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEval = evaluateDayGoalSuccess(logs[todayStr], profile);

  useEffect(() => {
    const widgetPayload = {
      caloriesLeft, caloriesEaten: totals.calories, calorieBudget: totalBudget,
      proteinLeft, proteinEaten: Math.round(totals.protein), proteinGoal: profile.targetProtein,
      streak, updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(WIDGET_SYNC_STORAGE_KEY, JSON.stringify(widgetPayload));
    const capPlugins = (window as any).Capacitor?.Plugins;
    if (capPlugins?.Preferences) {
      capPlugins.Preferences.set({ key: WIDGET_SYNC_STORAGE_KEY, value: JSON.stringify(widgetPayload) }).catch(() => {});
    }

    if (isPinnedNotifEnabled) {
      pushLockedMacroNotification(caloriesLeft, proteinLeft, totals.calories, totalBudget, Math.round(totals.protein), profile.targetProtein);
    }
  }, [totals.calories, totals.protein, totalBudget, profile.targetProtein, isPinnedNotifEnabled, streak]);

  const pushLockedMacroNotification = async (calsRemaining: number, proRemaining: number, calsEaten: number, calBudget: number, proEaten: number, proTarget: number) => {
    const title = calsRemaining >= 0 ? `🔥 ${calsRemaining} kcal left · 💪 ${proRemaining}g Protein to go` : `⚠️ ${Math.abs(calsRemaining)} kcal over · 💪 ${proRemaining}g Protein to go`;
    const body = `Eaten: ${calsEaten}/${calBudget} kcal | Protein: ${proEaten}/${proTarget}g (${todayEval.success ? '✅ Daily Goal Hit!' : 'Keep going!'})`;

    const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;
    if (LocalNotifications) {
      try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') await LocalNotifications.requestPermissions();
        await LocalNotifications.schedule({
          notifications: [{ id: 8881, title, body, ongoing: true, autoCancel: false, smallIcon: 'ic_stat_icon_config_sample', extra: { type: 'macro_tracker_locked' } }],
        });
        return;
      } catch (e) {
        console.warn('Capacitor LocalNotifications fallback to Web Notification:', e);
      }
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.showNotification(title, { body, tag: 'nutripulse-live-macros', renotify: false, requireInteraction: true, silent: true } as any);
            return;
          }
        }
        new Notification(title, { body, tag: 'nutripulse-live-macros', silent: true });
      } catch {}
    }
  };

  const toggleLockedNotification = async () => {
    if (!isPinnedNotifEnabled) {
      const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;
      if (LocalNotifications) {
        await LocalNotifications.requestPermissions();
      } else if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setNotifStatusText('Please allow notifications in your browser/phone settings.');
          setTimeout(() => setNotifStatusText(null), 3500);
          return;
        }
      }
      localStorage.setItem(LOCKED_NOTIF_PREF_KEY, 'true');
      setIsPinnedNotifEnabled(true);
      setNotifStatusText('Locked notification pinned! Updates automatically as you log.');
      setTimeout(() => setNotifStatusText(null), 3000);
    } else {
      localStorage.setItem(LOCKED_NOTIF_PREF_KEY, 'false');
      setIsPinnedNotifEnabled(false);
      const LocalNotifications = (window as any).Capacitor?.Plugins?.LocalNotifications;
      if (LocalNotifications) LocalNotifications.cancel({ notifications: [{ id: 8881 }] }).catch(() => {});
      setNotifStatusText('Locked notification unpinned.');
      setTimeout(() => setNotifStatusText(null), 2500);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg w-full space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 truncate">Live Macro Widget</span>
          <button onClick={onTriggerStreakPreview} className="px-2 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0" title="Click to view your AI Goal Streak status">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>{streak}d Streak</span>
          </button>
          {todayEval.success && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
              <ShieldCheck className="w-3 h-3" /> Goal Hit!
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={toggleLockedNotification} className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${isPinnedNotifEnabled ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'}`} title="Pin a locked notification showing live calories & protein left">
            {isPinnedNotifEnabled ? <><Bell className="w-3.5 h-3.5 text-emerald-400 fill-current" /><span>Locked Notif: ON</span></> : <><BellOff className="w-3.5 h-3.5 text-slate-500" /><span>Pin Notification</span></>}
          </button>
          <button onClick={() => setIsCompact(!isCompact)} className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer" title={isCompact ? 'Expand Widget' : 'Minimize Widget'}>
            {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {notifStatusText && <div className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5">{notifStatusText}</div>}
      {!isCompact && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-slate-950/90 border border-slate-800/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-emerald-400" /> Calories Left</span>
              <span className="text-[10px] font-mono text-slate-500">{calPct}%</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`text-lg sm:text-xl font-black font-mono tabular-nums ${caloriesLeft >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {caloriesLeft >= 0 ? caloriesLeft : `+${Math.abs(caloriesLeft)}`} <span className="text-xs font-normal text-slate-400 ml-1">{caloriesLeft >= 0 ? 'kcal' : 'over'}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">{totals.calories}/{totalBudget}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${caloriesLeft >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${calPct}%` }} />
            </div>
          </div>
          <div className="p-3 bg-slate-950/90 border border-slate-800/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">💪 Protein Left</span>
              <span className="text-[10px] font-mono text-slate-500">{proPct}%</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black font-mono text-cyan-400 tabular-nums">
                {proteinLeft}g <span className="text-xs font-normal text-slate-400 ml-1">to go</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">{Math.round(totals.protein)}/{profile.targetProtein}g</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${proPct}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};