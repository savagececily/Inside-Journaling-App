namespace Journal.Models
{
    /// <summary>
    /// Represents a user's usage quota and subscription tier
    /// </summary>
    public class UserQuota
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public UserTier Tier { get; set; } = UserTier.Free;
        public int EntriesThisMonth { get; set; } = 0;
        public int VoiceEntriesThisMonth { get; set; } = 0;
        public int ChatMessagesThisMonth { get; set; } = 0;
        public DateTime LastReset { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PremiumExpiresAt { get; set; }
        
        /// <summary>
        /// Get active tier considering subscription expiration
        /// </summary>
        public UserTier EffectiveTier => (PremiumExpiresAt.HasValue && PremiumExpiresAt.Value <= DateTime.UtcNow)
            ? UserTier.Free
            : Tier;

        /// <summary>
        /// Get the AI analysis quota limit based on user tier
        /// </summary>
        public int AIAnalysisQuotaLimit => EffectiveTier switch
        {
            UserTier.Free => 50,
            UserTier.Premium => int.MaxValue,
            UserTier.Pro => int.MaxValue,
            _ => 50
        };
        
        /// <summary>
        /// Get the voice recording quota limit based on user tier
        /// </summary>
        public int VoiceQuotaLimit => EffectiveTier switch
        {
            UserTier.Free => 10,
            UserTier.Premium => int.MaxValue,
            UserTier.Pro => int.MaxValue,
            _ => 10
        };

        /// <summary>
        /// Get the Virtual Support chat message quota limit based on user tier
        /// </summary>
        public int ChatQuotaLimit => EffectiveTier switch
        {
            UserTier.Free => 15,
            UserTier.Premium => 250,
            UserTier.Pro => int.MaxValue,
            _ => 15
        };
        
        /// <summary>
        /// Check if user has exceeded their AI analysis quota
        /// </summary>
        public bool HasExceededAIQuota => EntriesThisMonth >= AIAnalysisQuotaLimit;
        
        /// <summary>
        /// Check if user has exceeded their voice quota
        /// </summary>
        public bool HasExceededVoiceQuota => VoiceEntriesThisMonth >= VoiceQuotaLimit;

        /// <summary>
        /// Check if user has exceeded their chat message quota
        /// </summary>
        public bool HasExceededChatQuota => ChatMessagesThisMonth >= ChatQuotaLimit;
        
        /// <summary>
        /// Check if this is an active paid subscription user (Premium or Pro)
        /// </summary>
        public bool IsPremiumActive => EffectiveTier == UserTier.Premium || EffectiveTier == UserTier.Pro;

        /// <summary>
        /// Check if this is an active Pro tier user
        /// </summary>
        public bool IsProActive => EffectiveTier == UserTier.Pro;
        
        /// <summary>
        /// Check if quota should be reset (new month)
        /// </summary>
        public bool ShouldResetQuota()
        {
            var now = DateTime.UtcNow;
            return now.Year != LastReset.Year || now.Month != LastReset.Month;
        }
        
        /// <summary>
        /// Reset monthly counters
        /// </summary>
        public void ResetMonthlyQuota()
        {
            EntriesThisMonth = 0;
            VoiceEntriesThisMonth = 0;
            ChatMessagesThisMonth = 0;
            LastReset = DateTime.UtcNow;
        }
    }
    
    /// <summary>
    /// User subscription tier
    /// </summary>
    public enum UserTier
    {
        Free = 0,
        Premium = 1,
        Pro = 2
    }
}
