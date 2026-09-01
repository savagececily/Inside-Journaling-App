# Azure Setup and Deployment

Scripts and reference material for deploying Inside Journaling App to Azure.

## Architecture

The backend and frontend are deployed independently.

| Component | Azure resource | Notes |
| --- | --- | --- |
| Backend API | App Service `inside-journal-api` | .NET 8 on Windows, with a `development` slot |
| Frontend | Static Web App `inside-journal-app` | React and Vite build output |
| Mobile | Expo / React Native | Consumes the same API |

## Azure Resources

| Resource | Name |
| --- | --- |
| Resource group | `InsideJournalingAppRG` (East US 2) |
| App Service | `inside-journal-api` |
| App Service plan | `InsideJournalingApp-ASP` |
| Static Web App | `inside-journal-app` |
| Cosmos DB | `inside-journaling-app-cosmosdb`, database `JournalDb` |
| Cosmos containers | `Users`, `JournalEntries`, `UserQuotas`, `TokenUsage` |
| Blob Storage | `sainsidejournalingapp`, container `journal-audio` |
| Azure AI Foundry | `Inside-Journaling-App-Foundry` (`gpt-4o-mini`, `gpt-4o`) |
| Managed identity (dev) | `Inside-Journaling-App-DEV-UAMI` |
| Application Insights | `inside-journaling-app` |

## URLs

| Environment | URL |
| --- | --- |
| API (production) | https://inside-journal-api.azurewebsites.net |
| API (development) | https://inside-journal-api-development.azurewebsites.net |
| Swagger | https://inside-journal-api-development.azurewebsites.net/swagger |
| Frontend | https://polite-island-0c8b5cb0f.5.azurestaticapps.net |

## Configuration

Configuration comes from `appsettings.json` and App Service application settings. Azure App Configuration is not used, which saves roughly $40/month.

Azure services are accessed with Managed Identity. Do not add connection strings or API keys for Azure resources.

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
| `ManagedIdentityClientId` | `136abc9f-ef3a-4073-a6d2-e6f915ba1f0f` |

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
