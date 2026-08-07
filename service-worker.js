// Greebtown — Service Worker
// Bump CACHE_VERSION any time you publish an update to force refresh of cached assets.
const CACHE_VERSION = "v410";
const CACHE_NAME = `boomtown-companion-${CACHE_VERSION}`;

try{
  importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
  firebase.initializeApp({
    apiKey: "AIzaSyAgiBfNu3IpTCpumJQrYkFOh03VNFTWOVQ",
    authDomain: "greebtown.firebaseapp.com",
    projectId: "greebtown",
    storageBucket: "greebtown.firebasestorage.app",
    messagingSenderId: "944940862671",
    appId: "1:944940862671:web:f84ece4e66b052b4f97bba"
  });
  firebase.messaging();
}catch(err){
  console.warn("Firebase Messaging unavailable in service worker:", err && err.message);
}

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/artist-bios.js",
  "./js/artist-previews.js",
  "./js/boomtown-locations-2026.js",
  "./map-system/data/map-data.js",
  "./map-system/data/map-document.json",
  "./map-system/editor/index.html",
  "./map-system/editor/editor.css",
  "./map-system/editor/editor.js",
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      // Deletes ANY cache that isn't this version's own, not just ones
      // prefixed "boomtown-companion-" — a brief incident (2 Aug 2026,
      // see CLAUDE.md) shipped a broken service worker using a different
      // cache-name prefix ("greebtown-"), so a plain prefix filter would
      // leave those orphaned in any browser that installed it. This
      // origin only ever hosts this one PWA, so removing every cache
      // that isn't CACHE_NAME is safe, not just the ones matching a
      // prefix we might have changed since.
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    return;
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

  // Network-first for JS so map/location updates always reach clients
  if (url.pathname.includes("/js/") || url.pathname.endsWith(".js")) {
    event.respondWith(
      fetch(req).then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return networkResponse;
      }).catch(() => caches.match(req))
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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => "focus" in c);
      if (existing) return existing.focus();
      return self.clients.openWindow("./");
    })
  );
});
