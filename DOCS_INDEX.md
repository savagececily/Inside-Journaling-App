# Documentation Index

Quick reference guide to all Inside Journaling App documentation.

---

## 📖 Start Here

**New to the project?** Start with these:
1. [README.md](README.md) - Project overview, features, and quick start
2. [TESTING_GUIDE.md](TESTING_GUIDE.md) - How to test the application
3. [azure-setup/README.md](azure-setup/README.md) - Deployment scripts and procedures

---

## 🚀 Deployment & Configuration

### **[azure-setup/README.md](azure-setup/README.md)** - Deployment scripts

**⚡ Automated deployment scripts**

Available scripts:
- 🔧 **configure-app-settings.sh** - Set up all app settings for both slots
- 🚀 **deploy-to-dev.sh** - Build and deploy to development slot
- 🔄 **swap-to-production.sh** - Promote development to production
- ⏪ **rollback-production.sh** - Emergency rollback if needed

**Azure Resources:**
- **Resource Group:** InsideJournalingAppRG
- **Web App:** inside-journaling-app (production) with development slot
- **Cosmos DB:** inside-journaling-app-cosmosdb
- **Storage:** sainsidejournalingapp
- **Azure AI Foundry Hub:** Inside-Journaling-App-Foundry
- **AI Models:** gpt-4o-mini, gpt-4o (serverless, 250 capacity each)
- **Managed Identities:** Inside-Journaling-App-UAMI (prod), Inside-Journaling-App-DEV-UAMI (dev)

### **[PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md)** - Payment and subscription implementation

Includes:
- 💳 **Payment Provider** - Stripe vs PayPal vs Square comparison (Stripe recommended)
- 🛠️ **Web Implementation** - Complete Stripe Checkout integration guide
- 📱 **Mobile IAP** - Apple/Google In-App Purchase implementation
- 🔒 **Security** - PCI compliance, webhook verification, receipt validation
- 🧪 **Testing** - Test modes, sandbox accounts, local webhook testing
- 📊 **Analytics** - Revenue metrics, conversion tracking, monitoring queries

### **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures

Includes:
- 🧪 **Unit tests** (xUnit) - Service layer and controller tests
- 🔗 **Integration tests** - End-to-end API testing
- 📋 **Manual testing** - Step-by-step testing procedures
- 📊 **Coverage reports** - Test coverage analysis

### **[AUTHENTICATION.md](AUTHENTICATION.md)** - Authentication implementation

Details on Google OAuth, JWT tokens, and security implementation.

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

## 📱 Mobile Application (React Native)

### **[MOBILE_FEATURES.md](MOBILE_FEATURES.md)** - Complete mobile app feature documentation

Includes:
- 📱 **Offline-First Architecture** - Complete offline support with automatic background sync
- 🎙️ **Voice Recording** - Native audio recording with speech-to-text
- 🤖 **AI Analysis** - Sentiment analysis, key phrases, affirmations, crisis detection
- 📊 **Data Visualizations** - Sentiment charts, streak counter, calendar view, word clouds
- 🆘 **Crisis Support** - Emergency hotlines, breathing exercises, grounding techniques
- 🔐 **Authentication** - Secure Google OAuth integration
- 🔄 **Sync Engine** - Smart background sync with conflict resolution
- 📦 **Tech Stack** - React Native (Expo), TypeScript, AsyncStorage, NetInfo

---

## 📄 Legal & Privacy

### **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)** - Privacy policy
User data handling, privacy rights, and compliance.

### **[TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)** - Terms of service
User agreement, acceptable use, and service terms.

---

## 🎯 Quick Links

- **Backend API:** [inside-journal-api.azurewebsites.net](https://inside-journal-api.azurewebsites.net)
- **Frontend:** [inside-journal-app (Static Web App)](https://polite-island-0c8b5cb0f.5.azurestaticapps.net)
- **Dev Slot:** [inside-journaling-app-development.azurewebsites.net](https://inside-journaling-app-development.azurewebsites.net)
- **Azure Portal:** [InsideJournalingAppRG](https://portal.azure.com/#@/resource/subscriptions/a7c4f882-34af-44dc-9bd7-ccac4f1ec402/resourceGroups/InsideJournalingAppRG/overview)

---

## 🛠️ Development Workflow

1. **Local Development**: Make changes to code
2. **Test Locally**: Run unit tests with `dotnet test`
3. **Deploy to Dev**: Use `./azure-setup/deploy-to-dev.sh`
4. **Test in Dev Slot**: Verify at development URL
5. **Swap to Production**: Use `./azure-setup/swap-to-production.sh`
6. **Rollback if Needed**: Use `./azure-setup/rollback-production.sh`

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
/
├── README.md                       # Project overview
├── MIGRATION_PLAN.md               # ⭐ Deployment strategy and phases
├── APP_SETTINGS_MIGRATION.md       # 💰 Configuration approach and cost savings
├── FOUNDRY_ARCHITECTURE_UPDATE.md  # 🤖 Azure AI Foundry architecture
├── DATA_MIGRATION_GUIDE.md         # 📦 Data migration reference (completed)
├── AUTHENTICATION.md               # 🔐 OAuth setup (Google & Microsoft)
├── PAYMENT_STRATEGY.md             # 💳 Payment & subscription implementation
├── TESTING_GUIDE.md                # 🧪 Testing guide
├── WEB_FEATURES.md                 # 🌐 Web app features
├── MOBILE_FEATURES.md              # 📱 Mobile app features
├── PRIVACY_POLICY.md               # ⚖️ Privacy policy
├── TERMS_OF_SERVICE.md             # ⚖️ Terms of service
└── azure-setup/
    ├── README.md                   # 📖 Script documentation
    ├── configure-app-settings.sh   # 🔧 Configure both slots
    ├── deploy-to-dev.sh            # 🚀 Deploy to development
    ├── swap-to-production.sh       # 🔄 Promote to production
    └── rollback-production.sh      # ⏪ Emergency rollback
```

---

## 🔍 Quick Find

**I want to...**
- **Deploy to Azure** → [MIGRATION_PLAN.md](MIGRATION_PLAN.md)
- **Configure app settings** → [APP_SETTINGS_MIGRATION.md](APP_SETTINGS_MIGRATION.md)
- **Run deployment scripts** → [azure-setup/README.md](azure-setup/README.md)
- **Understand Azure AI architecture** → [FOUNDRY_ARCHITECTURE_UPDATE.md](FOUNDRY_ARCHITECTURE_UPDATE.md)
- **Set up payments** → [PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md)
- **Configure OAuth** → [AUTHENTICATION.md](AUTHENTICATION.md)
- **Run tests** → [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Learn about features** → [WEB_FEATURES.md](WEB_FEATURES.md) or [MOBILE_FEATURES.md](MOBILE_FEATURES.md)
- **Review data migration** → [DATA_MIGRATION_GUIDE.md](DATA_MIGRATION_GUIDE.md)
- **Understand cost savings** → [APP_SETTINGS_MIGRATION.md](APP_SETTINGS_MIGRATION.md#-cost-savings)

---

## 📝 Architecture Updates

**July 25, 2026** - Configuration simplification and cost optimization:
- ✅ **Migrated to direct app settings** - Eliminated Azure App Configuration service
- ✅ **Cost savings** - ~$40/month reduction using environment variables
- ✅ **Simplified deployment** - Single script configures both production and development slots
- ✅ **Data migration complete** - 90 items migrated to development database
- ✅ **Cleaned up obsolete scripts** - Removed completed migration and old configuration scripts

**May 1, 2026** - Documentation consolidated from 12 files to 10:
- ✅ **AUTHENTICATION.md** (new) ← GOOGLE_OAUTH_SETUP.md + MICROSOFT_LOGIN_SETUP.md
- Result: Clearer navigation, reduced redundancy, comprehensive guides

---

**Last Updated:** July 25, 2026  
**Documentation Version:** 4.0 (Simplified Architecture)

## 📂 Documentation Structure

```
Journal/
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
Journal/
├── README.md                       # Project overview & quick start
├── DOCS_INDEX.md                   # This file - documentation navigator
│
├── MIGRATION_PLAN.md               # Deployment strategy & phases
├── APP_SETTINGS_MIGRATION.md       # Configuration & cost savings
├── FOUNDRY_ARCHITECTURE_UPDATE.md  # Azure AI architecture
├── DATA_MIGRATION_GUIDE.md         # Data migration reference
│
├── AUTHENTICATION.md               # OAuth setup (Google & Microsoft)
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
→ [MIGRATION_PLAN.md](MIGRATION_PLAN.md)

#### Configure App Settings
→ [APP_SETTINGS_MIGRATION.md](APP_SETTINGS_MIGRATION.md)

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
