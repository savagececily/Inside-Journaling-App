#!/bin/bash

###############################################################################
# DEPRECATED - Use GitHub Actions for rollback
# This script was for the old monolithic web app architecture.
# For rollback, redeploy a previous commit via GitHub Actions.
###############################################################################

echo "⚠️  DEPRECATED: This script is for the old monolithic architecture"
echo "For rollback, redeploy a previous commit via GitHub Actions"
exit 1

###############################################################################
# Rollback Production Deployment
# Emergency rollback - swaps production back to development slot
###############################################################################

set -e

echo "=========================================="
echo "🚨 EMERGENCY ROLLBACK"
echo "=========================================="

# Configuration
RESOURCE_GROUP="InsideJournalingAppRG"
WEBAPP_NAME="inside-journaling-app"
SLOT_NAME="development"

echo ""
echo "⚠️  WARNING: This will rollback your production deployment!"
echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "Web App: $WEBAPP_NAME"
echo ""
echo "This will:"
echo "  1. Swap production slot back to development"
echo "  2. Restore previous production code"
echo "  3. Current production code moves to development"
echo ""

read -p "Proceed with rollback? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

###############################################################################
# Step 1: Verify Production Issue
###############################################################################

echo ""
echo "🔍 Step 1: Checking production status..."
echo ""

PROD_URL="https://inside-journaling-app.azurewebsites.net"

echo "Testing production endpoint: $PROD_URL"
if curl -f -s "$PROD_URL" > /dev/null; then
    echo "⚠️  Production appears healthy"
    echo ""
    read -p "Production is responding. Still rollback? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Rollback cancelled."
        exit 1
    fi
else
    echo "❌ Production health check failed - proceeding with rollback"
fi

###############################################################################
# Step 2: Perform Rollback (Slot Swap)
###############################################################################

echo ""
echo "🔄 Step 2: Performing rollback (swapping slots)..."
echo ""
echo "This will take 1-2 minutes..."

az webapp deployment slot swap \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot "$SLOT_NAME" \
    --target-slot production

echo "✅ Rollback completed"

###############################################################################
# Step 3: Wait for Propagation
###############################################################################

echo ""
echo "⏳ Step 3: Waiting for changes to propagate..."
echo ""

sleep 15

###############################################################################
# Step 4: Verify Production Health After Rollback
###############################################################################

echo ""
echo "🏥 Step 4: Verifying production health after rollback..."
echo ""

MAX_RETRIES=5
RETRY_COUNT=0
RETRY_DELAY=10

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "$PROD_URL" > /dev/null; then
        echo "✅ Production is healthy after rollback"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        else
            echo "❌ Error: Production still unhealthy after rollback"
            echo "   Manual intervention required"
            echo ""
            echo "Check logs:"
            echo "  az webapp log tail \\"
            echo "    --name $WEBAPP_NAME \\"
            echo "    --resource-group $RESOURCE_GROUP"
            exit 1
        fi
    fi
done

###############################################################################
# Step 5: Check Application Insights
###############################################################################

echo ""
echo "📊 Step 5: Monitoring Application Insights..."
echo ""

echo "Check for errors in Application Insights:"
echo "  az monitor app-insights query \\"
echo "    --app inside-journaling-app \\"
echo "    --resource-group $RESOURCE_GROUP \\"
echo "    --analytics-query 'exceptions | top 10 by timestamp desc'"
echo ""

###############################################################################
# Summary
###############################################################################

echo ""
echo "=========================================="
echo "✅ Rollback Complete"
echo "=========================================="
echo ""
echo "🌐 Production URL:"
echo "  $PROD_URL"
echo ""
echo "⚠️  What Happened:"
echo "  - Production reverted to previous working version"
echo "  - Failed deployment moved to development slot"
echo "  - Slot-specific settings remained unchanged"
echo ""
echo "📊 Next Steps:"
echo ""
echo "1. Verify production is working correctly"
echo "2. Monitor Application Insights for errors"
echo "3. Test critical user flows"
echo ""
echo "4. Investigate the issue in development slot:"
echo "   https://inside-journaling-app-development.azurewebsites.net"
echo ""
echo "5. Check development slot logs:"
echo "   az webapp log tail \\"
echo "     --name $WEBAPP_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --slot $SLOT_NAME"
echo ""
echo "6. Fix the issue in your codebase"
echo ""
echo "7. When ready, redeploy:"
echo "   ./azure-setup/deploy-to-dev.sh"
echo "   (test thoroughly)"
echo "   ./azure-setup/swap-to-production.sh"
echo ""
echo "📋 Common Issues to Check:"
echo "  - App settings configuration"
echo "  - Managed identity permissions"
echo "  - OAuth redirect URIs"
echo "  - Database connection strings"
echo "  - API keys and secrets"
echo "  - CORS configuration"
echo ""
echo "=========================================="
