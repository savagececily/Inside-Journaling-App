# GitHub Actions CI/CD

This repository uses GitHub Actions to automatically deploy the Inside Journal app to Azure using a separated architecture.

## Workflows

### 🔧 Backend API Deployment
**File**: `backend-api-deploy.yml`

Deploys the .NET 8.0 backend API to Azure App Service (`inside-journal-api`).

**Triggers**:
- **Automatic**: Pushes to `main` branch when backend files change
- **Manual**: Workflow dispatch (choose development or production environment)

**Environments**:
- **Development**: `inside-journal-api-development.azurewebsites.net`
- **Production**: `inside-journal-api.azurewebsites.net` (manual deployment only)

**What it does**:
1. Builds the .NET backend
2. Runs all unit tests
3. Publishes the API
4. Deploys to Azure App Service slot

### 🎨 Frontend Static Web App Deployment
**File**: `frontend-static-deploy.yml`

Deploys the React + Vite frontend to Azure Static Web Apps.

**Triggers**:
- **Automatic**: Pushes to `main` branch when frontend files change
- **Pull Requests**: Creates preview deployments for PRs
- **Manual**: Workflow dispatch

**What it does**:
1. Builds the React app with Vite
2. Deploys to Azure Static Web Apps
3. Creates preview URLs for pull requests

## Required GitHub Secrets

Configure these secrets in your repository settings (`Settings` → `Secrets and variables` → `Actions`):

### Azure Authentication
```
AZURE_CLIENT_ID          # Azure AD App Client ID for federated credentials
AZURE_TENANT_ID          # Azure AD Tenant ID
AZURE_SUBSCRIPTION_ID    # Azure Subscription ID
```

**How to get these**:
1. Create an Azure AD App Registration (or use existing one)
2. Configure federated credentials for GitHub Actions:
   ```bash
   az ad app federated-credential create \
     --id <APP_ID> \
     --parameters '{
       "name": "github-actions",
       "issuer": "https://token.actions.githubusercontent.com",
       "subject": "repo:savagececily/MentalHealthJournal:ref:refs/heads/main",
       "audiences": ["api://AzureADTokenExchange"]
     }'
   ```
3. Assign the App Registration contributor role to your resource group:
   ```bash
   az role assignment create \
     --assignee <APP_ID> \
     --role Contributor \
     --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/InsideJournalingAppRG
   ```

### Static Web Apps Deployment
```
AZURE_STATIC_WEB_APPS_API_TOKEN    # Deployment token for Static Web Apps
```

**How to get this**:
```bash
az staticwebapp secrets list \
  --name inside-journal-app \
  --resource-group InsideJournalingAppRG \
  --query "properties.apiKey" -o tsv
```

### Frontend Environment Variables
```
VITE_GOOGLE_CLIENT_ID                          # Google OAuth Client ID
VITE_APPLICATIONINSIGHTS_CONNECTION_STRING     # Application Insights (optional)
```

## Manual Deployment

### Deploy Backend to Production
1. Go to **Actions** tab in GitHub
2. Select **Deploy Backend API to Azure**
3. Click **Run workflow**
4. Select `production` environment
5. Click **Run workflow**

### Deploy Frontend
Frontend deploys automatically on push to `main`. To deploy manually:
1. Go to **Actions** tab
2. Select **Deploy Frontend to Azure Static Web Apps**
3. Click **Run workflow**
4. Click **Run workflow**

## Pull Request Previews

When you create a pull request that changes frontend code:
1. A preview deployment is automatically created
2. Preview URL is posted as a comment on the PR
3. Preview is deleted when PR is closed/merged

## Monitoring Deployments

### View Deployment Status
- Check the **Actions** tab for workflow runs
- Each deployment shows build logs and test results
- Deployment summaries include URLs and timestamps

### View Live Logs
```bash
# Backend API logs
az webapp log tail --name inside-journal-api --slot development --resource-group InsideJournalingAppRG

# Check deployment history
az webapp deployment list --name inside-journal-api --resource-group InsideJournalingAppRG -o table
```

## Troubleshooting

### Backend Deployment Fails
1. **Authentication Error**: Verify Azure credentials in secrets
2. **Build Fails**: Check .NET version matches (8.x)
3. **Tests Fail**: Fix failing tests before deploying

### Frontend Deployment Fails
1. **Build Error**: Check Node version (22.x) and dependencies
2. **API Token Invalid**: Regenerate Static Web Apps token
3. **Missing Env Vars**: Verify all VITE_* secrets are configured

### Rollback
```bash
# Backend: Swap slots back
az webapp deployment slot swap \
  --name inside-journal-api \
  --resource-group InsideJournalingAppRG \
  --slot development \
  --target-slot production

# Frontend: Redeploy previous commit
git checkout <previous-commit>
git push --force
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              GitHub Repository                   │
│  ┌──────────────┐        ┌──────────────┐      │
│  │   Backend    │        │   Frontend   │      │
│  │  .NET 8 API  │        │  React+Vite  │      │
│  └──────┬───────┘        └───────┬──────┘      │
└─────────┼────────────────────────┼─────────────┘
          │                        │
          │ GitHub Actions         │ GitHub Actions
          │ (backend-api-deploy)   │ (frontend-static-deploy)
          ▼                        ▼
┌─────────────────────┐  ┌──────────────────────────┐
│  Azure App Service  │  │ Azure Static Web Apps    │
│  inside-journal-api │  │ inside-journal-app       │
│                     │  │                          │
│  Dev:  /dev slot    │  │ Production: main site    │
│  Prod: /prod slot   │  │ Preview: PR deployments  │
└─────────────────────┘  └──────────────────────────┘
```

## Best Practices

✅ **Always test locally before pushing**
✅ **Review PR preview before merging**
✅ **Deploy to development first, then production**
✅ **Monitor logs after deployment**
✅ **Keep secrets up to date**

## Archive

Old monolithic deployment workflows are in `archive/` folder for reference.
