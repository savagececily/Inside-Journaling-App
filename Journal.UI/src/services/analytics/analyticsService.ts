// Analytics Service for aggregating journal data
import { JournalEntry } from '../../types/api';

export interface SentimentDataPoint {
  date: string;
  sentiment: number; // -1 to 1 scale
  label: string; // Date label for display
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  lastEntryDate: string | null;
}

export interface KeyPhraseData {
  phrase: string;
  count: number;
  sentiment: number; // Average sentiment for this phrase
}

export interface TimePatternData {
  hour: number;
  count: number;
  avgSentiment: number;
}

export interface MonthlyData {
  date: string; // YYYY-MM-DD format
  hasEntry: boolean;
  sentiment?: number;
  entryCount: number;
}

/**
 * Calculate sentiment score from sentiment label
 */
function sentimentToScore(sentiment?: string): number {
  if (!sentiment) return 0;
  
  const normalizedSentiment = sentiment.toLowerCase();
  if (normalizedSentiment.includes('positive')) return 0.7;
  if (normalizedSentiment.includes('negative')) return -0.7;
  if (normalizedSentiment.includes('neutral')) return 0;
  if (normalizedSentiment.includes('mixed')) return 0.3;
  
  return 0;
}

/**
 * Get sentiment timeline data for charting
 */
export function getSentimentTimeline(entries: JournalEntry[]): SentimentDataPoint[] {
  if (!entries || entries.length === 0) return [];
  
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Take last 30 entries or all if less than 30
  const recentEntries = sortedEntries.slice(0, 30).reverse();
  
  return recentEntries.map(entry => {
    const date = new Date(entry.createdAt);
    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return {
      date: entry.createdAt,
      sentiment: sentimentToScore(entry.sentiment),
      label: dateLabel,
    };
  });
}

/**
 * Calculate streak data
 */
export function calculateStreak(entries: JournalEntry[]): StreakData {
  if (!entries || entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      lastEntryDate: null,
    };
  }
  
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get unique dates (ignore multiple entries on same day)
  const uniqueDates = Array.from(
    new Set(
      sortedEntries.map(entry => {
        const date = new Date(entry.createdAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    )
  ).sort((a, b) => b - a); // Sort newest first
  
  // Calculate current streak
  let currentStreak = 0;
  let checkDate = today.getTime();
  
  for (const entryDate of uniqueDates) {
    if (entryDate === checkDate || entryDate === checkDate - 86400000) {
      // Entry is today or yesterday
      currentStreak++;
      checkDate = entryDate - 86400000; // Move to previous day
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const diff = uniqueDates[i] - uniqueDates[i + 1];
    if (diff === 86400000) {
      // Consecutive day
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return {
    currentStreak,
    longestStreak,
    totalEntries: entries.length,
    lastEntryDate: sortedEntries[0]?.createdAt || null,
  };
}

/**
 * Aggregate key phrases with counts
 */
export function aggregateKeyPhrases(entries: JournalEntry[]): KeyPhraseData[] {
  if (!entries || entries.length === 0) return [];
  
  const phraseMap = new Map<string, { count: number; sentiments: number[] }>();
  
  entries.forEach(entry => {
    if (!entry.keyPhrases || entry.keyPhrases.length === 0) return;
    
    const sentiment = sentimentToScore(entry.sentiment);
    
    entry.keyPhrases.forEach(phrase => {
      const normalized = phrase.toLowerCase().trim();
      if (normalized.length < 3) return; // Skip very short phrases
      
      const existing = phraseMap.get(normalized);
      if (existing) {
        existing.count++;
        existing.sentiments.push(sentiment);
      } else {
        phraseMap.set(normalized, { count: 1, sentiments: [sentiment] });
      }
    });
  });
  
  // Convert to array and calculate average sentiment
  const phrases = Array.from(phraseMap.entries()).map(([phrase, data]) => ({
    phrase,
    count: data.count,
    sentiment: data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length,
  }));
  
  // Sort by count descending
  phrases.sort((a, b) => b.count - a.count);
  
  // Return top 20 phrases
  return phrases.slice(0, 20);
}

/**
 * Analyze time patterns (what time of day do entries happen)
 */
export function analyzeTimePatterns(entries: JournalEntry[]): TimePatternData[] {
  if (!entries || entries.length === 0) return [];
  
  const hourMap = new Map<number, { count: number; sentiments: number[] }>();
  
  entries.forEach(entry => {
    const date = new Date(entry.createdAt);
    const hour = date.getHours();
    const sentiment = sentimentToScore(entry.sentiment);
    
    const existing = hourMap.get(hour);
    if (existing) {
      existing.count++;
      existing.sentiments.push(sentiment);
    } else {
      hourMap.set(hour, { count: 1, sentiments: [sentiment] });
    }
  });
  
  // Convert to array with all 24 hours
  const patterns: TimePatternData[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const data = hourMap.get(hour);
    if (data) {
      patterns.push({
        hour,
        count: data.count,
        avgSentiment: data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length,
      });
    } else {
      patterns.push({
        hour,
        count: 0,
        avgSentiment: 0,
      });
    }
  }
  
  return patterns;
}

/**
 * Get calendar data for a specific month
 */
export function getCalendarData(entries: JournalEntry[], year: number, month: number): MonthlyData[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarData: MonthlyData[] = [];
  
  // Create entry map by date
  const entryMap = new Map<string, { count: number; sentiments: number[] }>();
  
  entries.forEach(entry => {
    const date = new Date(entry.createdAt);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const existing = entryMap.get(dateKey);
    const sentiment = sentimentToScore(entry.sentiment);
    
    if (existing) {
      existing.count++;
      existing.sentiments.push(sentiment);
    } else {
      entryMap.set(dateKey, { count: 1, sentiments: [sentiment] });
    }
  });
  
  // Build calendar data for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = entryMap.get(dateKey);
    
    if (data) {
      const avgSentiment = data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length;
      calendarData.push({
        date: dateKey,
        hasEntry: true,
        sentiment: avgSentiment,
        entryCount: data.count,
      });
    } else {
      calendarData.push({
        date: dateKey,
        hasEntry: false,
        entryCount: 0,
      });
    }
  }
  
  return calendarData;
}

/**
 * Export entries to CSV format
 */
export function exportToCSV(entries: JournalEntry[]): string {
  if (!entries || entries.length === 0) {
    return 'No entries to export';
  }
  
  // CSV header
  const header = 'Date,Content,Sentiment,Key Phrases,Summary,Audio URL\n';
  
  // CSV rows
  const rows = entries.map(entry => {
    const date = new Date(entry.createdAt).toISOString();
    const content = `"${entry.content.replace(/"/g, '""')}"`;
    const sentiment = entry.sentiment || '';
    const keyPhrases = `"${entry.keyPhrases?.join(', ') || ''}"`;
    const summary = `"${entry.summary?.replace(/"/g, '""') || ''}"`;
    const audioUrl = entry.audioUrl || '';
    
    return `${date},${content},${sentiment},${keyPhrases},${summary},${audioUrl}`;
  }).join('\n');
  
  return header + rows;
}

/**
 * Export entries to JSON format
 */
export function exportToJSON(entries: JournalEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

const analyticsService = {
  getSentimentTimeline,
  calculateStreak,
  aggregateKeyPhrases,
  analyzeTimePatterns,
  getCalendarData,
  exportToCSV,
  exportToJSON,
  sentimentToScore,
};

export default analyticsService;
