namespace MentalHealthJournal.Models;

public class AuditLog
{
    public string id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty; // partition key - all audit logs for a user in same partition
    public string Action { get; set; } = string.Empty; // Read, Create, Update, Delete, Export, Login, Logout
    public string ResourceType { get; set; } = string.Empty; // JournalEntry, User, AudioFile, etc.
    public string ResourceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool Successful { get; set; } = true;
    public string? ErrorMessage { get; set; }
    public string? AdditionalDetails { get; set; }
}
