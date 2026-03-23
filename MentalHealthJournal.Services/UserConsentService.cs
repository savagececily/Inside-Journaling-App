using MentalHealthJournal.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MentalHealthJournal.Services;

public class UserConsentService : IUserConsentService
{
    private readonly ILogger<UserConsentService> _logger;
    private readonly CosmosClient _cosmosClient;
    private readonly AppSettings _appSettings;
    private readonly Container _container;

    public UserConsentService(
        ILogger<UserConsentService> logger,
        CosmosClient cosmosClient,
        IOptions<AppSettings> options)
    {
        _logger = logger;
        _cosmosClient = cosmosClient;
        _appSettings = options.Value;
        _container = _cosmosClient.GetContainer(
            _appSettings.CosmosDb.DatabaseName,
            "UserConsents"); // New container for user consents
    }

    public async Task RecordConsentAsync(
        string userId,
        string consentType,
        string version,
        bool granted,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var consent = new UserConsent
            {
                id = Guid.NewGuid().ToString(), // Generate unique ID for each consent record
                userId = userId, // Partition key - all consents for a user in same partition
                ConsentType = consentType,
                ConsentVersion = version,
                Granted = granted,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = granted ? null : DateTime.UtcNow, // If revoking, set revoked date
                IpAddress = ipAddress,
                UserAgent = userAgent
            };

            var response = await _container.CreateItemAsync(
                consent,
                new PartitionKey(consent.userId),
                cancellationToken: cancellationToken);

            _logger.LogInformation(
                "✅ Consent SAVED: UserId={UserId}, Type={ConsentType}, Version={Version}, Granted={Granted}, Id={Id}",
                userId, consentType, version, granted, response.Resource.id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ Failed to record consent for UserId={UserId}, Type={ConsentType}",
                userId, consentType);
            throw;
        }
    }

    public async Task<UserConsent?> GetLatestConsentAsync(
        string userId,
        string consentType,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("🔍 Searching for consent: UserId={UserId}, Type={ConsentType}", userId, consentType);
            
            // Query for the latest non-revoked consent
            var query = new QueryDefinition(
                "SELECT TOP 1 * FROM c WHERE c.userId = @userId AND c.ConsentType = @consentType AND IS_NULL(c.RevokedDate) ORDER BY c.ConsentDate DESC")
                .WithParameter("@userId", userId)
                .WithParameter("@consentType", consentType);

            var queryRequestOptions = new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(userId) // Single-partition query for efficiency
            };

            _logger.LogInformation("🔍 Executing query with PartitionKey={PartitionKey}", userId);

            var iterator = _container.GetItemQueryIterator<UserConsent>(query, requestOptions: queryRequestOptions);

            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);
                _logger.LogInformation("📦 Query returned {Count} results", response.Count);
                
                var result = response.FirstOrDefault();
                
                if (result != null)
                {
                    _logger.LogInformation("✅ Found consent: UserId={UserId}, Type={ConsentType}, Granted={Granted}, ConsentDate={Date}, RevokedDate={RevokedDate}, Id={Id}",
                        result.userId, result.ConsentType, result.Granted, result.ConsentDate, result.RevokedDate, result.id);
                    return result;
                }
                else
                {
                    _logger.LogWarning("⚠️ Query executed but returned no results: UserId={UserId}, Type={ConsentType}", userId, consentType);
                }
            }
            else
            {
                _logger.LogWarning("⚠️ Query has no more results: UserId={UserId}, Type={ConsentType}", userId, consentType);
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ Failed to retrieve latest consent for UserId={UserId}, Type={ConsentType}",
                userId, consentType);
            throw;
        }
    }

    public async Task<bool> HasValidConsentAsync(
        string userId,
        string consentType,
        string requiredVersion,
        CancellationToken cancellationToken = default)
    {
        var consent = await GetLatestConsentAsync(userId, consentType, cancellationToken);
        
        if (consent == null || !consent.Granted || consent.RevokedDate != null)
        {
            return false;
        }

        // Check if version matches or is newer using proper semantic versioning
        try
        {
            var consentVer = Version.Parse(consent.ConsentVersion);
            var requiredVer = Version.Parse(requiredVersion);
            return consentVer >= requiredVer;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to parse version strings. ConsentVersion: {ConsentVersion}, RequiredVersion: {RequiredVersion}",
                consent.ConsentVersion, requiredVersion);
            return false;
        }
    }

    public async Task<List<UserConsent>> GetAllUserConsentsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.ConsentDate DESC")
                .WithParameter("@userId", userId);

            var queryRequestOptions = new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(userId) // Single-partition query for efficiency
            };

            var results = new List<UserConsent>();
            var iterator = _container.GetItemQueryIterator<UserConsent>(query, requestOptions: queryRequestOptions);

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);
                results.AddRange(response);
            }

            _logger.LogInformation("Retrieved {Count} consents for user {UserId}", results.Count, userId);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve consents for user {UserId}", userId);
            throw;
        }
    }

    public async Task RevokeConsentAsync(
        string userId,
        string consentType,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var latestConsent = await GetLatestConsentAsync(userId, consentType, cancellationToken);
            
            if (latestConsent == null)
            {
                _logger.LogWarning("No consent found to revoke for User {UserId}, Type {ConsentType}", userId, consentType);
                return;
            }

            latestConsent.RevokedDate = DateTime.UtcNow;

            await _container.ReplaceItemAsync(
                latestConsent,
                latestConsent.id,
                new PartitionKey(latestConsent.userId),
                cancellationToken: cancellationToken);

            _logger.LogInformation("Consent revoked: User {UserId}, Type {ConsentType}", userId, consentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to revoke consent for User {UserId}, Type {ConsentType}", userId, consentType);
            throw;
        }
    }
}
