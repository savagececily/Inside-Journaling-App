using MentalHealthJournal.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MentalHealthJournal.Services;

public class AuditLogService : IAuditLogService
{
    private readonly ILogger<AuditLogService> _logger;
    private readonly CosmosClient _cosmosClient;
    private readonly AppSettings _appSettings;
    private readonly Container _container;

    public AuditLogService(
        ILogger<AuditLogService> logger,
        CosmosClient cosmosClient,
        IOptions<AppSettings> options)
    {
        _logger = logger;
        _cosmosClient = cosmosClient;
        _appSettings = options.Value;
        _container = _cosmosClient.GetContainer(
            _appSettings.CosmosDb.DatabaseName,
            "AuditLogs"); // New container for audit logs
    }

    public async Task LogActionAsync(
        string userId,
        string action,
        string resourceType,
        string resourceId,
        bool successful = true,
        string? errorMessage = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? additionalDetails = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var auditLog = new AuditLog
            {
                userId = userId, // Partition key - all audit logs for a user in same partition
                Action = action,
                ResourceType = resourceType,
                ResourceId = resourceId,
                Timestamp = DateTime.UtcNow,
                Successful = successful,
                ErrorMessage = errorMessage,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                AdditionalDetails = additionalDetails
            };

            await _container.CreateItemAsync(
                auditLog,
                new PartitionKey(auditLog.userId),
                cancellationToken: cancellationToken);

            _logger.LogInformation(
                "Audit log created: User {UserId}, Action {Action}, Resource {ResourceType}:{ResourceId}, Success {Successful}",
                userId, action, resourceType, resourceId, successful);
        }
        catch (Exception ex)
        {
            // Don't throw - audit logging should never break application flow
            _logger.LogError(ex,
                "Failed to create audit log for User {UserId}, Action {Action}, Resource {ResourceType}:{ResourceId}",
                userId, action, resourceType, resourceId);
        }
    }

    public async Task<List<AuditLog>> GetUserAuditLogsAsync(
        string userId,
        int? limit = 100,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new QueryDefinition(
                "SELECT TOP @limit * FROM c WHERE c.userId = @userId ORDER BY c.Timestamp DESC")
                .WithParameter("@userId", userId)
                .WithParameter("@limit", limit ?? 100);

            var queryRequestOptions = new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(userId) // Single-partition query for efficiency
            };

            var results = new List<AuditLog>();
            var iterator = _container.GetItemQueryIterator<AuditLog>(query, requestOptions: queryRequestOptions);

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);
                results.AddRange(response);
            }

            _logger.LogInformation("Retrieved {Count} audit logs for user {UserId}", results.Count, userId);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve audit logs for user {UserId}", userId);
            throw;
        }
    }
}
