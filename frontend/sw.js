/**
 * JalSanjeevani (RouteGuard) Service Worker
 * Architecture: Online-First (Network-First) with Offline PWA Cache Fallback.
 *
 * 1. Online-First: Always fetches fresh resources from the network when connected.
 * 2. Background Dynamic Cache: Successfully fetched resources update the local cache automatically.
 * 3. Offline PWA Fallback: If disconnected, serves resources seamlessly from the local cache.
 */

const CACHE_NAME = 'jalsanjeevani-online-first-v5';
const PRECACHE_ASSETS = [
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

// Install: Pre-cache core shell for offline readiness
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) => cache.add(url))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: Immediately claim all clients and remove old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: ONLINE-FIRST (Network-First) with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Live APIs and WebSockets bypass SW cache completely to ensure real-time data
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('onrender.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    // 1. ONLINE-FIRST: Attempt network fetch first
    fetch(event.request)
      .then((networkResponse) => {
        // If network request succeeded, update cache with the fresh response
        if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // 2. OFFLINE FALLBACK: When network is offline or fails, serve from cache
        console.log('📶 [SW] Network unavailable. Serving from offline cache:', event.request.url);
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigation request fails offline, fallback to index.html
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html') || await caches.match('/');
          if (fallback) return fallback;
        }

        return new Response('Offline: Resource not in local cache', {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});
