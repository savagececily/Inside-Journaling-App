# 🧠 Mental Health Journal

A modern, AI-powered journaling application for mental health and wellness tracking. Built with React, .NET, and Azure services.

## 📋 Overview

Mental Health Journal is a full-stack web application that helps users track their mental wellness through journaling. The application uses Azure Cognitive Services and OpenAI to provide intelligent insights, sentiment analysis, and personalized feedback on journal entries.

## ✨ Key Features

### 🎙️ **Voice Recording**
- Record journal entries using your voice
- Automatic speech-to-text transcription via Azure Speech Services
- Real-time recording timer and visual feedback
- Audio preview and playback

### 🤖 **AI-Powered Analysis**
- **Sentiment Analysis**: Automatically detects emotional tone (Positive, Negative, Neutral, Mixed)
- **Key Phrase Extraction**: Identifies important topics and themes in your entries
- **AI-Generated Summaries**: Contextual summaries with confidence scores
- **GPT-4 Affirmations**: Personalized encouraging messages tailored to your entry

### 📊 **Trend Visualization**
- Visual charts showing sentiment trends over time
- Emotional patterns and insights
- Track your mental wellness journey
- Dashboard overview of your progress

### 🔐 **Secure Authentication**
- Google OAuth integration
- JWT-based authentication
- Secure user data management

### 💾 **Cloud Storage**
- Azure Cosmos DB for scalable NoSQL data storage
- Azure Blob Storage for audio files
- Reliable and secure data persistence

## 📱 Mobile Application (Phase 2)

**Status:** 67% Complete (Sprint 4 of 6)

A native iOS and Android mobile app built with **React Native (Expo)** is currently in development.

### 🎉 Completed Features (Sprint 1-4)
- ✅ **Journal Management**: Create, edit, delete entries with voice recording
- ✅ **Offline-First**: Full offline support with background sync
- ✅ **Data Visualization**: Sentiment charts, streak counter, calendar, word clouds
- ✅ **Crisis Support**: Hotlines, breathing exercises, grounding techniques
- ✅ **Push Notifications**: Daily reminders, streak alerts, achievement notifications
- ✅ **Biometric Auth**: Face ID/Touch ID/Fingerprint with PIN fallback
- ✅ **Dark Mode**: Automatic theme switching based on system preference
- ✅ **Haptic Feedback**: Tactile responses for interactions and achievements
- ✅ **Deep Linking**: URL schemes for navigation (`mentalhealthjournal://`)

### 🔜 Coming Soon (Sprint 5-6)
- ⏳ App icon, splash screen, and branding
- ⏳ Performance optimization and testing
- ⏳ App Store and Google Play deployment

**[View Mobile Progress →](MOBILE_PROGRESS.md)** | **[View Development Plan →](PHASE_2_PLAN.md)**

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- Modern UI with responsive design
- Application Insights for monitoring

### Backend
- **.NET 8** Web API
- RESTful API architecture
- Service-oriented design pattern
- Comprehensive error handling and logging

### Azure Services
- **Azure App Configuration**: Centralized configuration management
- **Azure Cosmos DB**: NoSQL database for journal entries
- **Azure Blob Storage**: Audio file storage
- **Azure Cognitive Services**: Text Analytics for sentiment and key phrases
- **Azure OpenAI**: GPT-4 for personalized affirmations
- **Azure Speech Services**: Speech-to-text transcription
- **Application Insights**: Monitoring and telemetry

## 🚀 Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 22+](https://nodejs.org/)
- [Azure Subscription](https://azure.microsoft.com/free/)
- Azure CLI (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MentalHealthJournal
   ```

2. **Configure Azure Services**
   - Create an Azure account and resource group
   - Set up required Azure services (see [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md))
   - Configure `appsettings.json` with your Azure service connections

3. **Backend Setup**
   ```bash
   cd MentalHealthJournal.Server
   dotnet restore
   dotnet build
   dotnet run
   ```

4. **Frontend Setup**
   ```bash
   cd mentalhealthjournal.client
   npm install
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔧 Configuration

### Backend Configuration (`appsettings.json`)
```json
{
  "AzureAppConfiguration": "https://your-app-config.azconfig.io",
  "ApplicationInsights": {
    "ConnectionString": "your-connection-string"
  }
}
```

### Environment Variables
- `AzureAppConfiguration`: Azure App Configuration endpoint
- `ManagedIdentityClientId`: Managed identity client ID (for Azure deployment)

See [appsettings.Example.json](MentalHealthJournal.Server/appsettings.Example.json) for a complete configuration template.

## 📦 Project Structure

```
MentalHealthJournal/
├── mentalhealthjournal.client/     # React frontend (Web)
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── services/               # API and utility services
│   │   ├── contexts/               # React contexts
│   │   ├── hooks/                  # Custom React hooks
│   │   └── types/                  # TypeScript type definitions
│   └── public/                     # Static assets
├── MentalHealthJournal.Mobile/     # React Native app (iOS/Android) 📱
│   ├── src/
│   │   ├── components/             # UI components
│   │   ├── screens/                # App screens
│   │   ├── services/               # Services (sync, notifications, etc.)
│   │   ├── contexts/               # State management
│   │   ├── hooks/                  # Custom hooks
│   │   └── navigation/             # React Navigation setup
│   └── app.json                    # Expo configuration
├── MentalHealthJournal.Server/     # .NET Web API
│   ├── Controllers/                # API controllers
│   └── Properties/                 # Server configuration
├── MentalHealthJournal.Services/   # Business logic layer
│   ├── CosmosDbService.cs          # Database operations
│   ├── BlobStorageService.cs       # File storage
│   ├── JournalAnalysisService.cs   # AI analysis
│   ├── SpeechToTextService.cs      # Voice transcription
│   └── UserService.cs              # User management
├── MentalHealthJournal.Models/     # Shared data models
└── MentalHealthJournal.Tests/      # Unit tests
```

## 🧪 Testing

### Run Backend Tests
```bash
cd MentalHealthJournal.Tests
dotnet test
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing documentation.

## 🚀 Deployment

The application can be deployed to Azure using multiple approaches:

1. **Azure App Service** (Recommended)
2. **Azure Static Web Apps + Functions**
3. **Azure Container Apps**

For detailed deployment instructions, see [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md).

### Quick Deploy to Azure App Service
```bash
# Login to Azure
az login

# Deploy (from project root)
dotnet publish -c Release
# Follow deployment steps in AZURE_DEPLOYMENT.md
```

## 📚 Documentation

**[📖 Complete Documentation Index →](DOCS_INDEX.md)** - Quick navigation to all project documentation

### Getting Started
- [README.md](README.md) - This file, project overview and quick start
- [Azure Deployment Guide](AZURE_DEPLOYMENT.md) - Comprehensive Azure deployment instructions
- [Testing Guide](TESTING_GUIDE.md) - How to test the application end-to-end

### Feature Documentation
- **[Web Features](WEB_FEATURES.md)** - Complete web app feature reference (voice, AI analysis, visualizations, crisis support)
- **[Mobile Features](MOBILE_FEATURES.md)** - Complete mobile app feature reference (offline sync, notifications, biometrics, dark mode)
- [Mobile Progress Summary](MOBILE_PROGRESS.md) - Sprint progress, statistics, and achievements
- [Phase 2 Development Plan](PHASE_2_PLAN.md) - 6-sprint mobile development roadmap

### Technical Documentation
- [Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md) - Caching, retry policies, and optimization strategies
- [Unit Test Summary](UNIT_TEST_SUMMARY.md) - Current test coverage and results

### Legal
- [Privacy Policy](PRIVACY_POLICY.md) - Data collection, usage, and user rights
- [Terms of Service](TERMS_OF_SERVICE.md) - User agreement and service terms

## 🔒 Security

- All sensitive configuration stored in Azure App Configuration
- Managed Identity for secure Azure service authentication
- JWT-based authentication with secure token handling
- Google OAuth for user authentication
- HTTPS enforced in production
- Environment-specific configuration management

## 🛠️ Technology Stack

**Web Frontend**
- React 19
- TypeScript
- Vite
- Microsoft Application Insights

**Mobile App (React Native)**
- Expo ~55.0.7
- React Native 0.83.2
- TypeScript 5.9.2
- React Navigation 7.x
- React Query (TanStack) 5.x
- Expo Notifications, Local Authentication, Haptics

**Backend**
- .NET 8
- C# 12
- ASP.NET Core Web API
- Entity Framework Core patterns

**Azure Cloud Services**
- Azure App Service / Static Web Apps
- Azure Cosmos DB
- Azure Blob Storage
- Azure Cognitive Services (Text Analytics)
- Azure OpenAI Service
- Azure Speech Services
- Azure App Configuration
- Application Insights

**Authentication**
- Google OAuth 2.0
- JWT (JSON Web Tokens)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📧 Support

For questions or support, please open an issue in the repository.

---

**Built with ❤️ for mental health and wellness**
