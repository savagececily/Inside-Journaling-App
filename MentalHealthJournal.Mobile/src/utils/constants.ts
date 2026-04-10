// App constants and configuration

// API Configuration
// TODO: Replace with your actual backend URL
// export const API_BASE_URL = __DEV__
//   ? 'http://localhost:5079/api' // Local development (adjust port if needed)
//   : 'https://mentalhealthjournal-webapp.azurewebsites.net/api'; // Production URL

  export const API_BASE_URL = 'https://mentalhealthjournal-webapp.azurewebsites.net/api';

// Legal document URLs - using API endpoints that don't require authentication
export const LEGAL_URLS = {
  TERMS_OF_SERVICE: 'https://mentalhealthjournal-webapp.azurewebsites.net/api/legal/terms',
  PRIVACY_POLICY: 'https://mentalhealthjournal-webapp.azurewebsites.net/api/legal/privacy',
} as const;

// Google OAuth Configuration
// IMPORTANT: Replace these with your actual Google OAuth client IDs
// 
// Setup instructions:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing project
// 3. Enable Google+ API (or Google Sign-In API)
// 4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
// 5. Create THREE separate credentials:
//    - iOS: Application type "iOS", enter bundle ID (from app.json)
//    - Android: Application type "Android", enter package name and SHA-1 certificate
//    - Web: Application type "Web application" (for Expo Go and web testing)
// 6. For Web credential, add redirect URIs:
//    - https://auth.expo.io/@YOUR_EXPO_USERNAME/YOUR_APP_SLUG
//    - http://localhost:19006 (for web testing)
//
// For development with Expo Go, the Web client ID is most important.
// For production builds, you'll need the iOS and Android client IDs.
//
// The backend needs ONE of these client IDs configured in appsettings.json:
//   "Google": { "ClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com" }
//
export const GOOGLE_CLIENT_ID_IOS = '765765451806-5htslbhkn876bcnadgluollhh0miku5s.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_ANDROID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_WEB = '765765451806-8552it3usqnh6qa7n457r32mcfv8g9u8.apps.googleusercontent.com';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  OFFLINE_ENTRIES: 'offline_entries',
  SYNC_QUEUE: 'sync_queue',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  THEME_MODE: 'theme_mode',
  LAST_SYNC: 'last_sync',
} as const;

// App Settings
export const APP_SETTINGS = {
  // Pagination
  ENTRIES_PER_PAGE: 20,
  
  // Sync
  SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_OFFLINE_ENTRIES: 100,
  
  // Audio
  AUDIO_MAX_DURATION_SECONDS: 300, // 5 minutes
  AUDIO_SAMPLE_RATE: 44100,
  AUDIO_CHANNELS: 1,
  AUDIO_BIT_RATE: 128000,
  
  // Toast/Notification duration
  TOAST_DURATION_SHORT: 2000,
  TOAST_DURATION_LONG: 4000,
  
  // Session timeout
  SESSION_TIMEOUT_MINUTES: 30,
} as const;

// Sentiment colors (matching web app)
export const SENTIMENT_COLORS = {
  Positive: '#4ade80',
  Negative: '#f87171',
  Neutral: '#94a3b8',
  Mixed: '#fbbf24',
} as const;

// Crisis hotlines (US-focused, can be expanded)
export const CRISIS_HOTLINES = [
  {
    id: '1',
    name: '988 Suicide & Crisis Lifeline',
    number: '988',
    description: '24/7 support for people in crisis',
  },
  {
    id: '2',
    name: 'Crisis Text Line',
    number: '741741',
    description: 'Text HOME to 741741',
    isSMS: true,
  },
  {
    id: '3',
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    description: 'Help for mental health and substance abuse',
  },
  {
    id: '4',
    name: 'Disaster Distress Helpline',
    number: '1-800-985-5990',
    description: 'Crisis counseling for disaster survivors',
  },
] as const;

// Feature flags (for gradual rollout)
export const FEATURE_FLAGS = {
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_VOICE_RECORDING: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_DARK_MODE: false, // Coming soon
  ENABLE_PHOTO_JOURNALS: false, // Future feature
} as const;
