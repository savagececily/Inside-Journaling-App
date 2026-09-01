// React Query hooks for journal entries with offline support
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import journalService from '../services/journal/journalService';
import offlineStorage from '../services/storage/offlineStorage';
import { JournalEntry, JournalEntryRequest, UpdateJournalEntryRequest } from '../types/api';
import { Alert } from 'react-native';

// Query keys
export const journalKeys = {
  all: ['journal'] as const,
  lists: () => [...journalKeys.all, 'list'] as const,
  list: (page: number) => [...journalKeys.lists(), page] as const,
  details: () => [...journalKeys.all, 'detail'] as const,
  detail: (id: string) => [...journalKeys.details(), id] as const,
  offline: () => [...journalKeys.all, 'offline'] as const,
};

/**
 * Hook to fetch paginated journal entries (includes offline entries)
 */
export function useJournalEntries(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: journalKeys.list(page),
    queryFn: async () => {
      // Try to fetch from server
      try {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
          // Offline: return offline entries only
          const offlineEntries = await offlineStorage.getOfflineEntries();
          return offlineEntries.map(entry => ({
            ...entry,
            id: entry.localId,
            userId: 'offline',
            createdAt: entry.createdAt,
            sentiment: undefined,
            keyPhrases: undefined,
            summary: undefined,
            affirmation: undefined,
          })) as JournalEntry[];
        }
        
        // Online: fetch from server
        const serverEntries = await journalService.getJournalEntries(page, pageSize);
        
        // If first page, merge with unsynced offline entries
        if (page === 1) {
          const unsyncedEntries = await offlineStorage.getUnsyncedEntries();
          const offlineMapped = unsyncedEntries.map(entry => ({
            ...entry,
            id: entry.localId,
            userId: 'offline',
            sentiment: undefined,
            keyPhrases: undefined,
            summary: undefined,
            affirmation: undefined,
          })) as JournalEntry[];
          
          return [...offlineMapped, ...serverEntries];
        }
        
        return serverEntries;
      } catch (error) {
        // Network error: return offline entries
        console.error('Error fetching entries, falling back to offline:', error);
        const offlineEntries = await offlineStorage.getOfflineEntries();
        return offlineEntries.map(entry => ({
          ...entry,
          id: entry.localId,
          userId: 'offline',
          createdAt: entry.createdAt,
          sentiment: undefined,
          keyPhrases: undefined,
          summary: undefined,
          affirmation: undefined,
        })) as JournalEntry[];
      }
    },
  });
}

/**
 * Hook to fetch a single journal entry by ID
 */
export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: journalKeys.detail(id),
    queryFn: async () => {
      // Check if it's an offline entry
      if (id.startsWith('offline_')) {
        const offlineEntries = await offlineStorage.getOfflineEntries();
        const offlineEntry = offlineEntries.find(e => e.localId === id);
        
        if (!offlineEntry) {
          throw new Error('Entry not found');
        }
        
        return {
          ...offlineEntry,
          id: offlineEntry.localId,
          userId: 'offline',
          sentiment: undefined,
          keyPhrases: undefined,
          summary: undefined,
          affirmation: undefined,
        } as JournalEntry;
      }
      
      // Online entry: fetch from server
      try {
        return await journalService.getJournalEntryById(id);
      } catch (error) {
        console.error('Error fetching entry:', error);
        throw error;
      }
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new journal entry with offline support
 */
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: JournalEntryRequest) => {
      // Check network connectivity
      const netState = await NetInfo.fetch();
      
      if (!netState.isConnected) {
        // Offline: save to offline storage
        console.log('Creating entry offline');
        const offlineEntry = await offlineStorage.saveOfflineEntry(data);
        
        // Add to sync queue
        await offlineStorage.addToSyncQueue({
          id: offlineEntry.localId,
          type: 'create',
          data,
        });
        
        // Return a mock entry
        return {
          id: offlineEntry.localId,
          userId: 'offline',
          content: data.content,
          audioUrl: data.audioUrl,
          audioTranscription: data.audioTranscription,
          createdAt: offlineEntry.createdAt,
          sentiment: undefined,
          keyPhrases: undefined,
          summary: undefined,
          affirmation: undefined,
        } as JournalEntry;
      }
      
      // Online: create via API
      try {
        return await journalService.createJournalEntry(data);
      } catch (error: any) {
        // Network error during creation: save offline
        console.error('Error creating entry, saving offline:', error);
        const offlineEntry = await offlineStorage.saveOfflineEntry(data);
        
        // Add to sync queue
        await offlineStorage.addToSyncQueue({
          id: offlineEntry.localId,
          type: 'create',
          data,
        });
        
        throw new Error('Entry saved offline. Will sync when connection is restored.');
      }
    },
    onSuccess: (newEntry) => {
      // Invalidate and refetch journal list queries
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      
      // Add the new entry to the cache
      queryClient.setQueryData(journalKeys.detail(newEntry.id), newEntry);
    },
    onError: (error: any) => {
      if (!error.message?.includes('saved offline')) {
        Alert.alert(
          'Save Failed',
          error.message || 'Failed to save journal entry. Please try again.',
          [{ text: 'OK' }]
        );
      }
    },
  });
}

/**
 * Hook to update a journal entry
 */
export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJournalEntryRequest }) =>
      journalService.updateJournalEntry(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: journalKeys.detail(id) });

      // Snapshot the previous value
      const previousEntry = queryClient.getQueryData<JournalEntry>(journalKeys.detail(id));

      // Optimistically update to the new value
      if (previousEntry) {
        queryClient.setQueryData<JournalEntry>(journalKeys.detail(id), {
          ...previousEntry,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousEntry };
    },
    onError: (error, { id }, context) => {
      // Rollback to previous value on error
      if (context?.previousEntry) {
        queryClient.setQueryData(journalKeys.detail(id), context.previousEntry);
      }

      Alert.alert(
        'Update Failed',
        'Failed to update journal entry. Please try again.',
        [{ text: 'OK' }]
      );
    },
    onSuccess: (updatedEntry) => {
      // Update the cache with server data
      queryClient.setQueryData(journalKeys.detail(updatedEntry.id), updatedEntry);
      
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
    },
  });
}

/**
 * Hook to delete a journal entry with offline support
 */
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if it's an offline entry
      if (id.startsWith('offline_')) {
        // Remove from offline storage
        await offlineStorage.deleteOfflineEntry(id);
        return;
      }
      
      // Check network connectivity
      const netState = await NetInfo.fetch();
      
      if (!netState.isConnected) {
        // Offline: add to sync queue
        await offlineStorage.addToSyncQueue({
          id: `delete_${id}_${Date.now()}`,
          type: 'delete',
          data: { id },
        });
        throw new Error('Delete queued. Will sync when connection is restored.');
      }
      
      // Online: delete via API
      try {
        await journalService.deleteJournalEntry(id);
      } catch (error: any) {
        // Network error: add to sync queue
        await offlineStorage.addToSyncQueue({
          id: `delete_${id}_${Date.now()}`,
          type: 'delete',
          data: { id },
        });
        throw new Error('Delete queued. Will sync when connection is restored.');
      }
    },
    onMutate: async (id) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: journalKeys.detail(id) });

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: journalKeys.detail(id) });

      // Optimistically remove from list caches
      queryClient.setQueriesData<JournalEntry[]>(
        { queryKey: journalKeys.lists() },
        (oldData) => oldData?.filter((entry) => entry.id !== id)
      );
    },
    onError: (error: any) => {
      // Refetch all queries on error to restore consistency
      queryClient.invalidateQueries({ queryKey: journalKeys.all });

      if (!error.message?.includes('queued')) {
        Alert.alert(
          'Delete Failed',
          error.message || 'Failed to delete journal entry. Please try again.',
          [{ text: 'OK' }]
        );
      }
    },
  });
}

/**
 * Hook to upload audio file
 */
export function useUploadAudio() {
  return useMutation({
    mutationFn: ({ uri, fileName }: { uri: string; fileName: string }) =>
      journalService.uploadAudioFile(uri, fileName),
    onError: (error: any) => {
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload audio. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
}
