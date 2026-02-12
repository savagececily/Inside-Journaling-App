namespace MentalHealthJournal.Models;

public class UserConsent
{
    public string id { get; set; } = Guid.NewGuid().ToString();
    public string userConsentId { get; set; } = string.Empty; // partition key
    public string UserId { get; set; } = string.Empty;
    public string ConsentType { get; set; } = string.Empty; // TermsOfService, PrivacyPolicy, DataProcessing, AIAnalysis
    public string ConsentVersion { get; set; } = string.Empty; // e.g., "1.0", "2.0"
    public bool Granted { get; set; } = false;
    public DateTime ConsentDate { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedDate { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
