# Azure Setup and Deployment

Scripts and reference material for deploying Inside Journaling App to Azure.

## Architecture

The backend and frontend are deployed independently.

| Component | Azure resource | Notes |
| --- | --- | --- |
| Backend API | App Service `inside-journal-api` | .NET 8 on Windows, with a `development` slot |
| Frontend (production) | Static Web App `inside-journal-app` | React and Vite build output |
| Frontend (development) | Static Web App `inside-journal-app-dev` | Points at the API development slot |
| Mobile | Expo / React Native | Consumes the same API |

## Azure Resources

| Resource | Name |
| --- | --- |
| Resource group | `InsideJournalingAppRG` (East US 2) |
| App Service | `inside-journal-api` |
| App Service plan | `InsideJournalingApp-ASP` (P0v3) |
| Static Web App (production) | `inside-journal-app` |
| Static Web App (development) | `inside-journal-app-dev` |
| Cosmos DB | `inside-journaling-app-cosmosdb`, database `JournalDb` |
| Cosmos containers | `Users`, `JournalEntries`, `UserQuotas`, `TokenUsage` |
| Blob Storage | `sainsidejournalingapp`, container `journal-audio` |
| Azure AI Foundry | `Inside-Journaling-App-Foundry` (`gpt-4o-mini`, `gpt-4o`) |
| Managed identity (production) | `Inside-Journaling-App-UAMI` |
| Managed identity (development) | `Inside-Journaling-App-DEV-UAMI` |
| Application Insights | `inside-journaling-app`, `inside-journaling-app-dev` |

## URLs

| Environment | URL |
| --- | --- |
| API (production) | https://inside-journal-api.azurewebsites.net |
| API (development) | https://inside-journal-api-development.azurewebsites.net |
| Swagger | https://inside-journal-api-development.azurewebsites.net/swagger |
| Frontend (production) | https://polite-island-0c8b5cb0f.5.azurestaticapps.net |
| Frontend (development) | https://kind-sand-09f05e10f.6.azurestaticapps.net |

## Configuration

Configuration comes from `appsettings.json` and App Service application settings. Azure App Configuration is not used; the store was deleted since every value now lives in application settings.

Azure services are accessed with user-assigned managed identity. Do not add connection strings or API keys for Azure resources. `ManagedIdentityClientId` selects which identity `DefaultAzureCredential` uses, so it is marked as a slot setting on each slot.

Settings use the ASP.NET Core double-underscore convention, for example `CosmosDb__Endpoint`.

| Setting | Value |
| --- | --- |
| `CosmosDb__Endpoint` | `https://inside-journaling-app-cosmosdb.documents.azure.com:443/` |
| `CosmosDb__DatabaseName` | `JournalDb` |
| `CosmosDb__JournalEntryContainer` | `JournalEntries` |
| `CosmosDb__UserContainer` | `Users` |
| `BlobStorage__ServiceUri` | `https://sainsidejournalingapp.blob.core.windows.net` |
| `BlobStorage__ContainerName` | `journal-audio` |
| `AzureOpenAI__Endpoint` | `https://inside-journaling-app-foundry.cognitiveservices.azure.com/` |
| `AzureOpenAI__AffirmationDeploymentName` | `gpt-4o-mini` |
| `AzureOpenAI__CrisisDeploymentName` | `gpt-4o` |
| `AzureCognitiveServices__Endpoint` | Same Foundry endpoint |
| `AzureCognitiveServices__Region` | `eastus` |
| `Jwt__Issuer` | `Journal` |
| `Jwt__Audience` | `JournalApp` |
| `Jwt__Key` | Randomly generated per slot; slot setting |
| `Google__ClientId` | Google OAuth web client ID (public value) |
| `Microsoft__ClientId` | `2bdef97c-c4a9-43ed-9947-944b43cf8e97` |
| `Microsoft__TenantId` | `common` |
| `AdminEmails` | Comma-separated admin addresses |
| `Cors__AllowedOrigins` | Comma-separated origins; slot setting |
| `ManagedIdentityClientId` | Production `ebd7a708-...`, development `136abc9f-...`; slot setting |

Slot settings (`Jwt__Key`, `ManagedIdentityClientId`, `Cors__AllowedOrigins`, `ASPNETCORE_ENVIRONMENT`, `APPLICATIONINSIGHTS_CONNECTION_STRING`) stay with their slot during a swap, so development never inherits production identity or origins.

CORS is handled entirely by the application. Do not configure App Service platform CORS (`az webapp cors`) — it intercepts requests before the application and silently overrides `Cors__AllowedOrigins`.

Azure rejects application settings that begin with `AzureBlobStorage__`. Use the `BlobStorage__` prefix instead.

## Scripts

| Script | Purpose |
| --- | --- |
| `configure-app-settings.sh` | Apply all application settings to both slots |
| `deploy-to-dev.sh` | Build, test, and deploy to the development slot |
| `restrict-dev-access.sh` | Limit the development slot to admin users |
| `cleanup-old-resources.sh` | Delete legacy resources from the previous architecture |

Make them executable first:

```bash
chmod +x azure-setup/*.sh
```

## Deployment

Routine deployments run through GitHub Actions. See [../.github/workflows/README.md](../.github/workflows/README.md).

- Pushes to `main` that touch backend code deploy to the development slot automatically
- Production deployment is a manual workflow dispatch

### Manual deployment

```bash
az login

dotnet publish Journal.Server/Journal.Server.csproj -c Release -o ./publish
cd publish && zip -qr ../deploy.zip . && cd ..

az webapp deploy \
  --resource-group InsideJournalingAppRG \
  --name inside-journal-api \
  --slot development \
  --src-path deploy.zip \
  --type zip
```

Or use the script, which also runs the test suite:

```bash
./azure-setup/deploy-to-dev.sh
```

## Restricting Development Access

See [RESTRICT_DEV_ACCESS.md](RESTRICT_DEV_ACCESS.md) for locking the development slot down to admin users with App Service Authentication.

## Troubleshooting

### Not logged in

```bash
az login
```

### Permission denied running a script

```bash
chmod +x azure-setup/*.sh
```

### Managed Identity permissions not working

Role assignments can take 5-10 minutes to propagate. Wait, then retry.

### Cosmos DB connection fails

Confirm the "Cosmos DB Built-in Data Contributor" role is assigned to the app's managed identity.

### Setting an application setting returns "Bad Request"

The setting name uses a prefix Azure reserves. `AzureBlobStorage__` is known to fail; use `BlobStorage__`.

### CORS changes have no effect

Check whether App Service platform CORS is configured:

```bash
az webapp cors show -n inside-journal-api -g InsideJournalingAppRG --slot development
```

If `allowedOrigins` is non-empty, the platform layer is intercepting requests before the application and `Cors__AllowedOrigins` is ignored. Remove the platform entries so the application controls CORS.

### OAuth redirect fails

Verify the redirect URIs in the Google and Microsoft consoles match the deployed URLs exactly.

### View logs

```bash
az webapp log tail \
  --name inside-journal-api \
  --resource-group InsideJournalingAppRG \
  --slot development
```

## Related Documentation

- [../README.md](../README.md) - Project overview
- [../DOCS_INDEX.md](../DOCS_INDEX.md) - Documentation index
- [../AUTHENTICATION.md](../AUTHENTICATION.md) - OAuth and Easy Auth setup
- [../TESTING_GUIDE.md](../TESTING_GUIDE.md) - Testing procedures
