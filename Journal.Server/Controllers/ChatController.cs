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
        private readonly IChatService _chatService;
        private readonly IQuotaService? _quotaService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(IChatService chatService, ILogger<ChatController> logger, IQuotaService? quotaService = null)
        {
            _chatService = chatService;
            _logger = logger;
            _quotaService = quotaService;
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

            try
            {
                if (string.IsNullOrWhiteSpace(request?.Message))
                {
                    return BadRequest("Message cannot be empty");
                }

                if (_quotaService != null)
                {
                    var (canSend, reason) = await _quotaService.CanSendChatMessageAsync(userId);
                    if (!canSend)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new { message = reason });
                    }
                }

                var response = await _chatService.SendMessageAsync(userId, request);

                if (_quotaService != null)
                {
                    await _quotaService.IncrementChatCountAsync(userId);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending chat message");
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
