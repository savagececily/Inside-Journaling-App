#!/bin/bash

# Setup script for compliance feature Cosmos DB containers
# This script creates the required AuditLogs and UserConsents containers

echo "=========================================="
echo "Mental Health Journal - Compliance Setup"
echo "=========================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "✅ Azure CLI found"
echo ""

# Check if logged in
echo "Checking Azure login status..."
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Azure. Please run: az login"
    exit 1
fi

echo "✅ Logged in to Azure"
echo ""

# Get configuration
read -p "Enter your Azure Resource Group name: " RESOURCE_GROUP
read -p "Enter your Cosmos DB account name: " ACCOUNT_NAME
read -p "Enter your Cosmos DB database name [MentalHealthJournalDb]: " DATABASE_NAME
DATABASE_NAME=${DATABASE_NAME:-MentalHealthJournalDb}

# Validate required inputs
if [ -z "$RESOURCE_GROUP" ]; then
    echo "❌ Resource Group name is required. Please run the script again and provide a valid value."
    exit 1
fi

if [ -z "$ACCOUNT_NAME" ]; then
    echo "❌ Cosmos DB account name is required. Please run the script again and provide a valid value."
    exit 1
fi
echo ""
echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Cosmos DB Account: $ACCOUNT_NAME"
echo "  Database: $DATABASE_NAME"
echo ""

read -p "Proceed with container creation? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Creating containers..."
echo ""

# Create AuditLogs container
echo "📝 Creating AuditLogs container..."
az cosmosdb sql container create \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "$ACCOUNT_NAME" \
  --database-name "$DATABASE_NAME" \
  --name AuditLogs \
  --partition-key-path "/auditLogId" \
  --throughput 400

if [ $? -eq 0 ]; then
    echo "✅ AuditLogs container created successfully"
else
    echo "❌ Failed to create AuditLogs container"
    exit 1
fi

echo ""

# Create UserConsents container
echo "📝 Creating UserConsents container..."
az cosmosdb sql container create \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "$ACCOUNT_NAME" \
  --database-name "$DATABASE_NAME" \
  --name UserConsents \
  --partition-key-path "/userConsentId" \
  --throughput 400

if [ $? -eq 0 ]; then
    echo "✅ UserConsents container created successfully"
else
    echo "❌ Failed to create UserConsents container"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "The following containers have been created:"
echo "  1. AuditLogs (partition key: /auditLogId)"
echo "  2. UserConsents (partition key: /userConsentId)"
echo ""
echo "Next steps:"
echo "  1. Deploy your updated application to Azure"
echo "  2. Update your frontend to record user consent"
echo "  3. Add account deletion button to user settings"
echo "  4. Test the audit logging functionality"
echo ""
echo "For detailed documentation, see COMPLIANCE_FEATURES.md"
echo ""
