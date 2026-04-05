const CACHE_NAME = 'stmi-v1';
const BASE = '/sana-tu-mundo-APP';

const ASSETS = [
  BASE + '/Sana-Tu-Mundo-Interior.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png'
];

/* Instalación: guardar assets en cache */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/* Activación: limpiar caches viejas */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch: cache-first para los assets propios, network-first para el resto */
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  /* Solo interceptamos requests del mismo origen dentro del scope */
  if (!url.pathname.startsWith(BASE)) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      return fetch(event.request).then(function(response) {
        /* Guardamos en cache solo responses válidas */
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        /* Sin red y sin cache: devolver el HTML principal como fallback */
        return caches.match(BASE + '/Sana-Tu-Mundo-Interior.html');
      });
    })
  );
});
