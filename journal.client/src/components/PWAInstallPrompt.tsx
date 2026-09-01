import { useState, useEffect } from 'react';
import './PWAInstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Check if user has previously dismissed
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            // Show again after 7 days
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isInStandaloneMode = (window.navigator as any).standalone;

        if (isIOS && !isInStandaloneMode) {
            // Show iOS instructions
            setTimeout(() => setShowIOSInstructions(true), 3000); // Show after 3 seconds
            return;
        }

        // Listen for beforeinstallprompt event (Android/Chrome/Edge)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            // Show prompt after 3 seconds
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setShowIOSInstructions(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
            localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setShowIOSInstructions(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (isInstalled) {
        return null;
    }

    if (showIOSInstructions) {
        return (
            <div className="pwa-install-prompt ios">
                <div className="prompt-content">
                    <button 
                        className="prompt-close" 
                        onClick={handleDismiss}
                        aria-label="Close install prompt"
                    >
                        ×
                    </button>
                    <div className="prompt-icon">📱</div>
                    <h3 className="prompt-title">Install Inside Journal</h3>
                    <p className="prompt-message">
                        Add this app to your home screen for quick access and a better experience!
                    </p>
                    <div className="ios-instructions">
                        <div className="instruction-step">
                            <span className="step-number">1</span>
                            <p>Tap the <strong>Share</strong> button <span className="share-icon">⎋</span> at the bottom of Safari</p>
                        </div>
                        <div className="instruction-step">
                            <span className="step-number">2</span>
                            <p>Scroll down and tap <strong>"Add to Home Screen"</strong> <span className="add-icon">➕</span></p>
                        </div>
                        <div className="instruction-step">
                            <span className="step-number">3</span>
                            <p>Tap <strong>"Add"</strong> in the top right corner</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showPrompt && deferredPrompt) {
        return (
            <div className="pwa-install-prompt android">
                <div className="prompt-content">
                    <button 
                        className="prompt-close" 
                        onClick={handleDismiss}
                        aria-label="Close install prompt"
                    >
                        ×
                    </button>
                    <div className="prompt-icon">🚀</div>
                    <h3 className="prompt-title">Install Inside Journal</h3>
                    <p className="prompt-message">
                        Install this app on your device for quick access and offline support!
                    </p>
                    <div className="prompt-actions">
                        <button 
                            className="install-button" 
                            onClick={handleInstallClick}
                        >
                            Install App
                        </button>
                        <button 
                            className="dismiss-button" 
                            onClick={handleDismiss}
                        >
                            Not Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
