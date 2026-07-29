# Web App Features Documentation

Complete reference for all features implemented in the Inside Journaling App web application (React + .NET).

---

## 🎙️ Voice Recording

### Overview
Voice recording functionality allows users to create journal entries by recording their voice instead of typing.

### Frontend Implementation

#### **AudioRecordingService** (`src/services/audioRecordingService.ts`)
- Browser Web Audio API integration
- Microphone capture with MediaRecorder
- Recording state management (start/stop/pause)
- Audio returned as Blob for upload
- Automatic media stream cleanup
- Error handling for permissions

#### **VoiceRecorder Component** (`src/components/VoiceRecorder.tsx`)
- User-friendly recording interface
- Visual recording indicator with animated pulse
- Real-time timer (MM:SS format)
- Start/Stop/Clear controls
- Microphone permission handling
- Audio preview with playback controls
- Disabled state when text entry active
- Mutually exclusive with text input

#### **Styling** (`src/components/VoiceRecorder.css`)
- Gradient button styling
- Animated pulse dot during recording
- Audio preview card with dashed border
- Responsive design
- Clear visual state feedback

### Backend Implementation

#### **Voice Endpoint** (`POST /api/journal/voice`)
- Accepts multipart form data (audio file + userId)
- Uploads audio to Azure Blob Storage
- Transcribes audio using Azure Speech-to-Text
- Returns transcription and blob URL
- Error handling for failed transcription

#### **Analyze Endpoint Updates** (`POST /api/journal/analyze`)
- Now accepts `isVoiceEntry` boolean
- Accepts `audioBlobUrl` field
- Links audio to journal entry in database

### User Experience
- Record voice → Preview audio → Submit → Transcription → Sentiment analysis → Entry saved
- Can retry recording before submission
- Transcription status indicator
- Audio playback available in entry details

**Key Files:**
- `mentalhealthjournal.client/src/services/audioRecordingService.ts`
- `mentalhealthjournal.client/src/components/VoiceRecorder.tsx`
- `MentalHealthJournal.Server/Controllers/JournalController.cs`
- `MentalHealthJournal.Services/SpeechToTextService.cs`

---

## 🤖 AI-Powered Analysis

### Overview
Comprehensive AI analysis of journal entries using Azure Cognitive Services and OpenAI.

### Features

#### **1. Sentiment Analysis**
- **Azure Text Analytics** for emotional tone detection
- Four sentiment types: Positive, Negative, Neutral, Mixed
- Confidence scores (0-1) for each sentiment
- Overall sentiment score calculated from confidence values
- Real-time analysis on entry submission

#### **2. Key Phrase Extraction**
- **Azure Text Analytics** for topic identification
- Extracts important themes and subjects
- Returns top phrases mentioned in entry
- Used for word cloud visualization
- Helps identify recurring topics over time

#### **3. GPT-4 Affirmations**
- **Azure OpenAI Service** for personalized encouragement
- Context-aware affirmations based on entry content
- Tailored to user's emotional state
- Positive, supportive messages
- Displayed after entry submission

#### **4. Crisis Detection**
- Azure OpenAI GPT-4 for content analysis
- Detects signs of crisis:
  - Suicidal ideation
  - Self-harm intentions
  - Severe hopelessness
  - Recent trauma or abuse
- Calibrated to avoid false positives
- Does NOT flag general sadness or stress
- Triggers automatic resource display

### Backend Services

#### **JournalAnalysisService.cs**
- Text Analytics API integration
- Sentiment scoring algorithm
- Key phrase aggregation
- Response mapping to app models
- Error handling and fallbacks

#### **Crisis Detection Service**
- OpenAI GPT-4 Chat Completions API
- Specialized system prompt for crisis detection
- JSON response parsing
- Confidence scoring (0-100)
- Reasoning explanations for detections

### API Endpoints
- `POST /api/journal/analyze` - Sentiment + key phrases + affirmation
- `POST /api/journal/detect-crisis` - Crisis content analysis

**Key Files:**
- `MentalHealthJournal.Services/JournalAnalysisService.cs`
- `MentalHealthJournal.Server/Controllers/JournalController.cs`
- `mentalhealthjournal.client/src/services/journalService.ts`

---

## 📊 Data Visualizations

### Overview
Interactive charts and visualizations for mental wellness insights.

### Components

#### **1. Sentiment Timeline Chart**
- Line chart showing sentiment over last 30 days with entries
- Color-coded data points based on sentiment type
- Interactive tooltips with date, sentiment, and entry count
- Gradient area fill for visual appeal
- SVG-based rendering for smooth lines
- Responsive design for all screen sizes

**Features:**
- Groups entries by date
- Calculates daily average sentiment score
- Displays only days with entries
- Zoom and pan capabilities (optional)

#### **2. Key Phrases Word Cloud**
- Dynamic word sizing based on frequency
- Color coding by sentiment association
- Interactive hover showing frequency and sentiment
- Displays top 20-30 most common phrases
- Animated layout with subtle rotations
- Statistics panel (unique themes, total mentions, most common)

**Features:**
- Aggregates phrases across all entries
- Weighted sizing algorithm
- Color mapping (green=positive, red=negative, etc.)
- Responsive scaling to container

#### **3. Mood Pattern Analysis**
- Time-of-day analysis
- Weekly patterns (which days user journals)
- Sentiment distribution pie chart
- Entry frequency histogram

**Libraries Used:**
- Custom SVG charts
- D3.js for advanced visualizations (optional)
- Chart.js for simpler charts

#### **4. Statistics Cards**
- Total entries count
- Current streak (consecutive days)
- Longest streak record
- Average sentiment score
- Most common emotion
- Entries this week/month

**Key Files:**
- `mentalhealthjournal.client/src/components/SentimentTimeline.tsx`
- `mentalhealthjournal.client/src/components/KeyPhrasesCloud.tsx`
- `mentalhealthjournal.client/src/components/Dashboard.tsx`

---

## 🆘 Crisis Support Integration

### Overview
Intelligent crisis detection and immediate access to professional resources.

### Features

#### **1. Automatic Crisis Detection**
- AI-powered analysis of journal entries
- Flags concerning content:
  - Suicidal ideation or self-harm plans
  - Severe hopelessness with no perceived way out
  - Recent suicide attempts or severe self-harm
  - Acute trauma or abuse
- Calibrated to minimize false positives
- Does NOT flag normal sadness, stress, or anxiety

#### **2. Resource Modal Display**
When concerning content detected:
- Modal appears immediately after submission
- Explains why resources are shown
- Lists comprehensive 24/7 crisis contacts
- Encourages professional help
- Option to dismiss but resources remain accessible

#### **3. Manual Access Button**
"🆘 Need Help Now?" button in app header:
- Visible from any page
- No judgment - available for proactive support
- Same resource list as automatic detection
- Always accessible regardless of entry content

### Crisis Resources

**Included Hotlines:**
1. **988 Suicide & Crisis Lifeline**
   - Phone: 988
   - Text: 988
   - 24/7 free, confidential support

2. **Crisis Text Line**
   - Text: HOME to 741741
   - 24/7 support via text

3. **SAMHSA National Helpline**
   - Phone: 1-800-662-4357
   - Mental health and substance abuse
   - 24/7 treatment referral

4. **Veterans Crisis Line**
   - Phone: 988, then press 1
   - Text: 838255
   - For veterans and their families

5. **Trevor Project (LGBTQ Youth)**
   - Phone: 1-866-488-7386
   - Text: START to 678-678
   - Chat available on website

### Backend Implementation
- OpenAI GPT-4 for content analysis
- Confidence scoring system
- Reasoning logs for transparency
- Rate limiting to prevent API abuse
- Fallback to manual review if needed

**Key Files:**
- `mentalhealthjournal.client/src/components/CrisisResourcesModal.tsx`
- `mentalhealthjournal.client/src/components/Header.tsx`
- `MentalHealthJournal.Server/Controllers/JournalController.cs`

---

## 🔐 Authentication & Security

### Google OAuth Integration
- Google Sign-In for web
- OAuth 2.0 authorization code flow
- JWT token generation and validation
- Secure token storage in HTTP-only cookies
- Auto-refresh tokens on expiration

### Security Features
- HTTPS enforced in production
- Managed Identity for Azure service authentication
- Azure App Configuration for secrets management
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration for approved origins

### User Management
- User registration with age verification (13+)
- Username availability checking
- Profile updates (username, display name)
- Account deletion (soft delete)
- Privacy consent tracking

**Key Files:**
- `MentalHealthJournal.Server/Controllers/AuthController.cs`
- `MentalHealthJournal.Services/UserService.cs`
- `mentalhealthjournal.client/src/contexts/AuthContext.tsx`

---

## 💾 Data Storage

### Azure Cosmos DB
- NoSQL database for journal entries and user data
- Partition key: `/userId` for optimal query performance
- Containers:
  - **Users**: User accounts and profiles
  - **JournalEntries**: All journal entries
  - **AuditLogs**: Compliance audit trail
  - **UserConsents**: Privacy consent records

### Azure Blob Storage
- Audio file storage for voice entries
- Container: `journal-audio`
- File naming: `{userId}/{entryId}_{timestamp}.webm`
- Blob URLs stored with expiry
- Automatic cleanup of orphaned files

### Partitioning Strategy
- **Optimized**: Using `/userId` as partition key
- **Benefits**: Single-partition queries, lower RU costs, better performance
- **Previous issue**: Used unique GUIDs, caused cross-partition queries
- **Result**: 50-70% reduction in query costs after optimization

**Key Files:**
- `MentalHealthJournal.Services/CosmosDbService.cs`
- `MentalHealthJournal.Services/BlobStorageService.cs`

---

## ⚡ Performance Optimizations

### Implemented Optimizations

#### **1. Polly Resilience Policies**
- Retry policy: 3 attempts with exponential backoff
- Circuit breaker: Opens after 5 consecutive failures
- Timeout policy: 30 seconds for API calls
- Applied to all Azure service calls

#### **2. Lazy Loading**
- Journal entries loaded on demand
- Infinite scroll pagination (20 entries per page)
- Image lazy loading for avatars
- Component code splitting

#### **3. Caching Strategies**
- User data cached in memory (5 minutes)
- Sentiment analysis results cached (24 hours)
- Key phrases cached per entry
- Browser cache for static assets

#### **4. Database Query Optimization**
- Partition key specification in all queries
- Limited result sets (TOP N queries)
- Indexed fields for common queries
- Projection of only needed fields

#### **5. Frontend Optimization**
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers
- Virtual scrolling for long lists
- Debounced search inputs

### Monitoring
- Application Insights for performance tracking
- Custom telemetry events
- Exception tracking
- Dependency call durations
- User session analytics

**Key Files:**
- `MentalHealthJournal.Services/ResiliencePolicies.cs`
- `MentalHealthJournal.Server/Program.cs`
- `mentalhealthjournal.client/src/hooks/useInfiniteScroll.ts`

---

## 🧪 Testing

### Backend Tests
- **Unit Tests**: 40+ tests for services and controllers
- **Integration Tests**: Database and Azure service integration
- **Test Coverage**: ~75% overall

#### Test Categories
1. **Authentication Tests**
   - Google OAuth flow
   - JWT token generation/validation
   - User registration and login
   - Age verification

2. **Journal Service Tests**
   - Entry CRUD operations
   - Sentiment analysis
   - Key phrase extraction
   - Audio upload and transcription

3. **User Service Tests**
   - User creation and updates
   - Username availability
   - Profile management

### Frontend Tests
- Jest for unit tests
- React Testing Library for component tests
- Cypress for E2E tests (optional)

### Test Infrastructure
- xUnit test framework
- Moq for mocking dependencies
- In-memory Cosmos DB emulator
- Azurite for local blob storage

**Key Files:**
- `MentalHealthJournal.Tests/` directory
- `MentalHealthJournal.Tests/Controllers/`
- `MentalHealthJournal.Tests/Services/`

---

## 📦 Dependencies

### Frontend (React)
- React 19
- TypeScript
- Vite (build tool)
- React Query (data fetching)
- React Router (navigation)
- Application Insights (monitoring)

### Backend (.NET)
- .NET 8.0
- ASP.NET Core Web API
- Entity Framework Core patterns
- Azure SDK libraries
- Polly (resilience)
- xUnit (testing)

### Azure Services
- Azure App Service
- Azure Cosmos DB
- Azure Blob Storage
- Azure Cognitive Services (Text Analytics)
- Azure OpenAI Service
- Azure Speech Services
- Azure App Configuration
- Application Insights

---

## 🚀 Deployment

### Azure App Service
- .NET 8 runtime
- Linux or Windows hosting
- Auto-scaling enabled
- SSL/TLS certificates
- Custom domain support

### Configuration
- Managed Identity for Azure service auth
- App Configuration for centralized settings
- Environment-specific configuration
- Connection strings in secrets

### CI/CD
- GitHub Actions workflow
- Automated build and test
- Deploy on merge to main
- Rollback capabilities

**Key Files:**
- `MIGRATION_PLAN.md` - Deployment strategy and phases
- `APP_SETTINGS_MIGRATION.md` - Configuration approach
- `.github/workflows/` - CI/CD pipelines

---

## 📋 Legal & Compliance

### Privacy Policy
- Data collection transparency
- User rights (access, deletion, portability)
- Cookie usage disclosure
- Third-party service disclosure (Google, Azure)
- Contact information for privacy inquiries

### Terms of Service
- User responsibilities
- Acceptable use policy
- Service limitations and disclaimers
- Intellectual property rights
- Termination conditions

### COPPA Compliance
- Age verification (13+ required)
- Parental consent for minors (if applicable)
- Special privacy protections for children

### GDPR Considerations
- Right to access data
- Right to delete data
- Right to data portability
- Consent management
- Data breach notification

**Key Files:**
- `PRIVACY_POLICY.md`
- `TERMS_OF_SERVICE.md`
- `MentalHealthJournal.Services/UserConsentService.cs`
- `MentalHealthJournal.Services/AuditLogService.cs`

---

## 🎯 Development Status

**Current Phase:** Phase 1 Complete, Phase 2 (Mobile) In Progress

✅ **Web Application:** Fully deployed and operational  
✅ **Azure Infrastructure:** Production-ready  
✅ **Core Features:** Voice, AI, visualizations, crisis support  
✅ **Testing:** Comprehensive test coverage  
✅ **Documentation:** Complete guides and references  

**[View Deployment Guide →](MIGRATION_PLAN.md)** | **[View Testing Guide →](TESTING_GUIDE.md)**
