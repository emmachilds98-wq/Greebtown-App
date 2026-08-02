// Bump CACHE_VERSION any time you publish an update to force refresh of cached assets.
const CACHE_VERSION = "v295";
const CACHE_NAME = `boomtown-companion-${CACHE_VERSION}`;

try {
  importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

  firebase.initializeApp({
    apiKey: "AIzaSyAgiBfNu3IpTCpumJQrYkFOh03VNFTWOVQ",
    authDomain: "greebtown.firebaseapp.com",
    projectId: "greebtown",
    storageBucket: "greebtown.appspot.com",
    messagingSenderId: "102345678901",
    appId: "1:102345678901:web:abc123",
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title =
      (payload.notification && payload.notification.title) || "Greebtown";

    const options = {
      body: (payload.notification && payload.notification.body) || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: payload.data || {},
    };

    self.registration.showNotification(title, options);
  });
} catch (e) {}

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/styles.css",
  "/js/app.js",
  "/js/artist-bios.js",
  "/js/artist-previews.js",
  "/js/boomtown-locations-2026.js",
  "/js/pwa-register.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => {})
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
              (k) => k.startsWith("boomtown-companion-") && k !== CACHE_NAME
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Network-first for JavaScript so map/data updates reach clients quickly.
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

  // Cache-first for everything else.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
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

      return cached || fetched;
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});