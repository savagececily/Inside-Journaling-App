namespace MentalHealthJournal.Models;

public class User
{
    public string id { get; set; } = string.Empty; // Cosmos DB document ID
    public string userId { get; set; } = string.Empty; // Partition key
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Username { get; set; } // Custom username set by user
    public string? ProfilePictureUrl { get; set; }
    public string Provider { get; set; } = "google"; // google, facebook, microsoft, etc.
    public string ProviderId { get; set; } = string.Empty; // The ID from the provider
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
    public DateTime? DateOfBirth { get; set; } // For age verification (13+ required)
    public bool AgeVerified { get; set; } = false; // Confirmed age meets minimum requirement
    public int CurrentStreak { get; set; } = 0; // Number of consecutive days with entries
    public int LongestStreak { get; set; } = 0; // Best streak ever achieved
    public DateTime? LastStreakUpdateDate { get; set; } // Date of last streak calculation (UTC date only)
    
    // Stripe payment fields
    public string? StripeCustomerId { get; set; } // Stripe customer ID for billing portal access
    public string? StripeSubscriptionId { get; set; } // Stripe subscription ID for status tracking
}
