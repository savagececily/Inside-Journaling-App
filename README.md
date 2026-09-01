# 📔 Inside Journaling App

A modern, AI-powered journaling application for personal growth and wellness tracking. Built with React, .NET, and Azure services.

## 📋 Overview

Inside Journaling App is a full-stack web application that helps users track their wellness through journaling. The application uses Azure Cognitive Services and OpenAI to provide intelligent insights, sentiment analysis, and personalized feedback on journal entries.

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
- **GPT-4o-mini Affirmations**: Personalized encouraging messages tailored to your entry
- **Crisis Detection**: Intelligent screening with GPT-4o for safety support

### 📊 **Trend Visualization**
- Visual charts showing sentiment trends over time
- Emotional patterns and insights
- Track your mental wellness journey
- Dashboard overview of your progress

### 🔐 **Secure Authentication**
- Google OAuth integration
- JWT-based authentication
- Secure user data management
 & Performance**
- Azure Cosmos DB for scalable NoSQL data storage with partition optimization
- Azure Blob Storage for audio files
- In-memory response caching (15-25% cost reduction)
- Retry policies with exponential backoff for resilience
- Rate limiting for abuse prevention
- Reliable and secure data persistence

## 📱 Mobile Application

A native iOS and Android mobile app built with **React Native (Expo)** with complete feature parity to the web application.

### ✅ Features
- **Full Journal Management**: Create, edit, delete entries with voice recording and speech-to-text
- **Offline-First Architecture**: Complete offline support with automatic background sync
- **Data Visualizations**: Sentiment charts, streak counter, calendar view, word clouds, time patterns
- **Crisis Support**: Emergency hotlines, breathing exercises, grounding techniques
- **Push Notifications**: Customizable daily reminders, streak alerts, achievement notifications
- **Biometric Security**: Face ID/Touch ID/Fingerprint authentication with PIN fallback
- **Native Features**: Dark mode, haptic feedback, deep linking
- **Google OAuth**: Secure authentication with token management

**[View Mobile Features Documentation →](MOBILE_FEATURES.md)**

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

### Azure Serviceswith user quota and token tracking
- **Azure Blob Storage**: Audio file storage
- **Azure Cognitive Services**: Text Analytics for sentiment and key phrases
- **Azure OpenAI**: Dual deployments (GPT-4o-mini, GPT-4o) for cost optimization
- **Azure Speech Services**: Speech-to-text transcription
- **Application Insights**: Comprehensive m personalized affirmations
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
   cd Journal
   ```

2. **Configure Azure Services**
   - Create an Azure account and resource group
   - Set up required Azure services (see [MIGRATION_PLAN.md](MIGRATION_PLAN.md))
   - Configure `appsettings.json` with your Azure service connections

3. **Backend Setup**
   ```bash
   cd Journal.Server
   dotnet restore
   dotnet build
   dotnet run
   ```

4. **Frontend Setup**
   ```bash
   cd journal.client
   npm install
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔧 Configuration

### Backend Configuration (`appsettings.json`)

Configuration is loaded from `appsettings.json` and can be overridden by environment variables in Azure App Service.

**Key Settings:**
- `CosmosDb:Endpoint`: https://inside-journaling-app-cosmosdb.documents.azure.com:443/
- `CosmosDb:DatabaseName`: JournalDb
- `AzureOpenAI:Endpoint`: https://inside-journaling-app-foundry.cognitiveservices.azure.com/
- `AzureOpenAI:AffirmationDeploymentName`: gpt-4o-mini (for affirmations)
- `AzureOpenAI:CrisisDeploymentName`: gpt-4o (for crisis detection)

### Environment Variables
- `ManagedIdentityClientId`: Managed identity client ID (136abc9f-ef3a-4073-a6d2-e6f915ba1f0f)
- `APPLICATIONINSIGHTS_CONNECTION_STRING`: Application Insights connection string

See [appsettings.Example.json](Journal.Server/appsettings.Example.json) for a complete configuration template.

## 📦 Project Structure

```
Journal/
├── journal.client/     # React frontend (Web)
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── services/               # API and utility services
│   │   ├── contexts/               # React contexts
│   │   ├── hooks/                  # Custom React hooks
│   │   └── types/                  # TypeScript type definitions
│   └── public/                     # Static assets
├── Journal.Mobile/     # React Native app (iOS/Android) 📱
│   ├── src/
│   │   ├── components/             # UI components
│   │   ├── screens/                # App screens
│   │   ├── services/               # Services (sync, notifications, etc.)
│   │   ├── contexts/               # State management
│   │   ├── hooks/                  # Custom hooks
│   │   └── navigation/             # React Navigation setup
│   └── app.json                    # Expo configuration
├── Journal.Server/     # .NET Web API
│   ├── Controllers/                # API controllers
│   └── Properties/                 # Server configuration
├── Journal.Services/   # Business logic layer
│   ├── CosmosDbService.cs          # Database operations
│   ├── BlobStorageService.cs       # File storage
│   ├── JournalAnalysisService.cs   # AI analysis
│   ├── SpeechToTextService.cs      # Voice transcription
│   └── UserService.cs              # User management
├── Journal.Models/     # Shared data models
└── Journal.Tests/      # Unit tests
```

## 🧪 Testing

### Run Backend Tests
```bash
cd Journal.Tests
dotnet test
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing documentation.

## 🚀 Deployment

The application can be deployed to Azure using multiple approaches:

1. **Azure App Service** (Recommended)
2. **Azure Static Web Apps + Functions**
3. **Azure Container Apps**

For detailed deployment instructions, see [MIGRATION_PLAN.md](MIGRATION_PLAN.md).

### Quick Deploy to Azure App Service
```bash
# Login to Azure
az login

# Deploy (from project root)
dotnet publish -c Release
# Follow deployment steps in MIGRATION_PLAN.md
```

## 📚 Documentation

**[📖 Complete Documentation Index →](DOCS_INDEX.md)** - Quick navigation to all project documentation

### Getting Started
- [README.md](README.md) - This file, project overview and quick start
- [Migration & Deployment Plan](MIGRATION_PLAN.md) - Deployment strategy, phases, and testing
- [App Settings Migration](APP_SETTINGS_MIGRATION.md) - Configuration approach and cost savings
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
