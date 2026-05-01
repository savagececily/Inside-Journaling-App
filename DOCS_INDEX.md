# Documentation Index

Quick reference guide to all Mental Health Journal documentation.

---

## 📖 Start Here

**New to the project?** Start with these:
1. [README.md](README.md) - Project overview, features, and quick start
2. [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) - How to deploy to Azure
3. [PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md) - Cost optimization, freemium model, and production readiness
4. [TESTING_GUIDE.md](TESTING_GUIDE.md) - How to test the application

---

## 🚀 Production & Operations

### **[PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md)** - Complete production readiness guide

Includes:
- 💰 **Cost Analysis** - Per-user costs and optimization strategies (67% reduction achieved)
- 💎 **Freemium Model** - Tier structure, quotas, token tracking, revenue projections
- ⚡ **Performance** - Retry policies, caching, code splitting, monitoring
- 🎯 **Deployment** - Azure resource setup, configuration, testing procedures
- 📊 **Monitoring** - KQL queries, metrics, alerts, dashboards
- 🔧 **Configuration** - Environment variables, rate limiting, rollback procedures

### **[AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)** - Deployment procedures
- Azure resource provisioning
- App Service configuration
- CI/CD setup
- Production deployment steps

### **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures
- Unit tests (xUnit)
- Integration tests
- Manual testing procedures
- Test coverage reports

---

## 🌐 Web Application (React + .NET)

### **[WEB_FEATURES.md](WEB_FEATURES.md)** - Complete web app feature documentation

Includes:
- 🎙️ Voice Recording - Speech-to-text with Azure Speech Services
- 🤖 AI-Powered Analysis - Sentiment, key phrases, affirmations, crisis detection
- 📊 Data Visualizations - Charts and insights dashboard
- 🆘 Crisis Support - AI detection and crisis resources
- 🔐 Authentication - Google OAuth and security
- 💾 Data Storage - Cosmos DB and Blob Storage
- ⚡ Performance - Optimizations and caching
- 🧪 Testing - Unit and integration tests

---

## 📱 Mobile Application (React Native + Expo)

### **[MOBILE_FEATURES.md](MOBILE_FEATURES.md)** - Complete mobile app feature documentation

Includes:
- 🎨 UI Components Library - 15+ reusable components
- 🔐 Google OAuth - Authentication flow
- 📝 Journal Management - Create, edit, delete entries
- 🔄 Offline-First Sync - Background synchronization
- 📊 Visualizations - Charts, calendars, analytics
- 🆘 Crisis Support - Hotlines, breathing, grounding
- 🔔 Push Notifications - Daily reminders and streaks
- 🔒 Biometric Auth - Face ID, Touch ID, Fingerprint
- 🌓 Dark Mode - Automatic theme switching
- 📳 Haptic Feedback - Tactile responses
- 🔗 Deep Linking - URL schemes and navigation

---

## 🔐 Authentication Setup

### **[GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)** - Google OAuth configuration
- Google Cloud Console setup
- OAuth 2.0 credentials
- Frontend and backend integration

### **[MICROSOFT_LOGIN_SETUP.md](MICROSOFT_LOGIN_SETUP.md)** - Microsoft OAuth configuration
- Azure AD app registration
- Microsoft authentication setup
- Integration guide

---

## ⚖️ Legal

### **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)** - Privacy policy
- Data collection practices
- User rights and consent
- Security measures

### **[TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)** - Terms of service
- User agreements
- Service terms
- Liability and disclaimers

---

## 📊 Documentation Structure

```
docs/
├── README.md                    # Project overview
├── PRODUCTION_GUIDE.md          # ⭐ Production readiness (cost, freemium, performance)
├── AZURE_DEPLOYMENT.md          # Deployment procedures
├── TESTING_GUIDE.md             # Testing guide
├── WEB_FEATURES.md              # Web app features
├── MOBILE_FEATURES.md           # Mobile app features
├── GOOGLE_OAUTH_SETUP.md        # Google OAuth setup
├── MICROSOFT_LOGIN_SETUP.md     # Microsoft OAuth setup
├── PRIVACY_POLICY.md            # Privacy policy
└── TERMS_OF_SERVICE.md          # Terms of service
```

---

## 🔍 Quick Find

**I want to...**
- **Deploy to Azure** → [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)
- **Understand costs and monetization** → [PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md)
- **Set up monitoring** → [PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md#monitoring--analytics)
- **Run tests** → [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Learn about features** → [WEB_FEATURES.md](WEB_FEATURES.md) or [MOBILE_FEATURES.md](MOBILE_FEATURES.md)
- **Configure OAuth** → [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)
- **Check configuration options** → [PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md#configuration-reference)
- **Set up cost alerts** → [PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md#4-set-up-cost-alerts)

---

**Last Updated:** April 30, 2026

### Progress & Planning
- **[MOBILE_PROGRESS.md](MOBILE_PROGRESS.md)** - Sprint summaries, statistics, achievements
- **[PHASE_2_PLAN.md](PHASE_2_PLAN.md)** - 6-sprint development roadmap with task breakdown

**Status:** Sprint 4 of 6 Complete (67%)

---

## 🛠️ Technical Documentation

### Performance & Optimization
**[PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md)**
- Polly resilience policies
- Caching strategies
- Database query optimization
- Frontend optimizations
- Monitoring with Application Insights

### Testing
**[UNIT_TEST_SUMMARY.md](UNIT_TEST_SUMMARY.md)**
- Test coverage statistics
- Test categories breakdown
- Testing infrastructure
- How to run tests

**[TESTING_GUIDE.md](TESTING_GUIDE.md)**
- End-to-end testing guide
- Manual testing procedures
- Test scenarios and cases

---

## ⚖️ Legal & Compliance

**[PRIVACY_POLICY.md](PRIVACY_POLICY.md)**
- Data collection and usage
- User rights (access, deletion, portability)
- Third-party services
- GDPR and COPPA compliance

**[TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)**
- User responsibilities
- Acceptable use policy
- Service limitations
- Intellectual property

---

## 📂 Documentation Structure

```
MentalHealthJournal/
├── README.md                       # Project overview & quick start
├── DOCS_INDEX.md                   # This file - documentation navigator
│
├── WEB_FEATURES.md                 # Web app features (React + .NET)
├── MOBILE_FEATURES.md              # Mobile app features (React Native)
│
├── MOBILE_PROGRESS.md              # Mobile development progress
├── PHASE_2_PLAN.md                 # Mobile development roadmap
│
├── AZURE_DEPLOYMENT.md             # Deployment instructions
├── TESTING_GUIDE.md                # Testing procedures
├── UNIT_TEST_SUMMARY.md            # Test coverage
├── PERFORMANCE_OPTIMIZATIONS.md    # Performance best practices
│
├── PRIVACY_POLICY.md               # Privacy and data policy
└── TERMS_OF_SERVICE.md             # Terms and conditions
```

---

## 🎯 Quick Links by Task

### "I want to..."

#### Deploy the Application
→ [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)

#### Understand Web Features
→ [WEB_FEATURES.md](WEB_FEATURES.md)

#### Understand Mobile Features
→ [MOBILE_FEATURES.md](MOBILE_FEATURES.md)

#### See Mobile Development Progress
→ [MOBILE_PROGRESS.md](MOBILE_PROGRESS.md)

#### Run Tests
→ [TESTING_GUIDE.md](TESTING_GUIDE.md)

#### Optimize Performance
→ [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md)

#### Review Privacy/Legal
→ [PRIVACY_POLICY.md](PRIVACY_POLICY.md) & [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)

---

## 📝 Recently Consolidated

The following files were consolidated into **WEB_FEATURES.md** and **MOBILE_FEATURES.md**:

**Removed Files:**
- ~~CRISIS_SUPPORT_FEATURE.md~~ → Now in WEB_FEATURES.md
- ~~DATA_VISUALIZATION_FEATURE.md~~ → Now in WEB_FEATURES.md & MOBILE_FEATURES.md
- ~~VOICE_RECORDING_FEATURE.md~~ → Now in WEB_FEATURES.md
- ~~UI_COMPONENTS_LIBRARY.md~~ → Now in MOBILE_FEATURES.md
- ~~OFFLINE_SYNC_IMPLEMENTATION.md~~ → Now in MOBILE_FEATURES.md
- ~~GOOGLE_OAUTH_IMPLEMENTATION.md~~ → Now in MOBILE_FEATURES.md
- ~~COSMOS_DB_PARTITIONING.md~~ → Now in WEB_FEATURES.md
- ~~BUG_FIX_USER_ID_CONSISTENCY.md~~ → Historical, removed
- ~~PARTITION_KEY_FIX.md~~ → Historical, removed
- ~~GOOGLE_OAUTH_SETUP_CHECKLIST.md~~ → Redundant, removed
- ~~PHASE_1_PROGRESS.md~~ → Superseded by MOBILE_PROGRESS.md

**Result:** Reduced from 25 docs to 11 focused, well-organized documents.

---

**Last Updated:** March 19, 2026  
**Documentation Version:** 2.0 (Consolidated)
