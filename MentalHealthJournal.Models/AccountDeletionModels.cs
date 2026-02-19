namespace MentalHealthJournal.Models;

public class RequestAccountDeletionRequest
{
    public string Password { get; set; } = string.Empty;
}

public class ConfirmAccountDeletionRequest
{
    public string ConfirmationToken { get; set; } = string.Empty;
}

public class AccountDeletionToken
{
    public string id { get; set; } = string.Empty; // Cosmos DB document ID
    public string userId { get; set; } = string.Empty; // Partition key - same as userId
    public string Token { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
    public bool IsUsed { get; set; } = false;
}

public class RequestAccountDeletionResponse
{
    public string Message { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string ConfirmationToken { get; set; } = string.Empty;
}
