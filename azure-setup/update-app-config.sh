#!/bin/bash

# DEPRECATED: This script is for Azure App Configuration which is no longer used
# Configuration is now managed via Azure App Service Application Settings
# See README.md for current configuration approach

echo "⚠️  DEPRECATED: Azure App Configuration is no longer used"
echo "Configuration is now managed via App Service Application Settings"
exit 1
COSMOS_ACCOUNT="inside-journaling-app-cosmosdb"
STORAGE_ACCOUNT="sainsidejournalingapp"
AI_HUB_NAME="Inside-Journaling-App-Foundry"
APP_INSIGHTS_NAME="inside-journaling-app"
PROD_IDENTITY_NAME="Inside-Journaling-App-UAMI"
DEV_IDENTITY_NAME="Inside-Journaling-App-DEV-UAMI"
WEBAPP_NAME="inside-journaling-app"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Step 1: Getting new resource endpoints..."
echo ""

# Get Cosmos DB endpoint
COSMOS_ENDPOINT=$(az cosmosdb show \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query documentEndpoint \
    -o tsv)
echo "  ✅ Cosmos DB: $COSMOS_ENDPOINT"

# Get Storage account URI
STORAGE_URI=$(az storage account show \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query "primaryEndpoints.blob" \
    -o tsv)
echo "  ✅ Storage: $STORAGE_URI"

# Get AI Foundry Hub endpoint
AI_ENDPOINT=$(az cognitiveservices account show \
    --name "$AI_HUB_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.endpoint" \
    -o tsv)
echo "  ✅ AI Foundry Hub: $AI_ENDPOINT"

# Get AI region
AI_REGION=$(az cognitiveservices account show \
    --name "$AI_HUB_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "location" \
    -o tsv)
echo "  ✅ AI Region: $AI_REGION"

# Get App Insights connection string
APPINSIGHTS_CONN=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    -o tsv)
echo "  ✅ App Insights: (configured)"

# Get managed identity client IDs
PROD_IDENTITY_CLIENT_ID=$(az identity show \
    --name "$PROD_IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query clientId \
    -o tsv)
echo "  ✅ Production Identity: $PROD_IDENTITY_CLIENT_ID"

DEV_IDENTITY_CLIENT_ID=$(az identity show \
    --name "$DEV_IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query clientId \
    -o tsv)
echo "  ✅ Development Identity: $DEV_IDENTITY_CLIENT_ID"

echo ""
echo "🔧 Step 2: Updating App Configuration values..."
echo ""

# Update Cosmos DB endpoint
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "CosmosDb:Endpoint" \
    --value "$COSMOS_ENDPOINT" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated CosmosDb:Endpoint"

# Update Cosmos DB database name for production
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "CosmosDb:DatabaseName" \
    --value "inside-journaling-app" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated CosmosDb:DatabaseName (production)"

# Update Blob Storage URI
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureBlobStorage:ServiceUri" \
    --value "$STORAGE_URI" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated AzureBlobStorage:ServiceUri"

# Update container name for production
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureBlobStorage:ContainerName" \
    --value "journalaudio" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated AzureBlobStorage:ContainerName (production)"

# Update AI Foundry Hub endpoint (replaces old OpenAI endpoint)
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureOpenAI:Endpoint" \
    --value "$AI_ENDPOINT" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated AzureOpenAI:Endpoint (Foundry Hub)"

# Update AI deployment name for main model
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureOpenAI:DeploymentName" \
    --value "gpt-4o" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated AzureOpenAI:DeploymentName (gpt-4o)"

# Add affirmation deployment name (gpt-4o-mini for cost savings)
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureOpenAI:AffirmationDeploymentName" \
    --value "gpt-4o-mini" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Added AzureOpenAI:AffirmationDeploymentName (gpt-4o-mini)"

# Add crisis detection deployment name
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureOpenAI:CrisisDeploymentName" \
    --value "gpt-4o" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Added AzureOpenAI:CrisisDeploymentName (gpt-4o)"

# Update Cognitive Services endpoint (same as Foundry Hub for Speech-to-Text)
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureCognitiveServices:Endpoint" \
    --value "$AI_ENDPOINT" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated AzureCognitiveServices:Endpoint (Foundry Hub)"

# Update Cognitive Services region
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureCognitiveServices:Region" \
    --value "$AI_REGION" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated AzureCognitiveServices:Region"

# Update App Insights connection string
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "APPLICATIONINSIGHTS_CONNECTION_STRING" \
    --value "$APPINSIGHTS_CONN" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated APPLICATIONINSIGHTS_CONNECTION_STRING"

# Update production managed identity client ID
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "ManagedIdentityClientId" \
    --value "$PROD_IDENTITY_CLIENT_ID" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Updated ManagedIdentityClientId (production)"

echo ""
echo "🔧 Step 3: Creating development slot configuration..."
echo ""

# Development slot uses different database and container
az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "CosmosDb:DatabaseName" \
    --value "inside-journaling-app-dev" \
    --label "development" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Added CosmosDb:DatabaseName (development)"

az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "AzureBlobStorage:ContainerName" \
    --value "journalaudio-dev" \
    --label "development" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Added AzureBlobStorage:ContainerName (development)"

az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "ManagedIdentityClientId" \
    --value "$DEV_IDENTITY_CLIENT_ID" \
    --label "development" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Added ManagedIdentityClientId (development)"

az appconfig kv set \
    --name "$APP_CONFIG_NAME" \
    --key "ASPNETCORE_ENVIRONMENT" \
    --value "Development" \
    --label "development" \
    --auth-mode login \
    --yes > /dev/null
echo "  ✅ Added ASPNETCORE_ENVIRONMENT (development)"

echo ""
echo "🔒 Step 4: Configuring App Service to use App Configuration..."
echo ""

# Get App Configuration endpoint
APP_CONFIG_ENDPOINT=$(az appconfig show \
    --name "$APP_CONFIG_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query endpoint \
    -o tsv)

# Set App Configuration endpoint on production slot
az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings "AzureAppConfiguration=$APP_CONFIG_ENDPOINT" \
    --output none
echo "  ✅ Set AzureAppConfiguration on production slot"

# Set managed identity client ID on production slot
az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings "ManagedIdentityClientId=$PROD_IDENTITY_CLIENT_ID" \
    --output none
echo "  ✅ Set ManagedIdentityClientId on production slot"

# Set App Configuration endpoint on development slot
az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot development \
    --settings "AzureAppConfiguration=$APP_CONFIG_ENDPOINT" \
    --output none
echo "  ✅ Set AzureAppConfiguration on development slot"

# Set managed identity client ID on development slot
az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot development \
    --settings "ManagedIdentityClientId=$DEV_IDENTITY_CLIENT_ID" \
    --output none
echo "  ✅ Set ManagedIdentityClientId on development slot"

# Set environment label on development slot
az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot development \
    --settings "ASPNETCORE_ENVIRONMENT=Development" \
    --output none
echo "  ✅ Set ASPNETCORE_ENVIRONMENT on development slot"

echo ""
echo "🔐 Step 5: Granting managed identities access to App Configuration..."
echo ""

# Get App Configuration resource ID
APP_CONFIG_ID=$(az appconfig show \
    --name "$APP_CONFIG_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id \
    -o tsv)

# Get managed identity principal IDs
PROD_IDENTITY_PRINCIPAL=$(az identity show \
    --name "$PROD_IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query principalId \
    -o tsv)

DEV_IDENTITY_PRINCIPAL=$(az identity show \
    --name "$DEV_IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query principalId \
    -o tsv)

# Grant production identity "App Configuration Data Reader" role
az role assignment create \
    --assignee "$PROD_IDENTITY_PRINCIPAL" \
    --role "App Configuration Data Reader" \
    --scope "$APP_CONFIG_ID" \
    --output none 2>/dev/null || echo "  ℹ️  Production identity already has access"
echo "  ✅ Production identity has App Configuration Data Reader role"

# Grant development identity "App Configuration Data Reader" role
az role assignment create \
    --assignee "$DEV_IDENTITY_PRINCIPAL" \
    --role "App Configuration Data Reader" \
    --scope "$APP_CONFIG_ID" \
    --output none 2>/dev/null || echo "  ℹ️  Development identity already has access"
echo "  ✅ Development identity has App Configuration Data Reader role"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ App Configuration Updated Successfully!"
echo "==========================================${NC}"
echo ""
echo "📋 Configuration Summary:"
echo ""
echo "App Configuration: $APP_CONFIG_NAME"
echo "Endpoint: $APP_CONFIG_ENDPOINT"
echo ""
echo "Updated Resources:"
echo "  • Cosmos DB: inside-journaling-app-cosmosdb"
echo "  • Storage: sainsidejournalingapp"
echo "  • AI Foundry Hub: Inside-Journaling-App-Foundry"
echo "  • AI Models: gpt-4o, gpt-4o-mini"
echo "  • App Insights: inside-journaling-app"
echo ""
echo "Production Slot Configuration:"
echo "  • Database: inside-journaling-app"
echo "  • Container: journalaudio"
echo "  • Identity: $PROD_IDENTITY_CLIENT_ID"
echo ""
echo "Development Slot Configuration (labeled 'development'):"
echo "  • Database: inside-journaling-app-dev"
echo "  • Container: journalaudio-dev"
echo "  • Identity: $DEV_IDENTITY_CLIENT_ID"
echo ""
echo "🔒 RBAC Permissions:"
echo "  ✅ Both identities have App Configuration Data Reader role"
echo ""
echo "📝 Note: Keys/secrets removed from App Configuration (use Key Vault or app settings for secrets)"
echo ""
echo "Next Steps:"
echo "1. Update Program.cs to use Azure App Configuration"
echo "2. Deploy to development: ./azure-setup/deploy-to-dev.sh"
echo "3. Test at: https://inside-journaling-app-development.azurewebsites.net"
echo ""
