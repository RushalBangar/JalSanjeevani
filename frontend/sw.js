const CACHE_NAME = 'jalsanjeevani-cache-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './dashboard.html',
  './driver.html',
  './panchayat.html',
  './css/variables.css',
  './css/landing.css',
  './css/mobile.css',
  './css/dashboard.css',
  './css/login.css',
  './js/app.js',
  './js/driver.js',
  './js/panchayat.js',
  './js/dashboard.js',
  './js/supabaseClient.js',
  './js/lang.js',
  './js/html5-qrcode.min.js',
  './js/qrcode.min.js',
  './assets/favicon.svg',
  './assets/logo.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache individual files gracefully so one missing asset doesn't fail the whole install
        return Promise.allSettled(
          ASSETS_TO_CACHE.map((url) => cache.add(url))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          return networkResponse;
        }).catch(() => {
          // If offline and requesting navigation, return index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
