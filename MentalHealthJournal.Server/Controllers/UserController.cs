using MentalHealthJournal.Models;
using MentalHealthJournal.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace MentalHealthJournal.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly IQuotaService _quotaService;

        public UserController(ILogger<UserController> logger, IQuotaService quotaService)
        {
            _logger = logger;
            _quotaService = quotaService;
        }

        /// <summary>
        /// Get current user's quota information
        /// </summary>
        [HttpGet("quota")]
        public async Task<ActionResult<object>> GetQuota(CancellationToken cancellationToken = default)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var quota = await _quotaService.GetUserQuotaAsync(userId, cancellationToken);
                
                return Ok(new
                {
                    tier = quota.Tier.ToString().ToLower(),
                    isPremium = quota.IsPremiumActive,
                    premiumExpiresAt = quota.PremiumExpiresAt,
                    usage = new
                    {
                        entries = new
                        {
                            used = quota.EntriesThisMonth,
                            limit = quota.AIAnalysisQuotaLimit,
                            remaining = Math.Max(0, quota.AIAnalysisQuotaLimit - quota.EntriesThisMonth),
                            percentUsed = quota.AIAnalysisQuotaLimit > 0 
                                ? (int)((quota.EntriesThisMonth / (double)quota.AIAnalysisQuotaLimit) * 100)
                                : 0
                        },
                        voice = new
                        {
                            used = quota.VoiceEntriesThisMonth,
                            limit = quota.VoiceQuotaLimit,
                            remaining = Math.Max(0, quota.VoiceQuotaLimit - quota.VoiceEntriesThisMonth),
                            percentUsed = quota.VoiceQuotaLimit > 0 
                                ? (int)((quota.VoiceEntriesThisMonth / (double)quota.VoiceQuotaLimit) * 100)
                                : 0
                        }
                    },
                    resetDate = new DateTime(quota.LastReset.Year, quota.LastReset.Month, 1).AddMonths(1)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving quota for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving your quota information.");
            }
        }

        /// <summary>
        /// Get current user's token usage for this month
        /// </summary>
        [HttpGet("usage")]
        public async Task<ActionResult<object>> GetUsage(CancellationToken cancellationToken = default)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var usageRecords = await _quotaService.GetMonthlyTokenUsageAsync(userId, cancellationToken);
                
                var summary = new
                {
                    totalTokens = usageRecords.Sum(u => u.TotalTokens),
                    totalCost = usageRecords.Sum(u => u.EstimatedCost),
                    breakdown = usageRecords
                        .GroupBy(u => u.Operation)
                        .Select(g => new
                        {
                            operation = g.Key,
                            tokens = g.Sum(u => u.TotalTokens),
                            cost = g.Sum(u => u.EstimatedCost),
                            count = g.Count()
                        })
                        .OrderByDescending(x => x.cost)
                        .ToList(),
                    recentActivity = usageRecords
                        .Take(10)
                        .Select(u => new
                        {
                            timestamp = u.Timestamp,
                            operation = u.Operation,
                            tokens = u.TotalTokens,
                            cost = u.EstimatedCost,
                            model = u.Model
                        })
                        .ToList()
                };
                
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving usage for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving your usage information.");
            }
        }

        /// <summary>
        /// Upgrade to premium (placeholder - integrate with payment system)
        /// </summary>
        [HttpPost("upgrade")]
        public async Task<ActionResult> UpgradeToPremium([FromBody] UpgradeRequest? request, CancellationToken cancellationToken = default)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                // TODO: Integrate with payment provider (Stripe, etc.)
                // For now, this is a placeholder that grants premium access
                
                _logger.LogInformation("User {UserId} requested premium upgrade", userId);
                
                // Set premium expiration to 1 month from now (for monthly subscription)
                var expiresAt = DateTime.UtcNow.AddMonths(1);
                
                await _quotaService.UpgradeToPremiumAsync(userId, expiresAt, cancellationToken);
                
                _logger.LogInformation("User {UserId} upgraded to premium (expires: {Expires})", userId, expiresAt);
                
                return Ok(new
                {
                    success = true,
                    message = "Successfully upgraded to Premium!",
                    tier = "premium",
                    expiresAt = expiresAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upgrading user {UserId} to premium", userId);
                return StatusCode(500, "An error occurred while processing your upgrade.");
            }
        }

        /// <summary>
        /// Downgrade to free tier
        /// </summary>
        [HttpPost("downgrade")]
        public async Task<ActionResult> DowngradeToFree(CancellationToken cancellationToken = default)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                await _quotaService.DowngradeToFreeAsync(userId, cancellationToken);
                
                _logger.LogInformation("User {UserId} downgraded to free tier", userId);
                
                return Ok(new
                {
                    success = true,
                    message = "Successfully downgraded to Free tier.",
                    tier = "free"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downgrading user {UserId} to free", userId);
                return StatusCode(500, "An error occurred while processing your downgrade.");
            }
        }
    }

    public class UpgradeRequest
    {
        public string? PaymentMethodId { get; set; }
        public string? SubscriptionType { get; set; } = "monthly"; // monthly, yearly, etc.
    }
}
