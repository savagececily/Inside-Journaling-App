// Offline Storage Service using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, JournalEntryRequest } from '../../types/api';

const KEYS = {
  OFFLINE_ENTRIES: 'offline_journal_entries',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync_timestamp',
};

export interface OfflineEntry extends JournalEntryRequest {
  localId: string;
  createdAt: string;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
}

/**
 * Save a journal entry offline
 */
export async function saveOfflineEntry(entry: Omit<OfflineEntry, 'localId' | 'createdAt' | 'synced'>): Promise<OfflineEntry> {
  try {
    const entries = await getOfflineEntries();
    
    const newEntry: OfflineEntry = {
      ...entry,
      localId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    
    entries.push(newEntry);
    await AsyncStorage.setItem(KEYS.OFFLINE_ENTRIES, JSON.stringify(entries));
    
    return newEntry;
  } catch (error) {
    console.error('Error saving offline entry:', error);
    throw error;
  }
}

/**
 * Get all offline entries
 */
export async function getOfflineEntries(): Promise<OfflineEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.OFFLINE_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline entries:', error);
    return [];
  }
}

/**
 * Get unsynced offline entries
 */
export async function getUnsyncedEntries(): Promise<OfflineEntry[]> {
  try {
    const entries = await getOfflineEntries();
    return entries.filter(entry => !entry.synced);
  } catch (error) {
    console.error('Error getting unsynced entries:', error);
    return [];
  }
}

/**
 * Mark an offline entry as synced
 */
export async function markEntrySynced(localId: string, serverId: string): Promise<void> {
  try {
    const entries = await getOfflineEntries();
    const updatedEntries = entries.map(entry =>
      entry.localId === localId ? { ...entry, synced: true, id: serverId } : entry
    );
    await AsyncStorage.setItem(KEYS.OFFLINE_ENTRIES, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error marking entry as synced:', error);
    throw error;
  }
}

/**
 * Delete an offline entry
 */
export async function deleteOfflineEntry(localId: string): Promise<void> {
  try {
    const entries = await getOfflineEntries();
    const filteredEntries = entries.filter(entry => entry.localId !== localId);
    await AsyncStorage.setItem(KEYS.OFFLINE_ENTRIES, JSON.stringify(filteredEntries));
  } catch (error) {
    console.error('Error deleting offline entry:', error);
    throw error;
  }
}

/**
 * Remove synced entries older than 30 days
 */
export async function cleanupSyncedEntries(): Promise<void> {
  try {
    const entries = await getOfflineEntries();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredEntries = entries.filter(entry => {
      if (!entry.synced) return true; // Keep unsynced entries
      const entryDate = new Date(entry.createdAt);
      return entryDate > thirtyDaysAgo; // Keep recent synced entries
    });
    
    await AsyncStorage.setItem(KEYS.OFFLINE_ENTRIES, JSON.stringify(filteredEntries));
  } catch (error) {
    console.error('Error cleaning up synced entries:', error);
  }
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'timestamp' | 'retryCount'>): Promise<void> {
  try {
    const queue = await getSyncQueue();
    
    const queueItem: SyncQueueItem = {
      ...item,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    
    queue.push(queueItem);
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
}

/**
 * Get sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filteredQueue = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error removing from sync queue:', error);
    throw error;
  }
}

/**
 * Increment retry count for a sync queue item
 */
export async function incrementRetryCount(id: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const updatedQueue = queue.map(item =>
      item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
    );
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error incrementing retry count:', error);
    throw error;
  }
}

/**
 * Clear sync queue (use with caution)
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing sync queue:', error);
    throw error;
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTimestamp(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return null;
  }
}

/**
 * Update last sync timestamp
 */
export async function updateLastSyncTimestamp(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error updating last sync timestamp:', error);
  }
}

/**
 * Clear all offline data (for logout or reset)
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.OFFLINE_ENTRIES,
      KEYS.SYNC_QUEUE,
      KEYS.LAST_SYNC,
    ]);
  } catch (error) {
    console.error('Error clearing offline data:', error);
    throw error;
  }
}

const offlineStorage = {
  saveOfflineEntry,
  getOfflineEntries,
  getUnsyncedEntries,
  markEntrySynced,
  deleteOfflineEntry,
  cleanupSyncedEntries,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  incrementRetryCount,
  clearSyncQueue,
  getLastSyncTimestamp,
  updateLastSyncTimestamp,
  clearAllOfflineData,
};

export default offlineStorage;
