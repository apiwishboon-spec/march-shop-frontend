const CACHE_NAME = 'artink-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/order.html',
  '/faq.html',
  '/story.html',
  '/privacy.html',
  '/term.html',
  '/admin.html',
  '/success.html',
  '/404.html',
  '/style.css',
  '/app.js',
  '/copyright.js',
  '/art-ink-icon.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Return offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      }
    )
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

// Background sync for offline orders
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle offline orders when back online
  return self.registration.showNotification('ART&INK', {
    body: 'Your offline orders have been synced!',
    icon: '/art-ink-icon.png'
  });
}

// Push notifications
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
