// Sync Service for background synchronization
import NetInfo from '@react-native-community/netinfo';
import offlineStorage, { SyncQueueItem } from '../storage/offlineStorage';
import journalService from '../journal/journalService';

const MAX_RETRY_COUNT = 3;
const SYNC_INTERVAL_MS = 30000; // 30 seconds

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  pendingCount: number;
  lastSync: string | null;
  error: string | null;
}

let syncInterval: NodeJS.Timeout | null = null;
let syncInProgress = false;
let syncStateListeners: ((state: SyncState) => void)[] = [];

/**
 * Get current sync state
 */
export async function getSyncState(): Promise<SyncState> {
  const netState = await NetInfo.fetch();
  const queue = await offlineStorage.getSyncQueue();
  const lastSync = await offlineStorage.getLastSyncTimestamp();
  
  return {
    status: syncInProgress ? 'syncing' : 'idle',
    isOnline: netState.isConnected ?? false,
    pendingCount: queue.length,
    lastSync,
    error: null,
  };
}

/**
 * Subscribe to sync state changes
 */
export function subscribeSyncState(listener: (state: SyncState) => void): () => void {
  syncStateListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    syncStateListeners = syncStateListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all sync state listeners
 */
async function notifySyncStateChange() {
  const state = await getSyncState();
  syncStateListeners.forEach(listener => listener(state));
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: SyncQueueItem): Promise<void> {
  try {
    switch (item.type) {
      case 'create':
        await journalService.createJournalEntry(item.data);
        break;
      
      case 'update':
        await journalService.updateJournalEntry(item.data.id, item.data);
        break;
      
      case 'delete':
        await journalService.deleteJournalEntry(item.data.id);
        break;
      
      default:
        console.warn('Unknown sync item type:', item.type);
    }
    
    // Success - remove from queue
    await offlineStorage.removeFromSyncQueue(item.id);
  } catch (error: any) {
    console.error('Error processing sync item:', error);
    
    // Increment retry count
    await offlineStorage.incrementRetryCount(item.id);
    
    // Remove if max retries exceeded
    if (item.retryCount >= MAX_RETRY_COUNT) {
      console.warn(`Max retries exceeded for sync item ${item.id}, removing from queue`);
      await offlineStorage.removeFromSyncQueue(item.id);
    }
    
    throw error;
  }
}

/**
 * Sync offline entries with the server
 */
export async function syncOfflineEntries(): Promise<void> {
  try {
    const unsyncedEntries = await offlineStorage.getUnsyncedEntries();
    
    for (const entry of unsyncedEntries) {
      try {
        const serverEntry = await journalService.createJournalEntry({
          content: entry.content,
          audioUrl: entry.audioUrl,
          audioTranscription: entry.audioTranscription,
        });
        
        // Mark as synced
        await offlineStorage.markEntrySynced(entry.localId, serverEntry.id);
      } catch (error) {
        console.error('Error syncing offline entry:', error);
        // Continue with next entry
      }
    }
  } catch (error) {
    console.error('Error in syncOfflineEntries:', error);
    throw error;
  }
}

/**
 * Process sync queue
 */
export async function processSyncQueue(): Promise<{ success: number; failed: number }> {
  if (syncInProgress) {
    console.log('Sync already in progress, skipping...');
    return { success: 0, failed: 0 };
  }
  
  try {
    syncInProgress = true;
    await notifySyncStateChange();
    
    // Check network connectivity
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No network connection, skipping sync');
      return { success: 0, failed: 0 };
    }
    
    // Get sync queue
    const queue = await offlineStorage.getSyncQueue();
    
    if (queue.length === 0) {
      console.log('Sync queue is empty');
      return { success: 0, failed: 0 };
    }
    
    console.log(`Processing ${queue.length} items in sync queue`);
    
    let successCount = 0;
    let failedCount = 0;
    
    // Process each item
    for (const item of queue) {
      try {
        await processSyncItem(item);
        successCount++;
      } catch (error) {
        failedCount++;
      }
    }
    
    // Sync offline entries
    await syncOfflineEntries();
    
    // Update last sync timestamp
    await offlineStorage.updateLastSyncTimestamp();
    
    // Cleanup old synced entries
    await offlineStorage.cleanupSyncedEntries();
    
    console.log(`Sync complete: ${successCount} succeeded, ${failedCount} failed`);
    
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('Error processing sync queue:', error);
    throw error;
  } finally {
    syncInProgress = false;
    await notifySyncStateChange();
  }
}

/**
 * Start background sync
 */
export function startBackgroundSync(): void {
  if (syncInterval) {
    console.log('Background sync already running');
    return;
  }
  
  console.log('Starting background sync');
  
  // Initial sync
  processSyncQueue().catch(error => {
    console.error('Error in initial sync:', error);
  });
  
  // Periodic sync
  syncInterval = setInterval(() => {
    processSyncQueue().catch(error => {
      console.error('Error in background sync:', error);
    });
  }, SYNC_INTERVAL_MS);
  
  // Listen for network state changes
  NetInfo.addEventListener(state => {
    if (state.isConnected && !syncInProgress) {
      console.log('Network connected, triggering sync');
      processSyncQueue().catch(error => {
        console.error('Error in network sync:', error);
      });
    }
  });
}

/**
 * Stop background sync
 */
export function stopBackgroundSync(): void {
  if (syncInterval) {
    console.log('Stopping background sync');
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Manually trigger sync
 */
export async function triggerSync(): Promise<void> {
  console.log('Manually triggering sync');
  await processSyncQueue();
}

const syncService = {
  getSyncState,
  subscribeSyncState,
  processSyncQueue,
  syncOfflineEntries,
  startBackgroundSync,
  stopBackgroundSync,
  triggerSync,
};

export default syncService;
