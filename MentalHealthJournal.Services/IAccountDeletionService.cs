using MentalHealthJournal.Models;

namespace MentalHealthJournal.Services;

public interface IAccountDeletionService
{
    Task<AccountDeletionToken> RequestAccountDeletionAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateConfirmationTokenAsync(string userId, string token, CancellationToken cancellationToken = default);
    Task DeleteAllUserDataAsync(string userId, CancellationToken cancellationToken = default);
}
