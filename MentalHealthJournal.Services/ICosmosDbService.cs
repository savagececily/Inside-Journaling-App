using MentalHealthJournal.Models;

namespace MentalHealthJournal.Services
{
    public interface ICosmosDbService
    {
        public Task SaveJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken = default);
        public Task<List<JournalEntry>> GetEntriesForUserAsync(string userId, CancellationToken cancellationToken = default);
        public Task<JournalEntry?> GetJournalEntryByIdAsync(string entryId, string journalEntryId, CancellationToken cancellationToken = default);
        public Task<JournalEntry> UpdateJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken = default);
        public Task DeleteJournalEntryAsync(string entryId, string journalEntryId, CancellationToken cancellationToken = default);
        public Task<List<JournalEntry>> GetEntriesForUserByDateRangeAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
        public Task<int> DeleteAllUserEntriesAsync(string userId, CancellationToken cancellationToken = default);
    }
}
