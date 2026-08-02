 const CACHE_VERSION = "v296";
 const CACHE_NAME = `greebtown-${CACHE_VERSION}`;

 self.addEventListener("install", (event) => {
+  self.skipWaiting();
   event.waitUntil(
     caches.open(CACHE_NAME)
       .then((cache) => cache.addAll(APP_FILES))
   );
 });

 self.addEventListener("activate", (event) => {
   event.waitUntil(
     caches.keys().then((keys) =>
       Promise.all(
         keys
           .filter((key) => key !== CACHE_NAME)
           .map((key) => caches.delete(key))
       )
-    )
+    ).then(() => self.clients.claim())
   );
 });
