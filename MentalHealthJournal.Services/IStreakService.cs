using MentalHealthJournal.Models;

namespace MentalHealthJournal.Services
{
    public interface IStreakService
    {
        /// <summary>
        /// Calculate the current and longest streak for a user based on their journal entries
        /// </summary>
        /// <param name="userId">The user ID</param>
        /// <param name="timezoneOffsetMinutes">The user's timezone offset from UTC in minutes (e.g., -480 for PST/UTC-8)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        Task<(int currentStreak, int longestStreak)> CalculateStreaksAsync(string userId, int timezoneOffsetMinutes = 0, CancellationToken cancellationToken = default);
        
        /// <summary>
        /// Update the user's streak information after a new entry is created or deleted
        /// </summary>
        Task UpdateUserStreakAsync(string userId, CancellationToken cancellationToken = default);
    }
}
