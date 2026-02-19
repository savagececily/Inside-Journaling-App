using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MentalHealthJournal.Models;
using System.Security.Cryptography;
using System.Text;
using User = MentalHealthJournal.Models.User;

namespace MentalHealthJournal.Services;

public class AccountDeletionService : IAccountDeletionService
{
    private readonly Container _usersContainer;
    private readonly Container _journalEntriesContainer;
    private readonly Container _deletionTokensContainer;
    private readonly ILogger<AccountDeletionService> _logger;
    private readonly IBlobStorageService _blobService;

    public AccountDeletionService(
        CosmosClient cosmosClient,
        ILogger<AccountDeletionService> logger,
        IOptions<AppSettings> options,
        IBlobStorageService blobService)
    {
        var appSettings = options.Value;
        var database = cosmosClient.GetDatabase(appSettings.CosmosDb.DatabaseName);
        _usersContainer = database.GetContainer(appSettings.CosmosDb.UserContainer);
        _journalEntriesContainer = database.GetContainer(appSettings.CosmosDb.JournalEntryContainer);
        _deletionTokensContainer = database.GetContainer(appSettings.CosmosDb.DeletionTokensContainer);
        _logger = logger;
        _blobService = blobService;
    }

    public async Task<AccountDeletionToken> RequestAccountDeletionAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Creating account deletion request for user {UserId}", userId);

            // Generate a secure random token
            var token = GenerateSecureToken();

            var deletionToken = new AccountDeletionToken
            {
                id = Guid.NewGuid().ToString(),
                userId = userId,
                Token = token,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24), // 24-hour grace period
                IsUsed = false
            };

            await _deletionTokensContainer.CreateItemAsync(deletionToken, new PartitionKey(userId), cancellationToken: cancellationToken);

            _logger.LogInformation("Account deletion token created for user {UserId}, expires at {ExpiresAt}", userId, deletionToken.ExpiresAt);

            return deletionToken;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Cosmos DB error creating deletion token for user {UserId}. Status: {Status}", userId, ex.StatusCode);
            throw new InvalidOperationException($"Failed to create deletion token: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating deletion token for user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> ValidateConfirmationTokenAsync(string userId, string token, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Validating confirmation token for user {UserId}", userId);

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userId = @userId AND c.Token = @token AND c.IsUsed = false")
                .WithParameter("@userId", userId)
                .WithParameter("@token", token);

            var iterator = _deletionTokensContainer.GetItemQueryIterator<AccountDeletionToken>(query);
            var results = await iterator.ReadNextAsync(cancellationToken);

            var deletionToken = results.FirstOrDefault();

            if (deletionToken == null)
            {
                _logger.LogWarning("Invalid or already used deletion token for user {UserId}", userId);
                return false;
            }

            if (deletionToken.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogWarning("Expired deletion token for user {UserId}", userId);
                return false;
            }

            // Mark token as used
            deletionToken.IsUsed = true;
            await _deletionTokensContainer.UpsertItemAsync(deletionToken, new PartitionKey(userId), cancellationToken: cancellationToken);

            _logger.LogInformation("Deletion token validated successfully for user {UserId}", userId);
            return true;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Cosmos DB error validating deletion token for user {UserId}. Status: {Status}", userId, ex.StatusCode);
            throw new InvalidOperationException($"Failed to validate deletion token: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating deletion token for user {UserId}", userId);
            throw;
        }
    }

    public async Task DeleteAllUserDataAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting complete data deletion for user {UserId}", userId);

            // 1. Delete all journal entries
            var journalDeleteCount = await DeleteAllJournalEntriesAsync(userId, cancellationToken);
            _logger.LogInformation("Deleted {Count} journal entries for user {UserId}", journalDeleteCount, userId);

            // 2. Delete all audio files from blob storage
            await DeleteAllAudioFilesAsync(userId, cancellationToken);
            _logger.LogInformation("Deleted all audio files for user {UserId}", userId);

            // 3. Delete the user record
            await DeleteUserRecordAsync(userId, cancellationToken);
            _logger.LogInformation("Deleted user record for user {UserId}", userId);

            // 4. Delete all deletion tokens for this user
            await DeleteAllDeletionTokensAsync(userId, cancellationToken);
            _logger.LogInformation("Deleted deletion tokens for user {UserId}", userId);

            _logger.LogInformation("Complete data deletion finished for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during data deletion for user {UserId}", userId);
            throw;
        }
    }

    private async Task<int> DeleteAllJournalEntriesAsync(string userId, CancellationToken cancellationToken)
    {
        try
        {
            var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId")
                .WithParameter("@userId", userId);

            var iterator = _journalEntriesContainer.GetItemQueryIterator<JournalEntry>(query);
            int count = 0;

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);

                foreach (var entry in response)
                {
                    await _journalEntriesContainer.DeleteItemAsync<JournalEntry>(
                        entry.id,
                        new PartitionKey(entry.journalEntryId),
                        cancellationToken: cancellationToken);
                    count++;
                }
            }

            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting journal entries for user {UserId}", userId);
            throw;
        }
    }

    private async Task DeleteAllAudioFilesAsync(string userId, CancellationToken cancellationToken)
    {
        try
        {
            // Get all journal entries with audio files
            var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId AND c.IsVoiceEntry = true")
                .WithParameter("@userId", userId);

            var iterator = _journalEntriesContainer.GetItemQueryIterator<JournalEntry>(query);

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);

                foreach (var entry in response)
                {
                    if (!string.IsNullOrEmpty(entry.AudioBlobUrl))
                    {
                        try
                        {
                            await _blobService.DeleteAudioAsync(entry.AudioBlobUrl, cancellationToken);
                        }
                        catch (Exception ex)
                        {
                            // Log but don't fail the entire deletion if a single blob fails
                            _logger.LogWarning(ex, "Failed to delete audio blob {BlobUrl} for user {UserId}", entry.AudioBlobUrl, userId);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting audio files for user {UserId}", userId);
            throw;
        }
    }

    private async Task DeleteUserRecordAsync(string userId, CancellationToken cancellationToken)
    {
        try
        {
            await _usersContainer.DeleteItemAsync<User>(userId, new PartitionKey(userId), cancellationToken: cancellationToken);
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("User record {UserId} not found during deletion", userId);
            // Don't throw - user might have been deleted already
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user record for user {UserId}", userId);
            throw;
        }
    }

    private async Task DeleteAllDeletionTokensAsync(string userId, CancellationToken cancellationToken)
    {
        try
        {
            var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId")
                .WithParameter("@userId", userId);

            var iterator = _deletionTokensContainer.GetItemQueryIterator<AccountDeletionToken>(query);

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync(cancellationToken);

                foreach (var token in response)
                {
                    try
                    {
                        await _deletionTokensContainer.DeleteItemAsync<AccountDeletionToken>(
                            token.id,
                            new PartitionKey(userId),
                            cancellationToken: cancellationToken);
                    }
                    catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        // Token might have been deleted already, continue
                        _logger.LogWarning("Deletion token {TokenId} not found for user {UserId}", token.id, userId);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting deletion tokens for user {UserId}", userId);
            // Don't throw - this is cleanup, not critical
        }
    }

    private string GenerateSecureToken()
    {
        // Generate a 32-byte random token and convert to base64
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
