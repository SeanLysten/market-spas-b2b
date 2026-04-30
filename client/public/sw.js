// Service Worker — Cache vendor chunks pour accélérer les visites suivantes
// Les vendor chunks ont des hashes dans leurs noms de fichier (ex: vendor-recharts-BYrR42Tb.js)
// donc ils sont immutables et peuvent être cachés longtemps.

const CACHE_NAME = 'market-spas-vendor-v1';

// Patterns de fichiers à cacher (vendor chunks + fonts)
const CACHEABLE_PATTERNS = [
  /\/assets\/vendor-/,
  /\/assets\/.*\.woff2?$/,
];

// Stratégie: Cache-First pour les vendor chunks (immutables grâce au hash)
// Network-First pour tout le reste (HTML, CSS principal, API)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ne cacher que les requêtes GET vers nos propres assets
  if (event.request.method !== 'GET') return;
  if (!url.pathname.startsWith('/assets/')) return;
  
  // Vérifier si c'est un fichier cacheable
  const isCacheable = CACHEABLE_PATTERNS.some(pattern => pattern.test(url.pathname));
  if (!isCacheable) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        // Ne cacher que les réponses réussies
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});

// Nettoyage des anciens caches lors de l'activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Prise de contrôle immédiate
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
