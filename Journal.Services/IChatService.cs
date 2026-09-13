using Journal.Models;

namespace Journal.Services
{
    public interface IChatService
    {
        Task<ChatResponse> SendMessageAsync(string userId, ChatRequest request);
        Task<ChatSession?> GetSessionAsync(string userId, string sessionId);
        Task<List<ChatSession>> GetUserSessionsAsync(string userId);
        Task DeleteSessionAsync(string userId, string sessionId);
        Task DeleteAllUserSessionsAsync(string userId);
    }
}
