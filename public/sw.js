const CACHE_NAME = 'sim-bwatta-pwa-v2';

function getBasePath() {
  return new URL(self.registration.scope).pathname;
}

function getCoreAssets() {
  const basePath = getBasePath();
  return [
    basePath,
    `${basePath}manifest.webmanifest`,
    `${basePath}icons/icon-192.png`,
    `${basePath}icons/icon-512.png`,
    `${basePath}icons/icon-maskable-512.png`,
  ];
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(getCoreAssets()))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? caches.match(getBasePath())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached !== undefined) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
