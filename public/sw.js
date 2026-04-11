const CACHE = 'hybrid-v1';
const PRECACHE = ['/'];

// Install — cache the shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache for the app shell only
// Supabase API calls always go to network
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept Supabase or external requests
  if (url.hostname !== self.location.hostname) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful shell responses
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
