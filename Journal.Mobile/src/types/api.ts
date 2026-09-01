// API response and request types (matching backend models)

export interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  profilePictureUrl?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  audioUrl?: string;
  audioTranscription?: string;
  createdAt: string;
  updatedAt?: string;
  sentiment?: Sentiment;
  keyPhrases?: string[];
  summary?: string;
  summaryConfidence?: number;
  affirmation?: string;
}

export interface JournalEntryRequest {
  content: string;
  audioUrl?: string;
  audioTranscription?: string;
}

export interface UpdateJournalEntryRequest {
  content: string;
}

export interface JournalAnalysisResult {
  sentiment: Sentiment;
  sentimentScores: SentimentScores;
  keyPhrases: string[];
  summary: string;
  summaryConfidence: number;
  affirmation: string;
}

export interface SentimentScores {
  positive: number;
  negative: number;
  neutral: number;
}

export type Sentiment = 'Positive' | 'Negative' | 'Neutral' | 'Mixed';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
}

export interface TrendData {
  date: string;
  sentiment: Sentiment;
  entryCount: number;
}

// Auth types
export interface LoginRequest {
  idToken: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  requiresAgeVerification?: boolean;
}

// API error type
export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}
