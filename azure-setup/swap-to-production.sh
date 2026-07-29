#!/bin/bash

###############################################################################
# Swap Development Slot to Production
# Promotes tested code from development slot to production
###############################################################################

set -e

echo "=========================================="
echo "Swap Development to Production"
echo "=========================================="

# Configuration
RESOURCE_GROUP="InsideJournalingAppRG"
WEBAPP_NAME="inside-journaling-app"
SLOT_NAME="development"

echo ""
echo "⚠️  WARNING: This will swap your development slot to production!"
echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "Web App: $WEBAPP_NAME"
echo ""
echo "This will:"
echo "  1. Make development slot code live in production"
echo "  2. Move current production code to development slot"
echo "  3. Swap ONLY non-slot-specific settings"
echo ""
echo "Slot-specific settings (DB endpoints, etc.) will NOT swap."
echo ""

read -p "Have you tested thoroughly in development? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled. Please test development slot first."
    exit 1
fi

read -p "Are you ready to go live? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

###############################################################################
# Step 1: Verify Development Slot Health
###############################################################################

echo ""
echo "🏥 Step 1: Verifying development slot health..."
echo ""

DEV_URL="https://inside-journaling-app-development.azurewebsites.net"

if curl -f -s "$DEV_URL" > /dev/null; then
    echo "✅ Development slot is healthy"
else
    echo "❌ Error: Development slot health check failed"
    echo "   Fix issues before swapping to production"
    exit 1
fi

###############################################################################
# Step 2: Backup Current Production Slot
###############################################################################

echo ""
echo "💾 Step 2: Backing up production slot info..."
echo ""

PROD_URL="https://inside-journaling-app.azurewebsites.net"

# Test current production (if deployed)
echo "Current production URL: $PROD_URL"
if curl -f -s "$PROD_URL" > /dev/null; then
    echo "✅ Production slot is currently running"
else
    echo "⚠️  Production slot may not be deployed yet"
fi

###############################################################################
# Step 3: Perform Slot Swap
###############################################################################

echo ""
echo "🔄 Step 3: Performing slot swap..."
echo ""
echo "This will take 1-2 minutes..."

az webapp deployment slot swap \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot "$SLOT_NAME" \
    --target-slot production

echo "✅ Slot swap completed"

###############################################################################
# Step 4: Wait for Propagation
###############################################################################

echo ""
echo "⏳ Step 4: Waiting for changes to propagate..."
echo ""

sleep 15

###############################################################################
# Step 5: Verify Production Health
###############################################################################

echo ""
echo "🏥 Step 5: Verifying production health..."
echo ""

MAX_RETRIES=5
RETRY_COUNT=0
RETRY_DELAY=10

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "$PROD_URL" > /dev/null; then
        echo "✅ Production is healthy"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        else
            echo "❌ Error: Production health check failed after $MAX_RETRIES attempts"
            echo ""
            echo "⚠️  ROLLBACK RECOMMENDED!"
            echo "   Run ./azure-setup/rollback-production.sh immediately"
            exit 1
        fi
    fi
done

###############################################################################
# Step 6: Update OAuth Redirect URIs
###############################################################################

echo ""
echo "🔐 Step 6: OAuth configuration reminder..."
echo ""

echo "⚠️  IMPORTANT: Update OAuth redirect URIs if not already done:"
echo ""
echo "Google Console:"
echo "  https://inside-journaling-app.azurewebsites.net/api/auth/google/callback"
echo ""
echo "Microsoft Entra:"
echo "  https://inside-journaling-app.azurewebsites.net/api/auth/microsoft/callback"
echo ""
echo "If using custom domain:"
echo "  https://yourdomain.com/api/auth/google/callback"
echo "  https://yourdomain.com/api/auth/microsoft/callback"
echo ""

###############################################################################
# Summary
###############################################################################

echo ""
echo "=========================================="
echo "✅ Production Deployment Successful!"
echo "=========================================="
echo ""
echo "🌐 Production URL:"
echo "  $PROD_URL"
echo ""
echo "📊 Monitor Logs:"
echo "  az webapp log tail \\"
echo "    --name $WEBAPP_NAME \\"
echo "    --resource-group $RESOURCE_GROUP"
echo ""
echo "📈 Application Insights:"
echo "  https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade/overview"
echo ""
echo "⚠️  What Happened:"
echo "  - Development slot code is now LIVE in production"
echo "  - Old production code moved to development slot"
echo "  - Slot-specific settings (DB endpoints) remained with slots"
echo ""
echo "🔄 If Issues Occur:"
echo "  Run ./azure-setup/rollback-production.sh to revert"
echo ""
echo "📋 Post-Deployment Checklist:"
echo "  [ ] Monitor Application Insights for errors"
echo "  [ ] Test critical user flows (login, create entry, etc.)"
echo "  [ ] Verify OAuth login works"
echo "  [ ] Check Stripe payments if applicable"
echo "  [ ] Monitor Azure costs"
echo "  [ ] Update DNS if using custom domain"
echo ""
echo "🎉 Congratulations! Your app is now in production!"
echo ""
echo "=========================================="
