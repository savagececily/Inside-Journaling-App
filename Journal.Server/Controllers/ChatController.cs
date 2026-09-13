using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Journal.Models;
using Journal.Services;
using System.Security.Claims;

namespace Journal.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private const int MaxMessageLength = 10000;

        private readonly IChatService _chatService;
        private readonly IQuotaService _quotaService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(IChatService chatService, IQuotaService quotaService, ILogger<ChatController> logger)
        {
            _chatService = chatService ?? throw new ArgumentNullException(nameof(chatService));
            _quotaService = quotaService ?? throw new ArgumentNullException(nameof(quotaService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Send a message to the virtual support companion
        /// </summary>
        [HttpPost("message")]
        [EnableRateLimiting("chat")]
        public async Task<ActionResult<ChatResponse>> SendMessage([FromBody] ChatRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(request?.Message))
            {
                return BadRequest("Message cannot be empty");
            }

            if (request.Message.Length > MaxMessageLength)
            {
                return BadRequest($"Message exceeds maximum length of {MaxMessageLength:N0} characters.");
            }

            bool isCrisis = CrisisKeywords.ContainsCrisisKeyword(request.Message);

            try
            {
                var (canSend, reason) = await _quotaService.CanSendChatMessageAsync(userId);
                if (!canSend)
                {
                    if (isCrisis)
                    {
                        return StatusCode(StatusCodes.Status429TooManyRequests, new ChatResponse
                        {
                            Message = reason ?? "Quota limit reached.",
                            IsCrisisDetected = true,
                            CrisisReason = "Message contains phrases associated with crisis or distress.",
                            CrisisResources = CrisisResources.GetDefaultResources()
                        });
                    }

                    return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "Quota limit reached", message = reason });
                }

                var response = await _chatService.SendMessageAsync(userId, request);

                await _quotaService.IncrementChatCountAsync(userId);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending chat message for user {UserId}", userId);

                if (isCrisis)
                {
                    return Ok(new ChatResponse
                    {
                        SessionId = request.SessionId ?? Guid.NewGuid().ToString(),
                        Message = "An error occurred while processing your message, but support is available.",
                        Timestamp = DateTime.UtcNow,
                        IsCrisisDetected = true,
                        CrisisReason = "Message contains phrases associated with crisis or distress.",
                        CrisisResources = CrisisResources.GetDefaultResources()
                    });
                }

                return StatusCode(500, "An error occurred while processing your message");
            }
        }

        /// <summary>
        /// Get a specific chat session
        /// </summary>
        [HttpGet("session/{sessionId}")]
        [EnableRateLimiting("journal-reads")]
        public async Task<ActionResult<ChatSession>> GetSession(string sessionId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var session = await _chatService.GetSessionAsync(userId, sessionId);

                if (session == null)
                {
                    return NotFound("Session not found");
                }

                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving chat session {SessionId}", sessionId);
                return StatusCode(500, "An error occurred while retrieving the session");
            }
        }

        /// <summary>
        /// Get all chat sessions for the current user
        /// </summary>
        [HttpGet("sessions")]
        [EnableRateLimiting("journal-reads")]
        public async Task<ActionResult<List<ChatSession>>> GetSessions()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var sessions = await _chatService.GetUserSessionsAsync(userId);
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving chat sessions");
                return StatusCode(500, "An error occurred while retrieving sessions");
            }
        }

        /// <summary>
        /// Delete a chat session
        /// </summary>
        [HttpDelete("session/{sessionId}")]
        public async Task<ActionResult> DeleteSession(string sessionId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                await _chatService.DeleteSessionAsync(userId, sessionId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting chat session {SessionId}", sessionId);
                return StatusCode(500, "An error occurred while deleting the session");
            }
        }
    }
}
