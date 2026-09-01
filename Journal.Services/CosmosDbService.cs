using Journal.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Journal.Services
{
    public class CosmosDbService : ICosmosDbService
    {
        private readonly ILogger<CosmosDbService> _logger;
        private readonly CosmosClient _cosmosClient;
        private readonly AppSettings _appSettings;
        private readonly Container _container;
        private readonly IAuditLogService? _auditLogService;

        public CosmosDbService(ILogger<CosmosDbService> logger, CosmosClient cosmosClient, IOptions<AppSettings> options, IAuditLogService? auditLogService = null)
        {
            _logger = logger;
            _cosmosClient = cosmosClient;
            _appSettings = options.Value;
            _container = _cosmosClient.GetContainer(_appSettings.CosmosDb.DatabaseName, _appSettings.CosmosDb.JournalEntryContainer);
            _auditLogService = auditLogService;
        }

        public async Task SaveJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Saving journal entry for user {UserId}", journalEntry.userId);
               await _container.CreateItemAsync(journalEntry, new PartitionKey(journalEntry.journalEntryId), cancellationToken: cancellationToken);
                _logger.LogInformation("Journal entry saved successfully for user {UserId}", journalEntry.userId);
                
                // Audit log
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        journalEntry.userId,
                        "Create",
                        "JournalEntry",
                        journalEntry.id,
                        successful: true,
                        cancellationToken: cancellationToken);
                }
            }
            catch (CosmosException ex)
            {
                _logger.LogError(ex, "Cosmos DB error saving journal entry for user {UserId}. Status: {Status}", journalEntry.userId, ex.StatusCode);
                
                // Audit log failure
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        journalEntry.userId,
                        "Create",
                        "JournalEntry",
                        journalEntry.id,
                        successful: false,
                        errorMessage: ex.Message,
                        cancellationToken: cancellationToken);
                }
                
                throw new InvalidOperationException($"Failed to save journal entry: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving journal entry for user {UserId}", journalEntry.userId);
                throw;
            }
        }

        public async Task<List<JournalEntry>> GetEntriesForUserAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Retrieving journal entries for user {UserId}", userId);
                QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC")
                    .WithParameter("@userId", userId);

                var results = new List<JournalEntry>();

                var iterator = _container.GetItemQueryIterator<JournalEntry>(query);

                while (iterator.HasMoreResults)
                {
                    var response = await iterator.ReadNextAsync(cancellationToken);
                    results.AddRange(response);
                }

                _logger.LogInformation("Retrieved {Count} journal entries for user {UserId}", results.Count, userId);
                
                // Audit log
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        userId,
                        "Read",
                        "JournalEntry",
                        "All",
                        successful: true,
                        additionalDetails: $"Retrieved {results.Count} entries",
                        cancellationToken: cancellationToken);
                }
                
                return results;
            }
            catch (CosmosException ex)
            {
                _logger.LogError(ex, "Cosmos DB error retrieving journal entries for user {UserId}. Status: {Status}", userId, ex.StatusCode);
                throw new InvalidOperationException($"Failed to retrieve journal entries: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving journal entries for user {UserId}", userId);
                throw;
            }
        }

        public async Task<JournalEntry?> GetJournalEntryByIdAsync(string entryId, string journalEntryId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Retrieving journal entry {EntryId} with partition key {JournalEntryId}", entryId, journalEntryId);
                var response = await _container.ReadItemAsync<JournalEntry>(entryId, new PartitionKey(journalEntryId), cancellationToken: cancellationToken);
                return response.Resource;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Journal entry {EntryId} not found with partition key {JournalEntryId}", entryId, journalEntryId);
                return null;
            }
            catch (CosmosException ex)
            {
                _logger.LogError(ex, "Cosmos DB error retrieving journal entry {EntryId} with partition key {JournalEntryId}. Status: {Status}", entryId, journalEntryId, ex.StatusCode);
                throw new InvalidOperationException($"Failed to retrieve journal entry: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving journal entry {EntryId} with partition key {JournalEntryId}", entryId, journalEntryId);
                throw;
            }
        }

        public async Task<JournalEntry> UpdateJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Updating journal entry {EntryId} for user {UserId}", journalEntry.id, journalEntry.userId);
                var response = await _container.ReplaceItemAsync(journalEntry, journalEntry.id, new PartitionKey(journalEntry.journalEntryId), cancellationToken: cancellationToken);
                _logger.LogInformation("Journal entry {EntryId} updated successfully for user {UserId}", journalEntry.id, journalEntry.userId);
                
                // Audit log
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        journalEntry.userId,
                        "Update",
                        "JournalEntry",
                        journalEntry.id,
                        successful: true,
                        cancellationToken: cancellationToken);
                }
                
                return response.Resource;
            }
            catch (CosmosException ex)
            {
                _logger.LogError(ex, "Cosmos DB error updating journal entry {EntryId} for user {UserId}. Status: {Status}", journalEntry.id, journalEntry.userId, ex.StatusCode);
                
                // Audit log failure
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        journalEntry.userId,
                        "Update",
                        "JournalEntry",
                        journalEntry.id,
                        successful: false,
                        errorMessage: ex.Message,
                        cancellationToken: cancellationToken);
                }
                
                throw new InvalidOperationException($"Failed to update journal entry: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating journal entry {EntryId} for user {UserId}", journalEntry.id, journalEntry.userId);
                throw;
            }
        }

        public async Task DeleteJournalEntryAsync(string entryId, string journalEntryId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Deleting journal entry {EntryId} with partition key {JournalEntryId}", entryId, journalEntryId);
                
                // Get the entry first to extract userId for audit log
                var entry = await _container.ReadItemAsync<JournalEntry>(entryId, new PartitionKey(journalEntryId), cancellationToken: cancellationToken);
                var userId = entry.Resource.userId;
                
                await _container.DeleteItemAsync<JournalEntry>(entryId, new PartitionKey(journalEntryId), cancellationToken: cancellationToken);
                _logger.LogInformation("Journal entry {EntryId} deleted successfully with partition key {JournalEntryId}", entryId, journalEntryId);
                
                // Audit log
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        userId,
                        "Delete",
                        "JournalEntry",
                        entryId,
                        successful: true,
                        cancellationToken: cancellationToken);
                }
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Journal entry {EntryId} not found for deletion with partition key {JournalEntryId}", entryId, journalEntryId);
                throw new InvalidOperationException("Journal entry not found");
            }
            catch (CosmosException ex)
            {
                _logger.LogError(ex, "Cosmos DB error deleting journal entry {EntryId} with partition key {JournalEntryId}. Status: {Status}", entryId, journalEntryId, ex.StatusCode);
                throw new InvalidOperationException($"Failed to delete journal entry: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting journal entry {EntryId} with partition key {JournalEntryId}", entryId, journalEntryId);
                throw;
            }
        }

        public async Task<List<JournalEntry>> GetEntriesForUserByDateRangeAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Retrieving journal entries for user {UserId} between {StartDate} and {EndDate}", userId, startDate, endDate);
                
                // Convert to UTC if not already
                var utcStart = startDate.ToUniversalTime();
                var utcEnd = endDate.ToUniversalTime();
                
                QueryDefinition query = new QueryDefinition(
                    "SELECT * FROM c WHERE c.userId = @userId AND c.Timestamp >= @startDate AND c.Timestamp <= @endDate ORDER BY c.Timestamp DESC")
                    .WithParameter("@userId", userId)
                    .WithParameter("@startDate", utcStart)
                    .WithParameter("@endDate", utcEnd);

                var results = new List<JournalEntry>();

                var iterator = _container.GetItemQueryIterator<JournalEntry>(query);

                while (iterator.HasMoreResults)
                {
                    var response = await iterator.ReadNextAsync(cancellationToken);
                    results.AddRange(response);
                }

                _logger.LogInformation("Retrieved {Count} journal entries for user {UserId} in date range", results.Count, userId);
                return results;
            }
            catch (CosmosException ex)
            {
                _logger.LogError(ex, "Cosmos DB error retrieving journal entries for user {UserId} by date range. Status: {Status}", userId, ex.StatusCode);
                throw new InvalidOperationException($"Failed to retrieve journal entries by date range: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving journal entries for user {UserId} by date range", userId);
                throw;
            }
        }
        
        public async Task<int> DeleteAllUserEntriesAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Deleting all journal entries for user {UserId}", userId);
                
                // Get all entries for the user
                var entries = await GetEntriesForUserAsync(userId, cancellationToken);
                int deletedCount = 0;

                // Delete entries in parallel with controlled concurrency to improve performance
                // while avoiding excessive RU consumption and preserving best-effort semantics.
                var deleteTasks = new List<Task>();
                var concurrencySemaphore = new System.Threading.SemaphoreSlim(5); // limit concurrent deletes
                
                foreach (var entry in entries)
                {
                    await concurrencySemaphore.WaitAsync(cancellationToken);

                    var deleteTask = Task.Run(async () =>
                    {
                        try
                        {
                            await _container.DeleteItemAsync<JournalEntry>(
                                entry.id,
                                new PartitionKey(entry.journalEntryId),
                                cancellationToken: cancellationToken);
                            
                            System.Threading.Interlocked.Increment(ref deletedCount);
                        }
                        finally
                        {
                            concurrencySemaphore.Release();
                        }
                    }, cancellationToken);

                    deleteTasks.Add(deleteTask);
                }

                await Task.WhenAll(deleteTasks);
                
                _logger.LogInformation("Deleted {Count} journal entries for user {UserId}", deletedCount, userId);
                
                // Audit log
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        userId,
                        "Delete",
                        "JournalEntry",
                        "All",
                        successful: true,
                        additionalDetails: $"Deleted {deletedCount} entries during account deletion",
                        cancellationToken: cancellationToken);
                }
                
                return deletedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all journal entries for user {UserId}", userId);
                throw;
            }
        }
    }
}
