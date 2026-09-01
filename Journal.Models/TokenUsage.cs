namespace Journal.Models
{
    /// <summary>
    /// Tracks AI token usage and costs per user for billing and monitoring
    /// </summary>
    public class TokenUsage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Model { get; set; } = string.Empty;
        public int InputTokens { get; set; }
        public int OutputTokens { get; set; }
        public int TotalTokens => InputTokens + OutputTokens;
        public decimal EstimatedCost { get; set; }
        public string Operation { get; set; } = string.Empty; // e.g., "affirmation", "crisis-detection", "sentiment"
        public string JournalEntryId { get; set; } = string.Empty;
    }
}
