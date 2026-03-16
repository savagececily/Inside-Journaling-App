import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './OfflineIndicator.css';

/**
 * Offline Indicator Component
 * Shows a banner when the app is offline or when reconnected
 */
export function OfflineIndicator() {
    const { isOnline, wasOffline } = useOnlineStatus();

    // Show reconnected message briefly after coming back online
    if (wasOffline && isOnline) {
        return (
            <div className="offline-indicator online" role="status" aria-live="polite">
                <div className="indicator-content">
                    <span className="indicator-icon">✅</span>
                    <span className="indicator-text">Back Online</span>
                </div>
            </div>
        );
    }

    // Show offline message when offline
    if (!isOnline) {
        return (
            <div className="offline-indicator offline" role="status" aria-live="polite">
                <div className="indicator-content">
                    <span className="indicator-icon">📡</span>
                    <span className="indicator-text">
                        You're offline - Some features may be limited
                    </span>
                </div>
            </div>
        );
    }

    // Don't show anything when online (normal state)
    return null;
}
