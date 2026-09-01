# Inside Journaling App - Mobile App

React Native mobile application built with Expo for iOS and Android.

## 🚀 Quick Start

### Run the App

```bash
cd Journal.Mobile

# Start the development server
npm start

# Or run directly on iOS Simulator (macOS only)
npm run ios

# Or run on Android Emulator
npm run android
```

### Using Expo Go App

1. Install **Expo Go** on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the dev server: `npm start`
3. Scan the QR code with your phone camera (iOS) or Expo Go app (Android)

## ✅ What's Implemented (Sprint 1, Complete!)

### ✨ Foundation & Components Complete!

- [x] **Project Setup**
  - Expo SDK 55 with TypeScript
  - Folder structure organized by feature
  - React Native 0.76+

- [x] **Google OAuth Authentication** 
  - expo-auth-session integration
  - Secure token storage (expo-secure-store)
  - Backend JWT authentication
  - Automatic session restore
  - Age verification support

- [x] **Navigation System**
  - React Navigation 7 configured
  - Bottom tab navigation (Journal, Insights, Profile)
  - Stack navigators for each tab
  - Authentication flow handling
  - Type-safe navigation

- [x] **Authentication Framework**
  - AuthContext with React Context API
  - Secure token storage (expo-secure-store)
  - Local data storage (AsyncStorage)
  - Login/logout functionality
  - API client with auth interceptors

- [x] **UI Components Library** ⭐ NEW!
  - Common components: Button, Input, Card, Badge, LoadingSpinner, EmptyState
  - Journal components: JournalCard, SentimentBadge, VoiceRecorder
  - Theme-integrated with colors, spacing, typography
  - Accessibility features (44px touch targets, focus states)
  - Full TypeScript type safety

- [x] **Core Dependencies**
  - React Query (TanStack Query) for API caching
  - Axios for API calls with interceptors
  - Safe Area Context for notch/home indicator support
  - Gesture Handler for smooth interactions

- [x] **Theme System**
  - Colors matching web app (#6366f1 primary)
  - Typography system
  - Spacing & border radius constants
  - Shadows/elevation

- [x] **Placeholder Screens**
  - Login screen UI
  - Journal list screen
  - Insights dashboard screen
  - Profile screen with logout

## 📂 Project Structure

```
src/
├── screens/          # Screen components
│   ├── Auth/        # Login, Onboarding
│   ├── Journal/     # Journal list, detail, new entry
│   ├── Insights/    # Dashboard, trends, calendar
│   ├── Profile/     # Profile, settings, about
│   └── Crisis/      # Crisis support
├── components/       # Reusable components
│   ├── common/      # Button, Input, Card, etc.
│   ├── journal/     # Journal-specific components
│   └── insights/    # Insight-specific components
├── navigation/       # Navigation setup
├── services/        # API & storage services
│   ├── api/         # API client, endpoints
│   ├── storage/     # Secure & local storage
│   └── sync/        # Offline sync (coming soon)
├── hooks/           # Custom React hooks
├── contexts/        # React contexts (Auth, Theme)
├── types/           # TypeScript types
├── utils/           # Utilities & constants
└── theme/           # Design system (colors, typography)
```

## 🛠️ Technology Stack

- **React Native 0.76+** via Expo SDK 55
- **TypeScript 5.6+** for type safety
- **React Navigation 7** for navigation
- **TanStack Query** (React Query) for data fetching & caching
- **Axios** for HTTP requests
- **Expo modules:**
  - expo-secure-store (token storage)
  - expo-auth-session (OAuth)
  - expo-av (audio recording)
  - AsyncStorage (local data)

## 🔧 Configuration

### API Endpoint

Update your backend URL in `src/utils/constants.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://localhost:5079' // Your local API
  : 'https://your-app.azurewebsites.net'; // Production API
```

**Note for iOS Simulator:** Use `localhost`  
**Note for physical device:** Replace with your computer's local IP (e.g., `http://192.168.1.5:5079`)

### Google OAuth Setup

**Status:** ✅ Implemented in Sprint 1, Task 2

The mobile app uses Google OAuth for authentication. Follow these steps to configure it:

#### 1. Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or Google Sign-In API)
   - Click "Enable APIs and Services"
   - Search for "Google+ API" and enable it

#### 2. Create OAuth 2.0 Client IDs

You need **THREE** separate OAuth client IDs:

**A. Web Client ID** (for Expo Go and web testing)
1. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Add authorized redirect URIs:
   - `https://auth.expo.io/@YOUR_EXPO_USERNAME/journal-mobile`
   - `http://localhost:19006` (for web testing)
4. Click **Create** and copy the **Client ID**

**B. iOS Client ID** (for production iOS builds)
1. Create new OAuth 2.0 Client ID
2. Application type: **iOS**
3. Bundle ID: Get from `app.json` (e.g., `com.yourcompany.journal`)
4. Click **Create** and copy the **Client ID**

**C. Android Client ID** (for production Android builds)
1. Create new OAuth 2.0 Client ID
2. Application type: **Android**
3. Package name: Same as bundle ID from `app.json`
4. SHA-1 certificate fingerprint:
   ```bash
   # For debug builds
   keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey
   # Password: android
   
   # For production, use your release keystore
   ```
5. Click **Create** and copy the **Client ID**

#### 3. Update Mobile App Configuration

Edit `src/utils/constants.ts` and replace the placeholder client IDs:

```typescript
export const GOOGLE_CLIENT_ID_IOS = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_ANDROID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_WEB = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
```

**For development with Expo Go:** Only the **Web Client ID** is needed initially.

#### 4. Configure Backend API

The backend validates Google ID tokens using ONE client ID. Update your backend `appsettings.json`:

```json
{
  "Google": {
    "ClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

**Important:** Use the **Web Client ID** in the backend config for maximum compatibility.

#### 5. Get Your Expo Username (if using Expo Go)

If using Expo Go for testing:
```bash
# Login to Expo
npx expo login

# Check your username
npx expo whoami
```

Update the redirect URI in Google Cloud Console to:
```
https://auth.expo.io/@YOUR_ACTUAL_USERNAME/journal-mobile
```

#### 6. Test OAuth Flow

```bash
npm start
# Scan QR code with Expo Go app
# Tap "Sign in with Google"
# Should open browser for Google sign-in
```

**Troubleshooting:**
- **"Invalid client" error:** Check that client IDs match in `constants.ts`
- **Redirect URI mismatch:** Verify the redirect URI in Google Cloud Console
- **Backend 500 error:** Check backend `appsettings.json` has correct ClientId
- **Works on iOS simulator but not device:** Web Client ID is used for Expo Go

#### Production Builds

For standalone production builds (not Expo Go):
- **iOS:** Uses `GOOGLE_CLIENT_ID_IOS`
- **Android:** Uses `GOOGLE_CLIENT_ID_ANDROID`
- These require proper bundle IDs and signing certificates configured

## 🧪 Testing the App

### Current State
The app is ready to run with complete UI components! You'll see:
- **✅ Google OAuth Login** - Fully functional (requires OAuth setup)
- **✅ Authentication Flow** - Login, token storage, automatic session restore
- **✅ Bottom Tab Navigation** - Journal, Insights, Profile tabs
- **✅ UI Components Library** - 9 reusable components ready to use
- **✅ Placeholder Screens** - Journal list, Insights dashboard, Profile
- **✅ Logout Functionality** - Clears auth state and returns to login

### Next Steps (Sprint 2)
- **Task 4:** Journal entry creation screen with AI analysis
- **Task 5:** Journal entry list with real data
- **Task 6:** Offline sync implementation

## 📝 Development Tips

### Hot Reload
The app supports fast refresh - changes appear instantly while keeping state.

### Debugging
- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android) for dev menu
- Enable "Debug Remote JS" to use Chrome DevTools
- View logs in terminal where `npm start` is running

### iOS Simulator (macOS only)
```bash
# Install Xcode from App Store first
npm run ios
```

### Android Emulator
```bash
# Install Android Studio first, set up an AVD
npm run android
```

## 🚧 What'2 (Week 2):
- **Task 4:** Journal entry creation with voice recording and AI analysis
- **Task 5:** Journal entry list with real API integration
- **Task 6:** Offline sync with AsyncStorage and sync queuetion with AI analysis
- Voice recording integration
- Offline sync setup

### Sprint 3 (Week 3):
- Insights dashboard with charts
- Streak counter
- Calendar view

### Sprint 4 (Week 4):
- Push notifications
- Biometric authentication
- Dark mode

### Sprint 5 (Week 5):
- Polish & testing
- Performance optimization

### Sprint 6 (Week 6):
- App Store submission (iOS)
- Google Play submission (Android)

## 🔗 Related Files

- **Phase 2 Plan:** `../PHASE_2_PLAN.md` - Complete roadmap
- **Backend:** `../Journal.Server/` - .NET API
- **Web App:** `../journal.client/` - React web app

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Docs](https://reactnative.dev/)
- [TanStack Query](https://tanstack.com/query/latest)

## ❓ Troubleshooting

### Metro bundler cache issues
```bash
npm start -- --clear
```

### Node modules issues
```bash
rm -rf node_modules
npm install
```

### iOS build issues
```bash
cd ios && pod install && cd ..
```

## 📧 Support

For issues or questions, refer to the main project README in the repository root.

---

**Built with ❤️ using Expo & React Native**
