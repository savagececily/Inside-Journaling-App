using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MentalHealthJournal.Models;
using User = MentalHealthJournal.Models.User;

namespace MentalHealthJournal.Services;

public class UserService : IUserService
{
    private readonly Container _usersContainer;
    private readonly ILogger<UserService> _logger;
    private readonly IAuditLogService? _auditLogService;

    public UserService(CosmosClient cosmosClient, ILogger<UserService> logger, IOptions<AppSettings> options, IAuditLogService? auditLogService = null)
    {
        var appSettings = options.Value;
        var database = cosmosClient.GetDatabase(appSettings.CosmosDb.DatabaseName);
        _usersContainer = database.GetContainer(appSettings.CosmosDb.UserContainer);
        _logger = logger;
        _auditLogService = auditLogService;
    }

    public async Task<User?> GetUserByProviderIdAsync(string providerId, string provider)
    {
        try
        {
            _logger.LogInformation("Looking up user by providerId={ProviderId}, provider={Provider}", providerId, provider);
            
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.providerId = @providerId AND c.provider = @provider")
                .WithParameter("@providerId", providerId)
                .WithParameter("@provider", provider);

            var iterator = _usersContainer.GetItemQueryIterator<User>(query);
            
            // Iterate through all pages to ensure we don't miss results
            while (iterator.HasMoreResults)
            {
                var results = await iterator.ReadNextAsync();
                var user = results.FirstOrDefault();
                
                if (user != null)
                {
                    _logger.LogInformation("✅ Found existing user: id={Id}, userId={UserId}, email={Email}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}", 
                        user.id, user.userId, user.Email, user.DateOfBirth, user.AgeVerified);
                    return user;
                }
            }
            
            _logger.LogInformation("No existing user found for providerId={ProviderId}", providerId);
            return null;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Cosmos DB error getting user by provider ID: providerId={ProviderId}, provider={Provider}, StatusCode={StatusCode}", 
                providerId, provider, ex.StatusCode);
            throw new InvalidOperationException($"Failed to retrieve user from database: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting user by provider ID: providerId={ProviderId}, provider={Provider}", providerId, provider);
            throw;
        }
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        try
        {
            _logger.LogInformation("🔍 GetUserByIdAsync: Looking up userId={UserId}", userId);
            
            var response = await _usersContainer.ReadItemAsync<User>(userId, new PartitionKey(userId));
            
            _logger.LogInformation("📦 RAW Cosmos Response: StatusCode={StatusCode}, ActivityId={ActivityId}", 
                response.StatusCode, response.ActivityId);
            
            if (response.Resource != null)
            {
                _logger.LogInformation("✅ User retrieved: id={Id}, userId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}, Email={Email}",
                    response.Resource.id, response.Resource.userId, response.Resource.DateOfBirth, response.Resource.AgeVerified, response.Resource.Email);
            }
            else
            {
                _logger.LogWarning("⚠️ Response.Resource is null for userId={UserId}", userId);
            }
            
            // Audit log
            if (_auditLogService != null && response.Resource != null)
            {
                await _auditLogService.LogActionAsync(
                    userId,
                    "Read",
                    "User",
                    userId,
                    successful: true);
            }
            
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("⚠️ User not found: userId={UserId}", userId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID: userId={UserId}", userId);
            return null;
        }
    }

    public async Task<User?> GetUserByStripeSubscriptionIdAsync(string stripeSubscriptionId)
    {
        try
        {
            _logger.LogInformation("Looking up user by StripeSubscriptionId={SubscriptionId}", stripeSubscriptionId);
            
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.StripeSubscriptionId = @subscriptionId")
                .WithParameter("@subscriptionId", stripeSubscriptionId);

            var iterator = _usersContainer.GetItemQueryIterator<User>(query);
            
            while (iterator.HasMoreResults)
            {
                var results = await iterator.ReadNextAsync();
                var user = results.FirstOrDefault();
                
                if (user != null)
                {
                    _logger.LogInformation("Found user with StripeSubscriptionId: userId={UserId}", user.userId);
                    return user;
                }
            }
            
            _logger.LogWarning("No user found with StripeSubscriptionId={SubscriptionId}", stripeSubscriptionId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by Stripe subscription ID: {SubscriptionId}", stripeSubscriptionId);
            throw;
        }
    }

    public async Task<User> CreateOrUpdateUserAsync(User user)
    {
        try
        {
            user.LastLoginAt = DateTime.UtcNow;
            
            // ALWAYS ensure id and userId are consistent
            // This fixes any historical data where id != userId
            if (user.id != user.userId)
            {
                _logger.LogWarning("Correcting user ID mismatch: id={OldId} -> userId={UserId} for provider={Provider}, providerId={ProviderId}", 
                    user.id, user.userId, user.Provider, user.ProviderId);
                user.id = user.userId;
            }
            
            _logger.LogInformation("💾 Upserting user: id={Id}, userId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}", 
                user.id, user.userId, user.DateOfBirth, user.AgeVerified);
            
            var response = await _usersContainer.UpsertItemAsync(user, new PartitionKey(user.userId));
            
            _logger.LogInformation("✅ User upserted successfully: id={Id}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}", 
                response.Resource.id, response.Resource.DateOfBirth, response.Resource.AgeVerified);
            
            // Audit log
            if (_auditLogService != null)
            {
                await _auditLogService.LogActionAsync(
                    user.userId,
                    "Update",
                    "User",
                    user.userId,
                    successful: true,
                    additionalDetails: "User login/profile update");
            }
            
            return response.Resource;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating/updating user: id={Id}, userId={UserId}", user.id, user.userId);
            throw;
        }
    }

    public async Task<bool> IsUsernameAvailableAsync(string username, string? currentUserId = null)
    {
        try
        {
            // NOTE: This performs a cross-partition query which can be expensive
            // For production, consider:
            // 1. Creating a secondary container with username as partition key
            // 2. Using Azure Cognitive Search for username lookups
            // 3. Caching username availability results
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE LOWER(c.username) = LOWER(@username)")
                .WithParameter("@username", username);

            var iterator = _usersContainer.GetItemQueryIterator<User>(query);
            var results = await iterator.ReadNextAsync();
            
            var existingUser = results.FirstOrDefault();
            
            // Username is available if no one has it, or if the current user has it
            return existingUser == null || existingUser.userId == currentUserId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking username availability");
            return false;
        }
    }
    
    public async Task DeleteUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Deleting user {UserId}", userId);
            
            await _usersContainer.DeleteItemAsync<User>(
                userId, 
                new PartitionKey(userId), 
                cancellationToken: cancellationToken);
            
            _logger.LogInformation("User {UserId} deleted successfully", userId);
            
            // Audit log
            if (_auditLogService != null)
            {
                await _auditLogService.LogActionAsync(
                    userId,
                    "Delete",
                    "User",
                    userId,
                    successful: true,
                    additionalDetails: "Account deletion",
                    cancellationToken: cancellationToken);
            }
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("User {UserId} not found for deletion", userId);
            throw new InvalidOperationException("User not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", userId);
            throw;
        }
    }
}
