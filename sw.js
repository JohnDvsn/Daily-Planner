/* Rank Up Diary service worker.
 * Local app files are precached. Same-origin and CDN assets are cached on first use,
 * allowing repeat visits offline after the first successful online load. */
'use strict';
const CACHE = 'rank-up-diary-shell-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
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
