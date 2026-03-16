/**
 * Service Worker Registration
 * Handles registration, updates, and lifecycle management of the service worker
 */

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

type Config = {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onOffline?: () => void;
    onOnline?: () => void;
};

export function register(config?: Config) {
    if ('serviceWorker' in navigator) {
        // Only register service worker in production or if explicitly enabled
        const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

        if (isLocalhost) {
            // Check if service worker still exists in localhost
            checkValidServiceWorker(swUrl, config);

            // Add logging for localhost
            navigator.serviceWorker.ready.then(() => {
                console.log(
                    'This web app is being served cache-first by a service worker. ' +
                    'To learn more, visit https://cra.link/PWA'
                );
            });
        } else {
            // Register service worker for production
            registerValidSW(swUrl, config);
        }

        // Listen for network status changes
        window.addEventListener('online', () => {
            console.log('App is online');
            config?.onOnline?.();
        });

        window.addEventListener('offline', () => {
            console.log('App is offline - using cached data');
            config?.onOffline?.();
        });
    }
}

function registerValidSW(swUrl: string, config?: Config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            console.log('Service Worker registered successfully:', registration);

            // Check for updates periodically (every hour)
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);

            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) {
                    return;
                }
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // New content is available; please refresh
                            console.log(
                                'New content is available; please refresh to update.'
                            );
                            config?.onUpdate?.(registration);
                        } else {
                            // Content is cached for offline use
                            console.log('Content is cached for offline use.');
                            config?.onSuccess?.(registration);
                        }
                    }
                };
            };
        })
        .catch((error) => {
            console.error('Error during service worker registration:', error);
        });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
    // Check if the service worker can be found
    fetch(swUrl, {
        headers: { 'Service-Worker': 'script' },
    })
        .then((response) => {
            const contentType = response.headers.get('content-type');
            if (
                response.status === 404 ||
                (contentType != null && contentType.indexOf('javascript') === -1)
            ) {
                // No service worker found, reload the page
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister().then(() => {
                        window.location.reload();
                    });
                });
            } else {
                // Service worker found, proceed as normal
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            console.log('No internet connection found. App is running in offline mode.');
            config?.onOffline?.();
        });
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
                console.log('Service Worker unregistered');
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}

/**
 * Send a message to the service worker
 */
export function sendMessageToSW(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!navigator.serviceWorker.controller) {
            reject(new Error('No service worker controller'));
            return;
        }

        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            if (event.data.error) {
                reject(event.data.error);
            } else {
                resolve(event.data);
            }
        };

        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
}

/**
 * Force update the service worker
 */
export function forceUpdate(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!navigator.serviceWorker.controller) {
            reject(new Error('No service worker controller'));
            return;
        }

        navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
                registration.update().then(() => {
                    console.log('Service Worker update triggered');
                    resolve();
                });
            } else {
                reject(new Error('No service worker registration'));
            }
        });
    });
}
