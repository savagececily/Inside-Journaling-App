using MentalHealthJournal.Models;

namespace MentalHealthJournal.Services
{
    public interface IDataExportService
    {
        public Task<string> ExportToJsonAsync(string userId, CancellationToken cancellationToken = default);
        public Task<string> ExportToCsvAsync(string userId, CancellationToken cancellationToken = default);
    }
}
