# Phase 2: React Native Mobile App Development

## 📱 Overview

Phase 2 focuses on building **native iOS and Android mobile applications** using React Native that connect to the existing .NET backend and Azure services. The goal is to provide a true native mobile experience with platform-specific features while reusing the backend infrastructure.

---

## 🎯 Objectives

1. **Native Mobile Apps**: Build iOS and Android apps with React Native
2. **Shared Backend**: Reuse existing .NET API and Azure services (zero backend changes needed)
3. **Native Features**: Leverage device capabilities (biometrics, push notifications, native storage)
4. **Offline-First**: Implement robust offline functionality with sync
5. **App Store Ready**: Prepare for deployment to Apple App Store and Google Play Store

---

## 🏗️ Architecture Decision

### **Option A: Expo (Recommended for Fast Development)**
✅ **Pros:**
- Faster development with managed workflow
- Over-the-air (OTA) updates without app store review
- Simplified build process (EAS Build)
- Built-in support for common features (camera, audio, notifications)
- Easy local development with Expo Go app
- Better developer experience with TypeScript

❌ **Cons:**
- Slightly larger app size
- Some limitations on native modules (though 95% of use cases covered)

### **Option B: React Native CLI (Bare Workflow)**
✅ **Pros:**
- Full control over native code
- Smaller app size
- No restrictions on native modules

❌ **Cons:**
- More complex setup (Xcode, Android Studio, CocoaPods)
- Manual configuration for many features
- Harder to maintain
- Slower development iterations

**🎯 Recommendation:** Start with **Expo** for rapid development. Can always eject to bare workflow later if needed.

---

## 📋 Phase 2 Task Breakdown

### **✅ Sprint 1: Foundation (Week 1) - COMPLETE**
#### Task 1: Project Setup & Navigation
- [x] Initialize Expo project with TypeScript
- [x] Set up folder structure (screens, components, services, types)
- [x] Install core dependencies (React Navigation, React Query)
- [x] Configure TypeScript with strict mode
- [x] Set up navigation structure (Stack + Bottom Tabs)
- [x] Create placeholder screens (Login, Home, Journal, Insights, Profile)

#### Task 2: Authentication & API Integration
- [x] Create Google OAuth login flow (expo-auth-session)
- [x] Implement JWT token storage (expo-secure-store)
- [x] Build API client with interceptors for auth headers
- [x] Create authentication context provider
- [x] Implement auto-refresh token logic
- [x] Add loading states and error handling

#### Task 3: Core UI Components Library
- [x] Design system constants (colors, fonts, spacing)
- [x] Reusable components: Button, Input, Card, Badge
- [x] Loading indicators and empty states
- [x] Error boundary component
- [x] Toast/Snackbar notification system
- [x] Bottom sheet modal component

---

### **✅ Sprint 2: Journal Features (Week 2) - COMPLETE**
#### Task 4: Journal Entry Creation
- [x] Create journal entry form screen
- [x] AI sentiment analysis display
- [x] Voice recording with expo-av
- [x] Speech-to-text integration (Azure Speech SDK)
- [x] Save journal entry to API
- [x] Optimistic UI updates
- [x] Image compression before upload

#### Task 5: Journal Entry List & Details
- [x] Fetch and display journal entries (React Query)
- [x] Infinite scroll / pagination
- [x] Entry details view with sentiment badges
- [x] Edit/delete functionality
- [x] Pull-to-refresh
- [x] Animated swipe actions (delete, edit)
- [x] Search and filter entries

#### Task 6: Offline Sync & Local Storage
- [x] Set up async-storage for offline entries
- [x] Queue system for pending sync
- [x] Background sync when online
- [x] Conflict resolution strategy
- [x] Sync status indicators
- [x] Local-first architecture with React Query

---

### **✅ Sprint 3: Insights & Visualizations (Week 3) - COMPLETE**
#### Task 7: Trends & Analytics Dashboard
- [x] Sentiment timeline chart (react-native-chart-kit)
- [x] Streak counter with animations (react-native-reanimated)
- [x] Key phrases word cloud
- [x] Time patterns visualization (bar chart with 6 time blocks)
- [x] Calendar view with entry indicators (react-native-calendars)
- [x] Swipeable month navigation
- [x] Export data feature (CSV/JSON with expo-file-system and expo-sharing)

#### Task 8: Crisis Support & Resources
- [x] Crisis help button (always accessible)
- [x] Emergency contacts list
- [x] Crisis hotline quick dial (5 US hotlines with Linking API)
- [x] Breathing exercises (animated with 4 patterns)
- [x] Grounding techniques guides (6 techniques with expandable steps)
- [x] Crisis resources main screen with quick access buttons

---

### **✅ Sprint 4: Native Features (Week 4) - COMPLETE**
#### Task 9: Push Notifications
- [x] Set up Expo Push Notifications (expo-notifications ~0.30.5)
- [x] Daily reminder notification (customizable time)
- [x] Streak maintenance reminders (triggers after 18 hours)
- [x] Achievement notifications (unlock patterns)
- [x] Notification preferences screen (full settings UI)
- [x] Deep linking from notifications (navigation integration)
- [x] Expo push token management for backend integration

#### Task 10: Biometric Authentication
- [x] Implement Face ID / Touch ID / Fingerprint (expo-local-authentication)
- [x] Secure storage for sensitive data (expo-secure-store)
- [x] PIN code fallback (4-6 digits with verification)
- [x] Biometric preferences screen (full settings UI)
- [x] Session timeout with re-auth (configurable inactivity period)
- [x] Device capability detection and error handling

#### Task 11: Native Device Features
- [x] Dark mode support (automatic system preference detection with ThemeContext)
- [x] Haptic feedback on interactions (light/medium/heavy impacts)
- [x] Custom haptic patterns (achievement unlocks, streak milestones)
- [x] Deep linking configuration (mentalhealthjournal:// and https://mentalhealthjournal.app)
- [x] URL parsing and navigation handling
- [x] Updated app.json with permissions and configurations

---

### **Sprint 5: Polish & Testing (Week 5)**
#### Task 12: App Icon, Splash Screen & Branding
- [ ] Design app icon (1024x1024)
- [ ] Create adaptive icons for Android
- [ ] Design splash screen
- [ ] Configure app.json with branding
- [ ] Set up app.json with proper metadata
- [ ] Configure privacy policies links

#### Task 13: Performance Optimization
- [ ] Image optimization and caching
- [ ] Memoization for expensive computations
- [ ] Lazy loading for screens
- [ ] FlatList performance optimizations
- [ ] React Query cache configuration
- [ ] Monitor JS bundle size

#### Task 14: Testing
- [ ] Unit tests for utility functions
- [ ] Integration tests for API calls
- [ ] E2E tests with Detox (optional)
- [ ] Manual testing on physical devices
- [ ] Accessibility testing (screen readers)
- [ ] Performance profiling

---

### **Sprint 6: Deployment (Week 6)**
#### Task 15: Build & Deploy iOS
- [ ] Configure EAS Build for iOS
- [ ] Create Apple Developer account ($99/year)
- [ ] Generate certificates and provisioning profiles
- [ ] Configure app.json for iOS
- [ ] Build IPA with EAS Build
- [ ] Test on TestFlight
- [ ] Submit to App Store

#### Task 16: Build & Deploy Android
- [ ] Configure EAS Build for Android
- [ ] Create Google Play Console account ($25 one-time)
- [ ] Generate upload keystore
- [ ] Configure app.json for Android
- [ ] Build AAB with EAS Build
- [ ] Test on internal testing track
- [ ] Submit to Google Play Store

---

## 🛠️ Technology Stack

### **Core Framework**
- React Native 0.76+ (via Expo SDK 52+)
- Expo SDK 52+ (managed workflow)
- TypeScript 5.6+

### **Navigation**
- React Navigation 7.x (Stack, Bottom Tabs, Drawer)
- Deep linking support

### **State Management**
- React Context API (auth, theme)
- React Query (TanStack Query) for server state
- AsyncStorage for local persistence

### **UI/UX**
- React Native Paper (Material Design) OR NativeBase
- Expo Vector Icons
- React Native Reanimated 3.x for animations
- React Native Gesture Handler for gestures

### **API & Data**
- Axios for HTTP client
- React Query for caching/sync
- AsyncStorage for offline storage
- expo-secure-store for sensitive data

### **Native Features**
- expo-auth-session (OAuth)
- expo-av (audio recording/playback)
- expo-local-authentication (biometrics)
- expo-notifications (push notifications)
- expo-sharing (share functionality)
- expo-haptics (haptic feedback)

### **Charts & Visualizations**
- react-native-chart-kit OR Victory Native
- react-native-svg for custom graphics

### **Development Tools**
- ESLint + Prettier
- TypeScript strict mode
- Expo Dev Client for development
- EAS Build for app builds

---

## 📂 Proposed Folder Structure

```
MentalHealthJournal.Mobile/
├── app.json                          # Expo configuration
├── eas.json                          # EAS Build configuration
├── package.json
├── tsconfig.json
├── App.tsx                           # Root component
├── src/
│   ├── screens/                      # Screen components
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── Journal/
│   │   │   ├── JournalListScreen.tsx
│   │   │   ├── JournalDetailScreen.tsx
│   │   │   ├── NewEntryScreen.tsx
│   │   │   └── VoiceRecordingScreen.tsx
│   │   ├── Insights/
│   │   │   ├── InsightsDashboardScreen.tsx
│   │   │   ├── TrendsScreen.tsx
│   │   │   └── CalendarScreen.tsx
│   │   ├── Profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   └── AboutScreen.tsx
│   │   └── Crisis/
│   │       └── CrisisSupportScreen.tsx
│   ├── components/                   # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── journal/
│   │   │   ├── JournalCard.tsx
│   │   │   ├── SentimentBadge.tsx
│   │   │   └── VoiceRecorder.tsx
│   │   └── insights/
│   │       ├── SentimentChart.tsx
│   │       ├── StreakCounter.tsx
│   │       └── CalendarView.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx          # Main navigation
│   │   ├── AuthNavigator.tsx         # Auth stack
│   │   └── MainNavigator.tsx         # Bottom tabs
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts             # Axios instance
│   │   │   ├── auth.ts               # Auth endpoints
│   │   │   ├── journal.ts            # Journal endpoints
│   │   │   └── insights.ts           # Insights endpoints
│   │   ├── storage/
│   │   │   ├── secureStorage.ts      # Token storage
│   │   │   └── localStorage.ts       # App data storage
│   │   └── sync/
│   │       ├── syncManager.ts        # Offline sync
│   │       └── queue.ts              # Sync queue
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useJournalEntries.ts
│   │   ├── useOfflineSync.ts
│   │   └── useBiometrics.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── OfflineContext.tsx
│   ├── types/
│   │   ├── api.ts                    # API types
│   │   ├── models.ts                 # Data models
│   │   └── navigation.ts             # Navigation types
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── dateHelpers.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
└── __tests__/
    ├── components/
    ├── screens/
    └── utils/
```

---

## 🔄 Reusable Assets from Phase 1

### **From Web App (Can Reuse):**
1. **API Endpoints URLs** - Exact same backend
2. **Data Models/Types** - Copy TypeScript interfaces
3. **Business Logic** - Authentication flow, validation rules
4. **Design System** - Colors (#6366f1 purple theme), spacing
5. **Icons** - Same app icon for branding consistency

### **Cannot Reuse (Need Native Alternatives):**
1. React components (need React Native components)
2. CSS stylesheets (use React Native StyleSheet)
3. Service Worker (use React Query + AsyncStorage)
4. Web APIs (use Expo modules instead)

---

## 🔐 Backend Considerations

### **No Backend Changes Needed ✅**
- React Native app will use **same API endpoints** as web app
- JWT authentication already in place
- Azure services (Cosmos DB, Blob Storage, OpenAI) work identically

### **Optional Backend Enhancements** (Future)
- Push notification endpoint (send expo push tokens)
- Device registration endpoint
- Background job for sending reminders

---

## 📱 Native Features to Implement

| Feature | iOS | Android | Library |
|---------|-----|---------|---------|
| Biometric Auth | Face ID / Touch ID | Fingerprint | expo-local-authentication |
| Push Notifications | APNs | FCM | expo-notifications |
| Voice Recording | ✅ | ✅ | expo-av |
| Haptic Feedback | ✅ | ✅ | expo-haptics |
| Share Content | ✅ | ✅ | expo-sharing |
| Dark Mode | ✅ | ✅ | useColorScheme |
| Offline Storage | ✅ | ✅ | AsyncStorage |
| Secure Storage | Keychain | Keystore | expo-secure-store |

---

## 🧪 Testing Strategy

### **Manual Testing**
- iOS Simulator (Xcode)
- Android Emulator (Android Studio)
- Physical devices (iPhone, Android phone)

### **Automated Testing**
- Jest for unit tests
- React Native Testing Library for component tests
- Detox for E2E tests (optional, complex setup)

### **Beta Testing**
- TestFlight for iOS beta testers
- Google Play Internal Testing for Android beta testers

---

## 🚀 Deployment Checklist

### **Pre-Deployment**
- [ ] App icon (1024x1024)
- [ ] Splash screen
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Support email/website
- [ ] App description and keywords
- [ ] Screenshots (6.5", 5.5" for iOS; multiple for Android)
- [ ] App Store listing copy

### **iOS Requirements**
- [ ] Apple Developer Account ($99/year)
- [ ] Certificates & provisioning profiles
- [ ] App Store Connect setup
- [ ] App Review Guidelines compliance
- [ ] TestFlight testing

### **Android Requirements**
- [ ] Google Play Console account ($25 one-time)
- [ ] Upload keystore
- [ ] App signing by Google Play
- [ ] Play Store listing
- [ ] Internal testing track testing

---

## 📊 Timeline Estimate

| Sprint | Duration | Tasks | Deliverable |
|--------|----------|-------|-------------|
| Sprint 1 | Week 1 | 1-3 | Foundation with navigation & auth |
| Sprint 2 | Week 2 | 4-6 | Core journal features with offline sync |
| Sprint 3 | Week 3 | 7-8 | Insights dashboard & crisis support |
| Sprint 4 | Week 4 | 9-11 | Native features (biometrics, notifications) |
| Sprint 5 | Week 5 | 12-14 | Polish, testing, optimization |
| Sprint 6 | Week 6 | 15-16 | App store deployment |

**Total: 6 weeks for full React Native app**

---

## 💡 Key Decisions Needed

1. **Expo vs React Native CLI?**
   - Recommended: Expo (faster, easier)

2. **UI Component Library?**
   - Option A: React Native Paper (Material Design)
   - Option B: NativeBase
   - Option C: Custom components only

3. **Chart Library?**
   - Option A: react-native-chart-kit (simple, lightweight)
   - Option B: Victory Native (more powerful)

4. **Monetization Strategy?**
   - Free with optional premium features?
   - One-time purchase?
   - Subscription (Expo In-App Purchases)?

5. **Push Notification Backend?**
   - Use Expo's free push service?
   - Build custom backend endpoint?

---

## 🎯 Success Metrics

- [ ] App installs on both iOS and Android
- [ ] 4.5+ star rating on app stores
- [ ] <2s app launch time
- [ ] <100MB app size
- [ ] 95%+ crash-free rate
- [ ] Offline sync works reliably
- [ ] Biometric auth adoption rate >60%

---

## 📚 Resources

### **Documentation**
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Query](https://tanstack.com/query/latest)
- [React Native Paper](https://reactnativepaper.com/)

### **Tools**
- [Expo Snack](https://snack.expo.dev/) - Online playground
- [EAS Build](https://docs.expo.dev/build/introduction/) - Cloud builds
- [Expo Application Services](https://expo.dev/eas) - Full platform

---

## 🚦 Next Steps to Start Phase 2

1. **Initialize Expo Project**
   ```bash
   npx create-expo-app MentalHealthJournal.Mobile --template expo-template-blank-typescript
   cd MentalHealthJournal.Mobile
   ```

2. **Install Core Dependencies**
   ```bash
   npx expo install react-navigation
   npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
   npm install @tanstack/react-query axios
   ```

3. **Set Up Development Environment**
   - Install Expo Go app on phone
   - Configure VS Code with React Native extensions
   - Test basic app runs

4. **Create Folder Structure**
   - Set up folders as outlined above
   - Copy types from web app

Ready to begin? Let me know and we'll start with Task 1! 🚀
