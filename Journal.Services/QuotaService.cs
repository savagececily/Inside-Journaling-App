using Journal.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;

namespace Journal.Services
{
    public class QuotaService : IQuotaService
    {
        private readonly ICosmosDbService _cosmosDbService;
        private readonly ILogger<QuotaService> _logger;
        private readonly Container _quotaContainer;
        private readonly Container _tokenUsageContainer;

        public QuotaService(
            ICosmosDbService cosmosDbService,
            ILogger<QuotaService> logger,
            CosmosClient cosmosClient)
        {
            _cosmosDbService = cosmosDbService;
            _logger = logger;
            
            var database = cosmosClient.GetDatabase("JournalDb");
            _quotaContainer = database.GetContainer("UserQuotas");
            _tokenUsageContainer = database.GetContainer("TokenUsage");
        }

        public async Task<UserQuota> GetUserQuotaAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                var response = await _quotaContainer.ReadItemAsync<UserQuota>(
                    userId,
                    new PartitionKey(userId),
                    cancellationToken: cancellationToken
                );
                
                var quota = response.Resource;
                
                // Auto-reset if new month
                if (quota.ShouldResetQuota())
                {
                    quota.ResetMonthlyQuota();
                    await _quotaContainer.UpsertItemAsync(quota, new PartitionKey(userId), cancellationToken: cancellationToken);
                    _logger.LogInformation("Reset monthly quota for user {UserId}", userId);
                }
                
                return quota;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                // Create new quota record for user
                var newQuota = new UserQuota
                {
                    Id = userId,
                    UserId = userId,
                    Tier = UserTier.Free,
                    EntriesThisMonth = 0,
                    VoiceEntriesThisMonth = 0,
                    LastReset = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                
                await _quotaContainer.CreateItemAsync(newQuota, new PartitionKey(userId), cancellationToken: cancellationToken);
                _logger.LogInformation("Created new quota record for user {UserId}", userId);
                
                return newQuota;
            }
        }

        public async Task<(bool CanCreate, string? Reason)> CanCreateAIEntryAsync(string userId, CancellationToken cancellationToken = default)
        {
            var quota = await GetUserQuotaAsync(userId, cancellationToken);
            
            // Premium users have unlimited access
            if (quota.IsPremiumActive)
            {
                return (true, null);
            }
            
            // Check free tier quota
            if (quota.HasExceededAIQuota)
            {
                return (false, $"You've reached your free tier limit of {quota.AIAnalysisQuotaLimit} AI-analyzed entries this month. Upgrade to Premium for unlimited access.");
            }
            
            return (true, null);
        }

        public async Task<(bool CanCreate, string? Reason)> CanCreateVoiceEntryAsync(string userId, CancellationToken cancellationToken = default)
        {
            var quota = await GetUserQuotaAsync(userId, cancellationToken);
            
            // Premium users have unlimited access
            if (quota.IsPremiumActive)
            {
                return (true, null);
            }
            
            // Check free tier quota
            if (quota.HasExceededVoiceQuota)
            {
                return (false, $"You've reached your free tier limit of {quota.VoiceQuotaLimit} voice entries this month. Upgrade to Premium for unlimited access.");
            }
            
            return (true, null);
        }

        public async Task IncrementEntryCountAsync(string userId, bool isVoice, CancellationToken cancellationToken = default)
        {
            var quota = await GetUserQuotaAsync(userId, cancellationToken);
            
            quota.EntriesThisMonth++;
            if (isVoice)
            {
                quota.VoiceEntriesThisMonth++;
            }
            
            await _quotaContainer.UpsertItemAsync(quota, new PartitionKey(userId), cancellationToken: cancellationToken);
            
            _logger.LogInformation(
                "Incremented usage for user {UserId}: Entries={Entries}/{Limit}, Voice={Voice}/{VoiceLimit}",
                userId, quota.EntriesThisMonth, quota.AIAnalysisQuotaLimit, 
                quota.VoiceEntriesThisMonth, quota.VoiceQuotaLimit
            );
        }

        public async Task UpgradeToPremiumAsync(string userId, DateTime? expiresAt = null, CancellationToken cancellationToken = default)
        {
            var quota = await GetUserQuotaAsync(userId, cancellationToken);
            
            quota.Tier = UserTier.Premium;
            quota.PremiumExpiresAt = expiresAt;
            
            await _quotaContainer.UpsertItemAsync(quota, new PartitionKey(userId), cancellationToken: cancellationToken);
            
            _logger.LogInformation("Upgraded user {UserId} to Premium (expires: {Expires})", userId, expiresAt?.ToString() ?? "never");
        }

        public async Task DowngradeToFreeAsync(string userId, CancellationToken cancellationToken = default)
        {
            var quota = await GetUserQuotaAsync(userId, cancellationToken);
            
            quota.Tier = UserTier.Free;
            quota.PremiumExpiresAt = null;
            
            await _quotaContainer.UpsertItemAsync(quota, new PartitionKey(userId), cancellationToken: cancellationToken);
            
            _logger.LogInformation("Downgraded user {UserId} to Free tier", userId);
        }

        public async Task ResetQuotaIfNeededAsync(string userId, CancellationToken cancellationToken = default)
        {
            var quota = await GetUserQuotaAsync(userId, cancellationToken);
            
            if (quota.ShouldResetQuota())
            {
                quota.ResetMonthlyQuota();
                await _quotaContainer.UpsertItemAsync(quota, new PartitionKey(userId), cancellationToken: cancellationToken);
                _logger.LogInformation("Reset monthly quota for user {UserId}", userId);
            }
        }

        public async Task RecordTokenUsageAsync(TokenUsage usage, CancellationToken cancellationToken = default)
        {
            try
            {
                await _tokenUsageContainer.CreateItemAsync(usage, new PartitionKey(usage.UserId), cancellationToken: cancellationToken);
                
                _logger.LogInformation(
                    "Recorded token usage for user {UserId}: {Tokens} tokens, ${Cost}, operation={Operation}",
                    usage.UserId, usage.TotalTokens, usage.EstimatedCost, usage.Operation
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to record token usage for user {UserId}", usage.UserId);
                // Don't throw - token tracking is for monitoring, not critical path
            }
        }

        public async Task<List<TokenUsage>> GetMonthlyTokenUsageAsync(string userId, CancellationToken cancellationToken = default)
        {
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userId = @userId AND c.timestamp >= @startOfMonth ORDER BY c.timestamp DESC"
            )
            .WithParameter("@userId", userId)
            .WithParameter("@startOfMonth", startOfMonth);
            
            var results = new List<TokenUsage>();
            var iterator = _tokenUsageContainer.GetItemQueryIterator<TokenUsage>(query);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);
                results.AddRange(response);
            }
            
            return results;
        }

        public async Task DeleteUserQuotaAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                // Delete UserQuota record
                await _quotaContainer.DeleteItemAsync<UserQuota>(
                    userId,
                    new PartitionKey(userId),
                    cancellationToken: cancellationToken
                );
                
                _logger.LogInformation("Deleted quota record for user {UserId}", userId);
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Quota record not found for user {UserId}, skipping deletion", userId);
            }

            // Delete all TokenUsage records
            try
            {
                var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId")
                    .WithParameter("@userId", userId);
                
                var iterator = _tokenUsageContainer.GetItemQueryIterator<TokenUsage>(query);
                
                while (iterator.HasMoreResults)
                {
                    var response = await iterator.ReadNextAsync(cancellationToken);
                    foreach (var usage in response)
                    {
                        await _tokenUsageContainer.DeleteItemAsync<TokenUsage>(
                            usage.Id,
                            new PartitionKey(userId),
                            cancellationToken: cancellationToken
                        );
                    }
                }
                
                _logger.LogInformation("Deleted all token usage records for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting token usage records for user {UserId}", userId);
                throw;
            }
        }
    }
}
