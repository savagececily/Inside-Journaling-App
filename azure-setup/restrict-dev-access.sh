#!/bin/bash

# Restrict Development Slot Access to Admins Only
# Uses Azure App Service Authentication (Easy Auth) with Microsoft Entra ID

set -e

RESOURCE_GROUP="InsideJournalingAppRG"
APP_NAME="inside-journaling-app"
SLOT_NAME="development"

echo "======================================"
echo "Restrict Dev Slot Access to Admins"
echo "======================================"
echo ""

# Get the current subscription
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Current subscription: $SUBSCRIPTION_ID"
echo ""

# Step 1: Configure authentication to require login
echo "Step 1: Configuring authentication to require Microsoft login..."
az webapp auth update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot $SLOT_NAME \
  --enabled true \
  --action Return401 \
  --aad-allowed-token-audiences "api://inside-journaling-app-dev"

echo "✅ Authentication configured to require login"
echo ""

# Step 2: Get admin emails to whitelist
echo "Step 2: Configure allowed users"
echo "Enter admin email addresses (comma-separated) who should have access:"
echo "Example: admin1@contoso.com,admin2@contoso.com"
read -r ADMIN_EMAILS

# Convert comma-separated emails to array
IFS=',' read -ra EMAIL_ARRAY <<< "$ADMIN_EMAILS"

echo ""
echo "The following users will have access to the development slot:"
for email in "${EMAIL_ARRAY[@]}"; do
  echo "  - $email"
done
echo ""

# Step 3: Create or update app registration
echo "Step 3: Setting up Azure AD app registration..."

# Check if app registration exists
APP_REG_EXISTS=$(az ad app list --display-name "Inside-Journaling-App-Dev-Auth" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -z "$APP_REG_EXISTS" ]; then
  echo "Creating new app registration..."
  APP_ID=$(az ad app create \
    --display-name "Inside-Journaling-App-Dev-Auth" \
    --sign-in-audience AzureADMyOrg \
    --web-redirect-uris "https://inside-journaling-app-development.azurewebsites.net/.auth/login/aad/callback" \
    --query appId -o tsv)
  
  echo "Created app registration: $APP_ID"
else
  APP_ID=$APP_REG_EXISTS
  echo "Using existing app registration: $APP_ID"
fi

# Get tenant ID
TENANT_ID=$(az account show --query tenantId -o tsv)

echo ""
echo "======================================"
echo "✅ Configuration Complete!"
echo "======================================"
echo ""
echo "App ID: $APP_ID"
echo "Tenant ID: $TENANT_ID"
echo ""
echo "Next Steps:"
echo "1. Update app settings with the new client ID:"
echo "   az webapp config appsettings set \\"
echo "     --name $APP_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --slot $SLOT_NAME \\"
echo "     --settings MICROSOFT_PROVIDER_AUTHENTICATION_APP_ID=$APP_ID"
echo ""
echo "2. Go to Azure Portal > Entra ID > App Registrations > Inside-Journaling-App-Dev-Auth"
echo "3. Go to 'API permissions' > Add the following users/groups:"
for email in "${EMAIL_ARRAY[@]}"; do
  echo "   - $email"
done
echo ""
echo "4. OR use Enterprise Application assignment:"
echo "   - Portal > Entra ID > Enterprise Applications > Inside-Journaling-App-Dev-Auth"
echo "   - Properties > Set 'Assignment required?' to 'Yes'"
echo "   - Users and groups > Add user/group > Select admins"
echo ""
echo "Development slot will now require authentication!"
echo "URL: https://inside-journaling-app-development.azurewebsites.net"
