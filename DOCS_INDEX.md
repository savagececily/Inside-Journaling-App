# Documentation Index

Quick reference to all Inside Journaling App documentation.

## Start Here

1. [README.md](README.md) - Project overview, features, and local setup
2. [azure-setup/README.md](azure-setup/README.md) - Azure resources and deployment
3. [TESTING_GUIDE.md](TESTING_GUIDE.md) - How to test the application

## Documentation Map

| Document | Covers |
| --- | --- |
| [README.md](README.md) | Project overview, tech stack, local development, configuration |
| [WEB_FEATURES.md](WEB_FEATURES.md) | Web app features: voice recording, AI analysis, visualizations, crisis support |
| [MOBILE_FEATURES.md](MOBILE_FEATURES.md) | Mobile app features: offline sync, notifications, biometrics, dark mode, deep linking |
| [AUTHENTICATION.md](AUTHENTICATION.md) | Easy Auth, JWT, Google and Microsoft OAuth setup for web and mobile |
| [PAYMENT_STRATEGY.md](PAYMENT_STRATEGY.md) | Freemium model, Stripe Checkout, mobile in-app purchases, webhooks |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Unit tests, integration tests, manual test procedures |
| [azure-setup/README.md](azure-setup/README.md) | Azure resource inventory, app settings, deployment scripts |
| [azure-setup/RESTRICT_DEV_ACCESS.md](azure-setup/RESTRICT_DEV_ACCESS.md) | Limiting the development slot to admin users |
| [PRIVACY_POLICY.md](PRIVACY_POLICY.md) | Data collection, user rights, retention |
| [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) | User agreement, acceptable use, disclaimers |
| [.github/workflows/README.md](.github/workflows/README.md) | CI/CD workflows for the API and Static Web App |

## Architecture

The application is split into two independently deployed pieces:

- **Backend API** - ASP.NET Core 8 on Azure App Service (`inside-journal-api`), with a `development` slot
- **Frontend** - React and Vite on Azure Static Web Apps (`inside-journal-app`)
- **Mobile** - React Native and Expo, consuming the same API

All Azure service access uses Managed Identity. Configuration comes from `appsettings.json` and App Service application settings; Azure App Configuration is not used.

## Live Environments

| Environment | URL |
| --- | --- |
| Backend API (production) | https://inside-journal-api.azurewebsites.net |
| Backend API (development) | https://inside-journal-api-development.azurewebsites.net |
| API reference (Swagger) | https://inside-journal-api-development.azurewebsites.net/swagger |
| Frontend | https://polite-island-0c8b5cb0f.5.azurestaticapps.net |

## Azure Resources

| Resource | Name |
| --- | --- |
| Resource group | InsideJournalingAppRG |
| App Service (API) | inside-journal-api |
| Static Web App | inside-journal-app |
| Cosmos DB | inside-journaling-app-cosmosdb (database `JournalDb`) |
| Blob Storage | sainsidejournalingapp |
| Azure AI Foundry | Inside-Journaling-App-Foundry (gpt-4o-mini, gpt-4o) |
| Managed identity (dev) | Inside-Journaling-App-DEV-UAMI |

## Development Workflow

1. Make changes locally and run `dotnet test`
2. Deploy to the development slot with `./azure-setup/deploy-to-dev.sh`
3. Verify against the development URL
4. Promote to production via the GitHub Actions workflow (manual dispatch)
