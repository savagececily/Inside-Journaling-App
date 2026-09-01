import { useState, useEffect } from 'react';

/**
 * Custom hook to detect online/offline status
 * Returns online status and provides event handlers
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            console.log('Network: Online');
            setIsOnline(true);
            setWasOffline(true);
            
            // Reset wasOffline flag after showing reconnection message
            setTimeout(() => {
                setWasOffline(false);
            }, 5000);
        };

        const handleOffline = () => {
            console.log('Network: Offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, wasOffline };
}

/**
 * Custom hook to detect if app is running in standalone PWA mode
 */
export function useIsStandalone() {
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if running as installed PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true || // iOS
            document.referrer.includes('android-app://'); // Android

        setIsStandalone(standalone);
    }, []);

    return isStandalone;
}

/**
 * Custom hook to check if service worker is supported and active
 */
export function useServiceWorker() {
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        // Check if service worker is supported
        if ('serviceWorker' in navigator) {
            setIsSupported(true);

            // Check if service worker is active
            navigator.serviceWorker.ready.then((reg) => {
                setIsActive(true);
                setRegistration(reg);
                console.log('Service Worker is active');
            });

            // Listen for controller changes (new service worker activated)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Service Worker controller changed');
                setIsActive(true);
            });
        }
    }, []);

    const update = async () => {
        if (registration) {
            await registration.update();
        }
    };

    return { isSupported, isActive, registration, update };
}
