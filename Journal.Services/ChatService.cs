using Azure.AI.OpenAI;
using Journal.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI.Chat;

namespace Journal.Services
{
    public class ChatService : IChatService
    {
        private const int MaxMessagesPerSession = 500;

        private readonly AzureOpenAIClient _openAIClient;
        private readonly Container _chatContainer;
        private readonly ILogger<ChatService> _logger;
        private readonly string _deploymentName;

        private const string SystemPrompt = @"You are a compassionate and empathetic virtual mental health support companion for Inside Journaling App. Your role is to:

1. Listen actively and validate the user's feelings without judgment
2. Provide emotional support and encouragement
3. Help users reflect on their thoughts and emotions
4. Suggest healthy coping strategies and self-care practices
5. Recognize signs of crisis and provide appropriate resources

Important guidelines:
- You are NOT a replacement for professional therapy or medical advice
- Always encourage users to seek professional help for serious concerns
- If a user expresses thoughts of self-harm or suicide, provide crisis resources immediately
- Maintain a warm, supportive, and non-judgmental tone
- Ask open-ended questions to help users explore their feelings
- Validate emotions while gently challenging negative thought patterns
- Respect boundaries and user autonomy

Remember: Your goal is to provide support and encouragement, not to diagnose or treat mental health conditions.";

        public ChatService(
            AzureOpenAIClient openAIClient,
            CosmosClient cosmosClient,
            IOptions<AppSettings> options,
            ILogger<ChatService> logger,
            IConfiguration? configuration = null)
        {
            _openAIClient = openAIClient ?? throw new ArgumentNullException(nameof(openAIClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            var appSettings = options?.Value ?? new AppSettings();
            _deploymentName = !string.IsNullOrEmpty(appSettings.AzureOpenAI?.DeploymentName)
                ? appSettings.AzureOpenAI.DeploymentName
                : (configuration?["AzureOpenAI:DeploymentName"] ?? "gpt-4o-mini");

            var databaseName = !string.IsNullOrEmpty(appSettings.CosmosDb?.DatabaseName)
                ? appSettings.CosmosDb.DatabaseName
                : (configuration?["CosmosDb:DatabaseName"] ?? throw new InvalidOperationException("CosmosDb:DatabaseName is not configured"));

            var containerName = !string.IsNullOrEmpty(appSettings.CosmosDb?.ChatSessionContainer)
                ? appSettings.CosmosDb.ChatSessionContainer
                : (configuration?["CosmosDb:ChatSessionContainer"] ?? "ChatSessions");

            _chatContainer = cosmosClient.GetContainer(databaseName, containerName);
        }

        public async Task<ChatResponse> SendMessageAsync(string userId, ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }

            if (string.IsNullOrWhiteSpace(request?.Message))
            {
                throw new ArgumentException("Message cannot be null or empty", nameof(request));
            }

            try
            {
                // Crisis pre-screening
                bool isCrisis = CrisisKeywords.ContainsCrisisKeyword(request.Message);

                ChatSession session;
                var chatClient = _openAIClient.GetChatClient(_deploymentName);

                if (!string.IsNullOrEmpty(request.SessionId))
                {
                    session = await GetSessionAsync(userId, request.SessionId)
                        ?? throw new InvalidOperationException("Session not found");

                    if (session.Messages.Count >= MaxMessagesPerSession)
                    {
                        throw new InvalidOperationException($"This conversation has reached its maximum limit of {MaxMessagesPerSession} messages. Please start a new conversation.");
                    }
                }
                else
                {
                    var newSessionId = Guid.NewGuid().ToString();
                    var title = await GenerateSessionTitleAsync(chatClient, request.Message);
                    session = new ChatSession
                    {
                        id = newSessionId,
                        ChatSessionId = newSessionId,
                        UserId = userId,
                        Title = title
                    };
                }

                var userMessage = new Journal.Models.ChatMessage
                {
                    Role = "user",
                    Content = request.Message,
                    Timestamp = DateTime.UtcNow
                };
                session.Messages.Add(userMessage);

                var chatMessagesForContext = new List<Journal.Models.ChatMessage>
                {
                    new Journal.Models.ChatMessage { Role = "system", Content = SystemPrompt }
                };
                chatMessagesForContext.AddRange(session.Messages.TakeLast(10));

                var openAIMessages = new List<OpenAI.Chat.ChatMessage>();
                foreach (var m in chatMessagesForContext)
                {
                    if (m.Role == "user")
                    {
                        openAIMessages.Add(OpenAI.Chat.ChatMessage.CreateUserMessage(m.Content));
                    }
                    else if (m.Role == "assistant")
                    {
                        openAIMessages.Add(OpenAI.Chat.ChatMessage.CreateAssistantMessage(m.Content));
                    }
                    else
                    {
                        openAIMessages.Add(OpenAI.Chat.ChatMessage.CreateSystemMessage(m.Content));
                    }
                }

                var chatCompletion = await chatClient.CompleteChatAsync(openAIMessages);
                var assistantResponse = chatCompletion.Value.Content[0].Text;

                var assistantMessage = new Journal.Models.ChatMessage
                {
                    Role = "assistant",
                    Content = assistantResponse,
                    Timestamp = DateTime.UtcNow
                };
                session.Messages.Add(assistantMessage);
                session.LastMessageAt = DateTime.UtcNow;

                await _chatContainer.UpsertItemAsync(
                    session,
                    new PartitionKey(session.UserId)
                );

                _logger.LogInformation("Chat message processed for user {UserId} in session {SessionId}", userId, session.id);

                return new ChatResponse
                {
                    SessionId = session.id,
                    Message = assistantResponse,
                    Timestamp = assistantMessage.Timestamp,
                    IsCrisisDetected = isCrisis,
                    CrisisReason = isCrisis ? "Message contains phrases associated with crisis or distress." : null,
                    CrisisResources = isCrisis ? CrisisResources.GetDefaultResources() : null
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat message for user {UserId}", userId);
                throw;
            }
        }

        public async Task<ChatSession?> GetSessionAsync(string userId, string sessionId)
        {
            try
            {
                var response = await _chatContainer.ReadItemAsync<ChatSession>(
                    sessionId,
                    new PartitionKey(userId)
                );

                if (response.Resource.UserId != userId || !response.Resource.IsActive)
                {
                    return null;
                }

                return response.Resource;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        public async Task<List<ChatSession>> GetUserSessionsAsync(string userId)
        {
            try
            {
                var query = new QueryDefinition(
                    "SELECT c.id, c.chatSessionId, c.userId, c.title, c.createdAt, c.lastMessageAt, c.isActive FROM c WHERE c.userId = @userId AND c.isActive = true ORDER BY c.lastMessageAt DESC"
                ).WithParameter("@userId", userId);

                var queryOptions = new QueryRequestOptions
                {
                    PartitionKey = new PartitionKey(userId)
                };

                var sessions = new List<ChatSession>();
                using var feedIterator = _chatContainer.GetItemQueryIterator<ChatSession>(query, requestOptions: queryOptions);

                while (feedIterator.HasMoreResults)
                {
                    var response = await feedIterator.ReadNextAsync();
                    sessions.AddRange(response);
                }

                return sessions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving chat sessions for user {UserId}", userId);
                throw;
            }
        }

        public async Task DeleteSessionAsync(string userId, string sessionId)
        {
            try
            {
                var session = await GetSessionAsync(userId, sessionId);
                if (session != null)
                {
                    session.IsActive = false;
                    await _chatContainer.UpsertItemAsync(
                        session,
                        new PartitionKey(session.UserId)
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting chat session {SessionId} for user {UserId}", sessionId, userId);
                throw;
            }
        }

        public async Task DeleteAllUserSessionsAsync(string userId)
        {
            try
            {
                var query = new QueryDefinition(
                    "SELECT c.id FROM c WHERE c.userId = @userId"
                ).WithParameter("@userId", userId);

                var queryOptions = new QueryRequestOptions
                {
                    PartitionKey = new PartitionKey(userId)
                };

                using var iterator = _chatContainer.GetItemQueryIterator<ChatSession>(query, requestOptions: queryOptions);
                while (iterator.HasMoreResults)
                {
                    var response = await iterator.ReadNextAsync();
                    foreach (var session in response)
                    {
                        await _chatContainer.DeleteItemAsync<ChatSession>(
                            session.id,
                            new PartitionKey(userId)
                        );
                    }
                }

                _logger.LogInformation("Deleted all chat sessions for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all chat sessions for user {UserId}", userId);
                throw;
            }
        }

        private async Task<string> GenerateSessionTitleAsync(ChatClient chatClient, string firstMessage)
        {
            try
            {
                var messages = new List<OpenAI.Chat.ChatMessage>
                {
                    OpenAI.Chat.ChatMessage.CreateSystemMessage("Summarize the user's message into a short, empathetic 3 to 5 word title for a support chat session. Do not use quotes, punctuation, or emoji."),
                    OpenAI.Chat.ChatMessage.CreateUserMessage(firstMessage)
                };

                var options = new ChatCompletionOptions
                {
                    MaxOutputTokenCount = 25,
                    Temperature = 0.5f
                };

                var completion = await chatClient.CompleteChatAsync(messages, options);
                var generatedTitle = completion.Value.Content[0].Text.Trim().Trim('"', '\'', '.', ',');
                if (!string.IsNullOrWhiteSpace(generatedTitle))
                {
                    return generatedTitle.Length > 50 ? generatedTitle[..47] + "..." : generatedTitle;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate AI title for chat session - falling back to message snippet");
            }

            return FallbackGenerateSessionTitle(firstMessage);
        }

        private static string FallbackGenerateSessionTitle(string firstMessage)
        {
            var title = firstMessage.Length > 50
                ? firstMessage[..47] + "..."
                : firstMessage;
            return title;
        }
    }
}
