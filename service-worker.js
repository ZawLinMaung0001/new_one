/* Lightweight offline support for the CCNA 2 PWA.
   - Precache app shell + chapter JSON
   - Runtime cache for images
*/

const VERSION = "v2";
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/maskable.svg",
  "./data/chapter6.json",
  "./data/chapter7.json",
  "./data/chapter8.json",
  "./data/chapter9.json",
  "./data/chapter10.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== PRECACHE && k !== RUNTIME) return caches.delete(k);
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (!isSameOrigin(req.url)) return;

  // App shell + JSON: stale-while-revalidate
  if (
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/style.css") ||
    url.pathname.endsWith("/script.js") ||
    url.pathname.endsWith("/manifest.webmanifest") ||
    url.pathname.startsWith("/data/")
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(PRECACHE).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Images: cache-first (great for offline exhibits)
  if (url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached);
      })
    );
  }
});
