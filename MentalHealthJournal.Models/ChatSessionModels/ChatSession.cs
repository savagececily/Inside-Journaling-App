namespace MentalHealthJournal.Models
{
    public class ChatSession
    {
        public string id { get; set; } = Guid.NewGuid().ToString();
        public string ChatSessionId { get; set; } = Guid.NewGuid().ToString(); // Partition key
        public string UserId { get; set; } = string.Empty; // Used to query user's sessions
        public List<ChatMessage> Messages { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
        public string Title { get; set; } = "New Conversation";
        public bool IsActive { get; set; } = true;
    }
}
