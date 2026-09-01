/**
 * Inside Journaling App - Service Worker
 * Provides offline support and caching for the PWA
 * Cache Strategy: Cache-first for static assets, Network-first for API calls
 */

const CACHE_NAME = 'mental-health-journal-v1';
const DATA_CACHE_NAME = 'mental-health-journal-data-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html', // Optional: create a custom offline page
];

// Max age for cached data (7 days)
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell');
            // Don't fail if some assets can't be cached
            return cache.addAll(STATIC_ASSETS).catch((error) => {
                console.warn('[Service Worker] Failed to cache some assets:', error);
                // Cache what we can
                return Promise.all(
                    STATIC_ASSETS.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn(`[Service Worker] Failed to cache ${url}:`, err);
                        })
                    )
                );
            });
        }).then(() => {
            // Force the waiting service worker to become the active service worker
            return self.skipWaiting();
        })
    );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        // Delete old caches
                        return name !== CACHE_NAME && name !== DATA_CACHE_NAME;
                    })
                    .map((name) => {
                        console.log('[Service Worker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

/**
 * Fetch Event - Serve from cache or network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // API requests - Network-first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Static assets - Cache-first strategy
    event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache-First Strategy
 * Best for static assets (CSS, JS, images, fonts)
 */
async function cacheFirstStrategy(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Check if cache is stale
            const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
            const now = new Date();
            const age = now.getTime() - cacheDate.getTime();

            // If cache is not too old, use it
            if (age < MAX_AGE) {
                console.log('[Service Worker] Serving from cache:', request.url);
                return cachedResponse;
            }
        }

        // Cache miss or stale - fetch from network
        console.log('[Service Worker] Fetching from network:', request.url);
        const networkResponse = await fetch(request);

        // Cache the new response for next time
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache even if stale
        console.log('[Service Worker] Network failed, using stale cache:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If we have an offline page and this was a navigation request
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match('/offline.html');
            if (offlineResponse) {
                return offlineResponse;
            }
        }

        // Return a basic offline response
        return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain',
            }),
        });
    }
}

/**
 * Network-First Strategy
 * Best for API requests (fresh data is important)
 */
async function networkFirstStrategy(request) {
    const cache = await caches.open(DATA_CACHE_NAME);

    try {
        // Try network first
        console.log('[Service Worker] Fetching API from network:', request.url);
        const networkResponse = await fetch(request);

        // Cache successful responses for offline fallback
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed - try cache
        console.log('[Service Worker] Network failed, trying cache for API:', request.url);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            // Add a custom header to indicate this is cached data
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-From-Cache', 'true');

            return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers,
            });
        }

        // No cache available - return error
        return new Response(
            JSON.stringify({
                error: 'Offline - Data not available in cache',
                offline: true,
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
            }
        );
    }
}

/**
 * Background Sync - For future enhancement
 * Could be used to sync journal entries when back online
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-journal-entries') {
        event.waitUntil(syncJournalEntries());
    }
});

async function syncJournalEntries() {
    // TODO: Implement background sync for journal entries
    // This would sync any entries created while offline
    console.log('[Service Worker] Syncing journal entries...');
}

/**
 * Push Notifications - For future enhancement
 * Could be used for reminders to journal
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received');
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Inside Journaling App';
    const options = {
        body: data.body || 'Time to check in with yourself',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        actions: [
            {
                action: 'open',
                title: 'Open Journal',
            },
            {
                action: 'close',
                title: 'Dismiss',
            },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event.action);
    
    event.notification.close();

    if (event.action === 'open') {
        const urlToOpen = event.notification.data || '/';
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then((clientList) => {
                // Check if window is already open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
        );
    }
});

/**
 * Message Handler - For communication with the app
 */
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(urls);
            })
        );
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
        );
    }
});
