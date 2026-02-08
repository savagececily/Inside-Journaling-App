using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using MentalHealthJournal.Models;
using User = MentalHealthJournal.Models.User;

namespace MentalHealthJournal.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly Container _usersContainer;
    private readonly Container _journalEntriesContainer;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        CosmosClient cosmosClient,
        ILogger<AdminController> logger,
        IOptions<AppSettings> options)
    {
        var appSettings = options.Value;
        var database = cosmosClient.GetDatabase(appSettings.CosmosDb.DatabaseName);
        _usersContainer = database.GetContainer(appSettings.CosmosDb.UserContainer);
        _journalEntriesContainer = database.GetContainer(appSettings.CosmosDb.JournalEntryContainer);
        _logger = logger;
    }

    [HttpPost("cleanup-duplicate-users")]
    [AllowAnonymous]
    public async Task<ActionResult> CleanupDuplicateUsers([FromQuery] bool dryRun = true)
    {
        try
        {
            _logger.LogInformation("Starting duplicate user cleanup (dryRun={DryRun})", dryRun);

            // Step 1: Find all users
            var allUsers = await GetAllUsersAsync();
            _logger.LogInformation("Total users found: {Count}", allUsers.Count);

            // Step 2: Group by ProviderId + Provider
            var userGroups = allUsers
                .Where(u => !string.IsNullOrEmpty(u.ProviderId))
                .GroupBy(u => new { u.ProviderId, u.Provider })
                .Where(g => g.Count() > 1)
                .ToList();

            if (userGroups.Count == 0)
            {
                _logger.LogInformation("No duplicate users found");
                return Ok(new
                {
                    message = "No duplicate users found. Database is clean!",
                    duplicateGroups = 0,
                    dryRun
                });
            }

            var results = new List<object>();
            int totalDuplicates = 0;
            int totalEntriesMigrated = 0;

            foreach (var group in userGroups)
            {
                var duplicates = group.OrderBy(u => u.CreatedAt).ToList();
                totalDuplicates += duplicates.Count - 1;

                // The primary user is the oldest one
                var primaryUser = duplicates.First();
                var duplicateUsers = duplicates.Skip(1).ToList();

                var groupResult = new
                {
                    email = primaryUser.Email,
                    provider = primaryUser.Provider,
                    primaryUserId = primaryUser.userId,
                    primaryUserCreated = primaryUser.CreatedAt,
                    duplicateCount = duplicateUsers.Count,
                    duplicates = new List<object>()
                };

                foreach (var duplicate in duplicateUsers)
                {
                    // Migrate journal entries
                    var entriesCount = await MigrateJournalEntriesAsync(duplicate.userId, primaryUser.userId, dryRun);
                    totalEntriesMigrated += entriesCount;

                    // Merge streak data (keep the highest)
                    if (duplicate.CurrentStreak > primaryUser.CurrentStreak)
                    {
                        _logger.LogInformation("Updating streak for {Email}: {Old} -> {New}",
                            primaryUser.Email, primaryUser.CurrentStreak, duplicate.CurrentStreak);
                        if (!dryRun)
                        {
                            primaryUser.CurrentStreak = duplicate.CurrentStreak;
                            primaryUser.LastStreakUpdateDate = duplicate.LastStreakUpdateDate;
                        }
                    }
                    if (duplicate.LongestStreak > primaryUser.LongestStreak)
                    {
                        _logger.LogInformation("Updating longest streak for {Email}: {Old} -> {New}",
                            primaryUser.Email, primaryUser.LongestStreak, duplicate.LongestStreak);
                        if (!dryRun)
                        {
                            primaryUser.LongestStreak = duplicate.LongestStreak;
                        }
                    }

                    ((List<object>)groupResult.duplicates).Add(new
                    {
                        userId = duplicate.userId,
                        created = duplicate.CreatedAt,
                        entriesMigrated = entriesCount
                    });

                    // Delete duplicate user
                    if (!dryRun)
                    {
                        await _usersContainer.DeleteItemAsync<User>(duplicate.id, new PartitionKey(duplicate.userId));
                        _logger.LogInformation("Deleted duplicate user: {UserId}", duplicate.userId);
                    }
                }

                // Update primary user with merged data
                if (!dryRun)
                {
                    await _usersContainer.UpsertItemAsync(primaryUser, new PartitionKey(primaryUser.userId));
                    _logger.LogInformation("Updated primary user with merged data: {UserId}", primaryUser.userId);
                }

                results.Add(groupResult);
            }

            var summary = new
            {
                message = dryRun ? "Dry run completed. No changes were made." : "Cleanup completed successfully!",
                dryRun,
                duplicateUsersFound = totalDuplicates,
                journalEntriesMigrated = totalEntriesMigrated,
                duplicateGroups = results
            };

            _logger.LogInformation("Cleanup complete: {Duplicates} duplicates, {Entries} entries migrated",
                totalDuplicates, totalEntriesMigrated);

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during duplicate user cleanup");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private async Task<List<User>> GetAllUsersAsync()
    {
        var users = new List<User>();
        var query = new QueryDefinition("SELECT * FROM c");
        var iterator = _usersContainer.GetItemQueryIterator<User>(query);

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            users.AddRange(response);
        }

        return users;
    }

    private async Task<int> MigrateJournalEntriesAsync(string oldUserId, string newUserId, bool dryRun)
    {
        try
        {
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userId = @oldUserId")
                .WithParameter("@oldUserId", oldUserId);

            var iterator = _journalEntriesContainer.GetItemQueryIterator<JournalEntry>(query);
            int count = 0;

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();

                foreach (var entry in response)
                {
                    count++;

                    if (!dryRun)
                    {
                        // Delete from old partition (using journalEntryId as partition key)
                        await _journalEntriesContainer.DeleteItemAsync<JournalEntry>(
                            entry.id,
                            new PartitionKey(entry.journalEntryId));

                        // Update userId and insert into new partition (journalEntryId stays the same)
                        entry.userId = newUserId;
                        await _journalEntriesContainer.CreateItemAsync(
                            entry,
                            new PartitionKey(entry.journalEntryId));
                    }
                }
            }

            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error migrating journal entries from {OldUserId} to {NewUserId}",
                oldUserId, newUserId);
            return 0;
        }
    }
}
