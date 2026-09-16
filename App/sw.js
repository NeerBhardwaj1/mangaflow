const CACHE_NAME = 'mangaflow-app-v1';
const STATIC_ASSETS = [
  '/app/',
  '/app/css/app.css',
  '/app/js/app.js',
  '/app/js/api.js',
  '/app/js/store.js',
  '/app/js/router.js',
  '/app/js/views/homeView.js',
  '/app/js/views/searchView.js',
  '/app/js/views/detailView.js',
  '/app/js/views/readerView.js',
  '/app/js/views/libraryView.js',
  '/app/js/views/latestView.js',
  '/app/images/logo.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first for API calls, cache-first for static assets
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request))
    );
  }
});
