#!/bin/bash

# Azure Cost Alerts Setup Script
# This script creates cost management budgets and alerts for the Mental Health Journal application

set -e

echo "=================================================="
echo "Mental Health Journal - Cost Alert Setup"
echo "=================================================="
echo ""

# Check if user is logged in
echo "🔐 Checking Azure login..."
az account show > /dev/null 2>&1 || {
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
}

echo "✅ Logged in to Azure"
echo ""

# Get subscription info
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)

echo "📋 Subscription Information:"
echo "   ID: $SUBSCRIPTION_ID"
echo "   Name: $SUBSCRIPTION_NAME"
echo ""

# Prompt for resource group
read -p "Enter resource group name [default: rg-mentalhealthjournal]: " RESOURCE_GROUP
RESOURCE_GROUP=${RESOURCE_GROUP:-rg-mentalhealthjournal}

# Check if resource group exists
echo "🔍 Checking resource group..."
if az group show --name "$RESOURCE_GROUP" > /dev/null 2>&1; then
    echo "✅ Resource group '$RESOURCE_GROUP' found"
else
    echo "⚠️  Resource group '$RESOURCE_GROUP' not found. Creating it..."
    read -p "Enter location [default: eastus]: " LOCATION
    LOCATION=${LOCATION:-eastus}
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    echo "✅ Resource group created"
fi
echo ""

# Prompt for email addresses
echo "📧 Email Notification Setup"
echo "   Enter email addresses to receive cost alerts (comma-separated)"
read -p "Email(s): " EMAIL_INPUT

# Convert comma-separated emails to array
IFS=',' read -ra EMAILS <<< "$EMAIL_INPUT"

# Trim whitespace
FORMATTED_EMAILS=()
for email in "${EMAILS[@]}"; do
    trimmed=$(echo "$email" | xargs)
    FORMATTED_EMAILS+=("$trimmed")
done

echo ""
echo "📊 Setting up cost budgets and alerts..."
echo ""

# Budget amounts
MONTHLY_BUDGET=1000

echo "Setting up monthly budget: \$$MONTHLY_BUDGET"
echo ""

# Create budget with alerts at 50%, 75%, 90%, and 100%
BUDGET_NAME="mental-health-journal-monthly-budget"

# Get start date (first day of current month)
START_DATE=$(date -u +"%Y-%m-01T00:00:00Z")

# Build notification JSON
NOTIFICATIONS_JSON="["
THRESHOLDS=(50 75 90 100)

for i in "${!THRESHOLDS[@]}"; do
    threshold=${THRESHOLDS[$i]}
    
    # Build email list for JSON
    email_list=""
    for email in "${FORMATTED_EMAILS[@]}"; do
        email_list="$email_list\"$email\","
    done
    # Remove trailing comma
    email_list=${email_list%,}
    
    NOTIFICATIONS_JSON="$NOTIFICATIONS_JSON{\"enabled\":true,\"operator\":\"GreaterThan\",\"threshold\":$threshold,\"contactEmails\":[$email_list],\"contactRoles\":[],\"thresholdType\":\"Actual\"}"
    
    if [ $i -lt $((${#THRESHOLDS[@]} - 1)) ]; then
        NOTIFICATIONS_JSON="$NOTIFICATIONS_JSON,"
    fi
done

NOTIFICATIONS_JSON="$NOTIFICATIONS_JSON]"

echo "Creating budget '$BUDGET_NAME'..."

# Create or update budget
az deployment sub create \
    --location eastus \
    --template-file - <<EOF
{
  "\$schema": "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Consumption/budgets",
      "apiVersion": "2021-10-01",
      "name": "$BUDGET_NAME",
      "properties": {
        "category": "Cost",
        "amount": $MONTHLY_BUDGET,
        "timeGrain": "Monthly",
        "timePeriod": {
          "startDate": "$START_DATE"
        },
        "filter": {
          "dimensions": {
            "name": "ResourceGroupName",
            "operator": "In",
            "values": ["$RESOURCE_GROUP"]
          }
        },
        "notifications": {
          "Alert50": {
            "enabled": true,
            "operator": "GreaterThan",
            "threshold": 50,
            "contactEmails": [$(IFS=,; printf '"%s",' "${FORMATTED_EMAILS[@]}" | sed 's/,$//')],
            "thresholdType": "Actual"
          },
          "Alert75": {
            "enabled": true,
            "operator": "GreaterThan",
            "threshold": 75,
            "contactEmails": [$(IFS=,; printf '"%s",' "${FORMATTED_EMAILS[@]}" | sed 's/,$//')],
            "thresholdType": "Actual"
          },
          "Alert90": {
            "enabled": true,
            "operator": "GreaterThan",
            "threshold": 90,
            "contactEmails": [$(IFS=,; printf '"%s",' "${FORMATTED_EMAILS[@]}" | sed 's/,$//')],
            "thresholdType": "Actual"
          },
          "Alert100": {
            "enabled": true,
            "operator": "GreaterThan",
            "threshold": 100,
            "contactEmails": [$(IFS=,; printf '"%s",' "${FORMATTED_EMAILS[@]}" | sed 's/,$//')],
            "thresholdType": "Actual"
          }
        }
      }
    }
  ]
}
EOF

if [ $? -eq 0 ]; then
    echo "✅ Budget created successfully!"
else
    echo "⚠️  Budget creation failed. You may need owner/contributor permissions on the subscription."
    echo "   Attempting alternate method using az consumption budget..."
    
    # Try using az consumption budget create command
    az consumption budget create \
        --budget-name "$BUDGET_NAME" \
        --category Cost \
        --amount $MONTHLY_BUDGET \
        --time-grain Monthly \
        --start-date "$START_DATE" \
        --resource-group "$RESOURCE_GROUP" \
        --notifications enabled=true operator=GreaterThan threshold=50 contact-emails="${FORMATTED_EMAILS[0]}" \
        || echo "❌ Budget creation failed. Please create manually in Azure Portal."
fi

echo ""
echo "=================================================="
echo "✅ Cost Alert Setup Complete!"
echo "=================================================="
echo ""
echo "📋 Summary:"
echo "   Budget Name: $BUDGET_NAME"
echo "   Monthly Budget: \$$MONTHLY_BUDGET"
echo "   Alert Thresholds: 50%, 75%, 90%, 100%"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Notification Recipients:"
for email in "${FORMATTED_EMAILS[@]}"; do
    echo "      - $email"
done
echo ""
echo "📧 Alert Notifications:"
echo "   50% = \$500 spent"
echo "   75% = \$750 spent"
echo "   90% = \$900 spent"
echo "   100% = \$1,000 spent"
echo ""
echo "💡 Next Steps:"
echo "   1. Verify budget in Azure Portal: Cost Management > Budgets"
echo "   2. Deploy optimized application code (GPT-4o-mini, rate limiting)"
echo "   3. Monitor costs regularly in Azure Portal"
echo "   4. Adjust budget thresholds as needed"
echo ""
echo "📊 To view current costs:"
echo "   az consumption usage list --start-date \$(date -u -d '30 days ago' +%Y-%m-%d) | jq '[.[] | {service: .meterCategory, cost: .pretaxCost}] | group_by(.service) | map({service: .[0].service, total: (map(.cost | tonumber) | add)})'"
echo ""
echo "🔗 Useful Links:"
echo "   - Azure Cost Management: https://portal.azure.com/#view/Microsoft_Azure_CostManagement"
echo "   - Budgets Dashboard: https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/budgets"
echo ""
