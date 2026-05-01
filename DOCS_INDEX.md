# Documentation Index

Quick reference guide to all Mental Health Journal documentation.

---

## 📖 Start Here

**New to the project?** Start with these:
1. [README.md](README.md) - Project overview, features, and quick start
2. [OPERATIONS.md](OPERATIONS.md) - Complete deployment and production operations guide
3. [TESTING_GUIDE.md](TESTING_GUIDE.md) - How to test the application

---

## 🚀 Production & Operations

### **[OPERATIONS.md](OPERATIONS.md)** - Complete deployment and operations guide

Includes:
- 🚀 **Azure Deployment** - App Service setup, managed identity, CI/CD pipelines
- 💰 **Cost Analysis** - Per-user costs and optimization strategies (67% reduction achieved)
- 💎 **Freemium Model** - Tier structure, quotas, token tracking, revenue projections
- ⚡ **Performance** - Retry policies, caching, code splitting, monitoring
- 📊 **Monitoring** - Application Insights, KQL queries, metrics, alerts
- 🔧 **Configuration** - Environment variables, rate limiting, rollback procedures
- 🧪 **Testing** - Production testing procedures
- 🔒 **Security** - Managed identity, quota bypass prevention, privacy

### **[PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md)** - Payment and subscription implementation

Includes:
- 💳 **Payment Provider** - Stripe vs PayPal vs Square comparison (Stripe recommended)
- 🛠️ **Web Implementation** - Complete Stripe Checkout integration guide
- 📱 **Mobile IAP** - Apple/Google In-App Purchase implementation
- 🔒 **Security** - PCI compliance, webhook verification, receipt validation
- 🧪 **Testing** - Test modes, sandbox accounts, local webhook testing
- 📊 **Analytics** - Revenue metrics, conversion tracking, monitoring queries

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

### **[AUTHENTICATION.md](AUTHENTICATION.md)** - Complete OAuth configuration guide

Includes:
- 🔑 **Google OAuth** - Console setup, redirect URIs, test users, troubleshooting
- 🔑 **Microsoft OAuth** - Entra ID app registration, authentication config, API permissions
- 📱 **Mobile Configuration** - iOS and Android setup for both providers
- 🔒 **Security Best Practices** - Token validation, secure storage, monitoring

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
├── OPERATIONS.md                # ⭐ Complete deployment and operations guide
├── PAYMENT_STRATEGY.md          # 💳 Payment & subscription implementation
├── AUTHENTICATION.md            # 🔐 OAuth setup (Google & Microsoft)
├── TESTING_GUIDE.md             # Testing guide
├── WEB_FEATURES.md              # Web app features
├── MOBILE_FEATURES.md           # Mobile app features
├── PRIVACY_POLICY.md            # Privacy policy
└── TERMS_OF_SERVICE.md          # Terms of service
```

---

## 🔍 Quick Find

**I want to...**
- **Deploy to Azure** → [OPERATIONS.md](OPERATIONS.md)
- **Understand costs and monetization** → [OPERATIONS.md](OPERATIONS.md#cost-analysis--optimization)
- **Set up CI/CD** → [OPERATIONS.md](OPERATIONS.md#continuous-deployment-with-github-actions)
- **Implement payments** → [PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md)
- **Set up Stripe** → [PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md#-web-implementation-stripe-checkout)
- **Set up mobile IAP** → [PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md#-mobile-implementation-in-app-purchases)
- **Configure Google OAuth** → [AUTHENTICATION.md](AUTHENTICATION.md#google-oauth-setup)
- **Configure Microsoft OAuth** → [AUTHENTICATION.md](AUTHENTICATION.md#microsoft-oauth-setup)
- **Set up monitoring** → [OPERATIONS.md](OPERATIONS.md#monitoring--analytics)
- **Run tests** → [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Learn about features** → [WEB_FEATURES.md](WEB_FEATURES.md) or [MOBILE_FEATURES.md](MOBILE_FEATURES.md)
- **Check configuration options** → [OPERATIONS.md](OPERATIONS.md#configuration-reference)
- **Troubleshoot deployment** → [OPERATIONS.md](OPERATIONS.md#troubleshooting)
- **Optimize costs** → [OPERATIONS.md](OPERATIONS.md#key-optimizations-implemented)

---

## 📝 Consolidation History

**May 1, 2026** - Documentation consolidated from 12 files to 10:
- ✅ **AUTHENTICATION.md** (new) ← GOOGLE_OAUTH_SETUP.md + MICROSOFT_LOGIN_SETUP.md
- ✅ **OPERATIONS.md** (new) ← AZURE_DEPLOYMENT.md + PRODUCTION_GUIDE.md
- Result: Clearer navigation, reduced redundancy, comprehensive guides

**Previous Consolidation (March 2026):**
- ✅ **WEB_FEATURES.md** ← Crisis Support, Data Visualization, Voice Recording features
- ✅ **MOBILE_FEATURES.md** ← UI Components, Offline Sync, OAuth features
- Result: From 25 docs to 12 focused documents

---

**Last Updated:** May 1, 2026  
**Documentation Version:** 3.0 (Aggressive Consolidation)

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

## 📂 Documentation Structure

```
MentalHealthJournal/
├── README.md                       # Project overview & quick start
├── DOCS_INDEX.md                   # This file - documentation navigator
│
├── AUTHENTICATION.md               # OAuth setup (Google & Microsoft)
├── OPERATIONS.md                   # Complete deployment & operations
├── PAYMENT_STRATEGY.md             # Payment & subscription implementation
├── TESTING_GUIDE.md                # Testing procedures
│
├── WEB_FEATURES.md                 # Web app features (React + .NET)
├── MOBILE_FEATURES.md              # Mobile app features (React Native)
│
├── PRIVACY_POLICY.md               # Privacy and data policy
└── TERMS_OF_SERVICE.md             # Terms and conditions
```

---

## 🎯 Quick Links by Task

### "I want to..."

#### Deploy the Application
→ [OPERATIONS.md](OPERATIONS.md)

#### Configure OAuth
→ [AUTHENTICATION.md](AUTHENTICATION.md)

#### Implement Payments
→ [PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md)

#### Understand Web Features
→ [WEB_FEATURES.md](WEB_FEATURES.md)

#### Understand Mobile Features
→ [MOBILE_FEATURES.md](MOBILE_FEATURES.md)

#### Run Tests
→ [TESTING_GUIDE.md](TESTING_GUIDE.md)

#### Review Privacy/Legal
→ [PRIVACY_POLICY.md](PRIVACY_POLICY.md) & [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)

---

## 📝 Consolidation History

**May 1, 2026** - Documentation consolidated from 12 files to 10:
- ✅ **AUTHENTICATION.md** (new) ← GOOGLE_OAUTH_SETUP.md + MICROSOFT_LOGIN_SETUP.md
- ✅ **OPERATIONS.md** (new) ← AZURE_DEPLOYMENT.md + PRODUCTION_GUIDE.md
- Result: Clearer navigation, reduced redundancy, comprehensive guides

**Previous Consolidation (March 2026):**
- ✅ **WEB_FEATURES.md** ← Crisis Support, Data Visualization, Voice Recording features
- ✅ **MOBILE_FEATURES.md** ← UI Components, Offline Sync, OAuth features
- Result: From 25 docs to 12 focused documents

---

**Last Updated:** May 1, 2026  
**Documentation Version:** 3.0 (Aggressive Consolidation)
