# Mobile App Features Documentation

Complete reference for all features implemented in the Mental Health Journal mobile app (React Native/Expo).

---

## 🎨 UI Components Library

### Overview
Comprehensive reusable component library with consistent design system, accessibility features, and theme support.

### Components (15+ components)

#### **Common Components**
- **Button**: 5 variants (primary, secondary, outline, ghost, danger), 3 sizes, loading states
- **Input**: Labels, validation, error states, prefix/suffix support
- **Card**: Flexible content container with optional header/footer
- **Badge**: Status indicators with 8 color variants
- **LoadingSpinner**: Activity indicators in 3 sizes
- **ErrorMessage**: Consistent error display with retry actions

#### **Journal Components**
- **JournalEntryCard**: Preview cards with sentiment badges
- **SentimentBadge**: Color-coded emotional indicators
- **VoiceRecordingButton**: Record/stop controls with timer

#### **Insights Components**
- **SentimentTimelineChart**: Line chart for mood tracking
- **StreakCounter**: Animated streak display with fire emoji
- **KeyPhrasesCloud**: Word cloud with sentiment colors
- **TimePatternsChart**: Bar chart showing time-of-day patterns
- **JournalCalendar**: Monthly view with entry indicators
- **ExportDataButton**: CSV/JSON export functionality

**Files:** `src/components/common/`, `src/components/journal/`, `src/components/insights/`

---

## 🔐 Google OAuth Authentication

### Implementation
Complete OAuth flow using expo-auth-session and Google Sign-In.

### Features
- **expo-auth-session**: OAuth 2.0 flow management
- **Google Sign-In**: Web, iOS, Android client IDs
- **JWT tokens**: Secure token storage with expo-secure-store
- **Auto-refresh**: Token refresh on expiration
- **Age verification**: COPPA compliance check

### Flow
1. User taps "Sign in with Google"
2. expo-auth-session opens Google consent screen
3. User selects account and grants permissions
4. App receives ID token
5. Backend validates token with Google
6. JWT token issued and stored securely
7. User authenticated across API calls

**Files:** `src/hooks/useGoogleAuth.ts`, `src/services/api/auth.ts`, `src/screens/Auth/LoginScreen.tsx`

### Setup Requirements
- Google Cloud Console project
- OAuth 2.0 credentials (Web, iOS, Android)
- Redirect URIs configured
- Backend API integration

---

## 📝 Journal Entry Management

### Features
- **Create entries**: Text or voice input
- **Edit entries**: Update content and sentiment
- **Delete entries**: Soft delete with confirmation
- **Voice recording**: expo-av audio capture
- **Speech-to-text**: Azure Speech Services transcription
- **AI sentiment analysis**: Real-time emotional tone detection
- **Key phrase extraction**: Automatic topic identification
- **Offline support**: Create entries without internet

### Entry Model
```typescript
interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
  sentimentScore?: number;
  keyPhrases: string[];
  audioUrl?: string;
  audioTranscription?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Files:** `src/screens/journal/`, `src/hooks/useJournal.ts`, `src/services/api/journal.ts`

---

## 🔄 Offline-First Sync

### Architecture
Complete offline-first system with background synchronization.

### Features
- **Local storage**: AsyncStorage for all journal entries
- **Queue system**: Track create/update/delete operations
- **Background sync**: Automatic when connectivity restored
- **Conflict resolution**: Server-wins strategy
- **Optimistic updates**: Immediate UI feedback
- **Sync indicators**: Visual status of sync state
- **Retry logic**: Max 3 attempts with exponential backoff
- **Auto-cleanup**: Remove synced entries after 30 days

### Sync Flow
1. User creates/edits entry offline
2. Entry saved to AsyncStorage with `localId`
3. Operation added to sync queue
4. Network state monitored with @react-native-community/netinfo
5. When online, sync queue processed
6. Server responds with `serverId`
7. Local entry marked as synced
8. UI updated with server data

### Components
- **offlineStorage.ts**: AsyncStorage wrapper
- **syncService.ts**: Sync queue and conflict resolution
- **useSync.ts**: React Query hooks for sync operations

**Files:** `src/services/storage/offlineStorage.ts`, `src/services/sync/syncService.ts`, `src/hooks/useSync.ts`

---

## 📊 Data Visualizations & Analytics

### Analytics Dashboard
Complete insights and trend analysis with interactive charts.

### Components

#### **1. Sentiment Timeline Chart**
- Line chart showing mood trends over 30 days
- Color-coded points (green=positive, red=negative, gray=neutral, blue=mixed)
- Gradient fill for visual appeal
- Interactive tooltips with date and sentiment
- **Library:** Custom SVG rendering

#### **2. Streak Counter**
- Tracks consecutive days with entries
- Animated fire emoji progression
- Current streak, longest streak, total entries
- Milestone celebrations at 7, 30, 100, 365 days
- **Library:** react-native-reanimated

#### **3. Key Phrases Word Cloud**
- Dynamic word sizing based on frequency
- Color coding by sentiment association
- Interactive hover with statistics
- Top 20 most common phrases
- **Library:** Custom SVG layout

#### **4. Time Patterns Chart**
- Bar chart with 6 time blocks (4-hour intervals)
- Shows when user journals most
- Entry count per time period
- **Library:** react-native-chart-kit

#### **5. Journal Calendar**
- Monthly calendar view
- Dots indicate days with entries
- Color-coded by dominant sentiment
- Navigate between months
- **Library:** react-native-calendars

#### **6. Export Data**
- Export to CSV or JSON format
- All entries with full metadata
- Native share dialog with expo-sharing
- File system access with expo-file-system

**Files:** `src/screens/insights/InsightsScreen.tsx`, `src/services/analytics/analyticsService.ts`, `src/components/insights/`

---

## 🆘 Crisis Support Resources

### Features
Complete crisis intervention system with immediate access to professional help.

### Components

#### **1. Crisis Hotline List**
5 US crisis hotlines with one-tap calling:
- **988 Suicide & Crisis Lifeline**: Call or text 988
- **Crisis Text Line**: Text HOME to 741741
- **SAMHSA National Helpline**: 1-800-662-4357
- **Veterans Crisis Line**: 988 then Press 1
- **Trevor Project** (LGBTQ Youth): 1-866-488-7386

Features:
- One-tap to call or text
- 24/7 availability indicators
- Descriptions of each service
- Uses React Native Linking API

#### **2. Breathing Exercises**
4 guided breathing patterns:
- **Box Breathing** (4-4-4-4): Stress reduction
- **4-7-8 Breathing**: Sleep aid
- **Resonant Breathing** (5-5): Anxiety relief
- **Energizing Breath** (3-1-4-1): Quick energy boost

Features:
- Animated visual guidance (expanding/contracting circle)
- Voice instructions
- Countdown timer
- Haptic feedback on transitions
- **Library:** react-native-reanimated

#### **3. Grounding Techniques**
6 evidence-based grounding exercises:
- **5-4-3-2-1 Sensory**: Identify 5 things you see, 4 you touch, etc.
- **54321 Countdown**: Count backwards with breathing
- **Body Scan**: Progressive relaxation
- **Mental Categories**: Name items in categories (colors, animals, etc.)
- **Object Focus**: Detailed observation exercise
- **Affirmation Phrases**: Positive self-talk statements

Features:
- Step-by-step instructions
- Expandable cards
- Progress tracking
- Audio guidance (optional)

**Files:** `src/screens/crisis/CrisisResourcesScreen.tsx`, `src/components/crisis/`

---

## 🔔 Push Notifications

### Features
Complete notification system with scheduling, preferences, and deep linking.

### Notification Types

#### **1. Daily Reminders**
- Customizable time (user selects HH:MM)
- Scheduled with expo-notifications
- Badge management
- Cancelable

#### **2. Streak Maintenance Alerts**
- Triggers after 18 hours without entry
- Helps maintain journaling streaks
- Configurable on/off

#### **3. Achievement Notifications**
- Milestone celebrations (7-day, 30-day, 100-day streaks)
- First entry congratulations
- Badge unlocks

### Components
- **notificationService.ts**: Permission handling, scheduling, Expo push tokens
- **NotificationPreferencesScreen.tsx**: Full settings UI with master toggle, time picker, individual type toggles

### Features
- Permission request dialog
- Expo push token management for backend
- Scheduled notification count display
- Time formatting (24h → 12h AM/PM)
- Navigation integration (tap notification → open screen)
- Status indicators (permission granted, scheduled count)

**Files:** `src/services/notifications/notificationService.ts`, `src/screens/settings/NotificationPreferencesScreen.tsx`

---

## 🔒 Biometric Authentication

### Features
Complete biometric security with multiple fallback options.

### Supported Biometrics
- **Face ID** (iOS)
- **Touch ID** (iOS)
- **Fingerprint** (Android)
- **Iris** (Android - some devices)

### Security Features

#### **Biometric Authentication**
- Device capability detection
- Enrollment status checking
- Biometric type identification
- Authentication prompts with custom messages
- Session tracking with inactivity timeout

#### **PIN Fallback**
- 4-6 digit PIN requirement
- Two-step verification (enter → confirm)
- Secure storage with expo-secure-store
- PIN change with current PIN verification
- PIN removal with confirmation

#### **Session Management**
- Configurable inactivity timeout (1-60 minutes)
- Last activity timestamp tracking
- Auto-lock on timeout
- Require auth on app launch (optional)

### Components
- **biometricService.ts**: Authentication logic, PIN management, session tracking
- **BiometricPreferencesScreen.tsx**: Full settings UI with device status, enable/disable toggle, PIN management

**Files:** `src/services/auth/biometricService.ts`, `src/screens/settings/BiometricPreferencesScreen.tsx`

---

## 🌓 Dark Mode

### Features
Complete theme system with automatic switching based on system preferences.

### Theme Modes
- **Light**: Default bright theme
- **Dark**: Dark backgrounds for low-light usage
- **System**: Automatically follows device settings (default)

### Implementation
- **ThemeContext**: React Context for global theme state
- **useTheme()**: Hook for theme mode and colors
- **useColors()**: Backward-compatible hook for just colors
- **AsyncStorage**: Persists user's theme preference
- **useColorScheme()**: Detects system dark mode

### Color Palettes
Complete color schemes for both light and dark modes:
- Background, surface, elevated surface
- Primary, secondary, accent colors
- Text (primary, secondary, disabled)
- Borders, dividers
- Semantic colors (success, warning, error, info)
- Sentiment colors (positive, negative, neutral, mixed)

**Files:** `src/contexts/ThemeContext.tsx`

---

## 📳 Haptic Feedback

### Features
Comprehensive tactile feedback system for enhanced user experience.

### Feedback Types

#### **Basic Impacts**
- **Light**: Subtle feedback (tabs, switches)
- **Medium**: Standard feedback (buttons)
- **Heavy**: Strong feedback (confirmations, achievements)

#### **Notifications**
- **Success**: Positive outcome (entry saved, sync complete)
- **Warning**: Caution needed (low storage, network issues)
- **Error**: Failure state (validation errors, sync failed)

#### **Special Patterns**
- **Achievement Unlock**: Double success pattern
- **Streak Milestone**: Triple heavy impact
- **Journal Entry Saved**: Success with medium impact
- **Recording Toggle**: Light impact on start/stop

### Convenience Functions
- `buttonPress()`, `tabSwitch()`, `deleteAction()`, `saveAction()`
- `refresh()`, `longPress()`, `swipe()`
- `customPattern([{type, delay}, ...])` for advanced sequences

### Preferences
- Global enable/disable
- Granular control (button press, success, warning, error, selection)
- Stored in AsyncStorage

**Files:** `src/services/haptics/hapticService.ts`

---

## 🔗 Deep Linking

### Features
Complete URL scheme support for navigation and sharing.

### URL Schemes
- **App Scheme**: `mentalhealthjournal://`
- **Universal Links**: `https://mentalhealthjournal.app`

### Supported Paths
- `journal/new` - Create new entry
- `journal/:id` - View specific entry
- `insights/dashboard` - Analytics screen
- `insights/timeline` - Sentiment timeline
- `crisis/main` - Crisis resources
- `settings/notifications` - Notification settings
- `settings/biometric` - Biometric settings
- `settings/theme` - Theme settings

### Features
- URL parsing with query parameters
- Navigation integration with React Navigation
- Deep link shortcuts helper (e.g., `DeepLinks.journal.new()`)
- Initial URL handling for cold starts
- Dynamic link listener for warm starts
- Create deep links programmatically

**Files:** `src/navigation/deepLinking.ts`

---

## 📦 Dependencies

### Core Framework
- expo ~55.0.7
- react-native 0.83.2
- typescript ~5.9.2

### Navigation & State
- @react-navigation/native ^7.1.33
- @tanstack/react-query ^5.91.0
- @react-native-async-storage/async-storage 2.2.0

### Visualization
- react-native-chart-kit ^6.12.0
- react-native-calendars ^1.1313.0
- react-native-reanimated ~3.17.4

### Native Features
- expo-notifications ~0.30.5
- expo-local-authentication ~15.0.3
- expo-haptics ~14.0.1
- expo-av ^16.0.8
- expo-secure-store ~55.0.9
- expo-auth-session ~55.0.8

---

## 🎯 Development Status

**Current Sprint:** 4 of 6 Complete (67%)

✅ **Sprint 1:** Foundation & Authentication  
✅ **Sprint 2:** Journal Features & Offline Sync  
✅ **Sprint 3:** Visualizations & Crisis Support  
✅ **Sprint 4:** Native Features (Notifications, Biometrics, Dark Mode)  
⏳ **Sprint 5:** Polish & Testing  
🔜 **Sprint 6:** App Store Deployment  

**[View Progress →](MOBILE_PROGRESS.md)** | **[View Plan →](PHASE_2_PLAN.md)**
