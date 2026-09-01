#!/bin/bash

###############################################################################
# Deploy to Development Slot
# Builds and deploys Inside Journaling App to development slot
###############################################################################

set -e

echo "=========================================="
echo "Deploy to Development Slot"
echo "=========================================="

# Configuration
RESOURCE_GROUP="InsideJournalingAppRG"
WEBAPP_NAME="inside-journaling-app"
SLOT_NAME="development"
FRONTEND_DIR="journal.client"
BACKEND_DIR="Journal.Server"
OUTPUT_DIR="publish-dev"

echo ""
echo "Target: $WEBAPP_NAME/$SLOT_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo ""

# Check current directory
if [ ! -f "MentalHealthJournal.sln" ]; then
    echo "❌ Error: Must run from repository root"
    exit 1
fi

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

###############################################################################
# Step 1: Build Frontend (React + Vite)
###############################################################################

echo ""
echo "⚛️  Step 1: Building React frontend..."
echo ""

cd "$FRONTEND_DIR"

# Install dependencies
echo "Installing npm dependencies..."
npm ci

# Get App Insights connection string for build
APPINSIGHTS_CONNECTION=$(az monitor app-insights component show \
    --app "inside-journaling-app" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)

# Build with Vite
echo "Building with Vite..."
VITE_APPLICATIONINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CONNECTION" npm run build

echo "✅ Frontend built successfully"

cd ..

###############################################################################
# Step 2: Copy Frontend to Backend wwwroot
###############################################################################

echo ""
echo "📦 Step 2: Copying frontend to backend..."
echo ""

rm -rf "$BACKEND_DIR/wwwroot"/*
cp -r "$FRONTEND_DIR/dist"/* "$BACKEND_DIR/wwwroot/"
cp PRIVACY_POLICY.md "$BACKEND_DIR/wwwroot/"
cp TERMS_OF_SERVICE.md "$BACKEND_DIR/wwwroot/"

echo "✅ Frontend copied to wwwroot"

###############################################################################
# Step 3: Run Tests
###############################################################################

echo ""
echo "🧪 Step 3: Running unit tests..."
echo ""

dotnet test MentalHealthJournal.Tests/MentalHealthJournal.Tests.csproj --configuration Release

echo "✅ Tests passed"

###############################################################################
# Step 4: Publish Backend (.NET)
###############################################################################

echo ""
echo "🔨 Step 4: Publishing .NET backend..."
echo ""

rm -rf "$OUTPUT_DIR"

dotnet publish "$BACKEND_DIR/MentalHealthJournal.Server.csproj" \
    -c Release \
    -o "$OUTPUT_DIR" \
    --no-restore

echo "✅ Backend published"

###############################################################################
# Step 5: Deploy to Development Slot
###############################################################################

echo ""
echo "🚀 Step 5: Deploying to Azure development slot..."
echo ""

# Create zip package
cd "$OUTPUT_DIR"
zip -r ../deploy-package.zip . > /dev/null
cd ..

# Deploy to slot
az webapp deployment source config-zip \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot "$SLOT_NAME" \
    --src deploy-package.zip

# Clean up
rm deploy-package.zip
rm -rf "$OUTPUT_DIR"

echo "✅ Deployed to development slot"

###############################################################################
# Step 6: Restart Slot
###############################################################################

echo ""
echo "♻️  Step 6: Restarting development slot..."
echo ""

az webapp restart \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot "$SLOT_NAME"

echo "✅ Slot restarted"

###############################################################################
# Step 7: Health Check
###############################################################################

echo ""
echo "🏥 Step 7: Performing health check..."
echo ""

SLOT_URL="https://inside-journaling-app-development.azurewebsites.net"

echo "Waiting for app to start (30 seconds)..."
sleep 30

echo "Testing endpoint..."
if curl -f -s "$SLOT_URL" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️  Warning: Health check failed. App may still be starting."
    echo "   Check logs: az webapp log tail --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --slot $SLOT_NAME"
fi

###############################################################################
# Summary
###############################################################################

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 Development Slot URL:"
echo "  $SLOT_URL"
echo ""
echo "📊 View Logs:"
echo "  az webapp log tail \\"
echo "    --name $WEBAPP_NAME \\"
echo "    --resource-group $RESOURCE_GROUP \\"
echo "    --slot $SLOT_NAME"
echo ""
echo "🧪 Testing Checklist:"
echo "  [ ] Login with Google OAuth"
echo "  [ ] Login with Microsoft OAuth"
echo "  [ ] Create journal entry (text)"
echo "  [ ] Voice transcription"
echo "  [ ] AI sentiment analysis"
echo "  [ ] Generate affirmation"
echo "  [ ] View entry history"
echo "  [ ] Edit/delete entries"
echo "  [ ] Stripe checkout"
echo "  [ ] Premium features"
echo "  [ ] Account deletion"
echo "  [ ] Data export"
echo ""
echo "📖 After Testing Successfully:"
echo "  Run ./azure-setup/swap-to-production.sh to promote to production"
echo ""
echo "=========================================="
