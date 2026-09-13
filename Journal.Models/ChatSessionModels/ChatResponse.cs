using System.Text.Json.Serialization;

namespace Journal.Models
{
    public class ChatResponse
    {
        [JsonPropertyName("sessionId")]
        public string SessionId { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("isCrisisDetected")]
        public bool IsCrisisDetected { get; set; } = false;

        [JsonPropertyName("crisisReason")]
        public string? CrisisReason { get; set; }

        [JsonPropertyName("crisisResources")]
        public List<CrisisResource>? CrisisResources { get; set; }
    }
}
