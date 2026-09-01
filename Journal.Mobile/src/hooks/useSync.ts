// Hook for sync state and network connectivity
import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import syncService, { SyncState } from '../services/sync/syncService';

export function useSyncState() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    isOnline: true,
    pendingCount: 0,
    lastSync: null,
    error: null,
  });

  useEffect(() => {
    // Initial state
    syncService.getSyncState().then(setSyncState);

    // Subscribe to sync state changes
    const unsubscribe = syncService.subscribeSyncState(setSyncState);

    return unsubscribe;
  }, []);

  return syncState;
}

export function useNetworkState() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [networkType, setNetworkType] = useState<string>('unknown');

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
      setNetworkType(state.type);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setNetworkType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isConnected, networkType };
}

/**
 * Hook to start/stop background sync based on app state
 */
export function useBackgroundSync() {
  useEffect(() => {
    // Start background sync on mount
    syncService.startBackgroundSync();

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, trigger sync
        syncService.triggerSync().catch(error => {
          console.error('Error triggering sync on app active:', error);
        });
      }
      // Optional: stop sync when app goes to background to save battery
      // if (nextAppState === 'background') {
      //   syncService.stopBackgroundSync();
      // }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      subscription.remove();
      syncService.stopBackgroundSync();
    };
  }, []);
}
