using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MentalHealthJournal.Models;
using MentalHealthJournal.Services;
using System.Security.Claims;

namespace MentalHealthJournal.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConsentController : ControllerBase
{
    private readonly IUserConsentService _consentService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<ConsentController> _logger;

    // Current consent versions - update these when policies change
    private const string TERMS_VERSION = "1.0";
    private const string PRIVACY_VERSION = "1.0";
    private const string AI_PROCESSING_VERSION = "1.0";

    public ConsentController(
        IUserConsentService consentService,
        IAuditLogService auditLogService,
        ILogger<ConsentController> logger)
    {
        _consentService = consentService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// Record user consent for a specific type (TermsOfService, PrivacyPolicy, AIAnalysis)
    /// </summary>
    [HttpPost("record")]
    public async Task<IActionResult> RecordConsent([FromBody] RecordConsentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            await _consentService.RecordConsentAsync(
                userId,
                request.ConsentType,
                request.Version,
                request.Granted,
                ipAddress,
                userAgent,
                cancellationToken);

            // Audit log
            await _auditLogService.LogActionAsync(
                userId,
                request.Granted ? "Grant" : "Deny",
                "Consent",
                request.ConsentType,
                successful: true,
                ipAddress: ipAddress,
                userAgent: userAgent,
                additionalDetails: $"Version {request.Version}",
                cancellationToken: cancellationToken);

            return Ok(new { message = "Consent recorded successfully", timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording consent");
            return StatusCode(500, new { error = "Failed to record consent", details = ex.Message });
        }
    }

    /// <summary>
    /// Get all consent records for the current user
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetConsentHistory(CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var consents = await _consentService.GetAllUserConsentsAsync(userId, cancellationToken);
            return Ok(consents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving consent history");
            return StatusCode(500, new { error = "Failed to retrieve consent history", details = ex.Message });
        }
    }

    /// <summary>
    /// Check if user has valid consent for all required types
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetConsentStatus(CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var hasTerms = await _consentService.HasValidConsentAsync(userId, "TermsOfService", TERMS_VERSION, cancellationToken);
            var hasPrivacy = await _consentService.HasValidConsentAsync(userId, "PrivacyPolicy", PRIVACY_VERSION, cancellationToken);
            var hasAiProcessing = await _consentService.HasValidConsentAsync(userId, "AIAnalysis", AI_PROCESSING_VERSION, cancellationToken);

            return Ok(new
            {
                termsOfService = new { required = true, version = TERMS_VERSION, granted = hasTerms },
                privacyPolicy = new { required = true, version = PRIVACY_VERSION, granted = hasPrivacy },
                aiProcessing = new { required = true, version = AI_PROCESSING_VERSION, granted = hasAiProcessing },
                allGranted = hasTerms && hasPrivacy && hasAiProcessing
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking consent status");
            return StatusCode(500, new { error = "Failed to check consent status", details = ex.Message });
        }
    }

    /// <summary>
    /// Revoke a specific consent type
    /// </summary>
    [HttpPost("revoke")]
    public async Task<IActionResult> RevokeConsent([FromBody] RevokeConsentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

            await _consentService.RevokeConsentAsync(userId, request.ConsentType, cancellationToken);

            // Audit log
            await _auditLogService.LogActionAsync(
                userId,
                "Revoke",
                "Consent",
                request.ConsentType,
                successful: true,
                ipAddress: ipAddress,
                userAgent: userAgent,
                cancellationToken: cancellationToken);

            return Ok(new { message = "Consent revoked successfully", timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking consent");
            return StatusCode(500, new { error = "Failed to revoke consent", details = ex.Message });
        }
    }

    /// <summary>
    /// Get current required consent versions
    /// </summary>
    [HttpGet("versions")]
    [AllowAnonymous]
    public IActionResult GetConsentVersions()
    {
        return Ok(new
        {
            termsOfService = TERMS_VERSION,
            privacyPolicy = PRIVACY_VERSION,
            aiProcessing = AI_PROCESSING_VERSION
        });
    }
}

public class RecordConsentRequest
{
    public string ConsentType { get; set; } = string.Empty; // TermsOfService, PrivacyPolicy, AIAnalysis
    public string Version { get; set; } = string.Empty;
    public bool Granted { get; set; }
}

public class RevokeConsentRequest
{
    public string ConsentType { get; set; } = string.Empty;
}
