using MentalHealthJournal.Models;
using MentalHealthJournal.Server.Controllers;
using MentalHealthJournal.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Xunit;

namespace MentalHealthJournal.Tests.Controllers
{
    public class ConsentControllerTests
    {
        private readonly Mock<IUserConsentService> _consentServiceMock;
        private readonly Mock<IAuditLogService> _auditLogServiceMock;
        private readonly Mock<ILogger<ConsentController>> _loggerMock;
        private readonly ConsentController _controller;
        private const string TestUserId = "test-user-123";

        public ConsentControllerTests()
        {
            _consentServiceMock = new Mock<IUserConsentService>();
            _auditLogServiceMock = new Mock<IAuditLogService>();
            _loggerMock = new Mock<ILogger<ConsentController>>();

            _controller = new ConsentController(
                _consentServiceMock.Object,
                _auditLogServiceMock.Object,
                _loggerMock.Object);

            // Setup authenticated user
            SetupAuthenticatedUser(TestUserId);
        }

        private void SetupAuthenticatedUser(string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, "test@example.com")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Theory]
        [InlineData("TermsOfService")]
        [InlineData("PrivacyPolicy")]
        [InlineData("AIAnalysis")]
        public async Task RecordConsent_WithValidConsentType_ReturnsOk(string consentType)
        {
            // Arrange
            var request = new RecordConsentRequest
            {
                ConsentType = consentType,
                Version = "1.0",
                Granted = true
            };

            _consentServiceMock.Setup(s => s.RecordConsentAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _auditLogServiceMock.Setup(s => s.LogActionAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.RecordConsent(request, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Theory]
        [InlineData("InvalidType")]
        [InlineData("")]
        [InlineData("termsofservice")]
        [InlineData("TERMSOFSERVICE")]
        public async Task RecordConsent_WithInvalidConsentType_ReturnsBadRequest(string consentType)
        {
            // Arrange
            var request = new RecordConsentRequest
            {
                ConsentType = consentType,
                Version = "1.0",
                Granted = true
            };

            // Act
            var result = await _controller.RecordConsent(request, CancellationToken.None);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Theory]
        [InlineData("1.0")]
        [InlineData("1.0.0")]
        [InlineData("2.1")]
        [InlineData("10.5.3")]
        public async Task RecordConsent_WithValidVersionFormat_ReturnsOk(string version)
        {
            // Arrange
            var request = new RecordConsentRequest
            {
                ConsentType = "TermsOfService",
                Version = version,
                Granted = true
            };

            _consentServiceMock.Setup(s => s.RecordConsentAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _auditLogServiceMock.Setup(s => s.LogActionAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.RecordConsent(request, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Theory]
        [InlineData("")]
        [InlineData("v1.0")]
        [InlineData("1.x")]
        [InlineData("abc")]
        [InlineData("1.0.0.0.1")]
        public async Task RecordConsent_WithInvalidVersionFormat_ReturnsBadRequest(string version)
        {
            // Arrange
            var request = new RecordConsentRequest
            {
                ConsentType = "TermsOfService",
                Version = version,
                Granted = true
            };

            // Act
            var result = await _controller.RecordConsent(request, CancellationToken.None);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Theory]
        [InlineData("TermsOfService")]
        [InlineData("PrivacyPolicy")]
        [InlineData("AIAnalysis")]
        public async Task RevokeConsent_WithValidConsentType_ReturnsOk(string consentType)
        {
            // Arrange
            var request = new RevokeConsentRequest
            {
                ConsentType = consentType
            };

            _consentServiceMock.Setup(s => s.RevokeConsentAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _auditLogServiceMock.Setup(s => s.LogActionAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.RevokeConsent(request, CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Theory]
        [InlineData("InvalidType")]
        [InlineData("")]
        [InlineData("termsofservice")]
        public async Task RevokeConsent_WithInvalidConsentType_ReturnsBadRequest(string consentType)
        {
            // Arrange
            var request = new RevokeConsentRequest
            {
                ConsentType = consentType
            };

            // Act
            var result = await _controller.RevokeConsent(request, CancellationToken.None);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        public async Task GetConsentStatus_WithAuthenticatedUser_ReturnsOkWithStatus()
        {
            // Arrange
            _consentServiceMock.Setup(s => s.HasValidConsentAsync(
                TestUserId, "TermsOfService", It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            _consentServiceMock.Setup(s => s.HasValidConsentAsync(
                TestUserId, "PrivacyPolicy", It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            _consentServiceMock.Setup(s => s.HasValidConsentAsync(
                TestUserId, "AIAnalysis", It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.GetConsentStatus(CancellationToken.None);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public void GetConsentVersions_ReturnsOkWithVersions()
        {
            // Act
            var result = _controller.GetConsentVersions();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}
