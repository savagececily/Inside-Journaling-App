# Azure Deployment Scripts

This directory contains scripts for deploying Inside Journaling App to Azure using the **development slot strategy**.

---

## 🎯 Current Deployment Status

**Resource Group:** `InsideJournalingAppRG`  
**Subscription:** Visual Studio Enterprise Subscription  

### Azure Resources

**Backend API:**
- Name: `inside-journal-api`
- Development: https://inside-journal-api-development.azurewebsites.net
- Production: https://inside-journal-api.azurewebsites.net
- Runtime: .NET 8.0 on Windows

**Frontend:**
- Name: `inside-journal-app` (Static Web App)
- URL: https://polite-island-0c8b5cb0f.5.azurestaticapps.net
- Technology: React + Vite + TypeScript

**Data & AI:**
- Cosmos DB: `inside-journaling-app-cosmosdb` (Database: JournalDb)
- Storage Account: `sainsidejournalingapp`
- Azure AI Foundry: `Inside-Journaling-App-Foundry` (gpt-4o-mini, gpt-4o, Speech-to-Text)
- Managed Identity: `Inside-Journaling-App-DEV-UAMI` (Client ID: 136abc9f-ef3a-4073-a6d2-e6f915ba1f0f)

**Configuration:**
All configuration is managed via App Service Application Settings (environment variables). Azure App Configuration is no longer used to reduce costs.

### Completed Phases ✅

- ✅ **Phase 0:** Data Migration (90 items migrated from old resource group)
- ✅ **Phase 1:** Azure AI Foundry Hub created (gpt-4o-mini, gpt-4o, Speech-to-Text)

### Current Phase 📍

- **Phase 2:** Architecture separated - Backend API + Static Web App deployed

---

## 🚀 Deployment Workflow

### Phase 2: Configure App Settings (10-15 min) ⬅️ **NEXT STEP**

```bash
./azure-setup/configure-app-settings.sh
```

**What it does:**
- Configures all app settings directly on Azure App Service
- Sets up **both production and development slots** in one run
- Prompts for secrets (JWT, OAuth, Stripe)
- Automatically retrieves resource endpoints (Cosmos DB, Storage, AI Hub)
- Configures environment-specific settings (database names, storage containers)

**You'll need:**
- JWT Key (32+ characters) - secure random string
- Google OAuth Client ID and Secret
- Microsoft OAuth Client ID
- Stripe Secret Key, Publishable Key, Webhook Secret, Price ID

**💰 Cost Savings:** Direct app settings = $0 (vs Azure App Configuration ~$40/month)

**See:** [../APP_SETTINGS_MIGRATION.md](../APP_SETTINGS_MIGRATION.md) for details

---

### Phase 3: Deploy to Development (5-10 min)

```bash
./azure-setup/deploy-to-dev.sh
```

**What it does:**
- Builds React frontend with Vite (`npm ci && npm run build`)
- Runs unit tests (`dotnet test`)
- Publishes .NET backend (`dotnet publish -c Release`)
- Deploys to **development slot**

**Test at:** `https://inside-journaling-app-development.azurewebsites.net`

**Testing checklist:**
- ✅ Login with OAuth (Google/Microsoft)
- ✅ View existing journal entries (migrated data)
- ✅ Create new journal entries
- ✅ Test AI features (affirmations, crisis detection)
- ✅ Test audio recording and playback
- ✅ Test data export
- ✅ Verify premium features (if applicable)

---

### Phase 4: Swap to Production (2-5 min)

After successful testing in development:

```bash
./azure-setup/swap-to-production.sh
```

**What it does:**
- Performs zero-downtime slot swap
- Promotes development code to production
- Production traffic immediately uses new code
- Old code remains in development slot as instant rollback

**Result:** New code live at `https://inside-journal-api.azurewebsites.net` (Production) or `https://inside-journal-api-development.azurewebsites.net` (Development)

---

### Emergency Rollback ⏪

If issues occur after production swap:

```bash
./azure-setup/rollback-production.sh
```

**What it does:**
- Instantly swaps slots back (previous production code becomes live again)
- Takes ~30 seconds
- Zero data loss (only code reverts)

---

### Phase 5: Cleanup Old Resources (5-10 min) - OPTIONAL ⚠️

**⚠️ Only run after confirming production is stable for 24-48 hours!**

```bash
./azure-setup/cleanup-old-resources.sh
```

**What it does:**
- Deletes the old **Journal** resource group
- Removes all legacy resources (old App Service, Cosmos DB, Storage, OpenAI, etc.)
- Stops incurring costs on deprecated infrastructure

**💰 Cost Savings:** ~$165-260/month by eliminating old resource group

**Safety features:**
- ✅ Interactive confirmation prompts
- ✅ Lists all resources before deletion
- ✅ Verifies new resource group exists and has resources
- ✅ Requires typing resource group name to confirm
- ✅ Pre-deletion checklist (backups, testing, migration complete)
- ✅ Can be cancelled at any point

**When to run:**
- ✅ After Phase 4 is complete
- ✅ Production has been stable for 24-48 hours
- ✅ All users migrated to new app
- ✅ Backups confirmed (Cosmos DB export, blob downloads)
- ✅ No active traffic on old resources

**Resources that will be deleted:**
- Old Web App: `Journal-WebApp`
- Old Cosmos DB: `journal-cosmosdb`
- Old Storage: `sajournal`
- Old OpenAI: `Journal-OpenAI`
- Old Cognitive Services: `Journal-CogServices`
- Old App Configuration: `Journal-AppConfig`
- Old Managed Identity: `Journal-UAMI`
- Old Application Insights and all related resources

---

## 📋 Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `configure-app-settings.sh` | Configure all app settings for both slots | Phase 2 - Initial setup or when settings change |
| `deploy-to-dev.sh` | Build and deploy to development slot | Phase 3 - Every new deployment |
| `swap-to-production.sh` | Promote development to production | Phase 4 - After testing succeeds |
| `rollback-production.sh` | Emergency revert to previous version | If production issues occur |
| `cleanup-old-resources.sh` | Delete old Journal resource group | Phase 5 - After production is stable 24-48hrs |

---

## 🏗️ Azure Resources

### Current Infrastructure

**Azure AI Foundry Hub:** `Inside-Journaling-App-Foundry`
- AI Project: `inside-journaling-app-proj`
- Models: `gpt-4o-mini` (affirmations), `gpt-4o` (crisis detection)
- Capacity: 250 each
- Region: eastus

**Cosmos DB:** `inside-journaling-app-cosmosdb`
- Production Database: `inside-journaling-app`
- Development Database: `inside-journaling-app-dev`
- Containers: Users, JournalEntries, UserConsents, ChatSessions, AuditLogs
- Partition Key: `/userId`
- Region: chilecentral (serverless)

**Blob Storage:** `sainsidejournalingapp`
- Production Container: `journalaudio`
- Development Container: `journalaudio-dev`
- Region: eastus

**App Service:** `inside-journaling-app`
- Backend API Production: `https://inside-journal-api.azurewebsites.net`
- Backend API Development: `https://inside-journal-api-development.azurewebsites.net`
- Frontend: `https://polite-island-0c8b5cb0f.5.azurestaticapps.net`
- Development Slot: `https://inside-journaling-app-development.azurewebsites.net`
- Plan: Standard tier (supports slots)

**Managed Identities:**
- Production: `Inside-Journaling-App-UAMI`
- Development: `Inside-Journaling-App-DEV-UAMI`
- RBAC: Cosmos DB Data Contributor, Storage Blob Data Contributor, Cognitive Services OpenAI User

---

## 🔒 Security Configuration

All scripts follow security best practices:

✅ **Managed Identity** - No stored credentials, Azure AD authentication  
✅ **HTTPS Only** - Enforced on web apps  
✅ **RBAC Permissions** - Least privilege access per slot  
✅ **TLS 1.2+** - Minimum encryption standard  
✅ **Private Blob Access** - No public blob access  
✅ **Secrets in App Settings** - Encrypted at rest, not in code  
✅ **Slot-Specific Configuration** - Production and development isolated

---

## 💰 Cost Breakdown

### Current Monthly Costs (After Migration)

| Service | Cost | Notes |
|---------|------|-------|
| Azure AI Foundry Hub | ~$0-10 | Pay-per-use (gpt-4o-mini cheaper) |
| Cosmos DB | ~$0-25 | Serverless, first 1M RUs free |
| Blob Storage | ~$1-5 | Pay-per-GB stored and accessed |
| App Service (Standard) | ~$75 | Includes deployment slots |
| Application Insights | ~$0-10 | First 5GB/month free |
| **Total** | **~$80-125** | Scales with usage |

### Cost Optimizations ✅

- ✅ **Direct App Settings** - Eliminated Azure App Configuration (~$40/month saved)
- ✅ **gpt-4o-mini for affirmations** - 83% cheaper than gpt-4o
- ✅ **Serverless Cosmos DB** - Pay only for what you use
- ✅ **Shared AI Hub** - One hub for all AI services
- ⏳ **Delete Old Resource Group** - Run Phase 5 to save ~$165-260/month

### Total Possible Savings

**~$205-300/month** compared to old architecture:
- $40/month from eliminating Azure App Configuration ✅
- $165-260/month from deleting old resource group ⏳ (Phase 5)

---

## 📖 Additional Documentation

- **[MIGRATION_PLAN.md](../MIGRATION_PLAN.md)** - Complete deployment strategy
- **[APP_SETTINGS_MIGRATION.md](../APP_SETTINGS_MIGRATION.md)** - Configuration approach and cost savings
- **[FOUNDRY_ARCHITECTURE_UPDATE.md](../FOUNDRY_ARCHITECTURE_UPDATE.md)** - Azure AI Foundry architecture
- **[DATA_MIGRATION_GUIDE.md](../DATA_MIGRATION_GUIDE.md)** - Data migration reference
- **[TESTING_GUIDE.md](../TESTING_GUIDE.md)** - Testing procedures
- **[AUTHENTICATION.md](../AUTHENTICATION.md)** - OAuth configuration
- **[DOCS_INDEX.md](../DOCS_INDEX.md)** - Complete documentation index

---

## 🆘 Troubleshooting

### Script fails with "az: command not found"
```bash
# Install Azure CLI
brew install azure-cli

# Login
az login
```

### "Insufficient permissions" error
```bash
# Verify you have Contributor role
az role assignment list --assignee $(az ad signed-in-user show --query id -o tsv)
```

### Deployment slot not found
```bash
# Verify slots exist
az webapp deployment slot list \
  --name inside-journaling-app \
  --resource-group InsideJournalingAppRG
```

### Configuration not updating
```bash
# Restart the slot after config changes
az webapp restart \
  --name inside-journaling-app \
  --slot development \
  --resource-group InsideJournalingAppRG
```

---

## 📞 Support

For issues or questions:
1. Check [MIGRATION_PLAN.md](../MIGRATION_PLAN.md) troubleshooting section
2. Review [APP_SETTINGS_MIGRATION.md](../APP_SETTINGS_MIGRATION.md) configuration guide
3. Verify Azure resources in portal: https://portal.azure.com

---

**Last Updated:** July 25, 2026  
**Version:** 4.0 (Simplified Architecture)

# Test health endpoint
curl https://$WEBAPP_URL/

# Stream logs
az webapp log tail \
  --name insidejournal-webapp \
  --resource-group rg-insidejournal-prod
```

## 🔄 Rollback Procedure

If deployment fails:

```bash
# View previous deployments
az webapp deployment list \
  --name insidejournal-webapp \
  --resource-group rg-insidejournal-prod

# Rollback to previous version
az webapp deployment source show \
  --name insidejournal-webapp \
  --resource-group rg-insidejournal-prod
```

## 📚 Additional Documentation

- **[MIGRATION_PLAN.md](../MIGRATION_PLAN.md)** - Complete deployment strategy
- **[APP_SETTINGS_MIGRATION.md](../APP_SETTINGS_MIGRATION.md)** - Configuration approach
- **[DOCS_INDEX.md](../DOCS_INDEX.md)** - All documentation

## ❓ Troubleshooting

### Script fails with "Not logged in"
```bash
az login
```

### Permission denied errors
```bash
chmod +x azure-setup/*.sh
```

### Managed Identity permissions not working
Wait 5-10 minutes for role assignments to propagate, then retry.

### Cosmos DB connection fails
Ensure "Cosmos DB Built-in Data Contributor" role is assigned to the web app's managed identity.

### OAuth redirect fails
Verify redirect URIs in Google/Microsoft console match your web app URL exactly.

## 🆘 Support

For issues or questions:
1. Check the logs: `az webapp log tail`
2. Review Application Insights for errors
3. Check [MIGRATION_PLAN.md](../MIGRATION_PLAN.md) troubleshooting section
4. Check Azure Portal for resource status

---

**Ready to deploy?** Start with `./azure-setup/deploy-production.sh` 🚀
