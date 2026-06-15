// GarageOS service worker.
//
// Deliberately minimal: it ONLY provides offline fallback for the job-cards
// list API. It does NOT cache the app shell / HTML / hashed assets — caching
// those caused stale deploys (an old index.html referencing chunk filenames
// that no longer exist on the CDN → blank page / 404). HTML and assets are
// always served fresh from Vercel's CDN.

const API_CACHE = "garageos-api-v2";

self.addEventListener("install", () => {
  // Activate immediately; we no longer precache anything.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop every cache except the current API cache (clears the old shell cache).
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== API_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Network-first with cache fallback, ONLY for the job-cards list API.
  // Everything else (HTML, JS/CSS, other APIs) goes straight to the network.
  if (url.pathname.includes("/api/v1/job-cards")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
