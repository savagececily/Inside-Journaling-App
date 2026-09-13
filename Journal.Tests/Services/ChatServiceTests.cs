using Journal.Models;
using Journal.Services;
using Azure.AI.OpenAI;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Journal.Tests.Services
{
    public class ChatServiceTests
    {
        private readonly Mock<ILogger<ChatService>> _loggerMock;
        private readonly Mock<AzureOpenAIClient> _openAIClientMock;
        private readonly Mock<CosmosClient> _cosmosClientMock;
        private readonly Mock<Container> _containerMock;
        private readonly IOptions<AppSettings> _options;
        private const string TestUserId = "test-user-123";

        public ChatServiceTests()
        {
            _loggerMock = new Mock<ILogger<ChatService>>();
            _openAIClientMock = new Mock<AzureOpenAIClient>();
            _cosmosClientMock = new Mock<CosmosClient>();
            _containerMock = new Mock<Container>();

            var settings = new AppSettings
            {
                AzureOpenAI = new AzureOpenAISettings
                {
                    DeploymentName = "gpt-4o-mini"
                },
                CosmosDb = new CosmosDbSettings
                {
                    DatabaseName = "TestDb",
                    ChatSessionContainer = "ChatSessions"
                }
            };
            _options = Options.Create(settings);

            _cosmosClientMock.Setup(c => c.GetContainer(
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(_containerMock.Object);
        }

        private ChatService CreateService()
        {
            return new ChatService(
                _openAIClientMock.Object,
                _cosmosClientMock.Object,
                _options,
                _loggerMock.Object);
        }

        [Fact]
        public void Constructor_InitializesSuccessfully()
        {
            var service = CreateService();
            Assert.NotNull(service);
        }

        [Fact]
        public async Task SendMessageAsync_WithEmptyMessage_ThrowsArgumentException()
        {
            var service = CreateService();
            var request = new ChatRequest
            {
                Message = ""
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                service.SendMessageAsync(TestUserId, request));
        }

        [Fact]
        public async Task SendMessageAsync_WithNullUserId_ThrowsArgumentException()
        {
            var service = CreateService();
            var request = new ChatRequest
            {
                Message = "Hello"
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                service.SendMessageAsync(null!, request));
        }

        [Fact]
        public async Task SendMessageAsync_WithEmptyUserId_ThrowsArgumentException()
        {
            var service = CreateService();
            var request = new ChatRequest
            {
                Message = "Hello"
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                service.SendMessageAsync("", request));
        }

        [Fact]
        public async Task SendMessageAsync_WithInvalidSessionId_ThrowsInvalidOperationException()
        {
            var service = CreateService();
            var request = new ChatRequest
            {
                Message = "Hello",
                SessionId = "non-existent-session"
            };

            _containerMock.Setup(c => c.ReadItemAsync<ChatSession>(
                It.IsAny<string>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()))
                .ThrowsAsync(new CosmosException("Not found", System.Net.HttpStatusCode.NotFound, 0, "", 0));

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.SendMessageAsync(TestUserId, request));
        }

        [Fact]
        public async Task SendMessageAsync_WhenSessionReachesMaxMessages_ThrowsInvalidOperationException()
        {
            var service = CreateService();
            var session = new ChatSession
            {
                id = "full-session",
                ChatSessionId = "full-session",
                UserId = TestUserId,
                Messages = Enumerable.Range(1, 500)
                    .Select(i => new Journal.Models.ChatMessage { Role = "user", Content = $"Message {i}" })
                    .ToList()
            };

            var itemResponseMock = new Mock<ItemResponse<ChatSession>>();
            itemResponseMock.Setup(r => r.Resource).Returns(session);

            _containerMock.Setup(c => c.ReadItemAsync<ChatSession>(
                "full-session",
                new PartitionKey(TestUserId),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(itemResponseMock.Object);

            var request = new ChatRequest
            {
                Message = "Hello again",
                SessionId = "full-session"
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.SendMessageAsync(TestUserId, request));

            Assert.Contains("maximum limit", ex.Message);
        }

        [Fact]
        public async Task GetSessionAsync_WhenSessionBelongsToAnotherUser_ReturnsNull()
        {
            var service = CreateService();
            var session = new ChatSession
            {
                id = "session-1",
                ChatSessionId = "session-1",
                UserId = "other-user"
            };

            var itemResponseMock = new Mock<ItemResponse<ChatSession>>();
            itemResponseMock.Setup(r => r.Resource).Returns(session);

            _containerMock.Setup(c => c.ReadItemAsync<ChatSession>(
                "session-1",
                new PartitionKey(TestUserId),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(itemResponseMock.Object);

            var result = await service.GetSessionAsync(TestUserId, "session-1");

            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteSessionAsync_WhenSessionExists_SetsIsActiveFalse()
        {
            var service = CreateService();
            var session = new ChatSession
            {
                id = "session-1",
                ChatSessionId = "session-1",
                UserId = TestUserId,
                IsActive = true
            };

            var itemResponseMock = new Mock<ItemResponse<ChatSession>>();
            itemResponseMock.Setup(r => r.Resource).Returns(session);

            _containerMock.Setup(c => c.ReadItemAsync<ChatSession>(
                "session-1",
                new PartitionKey(TestUserId),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(itemResponseMock.Object);

            await service.DeleteSessionAsync(TestUserId, "session-1");

            _containerMock.Verify(c => c.UpsertItemAsync(
                It.Is<ChatSession>(s => s.id == "session-1" && !s.IsActive),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
