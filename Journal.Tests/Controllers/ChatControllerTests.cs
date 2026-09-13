using Journal.Models;
using Journal.Server.Controllers;
using Journal.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Xunit;

namespace Journal.Tests.Controllers
{
    public class ChatControllerTests
    {
        private readonly Mock<IChatService> _chatServiceMock;
        private readonly Mock<ILogger<ChatController>> _loggerMock;
        private readonly ChatController _controller;
        private const string TestUserId = "user-123";

        public ChatControllerTests()
        {
            _chatServiceMock = new Mock<IChatService>();
            _loggerMock = new Mock<ILogger<ChatController>>();
            _controller = new ChatController(_chatServiceMock.Object, _loggerMock.Object);

            SetupControllerContext(TestUserId);
        }

        private void SetupControllerContext(string? userId)
        {
            var user = userId != null
                ? new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId)
                }, "mock"))
                : new ClaimsPrincipal(new ClaimsIdentity());

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task SendMessage_WithValidMessage_ReturnsOk()
        {
            var request = new ChatRequest { Message = "Hello" };
            var expectedResponse = new ChatResponse
            {
                SessionId = "session-1",
                Message = "Hello, how can I help?",
                Timestamp = DateTime.UtcNow
            };

            _chatServiceMock.Setup(s => s.SendMessageAsync(TestUserId, request))
                .ReturnsAsync(expectedResponse);

            var actionResult = await _controller.SendMessage(request);

            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var response = Assert.IsType<ChatResponse>(okResult.Value);
            Assert.Equal(expectedResponse.SessionId, response.SessionId);
            Assert.Equal(expectedResponse.Message, response.Message);
        }

        [Fact]
        public async Task SendMessage_WithEmptyMessage_ReturnsBadRequest()
        {
            var request = new ChatRequest { Message = "" };

            var actionResult = await _controller.SendMessage(request);

            Assert.IsType<BadRequestObjectResult>(actionResult.Result);
        }

        [Fact]
        public async Task SendMessage_Unauthenticated_ReturnsUnauthorized()
        {
            SetupControllerContext(null);
            var request = new ChatRequest { Message = "Hello" };

            var actionResult = await _controller.SendMessage(request);

            Assert.IsType<UnauthorizedResult>(actionResult.Result);
        }

        [Fact]
        public async Task GetSession_WhenFound_ReturnsOk()
        {
            var session = new ChatSession
            {
                id = "session-1",
                UserId = TestUserId,
                Title = "Test Session"
            };

            _chatServiceMock.Setup(s => s.GetSessionAsync(TestUserId, "session-1"))
                .ReturnsAsync(session);

            var actionResult = await _controller.GetSession("session-1");

            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var resultSession = Assert.IsType<ChatSession>(okResult.Value);
            Assert.Equal("session-1", resultSession.id);
        }

        [Fact]
        public async Task GetSession_WhenNotFound_ReturnsNotFound()
        {
            _chatServiceMock.Setup(s => s.GetSessionAsync(TestUserId, "session-99"))
                .ReturnsAsync((ChatSession?)null);

            var actionResult = await _controller.GetSession("session-99");

            Assert.IsType<NotFoundObjectResult>(actionResult.Result);
        }

        [Fact]
        public async Task GetSessions_ReturnsUserSessions()
        {
            var sessions = new List<ChatSession>
            {
                new ChatSession { id = "session-1", UserId = TestUserId },
                new ChatSession { id = "session-2", UserId = TestUserId }
            };

            _chatServiceMock.Setup(s => s.GetUserSessionsAsync(TestUserId))
                .ReturnsAsync(sessions);

            var actionResult = await _controller.GetSessions();

            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var resultSessions = Assert.IsType<List<ChatSession>>(okResult.Value);
            Assert.Equal(2, resultSessions.Count);
        }

        [Fact]
        public async Task DeleteSession_ReturnsNoContent()
        {
            _chatServiceMock.Setup(s => s.DeleteSessionAsync(TestUserId, "session-1"))
                .Returns(Task.CompletedTask);

            var actionResult = await _controller.DeleteSession("session-1");

            Assert.IsType<NoContentResult>(actionResult);
        }
    }
}
