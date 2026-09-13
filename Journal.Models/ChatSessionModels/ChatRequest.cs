using System.Text.Json.Serialization;

namespace Journal.Models
{
    public class ChatRequest
    {
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("sessionId")]
        public string? SessionId { get; set; }
    }
}
