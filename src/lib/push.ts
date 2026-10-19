import { supabase } from '@/integrations/supabase/client';
async function request(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('mind-eat-push', { body });
  if (error) { let message = error.message; if (error.context instanceof Response) { try { message = (await error.context.json()).error || message; } catch {} } throw new Error(message); }
  if (data?.error) throw new Error(data.error);
  return data;
}
export async function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) throw new Error('Push is unavailable in this browser. On iOS, install Snap Eat to your home screen first.');
  const config = await request({ task: 'config' });
  if (!config.configured) throw new Error('Scheduled push needs VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT in Supabase Edge Function secrets.');
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) throw new Error('Install or open the production PWA before enabling scheduled push.');
  if (await Notification.requestPermission() !== 'granted') throw new Error('Notifications are blocked. You can still use in-app reminders.');
  const decoded = atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/')); const key = Uint8Array.from(decoded, c => c.charCodeAt(0));
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  try { await request({ task: 'subscribe', subscription: subscription.toJSON() }); } catch (error) { if (!existing) await subscription.unsubscribe(); throw error; }
}
export async function disablePush() {
  const registration = await navigator.serviceWorker.getRegistration(); const subscription = await registration?.pushManager.getSubscription();
  if (subscription) { const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint); if (error) throw error; await subscription.unsubscribe(); }
}
