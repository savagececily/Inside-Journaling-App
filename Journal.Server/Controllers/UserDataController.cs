using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Journal.Models;
using Journal.Services;
using System.Security.Claims;

namespace Journal.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserDataController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICosmosDbService _cosmosDbService;
    private readonly IBlobStorageService _blobStorageService;
    private readonly IAuditLogService _auditLogService;
    private readonly IUserConsentService _userConsentService;
    private readonly ILogger<UserDataController> _logger;

    public UserDataController(
        IUserService userService,
        ICosmosDbService cosmosDbService,
        IBlobStorageService blobStorageService,
        IAuditLogService auditLogService,
        IUserConsentService userConsentService,
        ILogger<UserDataController> logger)
    {
        _userService = userService;
        _cosmosDbService = cosmosDbService;
        _blobStorageService = blobStorageService;
        _auditLogService = auditLogService;
        _userConsentService = userConsentService;
        _logger = logger;
    }

    /// <summary>
    /// Delete all user data including journal entries, audio files, and user profile
    /// </summary>
    [HttpDelete("delete-all")]
    public async Task<IActionResult> DeleteAllUserData(CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found in token");
        }

        _logger.LogInformation("Starting complete data deletion for user {UserId}", userId);
        
        // Get IP and User Agent for audit log
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        // Create audit log BEFORE deletion to ensure traceability
        // This audit log will be retained for 7 years per Privacy Policy even after user deletion
        await _auditLogService.LogActionAsync(
            userId,
            "DeleteInitiated",
            "Account",
            userId,
            successful: true,
            ipAddress: ipAddress,
            userAgent: userAgent,
            additionalDetails: "Account deletion request received and initiated",
            cancellationToken: cancellationToken);

        try
        {
            // Delete journal entries
            var entriesDeleted = await _cosmosDbService.DeleteAllUserEntriesAsync(userId, cancellationToken);
            _logger.LogInformation("Deleted {Count} journal entries for user {UserId}", entriesDeleted, userId);

            // Delete audio files
            var audioFilesDeleted = await _blobStorageService.DeleteAllUserAudioAsync(userId, cancellationToken);
            _logger.LogInformation("Deleted {Count} audio files for user {UserId}", audioFilesDeleted, userId);

            // Delete user profile
            await _userService.DeleteUserAsync(userId, cancellationToken);
            _logger.LogInformation("Deleted user profile for user {UserId}", userId);

            // Log completion details
            await _auditLogService.LogActionAsync(
                userId,
                "Delete",
                "Account",
                userId,
                successful: true,
                ipAddress: ipAddress,
                userAgent: userAgent,
                additionalDetails: $"Account deletion completed: {entriesDeleted} entries, {audioFilesDeleted} audio files",
                cancellationToken: cancellationToken);

            return Ok(new
            {
                message = "All user data has been permanently deleted",
                entriesDeleted,
                audioFilesDeleted,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting all user data");
            
            // Log the failure in audit log (wrap in try-catch to preserve original error)
            try
            {
                await _auditLogService.LogActionAsync(
                    userId,
                    "Delete",
                    "Account",
                    userId,
                    successful: false,
                    errorMessage: ex.Message,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    additionalDetails: "Account deletion failed",
                    cancellationToken: cancellationToken);
            }
            catch (Exception auditEx)
            {
                // Log audit failure but don't mask original error
                _logger.LogError(auditEx, "Failed to write audit log for deletion failure");
            }
            
            return StatusCode(500, new { error = "Failed to delete user data. Please try again later or contact support if the issue persists." });
        }
    }

    /// <summary>
    /// Get audit logs for the current user
    /// </summary>
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int? limit = 100, CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var auditLogs = await _auditLogService.GetUserAuditLogsAsync(userId, limit, cancellationToken);
            return Ok(auditLogs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs");
            return StatusCode(500, new { error = "Failed to retrieve audit logs", details = ex.Message });
        }
    }
}
