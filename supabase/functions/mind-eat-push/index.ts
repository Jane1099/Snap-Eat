import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';
import webpush from 'npm:web-push@3.6.7';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
function validSubscription(value: any) {
  try {
    const url = new URL(value.endpoint);
    const host = url.hostname;
    const allowed = host === 'fcm.googleapis.com' || host.endsWith('.push.services.mozilla.com') || host === 'web.push.apple.com' || host.endsWith('.notify.windows.com');
    return allowed && url.protocol === 'https:' && !url.username && !url.password && !url.port && value.endpoint.length < 3000 && /^[A-Za-z0-9_-]{80,100}=?$/.test(value.keys?.p256dh) && /^[A-Za-z0-9_-]{20,30}={0,2}$/.test(value.keys?.auth);
  } catch { return false; }
}
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const db = admin(); const body = await req.json();
    const scheduler = req.headers.get('x-mind-eat-scheduler');
    if (body.task === 'deliver') {
      if (!scheduler || scheduler.length > 200) return reply({ error: 'Unauthorized scheduler' }, 401);
      const { data: valid, error } = await db.rpc('verify_mind_eat_scheduler', { candidate: scheduler });
      if (error || valid !== true) return reply({ error: 'Unauthorized scheduler' }, 401);
    } else {
      const token = req.headers.get('Authorization')?.replace(/^Bearer /, ''); if (!token) return reply({ error: 'Sign in to manage reminders.' }, 401);
      const { data: { user }, error } = await db.auth.getUser(token); if (error || !user) return reply({ error: 'Invalid session' }, 401);
      if (body.task === 'config') return reply({ configured: Boolean(Deno.env.get('VAPID_PUBLIC_KEY') && Deno.env.get('VAPID_PRIVATE_KEY') && Deno.env.get('VAPID_SUBJECT')), publicKey: Deno.env.get('VAPID_PUBLIC_KEY') || '' });
      if (body.task !== 'subscribe' || !validSubscription(body.subscription)) return reply({ error: 'Unsupported or invalid push subscription.' }, 400);
      const { data: existing, error: findError } = await db.from('push_subscriptions').select('user_id').eq('endpoint', body.subscription.endpoint).maybeSingle();
      if (findError) throw findError;
      if (existing && existing.user_id !== user.id) return reply({ error: 'This browser subscription belongs to another account. Disable it there first.' }, 409);
      const { error: saveError } = await db.from('push_subscriptions').upsert({ user_id: user.id, endpoint: body.subscription.endpoint, subscription: body.subscription }, { onConflict: 'endpoint' });
      if (saveError) throw saveError;
      console.info('[mind-eat-push] Subscription saved', { userId: user.id }); return reply({ subscribed: true });
    }
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY'); const privateKey = Deno.env.get('VAPID_PRIVATE_KEY'); const subject = Deno.env.get('VAPID_SUBJECT');
    if (!publicKey || !privateKey || !subject) { console.info('[mind-eat-push] Delivery not configured'); return reply({ configured: false, sent: 0 }); }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    let offset = 0; let sent = 0;
    while (true) {
      const { data: subscriptions, error } = await db.from('push_subscriptions').select('*').order('id').range(offset, offset + 99); if (error) throw error;
      if (!subscriptions?.length) break; offset += subscriptions.length;
      const ids = [...new Set(subscriptions.map(s => s.user_id))];
      const { data: profiles, error: profileError } = await db.from('profiles').select('*').in('id', ids).eq('onboarded', true); if (profileError) throw profileError;
      for (const profile of profiles || []) {
        const settings = profile.settings || {}; let now: Date; let parts: Intl.DateTimeFormatPart[];
        try { parts = new Intl.DateTimeFormat('en-US', { timeZone: settings.timezone || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()); } catch { continue; }
        const get = (key: string) => parts.find(p => p.type === key)?.value || ''; const date = `${get('year')}-${get('month')}-${get('day')}`; const hour = Number(get('hour')); const minute = hour * 60 + Number(get('minute')); now = new Date(`${date}T12:00:00Z`);
        const { data: logs, error: logsError } = await db.from('health_entries').select('id,kind,data').eq('user_id', profile.id).eq('entry_date', date); if (logsError) throw logsError;
        const candidates: { key: string; title: string; message: string; route: string }[] = [];
        if (settings.meals) ['breakfast', 'lunch', 'dinner', 'snacks'].forEach((meal, i) => { const [h, m] = String(settings[meal] || ['08:00', '13:00', '20:00', '16:00'][i]).split(':').map(Number); const at = h * 60 + m; if (minute >= at && minute < at + 60 && !logs?.some(e => e.kind === 'food' && String(e.data.meal).toLowerCase() === meal)) candidates.push({ key: meal, title: `A moment for ${meal}`, message: 'Have you eaten? Take a moment to log your meal.', route: `/log-food?meal=${meal.charAt(0).toUpperCase() + meal.slice(1)}` }); });
        const water = (logs || []).filter(e => e.kind === 'water').reduce((sum, e) => sum + Number(e.data.ml || 0), 0);
        const frequency = Math.max(1, Math.min(4, Number(settings.water_frequency) || 2));
        if (settings.water && hour >= 8 && hour <= 21 && hour % frequency === 0 && water < profile.water_goal) candidates.push({ key: `water-${Math.floor(hour / frequency)}`, title: 'A sip for yourself', message: 'A little water can go a long way. Log your next glass.', route: '/dashboard' });
        if (settings.measurements && now.getUTCDay() === (settings.measurement_day ?? 0) && hour >= 9 && !logs?.some(e => e.kind === 'measurement')) candidates.push({ key: 'measurement', title: 'Your weekly starting point', message: 'Log a measurement and look at your progress over time.', route: '/measurements' });
        if (settings.insights && now.getUTCDay() === 0 && hour >= 18) candidates.push({ key: 'weekly', title: 'Time for a weekly reflection', message: 'Look back at your meals and movement this week.', route: '/weekly-report' });
        for (const item of candidates) {
          const { data: inserted, error: insertError } = await db.from('health_entries').insert({ user_id: profile.id, kind: 'notification', entry_date: date, data: { ...item, read: false } }).select('id').single();
          // The unique daily notification key prevents duplicate deliveries from overlapping runs or foreground reminders.
          if (insertError?.code === '23505') continue;
          if (insertError) throw insertError;
          let delivered = false;
          for (const sub of subscriptions.filter(s => s.user_id === profile.id)) {
            if (!validSubscription(sub.subscription)) continue;
            try { await webpush.sendNotification(sub.subscription, JSON.stringify(item), { TTL: 3600, timeout: 8000 }); delivered = true; sent++; }
            catch (error) { const status = (error as { statusCode?: number }).statusCode; console.warn('[mind-eat-push] Push rejected', { status }); if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('id', sub.id); }
          }
          if (delivered) await db.from('health_entries').update({ data: { ...item, read: false, push_sent: true } }).eq('id', inserted.id);
        }
      }
      if (subscriptions.length < 100) break;
    }
    console.info('[mind-eat-push] Scheduler finished', { sent }); return reply({ sent, configured: true });
  } catch (error) { console.error('[mind-eat-push] Request failed', { message: error instanceof Error ? error.message : 'Unknown error' }); return reply({ error: 'Unable to complete notification setup or delivery. Please retry.' }, 500); }
});
