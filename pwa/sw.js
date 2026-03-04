// Service Worker for ART&INK PWA - Online Only Mode
const CACHE_NAME = 'artink-v1';

// Minimal cache for essential files only
const urlsToCache = [
  '../assets/img/art-ink-icon.png',
  '../pwa/manifest.json'
];

// Install event - cache only essential resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW installed - caching essential files only');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - always try network first (online only)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for icons only
        if (event.request.url.includes('art-ink-icon.png') || 
            event.request.url.includes('manifest.json')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Only serve from cache for icons and manifest
        if (event.request.url.includes('art-ink-icon.png') || 
            event.request.url.includes('manifest.json')) {
          return caches.match(event.request);
        }
        
        // For all other requests, show offline message
        if (event.request.destination === 'document') {
          return new Response(
            '<html><body><h1>ART&INK - Offline</h1><p>Please connect to the internet to use our shop.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
        
        return new Response('Offline - Please connect to internet', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notifications (still works when online)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New designs available at ART&INK!',
    icon: '/art-ink-icon.png',
    badge: '/art-ink-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore new designs',
        icon: '/art-ink-icon.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/art-ink-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ART&INK', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
