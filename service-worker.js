// Bump CACHE_VERSION any time you publish an update to force refresh of cached assets.
const CACHE_VERSION = "v296";
const CACHE_NAME = `boomtown-companion-${CACHE_VERSION}`;

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/style.css",
  "/js/app.js",
  "/js/artist-bios.js",
  "/js/artist-previews.js",
  "/js/boomtown-locations-2026.js",
  "/js/pwa-register.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("boomtown-companion-") &&
                key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Keep JavaScript network-first so updates reach users quickly.
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith("service-worker.js")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });

          return response;
        })
        .catch(() => caches.match(event.request))
    );

    return;
  }

  // Navigation fallback for offline use.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/index.html")
      )
    );

    return;
  }

  // Cache-first for other assets, updating cache in background.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }

          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
