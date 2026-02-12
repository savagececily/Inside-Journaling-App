using MentalHealthJournal.Models;

namespace MentalHealthJournal.Services;

public interface IUserService
{
    public Task<User?> GetUserByProviderIdAsync(string providerId, string provider);
    public Task<User?> GetUserByIdAsync(string userId);
    public Task<User> CreateOrUpdateUserAsync(User user);
    public Task<bool> IsUsernameAvailableAsync(string username, string? currentUserId = null);
    public Task DeleteUserAsync(string userId, CancellationToken cancellationToken = default);
}
