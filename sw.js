/* Firebase Messaging compat SDK for background push notifications.
 * Keep this service worker at the app root so it can control the PWA scope.
 */
importScripts('./firebase-config.js');

if (self.RU_FIREBASE_CONFIG &&
    self.RU_FIREBASE_CONFIG.apiKey &&
    !String(self.RU_FIREBASE_CONFIG.apiKey).includes('PASTE_')) {
  try {
    // If Firebase's CDN is temporarily unavailable, keep the offline app worker alive.
    importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js');
    firebase.initializeApp(self.RU_FIREBASE_CONFIG);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      // Notification payloads are displayed automatically by FCM.
      // This handler covers data-only messages without duplicating notification payloads.
      if (payload && payload.notification) return;
      const data = (payload && payload.data) || {};
      const title = data.title || 'Rank Up Diary';
      const options = {
        body: data.body || 'Waktunya cek progres kecilmu hari ini.',
        icon: './icons/icon.svg',
        badge: './icons/icon.svg',
        data: { url: data.url || './index.html' },
        tag: data.tag || 'rank-up-diary-reminder'
      };
      return self.registration.showNotification(title, options);
    });
  } catch (error) {
    // The PWA remains usable even before Firebase is configured.
    console.warn('Rank Up Diary FCM worker not initialized:', error);
  }
}

/* Rank Up Diary service worker.
 * Local app files are precached. Same-origin and CDN assets are cached on first use,
 * allowing repeat visits offline after the first successful online load. */
'use strict';
const CACHE = 'rank-up-diary-shell-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './firebase-config.js',
  './css/theme.css',
  './css/components.css',
  './css/views.css',
  './js/utils.js',
  './js/data.js',
  './js/domain.js',
  './js/store.js',
  './js/storage.js',
  './js/ui.js',
  './js/views/home.js',
  './js/views/schedule.js',
  './js/views/tasks.js',
  './js/views/habits.js',
  './js/views/confidants.js',
  './js/views/notes.js',
  './js/views/money.js',
  './js/views/reflect.js',
  './js/pwa.js',
  './js/app.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('rank-up-diary-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isNavigation = req.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
        return response;
      }).catch(async () => (await caches.match(req)) || (await caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return response;
      });
    })
  );
});


// Open the PWA when a push notification is tapped.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || './index.html', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
