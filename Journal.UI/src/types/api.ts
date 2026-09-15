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

// Chat types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  lastMessageAt: string;
  title: string;
  isActive: boolean;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface CrisisResource {
  name: string;
  phoneNumber: string;
  textNumber: string;
  description: string;
  url: string;
  isAvailable24_7: boolean;
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  timestamp: string;
  isCrisisDetected?: boolean;
  crisisReason?: string;
  crisisResources?: CrisisResource[];
}

// User quota and subscription types
export interface QuotaItem {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
}

export interface UserQuotaResponse {
  tier: 'free' | 'premium' | 'pro';
  isPremium: boolean;
  isPro: boolean;
  premiumExpiresAt?: string;
  usage: {
    entries: QuotaItem;
    voice: QuotaItem;
    chat: QuotaItem;
  };
  resetDate: string;
}

export interface UpgradeResponse {
  checkoutUrl: string;
}

export interface CustomerPortalResponse {
  portalUrl: string;
}
