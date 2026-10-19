import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHealth, today, totals } from './health';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useReminders() {
  const { session, profile, entries } = useHealth(); const qc = useQueryClient();
  useEffect(() => {
    if (!session || !profile.onboarded) return;
    let running = false; let disposed = false;
    const check = async () => {
      if (running || document.visibilityState !== 'visible') return;
      running = true;
      try {
        const now = new Date(); const date = today(); const hour = now.getHours(); const minutes = hour * 60 + now.getMinutes(); const settings = profile.settings || {};
        const candidates: { key: string; title: string; message: string; route: string }[] = [];
        if (settings.meals) (['breakfast', 'lunch', 'dinner', 'snacks'] as const).forEach((meal, i) => { const time = String(settings[meal] || ['08:00', '13:00', '20:00', '16:00'][i]).split(':').map(Number); const at = time[0] * 60 + time[1]; if (minutes >= at && minutes < at + 60 && !entries.some(e => e.kind === 'food' && e.entry_date === date && String(e.data.meal).toLowerCase() === meal)) candidates.push({ key: meal, title: `A moment for ${meal}`, message: 'Have you eaten? Take a moment to log your meal.', route: `/log-food?meal=${meal.charAt(0).toUpperCase() + meal.slice(1)}` }); });
        if (settings.water && hour >= 8 && hour <= 21 && totals(entries, date).water < profile.water_goal) { const interval = settings.water_frequency || 2; if (hour % interval === 0) candidates.push({ key: `water-${Math.floor(hour / interval)}`, title: 'A sip for yourself', message: 'A little water can go a long way. Log your next glass.', route: '/dashboard' }); }
        if (settings.measurements && now.getDay() === (settings.measurement_day ?? 0) && hour >= 9 && !entries.some(e => e.kind === 'measurement' && e.entry_date === date)) candidates.push({ key: 'measurement', title: 'Your weekly starting point', message: 'Log a measurement and look at your progress over time.', route: '/measurements' });
        if (settings.insights && now.getDay() === 0 && hour >= 18) candidates.push({ key: 'weekly', title: 'Time for a weekly reflection', message: 'Look back at your meals and movement this week.', route: '/weekly-report' });
        for (const item of candidates) {
          if (disposed) break;
          if (entries.some(e => e.kind === 'notification' && e.entry_date === date && e.data.key === item.key)) continue;
          const { error } = await supabase.from('health_entries').insert({ user_id: session.user.id, kind: 'notification', entry_date: date, data: { ...item, read: false } });
          if (error) { if (error.code !== '23505') toast.error('Could not save your reminder.'); continue; }
          await qc.invalidateQueries({ queryKey: ['entries'] }); toast(item.title, { description: item.message });
          if ('Notification' in window && Notification.permission === 'granted') {
            const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
            if (registration) await registration.showNotification(item.title, { body: item.message, icon: '/icons/snap-eat.png', tag: item.key, data: { route: item.route } });
          }
        }
      } catch {
        toast.error('Could not display your reminder. Check the notification center.');
      } finally { running = false; }
    };
    check(); const timer = window.setInterval(check, 60000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [session?.user.id, profile, entries, qc]);
}
