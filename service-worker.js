const CACHE_PREFIX = `scale-monitor:${self.registration.scope}:`;
const CACHE_NAME = CACHE_PREFIX + "v1";
const APP_URL = self.registration.scope;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.add(APP_URL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const appUrl = new URL(APP_URL);
  if (event.request.mode !== "navigate" ||
      url.origin !== appUrl.origin ||
      (url.pathname !== appUrl.pathname && url.pathname !== new URL("index.html", APP_URL).pathname)) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(APP_URL, response.clone());
      return response;
    } catch (err) {
      const cached = await cache.match(APP_URL);
      if (cached) return cached;
      throw err;
    }
  })());
});
