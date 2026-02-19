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
    public class AccountDeletionServiceTests
    {
        private readonly Mock<ILogger<AccountDeletionService>> _loggerMock;
        private readonly Mock<CosmosClient> _cosmosClientMock;
        private readonly Mock<Container> _usersContainerMock;
        private readonly Mock<Container> _journalEntriesContainerMock;
        private readonly Mock<Container> _deletionTokensContainerMock;
        private readonly Mock<IBlobStorageService> _blobServiceMock;
        private readonly AccountDeletionService _service;

        public AccountDeletionServiceTests()
        {
            _loggerMock = new Mock<ILogger<AccountDeletionService>>();
            _cosmosClientMock = new Mock<CosmosClient>();
            _usersContainerMock = new Mock<Container>();
            _journalEntriesContainerMock = new Mock<Container>();
            _deletionTokensContainerMock = new Mock<Container>();
            _blobServiceMock = new Mock<IBlobStorageService>();

            var appSettings = TestHelper.CreateTestAppSettings();
            appSettings.CosmosDb.UserContainer = "TestUsers";
            appSettings.CosmosDb.DeletionTokensContainer = "TestDeletionTokens";
            var options = Microsoft.Extensions.Options.Options.Create(appSettings);

            var databaseMock = new Mock<Database>();
            databaseMock.Setup(d => d.GetContainer("TestUsers")).Returns(_usersContainerMock.Object);
            databaseMock.Setup(d => d.GetContainer("TestJournalEntries")).Returns(_journalEntriesContainerMock.Object);
            databaseMock.Setup(d => d.GetContainer("TestDeletionTokens")).Returns(_deletionTokensContainerMock.Object);
            _cosmosClientMock.Setup(c => c.GetDatabase(It.IsAny<string>())).Returns(databaseMock.Object);

            _service = new AccountDeletionService(
                _cosmosClientMock.Object,
                _loggerMock.Object,
                options,
                _blobServiceMock.Object);
        }

        [Fact]
        public void Constructor_InitializesSuccessfully()
        {
            // Assert
            Assert.NotNull(_service);
        }

        [Fact]
        public async Task RequestAccountDeletionAsync_CreatesTokenSuccessfully()
        {
            // Arrange
            var userId = "test-user-123";
            var responseMock = new Mock<ItemResponse<AccountDeletionToken>>();
            var createdToken = new AccountDeletionToken
            {
                id = Guid.NewGuid().ToString(),
                userId = userId,
                Token = "test-token",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };
            responseMock.Setup(r => r.Resource).Returns(createdToken);

            _deletionTokensContainerMock.Setup(c => c.CreateItemAsync(
                It.IsAny<AccountDeletionToken>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            )).ReturnsAsync(responseMock.Object);

            // Act
            var result = await _service.RequestAccountDeletionAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.userId);
            Assert.NotEmpty(result.Token);
            Assert.False(result.IsUsed);
            Assert.True(result.ExpiresAt > DateTime.UtcNow);

            _deletionTokensContainerMock.Verify(c => c.CreateItemAsync(
                It.Is<AccountDeletionToken>(t => t.userId == userId && !t.IsUsed),
                It.Is<PartitionKey>(pk => pk.ToString().Contains(userId)),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact]
        public async Task ValidateConfirmationTokenAsync_WithValidToken_ReturnsTrue()
        {
            // Arrange
            var userId = "test-user-123";
            var token = "valid-token-123";
            var deletionToken = new AccountDeletionToken
            {
                id = Guid.NewGuid().ToString(),
                userId = userId,
                Token = token,
                CreatedAt = DateTime.UtcNow.AddMinutes(-10),
                ExpiresAt = DateTime.UtcNow.AddHours(23),
                IsUsed = false
            };

            var feedResponseMock = new Mock<FeedResponse<AccountDeletionToken>>();
            feedResponseMock.Setup(f => f.GetEnumerator()).Returns(new List<AccountDeletionToken> { deletionToken }.GetEnumerator());

            var iteratorMock = new Mock<FeedIterator<AccountDeletionToken>>();
            iteratorMock.Setup(i => i.HasMoreResults).Returns(true);
            iteratorMock.Setup(i => i.ReadNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(feedResponseMock.Object);

            _deletionTokensContainerMock.Setup(c => c.GetItemQueryIterator<AccountDeletionToken>(
                It.IsAny<QueryDefinition>(),
                It.IsAny<string>(),
                It.IsAny<QueryRequestOptions>()
            )).Returns(iteratorMock.Object);

            var updateResponseMock = new Mock<ItemResponse<AccountDeletionToken>>();
            updateResponseMock.Setup(r => r.Resource).Returns(deletionToken);
            _deletionTokensContainerMock.Setup(c => c.UpsertItemAsync(
                It.IsAny<AccountDeletionToken>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            )).ReturnsAsync(updateResponseMock.Object);

            // Act
            var result = await _service.ValidateConfirmationTokenAsync(userId, token);

            // Assert
            Assert.True(result);
            _deletionTokensContainerMock.Verify(c => c.UpsertItemAsync(
                It.Is<AccountDeletionToken>(t => t.IsUsed == true),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact]
        public async Task ValidateConfirmationTokenAsync_WithExpiredToken_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user-123";
            var token = "expired-token-123";
            var deletionToken = new AccountDeletionToken
            {
                id = Guid.NewGuid().ToString(),
                userId = userId,
                Token = token,
                CreatedAt = DateTime.UtcNow.AddHours(-25),
                ExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired 1 hour ago
                IsUsed = false
            };

            var feedResponseMock = new Mock<FeedResponse<AccountDeletionToken>>();
            feedResponseMock.Setup(f => f.GetEnumerator()).Returns(new List<AccountDeletionToken> { deletionToken }.GetEnumerator());

            var iteratorMock = new Mock<FeedIterator<AccountDeletionToken>>();
            iteratorMock.Setup(i => i.HasMoreResults).Returns(true);
            iteratorMock.Setup(i => i.ReadNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(feedResponseMock.Object);

            _deletionTokensContainerMock.Setup(c => c.GetItemQueryIterator<AccountDeletionToken>(
                It.IsAny<QueryDefinition>(),
                It.IsAny<string>(),
                It.IsAny<QueryRequestOptions>()
            )).Returns(iteratorMock.Object);

            // Act
            var result = await _service.ValidateConfirmationTokenAsync(userId, token);

            // Assert
            Assert.False(result);
            _deletionTokensContainerMock.Verify(c => c.UpsertItemAsync(
                It.IsAny<AccountDeletionToken>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact]
        public async Task ValidateConfirmationTokenAsync_WithInvalidToken_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user-123";
            var token = "invalid-token-123";

            var feedResponseMock = new Mock<FeedResponse<AccountDeletionToken>>();
            feedResponseMock.Setup(f => f.GetEnumerator()).Returns(new List<AccountDeletionToken>().GetEnumerator());

            var iteratorMock = new Mock<FeedIterator<AccountDeletionToken>>();
            iteratorMock.Setup(i => i.HasMoreResults).Returns(true);
            iteratorMock.Setup(i => i.ReadNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(feedResponseMock.Object);

            _deletionTokensContainerMock.Setup(c => c.GetItemQueryIterator<AccountDeletionToken>(
                It.IsAny<QueryDefinition>(),
                It.IsAny<string>(),
                It.IsAny<QueryRequestOptions>()
            )).Returns(iteratorMock.Object);

            // Act
            var result = await _service.ValidateConfirmationTokenAsync(userId, token);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAllUserDataAsync_DeletesAllUserData()
        {
            // Arrange
            var userId = "test-user-123";

            // Setup journal entries query
            var journalEntries = new List<JournalEntry>
            {
                TestHelper.CreateSampleJournalEntry("entry1", userId),
                TestHelper.CreateVoiceJournalEntry("entry2", userId)
            };

            var journalFeedResponseMock = new Mock<FeedResponse<JournalEntry>>();
            journalFeedResponseMock.Setup(f => f.GetEnumerator()).Returns(journalEntries.GetEnumerator());

            var journalIteratorMock = new Mock<FeedIterator<JournalEntry>>();
            journalIteratorMock.SetupSequence(i => i.HasMoreResults)
                .Returns(true)
                .Returns(false);
            journalIteratorMock.Setup(i => i.ReadNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(journalFeedResponseMock.Object);

            _journalEntriesContainerMock.Setup(c => c.GetItemQueryIterator<JournalEntry>(
                It.IsAny<QueryDefinition>(),
                It.IsAny<string>(),
                It.IsAny<QueryRequestOptions>()
            )).Returns(journalIteratorMock.Object);

            // Setup deletion mocks
            var deleteResponseMock = new Mock<ItemResponse<JournalEntry>>();
            _journalEntriesContainerMock.Setup(c => c.DeleteItemAsync<JournalEntry>(
                It.IsAny<string>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            )).ReturnsAsync(deleteResponseMock.Object);

            var userDeleteResponseMock = new Mock<ItemResponse<User>>();
            _usersContainerMock.Setup(c => c.DeleteItemAsync<User>(
                It.IsAny<string>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            )).ReturnsAsync(userDeleteResponseMock.Object);

            _blobServiceMock.Setup(b => b.DeleteAudioAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()
            )).Returns(Task.CompletedTask);

            // Setup deletion tokens query
            var tokenFeedResponseMock = new Mock<FeedResponse<AccountDeletionToken>>();
            tokenFeedResponseMock.Setup(f => f.GetEnumerator()).Returns(new List<AccountDeletionToken>().GetEnumerator());

            var tokenIteratorMock = new Mock<FeedIterator<AccountDeletionToken>>();
            tokenIteratorMock.SetupSequence(i => i.HasMoreResults)
                .Returns(true)
                .Returns(false);
            tokenIteratorMock.Setup(i => i.ReadNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(tokenFeedResponseMock.Object);

            _deletionTokensContainerMock.Setup(c => c.GetItemQueryIterator<AccountDeletionToken>(
                It.IsAny<QueryDefinition>(),
                It.IsAny<string>(),
                It.IsAny<QueryRequestOptions>()
            )).Returns(tokenIteratorMock.Object);

            // Act
            await _service.DeleteAllUserDataAsync(userId);

            // Assert
            // Verify journal entries were deleted
            _journalEntriesContainerMock.Verify(c => c.DeleteItemAsync<JournalEntry>(
                It.IsAny<string>(),
                It.IsAny<PartitionKey>(),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            ), Times.Exactly(2));

            // Verify audio file was deleted (only one voice entry)
            _blobServiceMock.Verify(b => b.DeleteAudioAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()
            ), Times.Once);

            // Verify user record was deleted
            _usersContainerMock.Verify(c => c.DeleteItemAsync<User>(
                userId,
                It.Is<PartitionKey>(pk => pk.ToString().Contains(userId)),
                It.IsAny<ItemRequestOptions>(),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }
    }
}
