# Inside Journaling App

A modern, AI-powered journaling application for personal growth and wellness tracking. Built with Expo (Universal App for iOS, Android, and Web), .NET 10, and Azure services.

## Overview

Inside Journaling App is a full-stack universal application that helps users track their wellness through journaling. The application uses Azure Cognitive Services and OpenAI to provide intelligent insights, sentiment analysis, personalized affirmations, and virtual support companion chat.

## Key Features

### Voice Recording
- Record journal entries using your voice
- Automatic speech-to-text transcription via Azure Speech Services
- Real-time recording timer and audio playback

### AI-Powered Analysis
- Sentiment Analysis: Automatically detects emotional tone (Positive, Negative, Neutral, Mixed)
- Key Phrase Extraction: Identifies important topics and themes in your entries
- AI-Generated Summaries: Contextual summaries with confidence scores
- Affirmations: Personalized encouraging messages tailored to your entry
- Crisis Detection: Intelligent screening for safety support and 24/7 resources
- Virtual Support Companion: Interactive AI chat with context on your journaling history

### Trend Visualization
- Visual charts showing sentiment trends over time
- Emotional patterns, word clouds, and time patterns
- Monthly calendar view with daily sentiment indicators
- Streak counter and milestone tracking

### Secure Authentication
- Google OAuth and Microsoft Entra ID integration
- JWT-based authentication
- Biometric authentication (Face ID, Touch ID, Fingerprint) with PIN fallback
- Secure user data management

### Scalability and Performance
- Azure Cosmos DB for scalable NoSQL data storage with partition optimization
- Azure Blob Storage for audio files
- In-memory response caching for cost reduction
- Rate limiting and quota protection
- Offline sync with background synchronization

## Technology Stack

### Universal Client (Expo / React Native)
- Expo SDK 54 / React Native 0.81
- React 19 and TypeScript
- React Navigation 7
- React Query (TanStack) 5
- Universal deployment targeting iOS, Android, and Web

### Backend
- .NET 10 Web API
- C# 13
- Service-oriented architecture with ASP.NET Core
- Entity and repository pattern with Azure SDKs

### Cloud Infrastructure
- Azure App Service
- Azure Static Web Apps
- Azure Cosmos DB
- Azure Blob Storage
- Azure OpenAI (Foundry)
- Azure Cognitive Services
- Azure Application Insights
- Stripe Payment Gateway

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 22+](https://nodejs.org/)
- [Azure Subscription](https://azure.microsoft.com/free/)
- Azure CLI (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Inside-Journaling-App
   ```

2. **Backend Setup**
   ```bash
   cd Journal.Server
   dotnet restore
   dotnet build
   dotnet run
   ```

3. **Frontend / Mobile App Setup (Expo)**
   ```bash
   cd Journal.UI
   npm install
   
   # Run for Web:
   npm run web
   
   # Run for iOS / Android:
   npm start
   ```

4. **Access the Application**
   - Web App: http://localhost:8081
   - Backend API: http://localhost:5079 (Swagger: http://localhost:5079/swagger)

## Configuration

### Backend Configuration (`appsettings.json`)

Configuration is loaded from `appsettings.json` and can be overridden by environment variables in Azure App Service.

**Key Settings:**
- `CosmosDb:Endpoint`: https://inside-journaling-app-cosmosdb.documents.azure.com:443/
- `CosmosDb:DatabaseName`: inside-journaling-app (or inside-journaling-app-dev)
- `AzureOpenAI:Endpoint`: https://inside-journaling-app-foundry.cognitiveservices.azure.com/

See [appsettings.Example.json](Journal.Server/appsettings.Example.json) for a complete configuration template.

## Project Structure

```
Journal/
├── Journal.UI/         # Universal client (iOS, Android, Web via Expo)
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── screens/                # Screen views (Journal, Insights, Chat, Profile, Crisis)
│   │   ├── services/               # API, auth, storage, sync services
│   │   ├── contexts/               # React Context state providers
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── navigation/             # React Navigation setup
│   │   └── types/                  # TypeScript definitions
│   └── app.json                    # Expo configuration
├── Journal.Server/     # .NET Web API
│   ├── Controllers/                # API controllers
│   ├── Properties/                 # Server launch profiles
│   └── Services/                   # Web API specific helpers
├── Journal.Services/   # Core business logic layer
│   ├── CosmosDbService.cs          # Database operations
│   ├── BlobStorageService.cs       # Audio file storage
│   ├── JournalAnalysisService.cs   # AI analysis
│   ├── ChatService.cs              # Virtual support companion
│   ├── SpeechToTextService.cs      # Voice transcription
│   └── UserService.cs              # User management & quotas
├── Journal.Models/     # Shared data models
└── Journal.Tests/      # Unit tests
```

## Testing

### Run Backend Tests
```bash
cd Journal.Tests
dotnet test
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing documentation.

## Documentation

[Documentation Index](DOCS_INDEX.md)

- [Azure Setup and Deployment](azure-setup/README.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Mobile and Universal Features](MOBILE_FEATURES.md)
- [Authentication](AUTHENTICATION.md)
- [Payment Strategy](PAYMENT_STRATEGY.md)
- [Privacy Policy](PRIVACY_POLICY.md)
- [Terms of Service](TERMS_OF_SERVICE.md)
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing documentation.

## Deployment

The application can be deployed to Azure using multiple approaches:

1. **Azure App Service** (Recommended)
2. **Azure Static Web Apps + Functions**
3. **Azure Container Apps**

For detailed deployment instructions, see [azure-setup/README.md](azure-setup/README.md).

### Quick Deploy to Azure App Service
```bash
# Login to Azure
az login

# Deploy (from project root)
dotnet publish -c Release
# Follow deployment steps in azure-setup/README.md
```

## Documentation

[Complete Documentation Index](DOCS_INDEX.md) - Quick navigation to all project documentation

### Getting Started
- [README.md](README.md) - Project overview and quick start
- [azure-setup/README.md](azure-setup/README.md) - Azure resources, configuration, and deployment
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - How to test the application end-to-end

### Feature Documentation
- [MOBILE_FEATURES.md](MOBILE_FEATURES.md) - Complete feature reference (journaling, voice, AI analysis, chat, offline sync, notifications, biometrics)

### Technical Documentation
- [AUTHENTICATION.md](AUTHENTICATION.md) - Easy Auth, JWT, and OAuth provider setup
- [PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md) - Freemium model and Stripe integration

### Legal
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) - Data collection, usage, and user rights
- [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) - User agreement and service terms

## Security

- All sensitive configuration stored in App Service application settings
- Managed Identity for secure Azure service authentication
- JWT-based authentication with secure token handling
- Google OAuth for user authentication
- HTTPS enforced in production
- Environment-specific configuration management

## Technology Stack

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

## License

This project is licensed under the MIT License.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## Support

For questions or support, please open an issue in the repository.

---

**Built with for a mindful lifestyle and wellness**
