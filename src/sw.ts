/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));
// Cache only the non-user-specific catalog. Never cache auth, health logs, private images or AI responses.
registerRoute(({ url, request }) => request.method === 'GET' && url.origin === 'https://khjmjnuawghmvdjmuurt.supabase.co' && url.pathname === '/rest/v1/foods', new NetworkFirst({
  cacheName: 'mind-eat-food-catalog', networkTimeoutSeconds: 4,
  plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 7 * 86400 })],
}));
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('push', event => {
  let payload: { title?: string; message?: string; route?: string; key?: string } = {};
  try { payload = event.data?.json() || {}; } catch { payload = {}; }
  event.waitUntil(self.registration.showNotification(payload.title || 'Mind Eat', { body: payload.message || 'A little moment for your wellbeing.', icon: '/icons/mind-eat.png', badge: '/icons/mind-eat.png', tag: payload.key, data: { route: payload.route || '/notifications' } }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const route = String(event.notification.data?.route || '/notifications');
  const url = new URL(route.startsWith('/') && !route.startsWith('//') ? route : '/notifications', self.location.origin);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const window of windows) { if (new URL(window.url).origin === self.location.origin) { await (window as WindowClient).navigate(url.href); await (window as WindowClient).focus(); return; } }
    await self.clients.openWindow(url.href);
  })());
});
