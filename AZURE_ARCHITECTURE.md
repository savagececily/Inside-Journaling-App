# Azure Architecture

## Overview

The Inside Journal app uses a separated architecture with dedicated infrastructure for frontend and backend:

## Architecture Components

### Frontend: Azure Static Web Apps
- **Production URL**: https://polite-island-0c8b5cb0f.5.azurestaticapps.net
- **Technology**: React + Vite SPA
- **Hosting**: Azure Static Web Apps (Free tier)
- **Build Output**: `mentalhealthjournal.client/dist/`
- **Environment Config**: `.env.production` (contains API endpoint)

### Backend: Azure App Service
- **Service Name**: `inside-journal-api`
- **Development URL**: https://inside-journal-api-development.azurewebsites.net
- **Production URL**: https://inside-journal-api.azurewebsites.net (when ready)
- **Runtime**: .NET 8.0 on Windows
- **Resource Group**: InsideJournalingAppRG
- **Location**: East US 2

### Data Layer
- **Cosmos DB**: inside-journaling-app-cosmosdb
- **Blob Storage**: sainsidejournalingapp
- **AI Foundry**: Inside-Journaling-App-Foundry (gpt-4o-mini, gpt-4o)
- **App Configuration**: inside-journaling-appconfig

### Identity & Access
- **Managed Identity (Dev)**: Inside-Journaling-App-DEV-UAMI
  - Client ID: 136abc9f-ef3a-4073-a6d2-e6f915ba1f0f
- **Azure AD App**: 2bdef97c-c4a9-43ed-9947-944b43cf8e97
- **Easy Auth**: Configured for Microsoft SSO

## Deployment

### Frontend Deployment

#### Prerequisites
```bash
cd mentalhealthjournal.client
npm install
```

#### Build & Deploy
```bash
# Build with production API endpoint
npm run build

# Deploy to Static Web App
npx @azure/static-web-apps-cli deploy \
  --app-location dist \
  --deployment-token "<get-from-azure>" \
  --env production
```

#### Get Deployment Token
```bash
az staticwebapp secrets list \
  --name inside-journal-app \
  --resource-group InsideJournalingAppRG \
  --query "properties.apiKey" -o tsv
```

### Backend Deployment

#### Prerequisites
```bash
cd MentalHealthJournal.Server
dotnet restore
```

#### Build & Deploy to Development Slot
```bash
# Build
dotnet publish MentalHealthJournal.Server/MentalHealthJournal.Server.csproj \
  -c Release -o publish-dev

# Create deployment package
cd publish-dev && zip -q -r ../deploy-dev.zip . && cd ..

# Deploy to Azure
curl -X POST \
  "https://inside-journal-api-development.scm.azurewebsites.net/api/zipdeploy?isAsync=false" \
  --data-binary @deploy-dev.zip \
  -H "Authorization: Bearer $(az account get-access-token --resource https://management.azure.com --query accessToken -o tsv)" \
  --max-time 300
```

#### Deploy to Production Slot
Replace `-development` with production slot name in the URL above.

## Configuration

### CORS Settings
The API is configured to accept requests from:
- Static Web App: https://polite-island-0c8b5cb0f.5.azurestaticapps.net
- Local development: http://localhost:5173
- Credentials: Enabled (for cookie-based authentication)

### App Settings (API)
Key settings configured on the API App Service:
- `AzureAppConfiguration`: Connection to App Configuration service
- `ManagedIdentityClientId`: Managed identity for Azure resource access
- `ASPNETCORE_ENVIRONMENT`: Development/Production
- `MICROSOFT_PROVIDER_AUTHENTICATION_SECRET`: Easy Auth secret
- `GOOGLE_PROVIDER_AUTHENTICATION_SECRET`: Google OAuth secret

All other settings (Cosmos DB, Blob Storage, AI Foundry) are loaded from Azure App Configuration.

### Environment Variables (Frontend)
`.env.production`:
```bash
VITE_API_URL=https://inside-journal-api-development.azurewebsites.net/api
VITE_API_BASE_URL=https://inside-journal-api-development.azurewebsites.net
```

## Staging/Development Workflow

### Backend Development Slot
- URL: https://inside-journal-api-development.azurewebsites.net
- Use for testing changes before promoting to production
- Swap slots when ready: `az webapp deployment slot swap --name inside-journal-api --resource-group InsideJournalingAppRG --slot development`

### Frontend Staging Environments
Static Web Apps automatically creates staging environments for:
- Pull requests (preview URLs)
- Named branches (when using GitHub integration)

Manual staging deployment:
```bash
npx @azure/static-web-apps-cli deploy \
  --app-location dist \
  --deployment-token "<staging-token>" \
  --env staging
```

## Monitoring & Logs

### Frontend Logs
View Static Web App logs in Azure Portal:
- Navigate to Static Web App resource
- Select "Application Insights" or "Diagnostics settings"

### Backend Logs
```bash
# Stream live logs
az webapp log tail --name inside-journal-api --resource-group InsideJournalingAppRG --slot development

# Download logs
az webapp log download --name inside-journal-api --resource-group InsideJournalingAppRG --slot development
```

## Cost Optimization

### Static Web Apps
- **Free tier**: 100 GB bandwidth/month, custom domains, SSL
- **Upgrade to Standard** when needed for:
  - More bandwidth
  - Private endpoints
  - SLA guarantees

### API App Service
Currently shares App Service Plan with existing `inside-journaling-app`.
- Monitor resource usage in Azure Portal
- Consider dedicated plan if needed for scaling

## Security

### Authentication Flow
1. **Frontend** → User selects login method (Email/Google/Microsoft)
2. **Microsoft SSO** → Redirects to `/.auth/login/aad` (Easy Auth)
3. **Easy Auth** → Sets `X-MS-CLIENT-PRINCIPAL` header + session cookie
4. **EasyAuthMiddleware** → Extracts claims, creates ClaimsPrincipal
5. **API Controllers** → Access authenticated user via `User` property

### HTTPS Only
- Both frontend and backend use HTTPS
- Static Web Apps: Automatic SSL
- API App Service: Automatic SSL

### Secrets Management
- Client secrets stored in App Service configuration
- Connection strings in Azure App Configuration
- No secrets in source code or frontend build

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Verify origin is in allowed list: `az webapp cors show --name inside-journal-api --resource-group InsideJournalingAppRG --slot development`
2. Add missing origin: `az webapp cors add --name inside-journal-api --resource-group InsideJournalingAppRG --slot development --allowed-origins "https://your-origin.com"`

### API 401 Errors
1. Check Easy Auth configuration in Azure Portal
2. Verify `X-MS-CLIENT-PRINCIPAL` header is present: Check browser DevTools → Network tab
3. Ensure `EasyAuthMiddleware` is registered in Program.cs
4. Check API logs: `az webapp log tail`

### Static Web App Not Updating
1. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Verify deployment completed: Check Azure Portal → Static Web App → Deployments
3. Check build logs in deployment history

## Migration Notes

### Migrated From
- **Old Architecture**: Monolithic App Service (`inside-journaling-app`)
  - Frontend and backend in same App Service
  - wwwroot serving React build

### Benefits of New Architecture
✅ **Separation of Concerns**: Frontend and backend can be scaled independently
✅ **Better Performance**: Static Web App serves frontend from CDN (global distribution)
✅ **Cost Optimization**: Static Web Apps Free tier saves ~$70/month
✅ **Easier Development**: Frontend and backend can be deployed independently
✅ **CI/CD Ready**: Static Web Apps integrates with GitHub Actions automatically

## Next Steps

- [ ] Set up GitHub Actions for automatic deployment
- [ ] Configure custom domain for Static Web App
- [ ] Implement staging environment workflow
- [ ] Add Application Insights for frontend monitoring
- [ ] Test production slot deployment and swap
- [ ] Implement test user selection for development environment
