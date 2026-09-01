// Local storage service for non-sensitive data
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { JournalEntry } from '../../types/api';

// Offline journal entries
export const saveOfflineEntries = async (entries: JournalEntry[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving offline entries:', error);
  }
};

export const getOfflineEntries = async (): Promise<JournalEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline entries:', error);
    return [];
  }
};

export const addOfflineEntry = async (entry: JournalEntry): Promise<void> => {
  try {
    const entries = await getOfflineEntries();
    entries.push(entry);
    await saveOfflineEntries(entries);
  } catch (error) {
    console.error('Error adding offline entry:', error);
  }
};

export const removeOfflineEntry = async (entryId: string): Promise<void> => {
  try {
    const entries = await getOfflineEntries();
    const filtered = entries.filter(e => e.id !== entryId);
    await saveOfflineEntries(filtered);
  } catch (error) {
    console.error('Error removing offline entry:', error);
  }
};

export const clearOfflineEntries = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_ENTRIES);
  } catch (error) {
    console.error('Error clearing offline entries:', error);
  }
};

// Sync queue management
interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

export const addToSyncQueue = async (item: SyncQueueItem): Promise<void> => {
  try {
    const queue = await getSyncQueue();
    queue.push(item);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

export const clearSyncQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  } catch (error) {
    console.error('Error clearing sync queue:', error);
  }
};

// Last sync timestamp
export const saveLastSyncTime = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error saving last sync time:', error);
  }
};

export const getLastSyncTime = async (): Promise<Date | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

// Theme preference
export const saveThemeMode = async (mode: 'light' | 'dark' | 'auto'): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  } catch (error) {
    console.error('Error saving theme mode:', error);
  }
};

export const getThemeMode = async (): Promise<'light' | 'dark' | 'auto'> => {
  try {
    const mode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
    return (mode as 'light' | 'dark' | 'auto') || 'auto';
  } catch (error) {
    console.error('Error getting theme mode:', error);
    return 'auto';
  }
};
