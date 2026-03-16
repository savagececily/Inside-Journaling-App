# Partition Key Mismatch Fix

## Problem
The application was failing with error:
```
PartitionKey extracted from document doesn't match the one specified in the header
```

## Root Cause
The Cosmos DB client is configured with `CosmosPropertyNamingPolicy.CamelCase` in Program.cs, which serializes all C# properties to camelCase in JSON documents. However:
- **Models defined**: `UserId` (PascalCase)
- **Containers created with**: `/UserId` (PascalCase partition key path)
- **Actual JSON documents have**: `userId` (camelCase due to serialization policy)
- **Result**: Partition key mismatch error

## Changes Made

### 1. Model Updates
- ✅ Updated `UserConsent.UserId` → `UserConsent.userId`
- ✅ Updated `AuditLog.UserId` → `AuditLog.userId`

### 2. Service Updates
- ✅ Updated `UserConsentService` to use `userId` property
- ✅ Updated `AuditLogService` to use `userId` property
- ✅ Fixed all SQL queries to use `c.userId` instead of `c.UserId`

### 3. Infrastructure Updates
- ✅ Updated `setup-compliance-containers.sh` to create containers with partition key `/userId`

### 4. Test Updates
- ✅ Updated `UserConsentServiceTests.cs` to use `userId` property

### 5. Documentation Updates
- ✅ Updated `COSMOS_DB_PARTITIONING.md` to reflect correct partition key paths and property naming

## Required Actions

### ⚠️ IMPORTANT: You MUST recreate your Cosmos DB containers

Since partition keys cannot be changed after container creation, you need to recreate the containers:

### Option 1: Delete and Recreate (Recommended for Development)

1. **Delete existing containers** (if they have data, export first):
   ```bash
   # Delete UserConsents container
   az cosmosdb sql container delete \
     --resource-group <your-resource-group> \
     --account-name <your-cosmos-account> \
     --database-name <your-database> \
     --name UserConsents
   
   # Delete AuditLogs container
   az cosmosdb sql container delete \
     --resource-group <your-resource-group> \
     --account-name <your-cosmos-account> \
     --database-name <your-database> \
     --name AuditLogs
   ```

2. **Create new containers with correct partition keys**:
   ```bash
   cd azure-setup
   ./setup-compliance-containers.sh
   ```

### Option 2: Create New Containers with Different Names

If you need to preserve existing data:

1. Create new containers with different names (e.g., `UserConsentsV2`, `AuditLogsV2`)
2. Migrate data from old containers to new containers
3. Update configuration to point to new container names
4. Delete old containers once migration is verified

### After Recreating Containers

1. **Rebuild and redeploy your application**:
   ```bash
   dotnet build
   # Deploy using your deployment method (azd up, docker, etc.)
   ```

2. **Test the consent functionality**:
   - Try registering/logging in
   - Accept the consent dialogs
   - Verify no partition key errors occur

3. **Verify audit logs are working**:
   - Perform some actions (create journal entry, etc.)
   - Check that audit logs are being created successfully

## Verification Commands

Check if containers exist with correct partition keys:
```bash
# Check UserConsents container
az cosmosdb sql container show \
  --resource-group <your-resource-group> \
  --account-name <your-cosmos-account> \
  --database-name <your-database> \
  --name UserConsents \
  --query "resource.partitionKey.paths"

# Check AuditLogs container  
az cosmosdb sql container show \
  --resource-group <your-resource-group> \
  --account-name <your-cosmos-account> \
  --database-name <your-database> \
  --name AuditLogs \
  --query "resource.partitionKey.paths"
```

Expected output for both: `["/userId"]`

## Summary

- ✅ All code has been fixed to use camelCase `userId` consistently
- ✅ Container setup scripts updated to use partition key `/userId`
- ⚠️ **ACTION REQUIRED**: You must recreate the Cosmos DB containers with the correct partition key
- 🔄 After recreating containers, rebuild and redeploy your application

## Technical Details

The Cosmos DB .NET SDK's `CosmosPropertyNamingPolicy.CamelCase` transforms property names during serialization:
- C# property: `UserId` (PascalCase)
- JSON document: `userId` (camelCase)
- Partition key path must match JSON: `/userId`

This is consistent with how `JournalEntry` already uses `userId`, `journalEntryId`, etc.
