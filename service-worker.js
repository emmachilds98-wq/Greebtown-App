// Greebtown — Service Worker
// Bump CACHE_VERSION any time you publish an update to force refresh of cached assets.
const CACHE_VERSION = "v153";
const CACHE_NAME = `boomtown-companion-${CACHE_VERSION}`;

// Everything the app needs to run with zero network connection.
// Paths are relative so this works from a GitHub Pages project subpath too.
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/artist-bios.js",
  "./js/artist-previews.js",
  "./js/pwa-register.js",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-167.png",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-256.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png"
];

// Install: pre-cache the full app shell, then activate immediately
// so an update doesn't wait for every tab to close.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop any caches from older versions, then take control
// of open pages right away.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("boomtown-companion-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//  - Same-origin app-shell files: cache-first, so the festival works
//    with zero signal. Falls back to network, and re-caches the result.
//  - Navigation requests (e.g. opening index.html): network-first with
//    a cache fallback, so a connected user always gets the latest build,
//    while an offline user still gets the last cached version.
//  - Cross-origin requests (Instagram, app store, etc.): left untouched,
//    normal network behaviour, no offline promise made for those.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    return; // don't intercept third-party/external links
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return networkResponse;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return networkResponse;
      }).catch(() => cached);
    })
  );
});
