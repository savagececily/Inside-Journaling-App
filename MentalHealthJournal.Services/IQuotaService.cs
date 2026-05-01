using MentalHealthJournal.Models;

namespace MentalHealthJournal.Services
{
    public interface IQuotaService
    {
        /// <summary>
        /// Get or create user quota record
        /// </summary>
        Task<UserQuota> GetUserQuotaAsync(string userId, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Check if user can create an AI-analyzed entry
        /// </summary>
        Task<(bool CanCreate, string? Reason)> CanCreateAIEntryAsync(string userId, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Check if user can create a voice entry
        /// </summary>
        Task<(bool CanCreate, string? Reason)> CanCreateVoiceEntryAsync(string userId, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Increment entry count for user
        /// </summary>
        Task IncrementEntryCountAsync(string userId, bool isVoice, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Upgrade user to premium tier
        /// </summary>
        Task UpgradeToPremiumAsync(string userId, DateTime? expiresAt = null, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Downgrade user to free tier
        /// </summary>
        Task DowngradeToFreeAsync(string userId, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Reset quota if new month
        /// </summary>
        Task ResetQuotaIfNeededAsync(string userId, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Record token usage for billing and monitoring
        /// </summary>
        Task RecordTokenUsageAsync(TokenUsage usage, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Get user's token usage for current month
        /// </summary>
        Task<List<TokenUsage>> GetMonthlyTokenUsageAsync(string userId, CancellationToken cancellationToken = default);
    }
}
