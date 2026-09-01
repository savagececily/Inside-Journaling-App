// Journal Service for API operations
import apiClient from '../api/client';
import {
  JournalEntry,
  JournalEntryRequest,
  UpdateJournalEntryRequest,
  JournalAnalysisResult,
} from '../../types/api';

/**
 * Create a new journal entry
 */
export async function createJournalEntry(
  data: JournalEntryRequest
): Promise<JournalEntry> {
  try {
    const response = await apiClient.post<JournalEntry>(
      '/journal/analyze',
      {
        Text: data.content,
        AudioBlobUrl: data.audioUrl,
        IsVoiceEntry: !!data.audioUrl,
        Timestamp: new Date(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
}

/**
 * Get all journal entries for the current user
 */
export async function getJournalEntries(
  page: number = 1,
  pageSize: number = 20
): Promise<JournalEntry[]> {
  try {
    const response = await apiClient.get<JournalEntry[]>(
      `/journal?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    throw error;
  }
}

/**
 * Get a single journal entry by ID
 */
export async function getJournalEntryById(
  id: string
): Promise<JournalEntry> {
  try {
    const response = await apiClient.get<JournalEntry>(
      `/journal/${id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    throw error;
  }
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(
  id: string,
  data: UpdateJournalEntryRequest
): Promise<JournalEntry> {
  try {
    const response = await apiClient.put<JournalEntry>(
      `/journal/${id}`,
      {
        Text: data.content,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(id: string): Promise<void> {
  try {
    await apiClient.delete(`/journal/${id}`);
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
}

/**
 * Upload audio file to Blob Storage
 */
export async function uploadAudioFile(
  uri: string,
  fileName: string
): Promise<string> {
  try {
    // Create form data with audio file
    const formData = new FormData();
    formData.append('audio', {
      uri,
      type: 'audio/m4a', // Expo Audio default format
      name: fileName,
    } as any);

    const response = await apiClient.post<{ audioUrl: string }>(
      '/journal/upload-audio',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.audioUrl;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
}

const journalService = {
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
  uploadAudioFile,
};

export default journalService;
