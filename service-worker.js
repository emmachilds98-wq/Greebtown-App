// Greebtown — Service Worker
// Bump CACHE_VERSION any time you publish an update to force refresh of cached assets.
const CACHE_VERSION = "v283";
const CACHE_NAME = `boomtown-companion-${CACHE_VERSION}`;

// ===============================
// BACKGROUND PUSH (FCM) — lets a chat message reach the lock screen
// with the app fully closed, not just backgrounded. A service worker
// can't import js/app.js (no ES modules here, and FIREBASE_CONFIG lives
// in a page-context script), so the same config is duplicated below —
// keep both in sync if the Firebase project ever changes. Registering a
// device for push (js/app.js's registerPushToken) and actually sending
// one (functions/index.js's sendChatPush Cloud Function) are the other
// two pieces of this feature. Wrapped in try/catch: if the CDN scripts
// fail to load (offline first install, etc.), the rest of this worker
// — caching, offline support — still needs to carry on regardless.
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
  console.warn("Firebase Messaging unavailable in service worker (push notifications won't reach the lock screen, everything else still works):", err && err.message);
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
  "./js/map-matching.js",
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
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("boomtown-companion-") && key !== CACHE_NAME)
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
