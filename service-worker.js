/* Amplyopia PWA service worker */
const CACHE_NAME = 'amplyopia-pwa-v1.1.4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/manifest.json',
  '/manifest-boy.json',
  '/manifest-girl.json',
  '/manifest-guest.json',
  '/css/styles.css',
  '/css/pwa.css',
  '/js/branding.js',
  '/js/pwa-config.js',
  '/js/pwa-bootstrap.js',
  '/js/session-timer.js',
  '/js/push-client.js',
  '/js/supabase-config.js',
  '/js/auth-routes.js',
  '/js/supabase.js',
  '/js/app.js',
  '/js/profile.js',
  '/js/legal-consent.js',
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
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('supabase.co')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && (req.url.includes('/css/') || req.url.includes('/js/') || req.url.includes('/images/'))) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
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
