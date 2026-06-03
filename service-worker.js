/* Amplyopia PWA service worker */
const CACHE_NAME = 'amplyopia-pwa-v1.2.0';

const STATIC_ASSETS = [
  '/manifest.json',
  '/manifest-boy.json',
  '/manifest-girl.json',
  '/manifest-guest.json',
  '/images/logo/blue-favicon.ico',
  '/images/logo/pink-favicon.ico',
  '/images/logo/yellow-favicon.ico',
  '/images/logo/blue-web-app-manifest-192x192.png',
  '/images/logo/pink-web-app-manifest-192x192.png',
  '/images/logo/yellow-web-app-manifest-192x192.png',
  '/images/logo/blue-web-app-manifest-512x512.png',
  '/images/logo/pink-web-app-manifest-512x512.png',
  '/images/logo/yellow-web-app-manifest-512x512.png'
];

function shouldCacheResponse(req, res) {
  if (!res || res.status !== 200) return false;
  const url = new URL(req.url);
  if (url.pathname.endsWith('.html') || url.pathname === '/') return false;
  return (
    url.pathname.includes('/css/') ||
    url.pathname.includes('/js/') ||
    url.pathname.includes('/images/')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/rest/v1/') || url.hostname.includes('supabase.co')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (shouldCacheResponse(req, res)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Amplyopia', body: 'You have a new message.', icon: '/images/logo/yellow-favicon-96x96.png' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Amplyopia', {
      body: payload.body || '',
      icon: payload.icon || '/images/logo/yellow-favicon-96x96.png',
      badge: '/images/logo/yellow-favicon-96x96.png',
      data: payload.data || {},
      tag: payload.tag || 'amplyopia-push'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
