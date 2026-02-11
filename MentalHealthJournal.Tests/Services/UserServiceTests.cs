using MentalHealthJournal.Models;
using MentalHealthJournal.Services;
using MentalHealthJournal.Tests.Helpers;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using User = MentalHealthJournal.Models.User;

namespace MentalHealthJournal.Tests.Services
{
    public class UserServiceTests
    {
        private readonly Mock<ILogger<UserService>> _loggerMock;
        private readonly Mock<CosmosClient> _cosmosClientMock;
        private readonly Mock<Container> _containerMock;
        private readonly UserService _service;

        public UserServiceTests()
        {
            _loggerMock = new Mock<ILogger<UserService>>();
            _cosmosClientMock = new Mock<CosmosClient>();
            _containerMock = new Mock<Container>();

            var appSettings = TestHelper.CreateTestAppSettings();
            // Add UserContainer to settings
            appSettings.CosmosDb.UserContainer = "TestUsers";
            var options = Microsoft.Extensions.Options.Options.Create(appSettings);

            var databaseMock = new Mock<Database>();
            databaseMock.Setup(d => d.GetContainer(It.IsAny<string>())).Returns(_containerMock.Object);
            _cosmosClientMock.Setup(c => c.GetDatabase(It.IsAny<string>())).Returns(databaseMock.Object);

            _service = new UserService(_cosmosClientMock.Object, _loggerMock.Object, options);
        }

        [Fact]
        public async Task CreateOrUpdateUserAsync_WithMismatchedIds_CorrectsMismatch()
        {
            // Arrange
            var user = new User
            {
                id = "old-mismatched-id",
                userId = "correct-user-id",
                Email = "test@example.com",
                Name = "Test User",
                Provider = "google",
                ProviderId = "google-123"
            };

            var expectedUser = new User
            {
                id = "correct-user-id",  // Should be corrected to match userId
                userId = "correct-user-id",
                Email = "test@example.com",
                Name = "Test User",
                Provider = "google",
                ProviderId = "google-123"
            };

            var responseMock = new Mock<ItemResponse<User>>();
            responseMock.Setup(r => r.Resource).Returns(expectedUser);

            _containerMock.Setup(c => c.UpsertItemAsync(
                It.Is<User>(u => u.id == "correct-user-id" && u.userId == "correct-user-id"),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            )).ReturnsAsync(responseMock.Object);

            // Act
            var result = await _service.CreateOrUpdateUserAsync(user);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("correct-user-id", result.id);
            Assert.Equal("correct-user-id", result.userId);

            // Verify that UpsertItemAsync was called with corrected user
            _containerMock.Verify(c => c.UpsertItemAsync(
                It.Is<User>(u => u.id == "correct-user-id" && u.userId == "correct-user-id"),
                It.Is<PartitionKey>(pk => pk.ToString().Contains("correct-user-id")),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact]
        public async Task CreateOrUpdateUserAsync_WithMatchingIds_DoesNotLogWarning()
        {
            // Arrange
            var user = new User
            {
                id = "matching-id",
                userId = "matching-id",
                Email = "test@example.com",
                Name = "Test User",
                Provider = "google",
                ProviderId = "google-123"
            };

            var responseMock = new Mock<ItemResponse<User>>();
            responseMock.Setup(r => r.Resource).Returns(user);

            _containerMock.Setup(c => c.UpsertItemAsync(
                It.IsAny<User>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            )).ReturnsAsync(responseMock.Object);

            // Act
            var result = await _service.CreateOrUpdateUserAsync(user);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("matching-id", result.id);
            Assert.Equal("matching-id", result.userId);

            // Verify no warning was logged (ids already matched)
            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Correcting user ID mismatch")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Never);
        }

        [Fact]
        public async Task CreateOrUpdateUserAsync_WithMismatchedIds_LogsWarning()
        {
            // Arrange
            var user = new User
            {
                id = "old-id",
                userId = "new-id",
                Email = "test@example.com",
                Name = "Test User",
                Provider = "google",
                ProviderId = "google-123"
            };

            var responseMock = new Mock<ItemResponse<User>>();
            responseMock.Setup(r => r.Resource).Returns(new User { id = "new-id", userId = "new-id" });

            _containerMock.Setup(c => c.UpsertItemAsync(
                It.IsAny<User>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            )).ReturnsAsync(responseMock.Object);

            // Act
            await _service.CreateOrUpdateUserAsync(user);

            // Assert - Verify warning was logged
            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Correcting user ID mismatch")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public void Constructor_InitializesSuccessfully()
        {
            // Assert
            Assert.NotNull(_service);
        }
    }
}
