using Journal.Models;
using Journal.Services;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Journal.Tests.Services
{
    public class QuotaServiceTests
    {
        private readonly Mock<ICosmosDbService> _cosmosDbServiceMock;
        private readonly Mock<ILogger<QuotaService>> _loggerMock;
        private readonly Mock<CosmosClient> _cosmosClientMock;
        private readonly Mock<Database> _databaseMock;
        private readonly Mock<Container> _quotaContainerMock;
        private readonly Mock<Container> _tokenUsageContainerMock;
        private readonly IOptions<AppSettings> _appSettings;
        private const string TestUserId = "test-user-quota";

        public QuotaServiceTests()
        {
            _cosmosDbServiceMock = new Mock<ICosmosDbService>();
            _loggerMock = new Mock<ILogger<QuotaService>>();
            _cosmosClientMock = new Mock<CosmosClient>();
            _databaseMock = new Mock<Database>();
            _quotaContainerMock = new Mock<Container>();
            _tokenUsageContainerMock = new Mock<Container>();

            var settings = new AppSettings
            {
                CosmosDb = new CosmosDbSettings
                {
                    DatabaseName = "TestDb"
                }
            };
            _appSettings = Options.Create(settings);

            _cosmosClientMock.Setup(c => c.GetDatabase("TestDb")).Returns(_databaseMock.Object);
            _databaseMock.Setup(d => d.GetContainer("UserQuotas")).Returns(_quotaContainerMock.Object);
            _databaseMock.Setup(d => d.GetContainer("TokenUsage")).Returns(_tokenUsageContainerMock.Object);
        }

        private QuotaService CreateService()
        {
            return new QuotaService(
                _cosmosDbServiceMock.Object,
                _loggerMock.Object,
                _cosmosClientMock.Object,
                _appSettings);
        }

        [Fact]
        public async Task CanSendChatMessageAsync_FreeUserUnderLimit_ReturnsTrue()
        {
            var service = CreateService();
            var quota = new UserQuota
            {
                Id = TestUserId,
                UserId = TestUserId,
                Tier = UserTier.Free,
                ChatMessagesThisMonth = 5
            };

            var itemResponseMock = new Mock<ItemResponse<UserQuota>>();
            itemResponseMock.Setup(r => r.Resource).Returns(quota);

            _quotaContainerMock.Setup(c => c.ReadItemAsync<UserQuota>(
                TestUserId,
                new PartitionKey(TestUserId),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(itemResponseMock.Object);

            var (canSend, reason) = await service.CanSendChatMessageAsync(TestUserId);

            Assert.True(canSend);
            Assert.Null(reason);
        }

        [Fact]
        public async Task CanSendChatMessageAsync_FreeUserAtLimit_ReturnsFalse()
        {
            var service = CreateService();
            var quota = new UserQuota
            {
                Id = TestUserId,
                UserId = TestUserId,
                Tier = UserTier.Free,
                ChatMessagesThisMonth = 15
            };

            var itemResponseMock = new Mock<ItemResponse<UserQuota>>();
            itemResponseMock.Setup(r => r.Resource).Returns(quota);

            _quotaContainerMock.Setup(c => c.ReadItemAsync<UserQuota>(
                TestUserId,
                new PartitionKey(TestUserId),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(itemResponseMock.Object);

            var (canSend, reason) = await service.CanSendChatMessageAsync(TestUserId);

            Assert.False(canSend);
            Assert.NotNull(reason);
            Assert.Contains("15", reason);
        }

        [Fact]
        public async Task IncrementChatCountAsync_IncrementsCounterWithPatch()
        {
            var service = CreateService();
            var quota = new UserQuota
            {
                Id = TestUserId,
                UserId = TestUserId,
                Tier = UserTier.Free,
                ChatMessagesThisMonth = 4
            };

            var itemResponseMock = new Mock<ItemResponse<UserQuota>>();
            itemResponseMock.Setup(r => r.Resource).Returns(quota);

            _quotaContainerMock.Setup(c => c.PatchItemAsync<UserQuota>(
                TestUserId,
                new PartitionKey(TestUserId),
                It.IsAny<IReadOnlyList<PatchOperation>>(),
                It.IsAny<PatchItemRequestOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(itemResponseMock.Object);

            await service.IncrementChatCountAsync(TestUserId);

            _quotaContainerMock.Verify(c => c.PatchItemAsync<UserQuota>(
                TestUserId,
                new PartitionKey(TestUserId),
                It.IsAny<IReadOnlyList<PatchOperation>>(),
                It.IsAny<PatchItemRequestOptions>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
