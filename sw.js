// sw.js
const CACHE_NAME = 'wfv-cache-v10'; // αυξάνει το version => καθαρίζει παλιές cache

// ΜΟΝΟ τοπικά assets. Κανένα https://... από άλλους domains.
const ASSETS = [
  '/', '/index.html', '/app.js', '/manifest.json',
  '/icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => null) // μην «σκάσεις» αν κάτι λείπει
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first για σελίδες (HTML), cache-first για τοπικά static
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Για πλοήγηση (HTML)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put('/index.html', copy));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  const url = new URL(req.url);

  // Μόνο same-origin αρχεία στην cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
      )
    );
  }
  // Cross-origin: άστο να περάσει στο δίκτυο (δεν το cache-άρουμε)
});
