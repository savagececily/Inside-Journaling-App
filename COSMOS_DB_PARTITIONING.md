# Cosmos DB Partitioning Strategy

## Overview

This document explains the optimized partition key strategy for the Mental Health Journal's Cosmos DB containers, specifically for the compliance features (AuditLogs and UserConsents).

## Partition Key Design

### UserConsents Container
- **Partition Key**: `/UserId`
- **Rationale**: All consent records for a single user are stored in the same logical partition

### AuditLogs Container
- **Partition Key**: `/UserId`
- **Rationale**: All audit log entries for a single user are stored in the same logical partition

## Why This Design?

### Previous Design Issues
The original implementation used unique GUIDs as partition keys:
- `UserConsents`: Used `/userConsentId` (a unique GUID per consent)
- `AuditLogs`: Used `/auditLogId` (a unique GUID per log entry)

**Problems with this approach:**
1. **Cross-partition queries**: Every query to retrieve a user's consents or audit logs required scanning multiple partitions
2. **Higher RU costs**: Cross-partition queries consume more Request Units (RUs) in Cosmos DB
3. **Reduced performance**: Queries were slower due to the need to scan multiple partitions
4. **Inefficient scaling**: Created excessive number of partitions, defeating the purpose of partitioning

### Optimized Design Benefits

By using `/UserId` as the partition key:

1. **Single-partition queries**: All queries for a user's data stay within a single partition
2. **Lower RU costs**: Single-partition queries are significantly cheaper in terms of RU consumption
3. **Improved performance**: Faster query execution as Cosmos DB only needs to read from one partition
4. **Better scalability**: Partitions scale with users, which is the natural access pattern for this application

## Query Optimization

All queries now specify the partition key explicitly for maximum efficiency:

```csharp
var queryRequestOptions = new QueryRequestOptions
{
    PartitionKey = new PartitionKey(userId) // Single-partition query
};

var iterator = _container.GetItemQueryIterator<UserConsent>(
    query, 
    requestOptions: queryRequestOptions
);
```

## Access Patterns

The application's access patterns align perfectly with this partition strategy:

### UserConsents
- ✅ Get all consents for a user
- ✅ Get latest consent of a specific type for a user
- ✅ Revoke a consent for a user
- ✅ Check if user has valid consent

All these operations are scoped to a single user, making `/UserId` the optimal partition key.

### AuditLogs
- ✅ Get all audit logs for a user
- ✅ Get recent audit logs for a user (with limit)
- ✅ Create audit log entry for user action

All audit log operations are user-specific, making `/UserId` the optimal partition key.

## Migration Guide

If you have existing containers with the old partition key structure, you'll need to:

1. **Create new containers** with the correct partition key structure (use the updated setup script)
2. **Migrate data** from old containers to new ones (if applicable)
3. **Update connection strings** in your application configuration
4. **Delete old containers** once migration is verified

### Using the Setup Script

The updated `azure-setup/setup-compliance-containers.sh` script creates containers with the optimized partition keys:

```bash
cd azure-setup
./setup-compliance-containers.sh
```

The script will create:
- `AuditLogs` container with partition key `/UserId`
- `UserConsents` container with partition key `/UserId`

## Performance Considerations

### Partition Size
- Each partition can grow to 20 GB
- For most users, consent and audit log data will be well within this limit
- The partition key distributes load evenly across users

### Hot Partitions
- Individual user activity creates load on specific partitions
- This is acceptable as user activity is naturally distributed
- High-activity users will have their data in "hot" partitions, but this is expected and manageable

### RU Savings Example

**Before (cross-partition query):**
- Query: Get all consents for user → Scans N partitions → ~50-100 RUs

**After (single-partition query):**
- Query: Get all consents for user → Reads 1 partition → ~3-10 RUs

**Result**: ~90% reduction in RU consumption for typical queries

## SQL Query Updates

All SQL queries now use correct property names (PascalCase matching the C# model):

```sql
-- Correct: Uses PascalCase property names
SELECT * FROM c WHERE c.UserId = @userId AND c.ConsentType = @consentType

-- Incorrect (old): Used camelCase
SELECT * FROM c WHERE c.userId = @userId AND c.consentType = @consentType
```

## References

- [Azure Cosmos DB Partitioning](https://docs.microsoft.com/en-us/azure/cosmos-db/partitioning-overview)
- [Request Units in Azure Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/request-units)
- [Choosing a Partition Key](https://docs.microsoft.com/en-us/azure/cosmos-db/sql/how-to-choose-partition-key)
