using System.Text.Json.Serialization;

namespace Journal.Models
{
    public class ChatSession
    {
        [JsonPropertyName("id")]
        public string id { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("chatSessionId")]
        public string ChatSessionId { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("userId")]
        public string UserId { get; set; } = string.Empty; // Partition key for user session isolation

        [JsonPropertyName("messages")]
        public List<ChatMessage> Messages { get; set; } = new();

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("lastMessageAt")]
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("title")]
        public string Title { get; set; } = "New Conversation";

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; } = true;
    }
}
