using MentalHealthJournal.Models;

namespace MentalHealthJournal.Services;

public interface IUserService
{
    Task<User?> GetUserByProviderIdAsync(string providerId, string provider);
    Task<User?> GetUserByIdAsync(string userId);
    Task<User?> GetUserByStripeSubscriptionIdAsync(string stripeSubscriptionId);
    Task<User> CreateOrUpdateUserAsync(User user);
    Task<bool> IsUsernameAvailableAsync(string username, string? currentUserId = null);
    Task DeleteUserAsync(string userId, CancellationToken cancellationToken = default);
}
