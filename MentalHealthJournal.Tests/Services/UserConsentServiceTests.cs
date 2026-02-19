using MentalHealthJournal.Models;
using MentalHealthJournal.Services;
using MentalHealthJournal.Tests.Helpers;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace MentalHealthJournal.Tests.Services
{
    public class UserConsentServiceTests
    {
        private readonly Mock<ILogger<UserConsentService>> _loggerMock;
        private readonly Mock<CosmosClient> _cosmosClientMock;
        private readonly Mock<Container> _containerMock;
        private readonly UserConsentService _service;

        public UserConsentServiceTests()
        {
            _loggerMock = new Mock<ILogger<UserConsentService>>();
            _cosmosClientMock = new Mock<CosmosClient>();
            _containerMock = new Mock<Container>();

            var appSettings = TestHelper.CreateTestAppSettings();
            var options = Microsoft.Extensions.Options.Options.Create(appSettings);

            _cosmosClientMock.Setup(c => c.GetContainer(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(_containerMock.Object);

            _service = new UserConsentService(_loggerMock.Object, _cosmosClientMock.Object, options);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithNewerVersion_ReturnsTrue()
        {
            // Arrange
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "1.0";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "2.0",
                Granted = true,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = null
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithExactVersion_ReturnsTrue()
        {
            // Arrange
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "1.0";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "1.0",
                Granted = true,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = null
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithOlderVersion_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "2.0";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "1.0",
                Granted = true,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = null
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithVersion1_10_GreaterThan1_9_ReturnsTrue()
        {
            // Arrange - This test specifically validates proper version comparison
            // String ordinal comparison would incorrectly say "1.9" > "1.10"
            // Proper version comparison correctly says "1.10" > "1.9"
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "1.9";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "1.10",
                Granted = true,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = null
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithVersion10_0_GreaterThan2_0_ReturnsTrue()
        {
            // Arrange - This test specifically validates proper version comparison
            // String ordinal comparison would incorrectly say "10.0" < "2.0"
            // Proper version comparison correctly says "10.0" > "2.0"
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "2.0";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "10.0",
                Granted = true,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = null
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithVersion1_9_LessThan1_10_ReturnsFalse()
        {
            // Arrange - This test validates the opposite case
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "1.10";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "1.9",
                Granted = true,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = null
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithInvalidVersionFormat_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "1.0";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "invalid-version",
                Granted = true,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = null
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithRevokedConsent_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "1.0";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "2.0",
                Granted = true,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = DateTime.UtcNow
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithNotGrantedConsent_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "1.0";

            var consent = new UserConsent
            {
                UserId = userId,
                ConsentType = consentType,
                ConsentVersion = "2.0",
                Granted = false,
                ConsentDate = DateTime.UtcNow,
                RevokedDate = null
            };

            SetupGetLatestConsentMock(consent);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasValidConsentAsync_WithNoConsent_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user";
            var consentType = "terms-of-service";
            var requiredVersion = "1.0";

            SetupGetLatestConsentMock(null);

            // Act
            var result = await _service.HasValidConsentAsync(userId, consentType, requiredVersion);

            // Assert
            Assert.False(result);
        }

        private void SetupGetLatestConsentMock(UserConsent? consent)
        {
            var feedResponseMock = new Mock<FeedResponse<UserConsent>>();
            if (consent != null)
            {
                feedResponseMock.Setup(x => x.GetEnumerator())
                    .Returns(new List<UserConsent> { consent }.GetEnumerator());
            }
            else
            {
                feedResponseMock.Setup(x => x.GetEnumerator())
                    .Returns(new List<UserConsent>().GetEnumerator());
            }

            var feedIteratorMock = new Mock<FeedIterator<UserConsent>>();
            feedIteratorMock.Setup(x => x.HasMoreResults).Returns(consent != null);
            feedIteratorMock.Setup(x => x.ReadNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(feedResponseMock.Object);

            _containerMock.Setup(x => x.GetItemQueryIterator<UserConsent>(
                It.IsAny<QueryDefinition>(),
                It.IsAny<string>(),
                It.IsAny<QueryRequestOptions>()))
                .Returns(feedIteratorMock.Object);
        }
    }
}
