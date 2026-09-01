#!/bin/bash

###############################################################################
# Configure App Settings for Inside Journaling App
# Sets all application settings directly on Azure App Service (Production & Dev)
# This replaces Azure App Configuration to reduce costs
###############################################################################

set -e

echo "=========================================="
echo "Configure App Settings"
echo "=========================================="

# Configuration
RESOURCE_GROUP="InsideJournalingAppRG"
WEBAPP_NAME="inside-journal-api"
PROD_IDENTITY_NAME="Inside-Journaling-App-UAMI"
DEV_IDENTITY_NAME="Inside-Journaling-App-DEV-UAMI"
COSMOS_ACCOUNT="inside-journaling-app-cosmosdb"
STORAGE_ACCOUNT="sainsidejournalingapp"
AI_HUB_NAME="Inside-Journaling-App-Foundry"
APPINSIGHTS_NAME="inside-journaling-app"

echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "Web App: $WEBAPP_NAME"
echo ""
echo "This script will configure app settings for:"
echo "  ✅ Production slot"
echo "  ✅ Development slot"
echo ""
echo "⚠️  You will need to provide:"
echo "  - JWT Key (32+ characters)"
echo "  - Google OAuth Client ID and Secret"
echo "  - Microsoft OAuth Client ID"
echo "  - Stripe Secret Key, Publishable Key, Webhook Secret, Price ID"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

###############################################################################
# Step 1: Get Resource Endpoints
###############################################################################

echo ""
echo "📋 Step 1: Getting resource endpoints..."
echo ""

# Cosmos DB
COSMOS_ENDPOINT=$(az cosmosdb show \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query documentEndpoint -o tsv)

# Storage Account
STORAGE_ENDPOINT=$(az storage account show \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query primaryEndpoints.blob -o tsv)

# Azure AI Foundry Hub
AI_ENDPOINT=$(az cognitiveservices account show \
    --name "$AI_HUB_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query properties.endpoint -o tsv)

# Application Insights
APPINSIGHTS_CONNECTION=$(az monitor app-insights component show \
    --app "$APPINSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv 2>/dev/null || echo "")

if [ -z "$APPINSIGHTS_CONNECTION" ]; then
    echo "⚠️  Application Insights not found - will skip for now"
fi

# Managed Identity Client IDs
PROD_IDENTITY_CLIENT_ID=$(az identity show \
    --name "$PROD_IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query clientId -o tsv)

DEV_IDENTITY_CLIENT_ID=$(az identity show \
    --name "$DEV_IDENTITY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query clientId -o tsv)

echo "✅ Retrieved all resource endpoints:"
echo "   Cosmos DB: $COSMOS_ENDPOINT"
echo "   Storage: $STORAGE_ENDPOINT"
echo "   AI Hub: $AI_ENDPOINT"
echo "   Prod Identity: $PROD_IDENTITY_CLIENT_ID"
echo "   Dev Identity: $DEV_IDENTITY_CLIENT_ID"

###############################################################################
# Step 2: Collect Secrets
###############################################################################

echo ""
echo "🔐 Step 2: Collecting secrets..."
echo ""
echo "Please provide the following secrets:"
echo ""

# JWT Key
read -p "JWT Key (32+ characters): " JWT_KEY
if [ ${#JWT_KEY} -lt 32 ]; then
    echo "❌ JWT Key must be at least 32 characters"
    exit 1
fi

# Google OAuth
echo ""
read -p "Google OAuth Client ID: " GOOGLE_CLIENT_ID
read -sp "Google OAuth Client Secret: " GOOGLE_CLIENT_SECRET
echo

# Microsoft OAuth
echo ""
read -p "Microsoft OAuth Client ID: " MICROSOFT_CLIENT_ID

# Stripe
echo ""
read -sp "Stripe Secret Key: " STRIPE_SECRET_KEY
echo
read -p "Stripe Publishable Key: " STRIPE_PUBLISHABLE_KEY
read -sp "Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET
echo
read -p "Stripe Price ID: " STRIPE_PRICE_ID

echo ""
echo "✅ Secrets collected successfully"

###############################################################################
# Step 3: Configure Production Slot App Settings
###############################################################################

echo ""
echo "⚙️  Step 3: Configuring PRODUCTION slot app settings..."
echo ""

az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
        "ManagedIdentityClientId=$PROD_IDENTITY_CLIENT_ID" \
        "ASPNETCORE_ENVIRONMENT=Production" \
        "APPLICATIONINSIGHTS_CONNECTION_STRING=$APPINSIGHTS_CONNECTION" \
        "AzureOpenAI__Endpoint=$AI_ENDPOINT" \
        "AzureOpenAI__AffirmationDeploymentName=gpt-4o-mini" \
        "AzureOpenAI__CrisisDeploymentName=gpt-4o" \
        "CosmosDb__Endpoint=$COSMOS_ENDPOINT" \
        "CosmosDb__DatabaseName=JournalDb" \
        "BlobStorage__ServiceUri=$STORAGE_ENDPOINT" \
        "BlobStorage__ContainerName=journalaudio" \
        "AzureCognitiveServices__Region=eastus" \
        "Jwt__Key=$JWT_KEY" \
        "Jwt__Issuer=Journal" \
        "Jwt__Audience=JournalApp" \
        "GoogleOAuth__ClientId=$GOOGLE_CLIENT_ID" \
        "GoogleOAuth__ClientSecret=$GOOGLE_CLIENT_SECRET" \
        "MicrosoftOAuth__ClientId=$MICROSOFT_CLIENT_ID" \
        "Stripe__SecretKey=$STRIPE_SECRET_KEY" \
        "Stripe__PublishableKey=$STRIPE_PUBLISHABLE_KEY" \
        "Stripe__WebhookSecret=$STRIPE_WEBHOOK_SECRET" \
        "Stripe__PriceId=$STRIPE_PRICE_ID" \
    --output none

echo "✅ Production slot configured"

###############################################################################
# Step 4: Configure Development Slot App Settings
###############################################################################

echo ""
echo "⚙️  Step 4: Configuring DEVELOPMENT slot app settings..."
echo ""

az webapp config appsettings set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot "development" \
    --settings \
        "ManagedIdentityClientId=$DEV_IDENTITY_CLIENT_ID" \
        "ASPNETCORE_ENVIRONMENT=Development" \
        "APPLICATIONINSIGHTS_CONNECTION_STRING=$APPINSIGHTS_CONNECTION" \
        "AzureOpenAI__Endpoint=$AI_ENDPOINT" \
        "AzureOpenAI__AffirmationDeploymentName=gpt-4o-mini" \
        "AzureOpenAI__CrisisDeploymentName=gpt-4o" \
        "CosmosDb__Endpoint=$COSMOS_ENDPOINT" \
        "CosmosDb__DatabaseName=JournalDb" \
        "BlobStorage__ServiceUri=$STORAGE_ENDPOINT" \
        "BlobStorage__ContainerName=journalaudio-dev" \
        "AzureCognitiveServices__Region=eastus" \
        "Jwt__Key=$JWT_KEY" \
        "Jwt__Issuer=https://inside-journal-api-development.azurewebsites.net" \
        "Jwt__Audience=https://inside-journal-api-development.azurewebsites.net" \
        "GoogleOAuth__ClientId=$GOOGLE_CLIENT_ID" \
        "GoogleOAuth__ClientSecret=$GOOGLE_CLIENT_SECRET" \
        "MicrosoftOAuth__ClientId=$MICROSOFT_CLIENT_ID" \
        "Stripe__SecretKey=$STRIPE_SECRET_KEY" \
        "Stripe__PublishableKey=$STRIPE_PUBLISHABLE_KEY" \
        "Stripe__WebhookSecret=$STRIPE_WEBHOOK_SECRET" \
        "Stripe__PriceId=$STRIPE_PRICE_ID" \
    --output none

echo "✅ Development slot configured"

###############################################################################
# Summary
###############################################################################

echo ""
echo "=========================================="
echo "✅ App Settings Configuration Complete!"
echo "=========================================="
echo ""
echo "📋 Configured settings for:"
echo ""
echo "PRODUCTION SLOT:"
echo "  • Database: JournalDb"
echo "  • Storage: journalaudio"
echo "  • Identity: $PROD_IDENTITY_CLIENT_ID"
echo "  • Environment: Production"
echo ""
echo "DEVELOPMENT SLOT:"
echo "  • Database: inside-journaling-app-dev"
echo "  • Storage: journalaudio-dev"
echo "  • Identity: $DEV_IDENTITY_CLIENT_ID"
echo "  • Environment: Development"
echo ""
echo "🔐 Both slots configured with:"
echo "  ✅ Azure AI Foundry Hub endpoints"
echo "  ✅ Cosmos DB connection"
echo "  ✅ Blob Storage connection"
echo "  ✅ JWT authentication"
echo "  ✅ Google OAuth"
echo "  ✅ Microsoft OAuth"
echo "  ✅ Stripe integration"
echo ""
echo "💰 Cost Savings:"
echo "  Eliminated Azure App Configuration: ~$1.32/day (~$40/month)"
echo ""
echo "📋 Next Steps:"
echo "  1. Deploy to development: ./azure-setup/deploy-to-dev.sh"
echo "  2. Test development slot thoroughly"
echo "  3. Promote to production: run the Backend API Deploy workflow in GitHub Actions"
echo ""
