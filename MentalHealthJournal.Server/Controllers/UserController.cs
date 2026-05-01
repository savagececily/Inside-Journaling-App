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
        private readonly IStripeService _stripeService;
        private readonly ICosmosDbService _cosmosService;
        private readonly IBlobStorageService _blobService;
        private readonly IUserService _userService;

        public UserController(
            ILogger<UserController> logger, 
            IQuotaService quotaService, 
            IStripeService stripeService,
            ICosmosDbService cosmosService,
            IBlobStorageService blobService,
            IUserService userService)
        {
            _logger = logger;
            _quotaService = quotaService;
            _stripeService = stripeService;
            _cosmosService = cosmosService;
            _blobService = blobService;
            _userService = userService;
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
        /// Upgrade to premium via Stripe Checkout
        /// </summary>
        [HttpPost("upgrade")]
        public async Task<ActionResult> UpgradeToPremium(CancellationToken cancellationToken = default)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
            {
                return Unauthorized();
            }

            try
            {
                _logger.LogInformation("User {UserId} requested premium upgrade", userId);
                
                var checkoutUrl = await _stripeService.CreateCheckoutSessionAsync(userId, email, cancellationToken);
                
                return Ok(new { checkoutUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating checkout session for user {UserId}", userId);
                return StatusCode(500, "Unable to create checkout session. Please try again later.");
            }
        }

        /// <summary>
        /// Get Stripe Customer Portal URL for managing billing
        /// </summary>
        [HttpPost("portal")]
        public async Task<ActionResult> GetCustomerPortal(CancellationToken cancellationToken = default)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var portalUrl = await _stripeService.CreateCustomerPortalSessionAsync(userId, cancellationToken);
                return Ok(new { portalUrl });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "User {UserId} attempted to access portal without Stripe customer ID", userId);
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating portal session for user {UserId}", userId);
                return StatusCode(500, "Unable to access billing portal. Please try again later.");
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

        /// <summary>
        /// Delete user account and all associated data (GDPR/CCPA compliance)
        /// </summary>
        [HttpDelete("delete-account")]
        public async Task<ActionResult> DeleteAccount(CancellationToken cancellationToken = default)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                _logger.LogWarning("User {UserId} requested account deletion", userId);

                // 1. Delete all audio files from blob storage
                await _blobService.DeleteAllUserAudioAsync(userId, cancellationToken);

                // 2. Delete all journal entries from Cosmos DB
                await _cosmosService.DeleteAllUserEntriesAsync(userId, cancellationToken);

                // 3. Delete user quota data
                await _quotaService.DeleteUserQuotaAsync(userId, cancellationToken);

                // 4. Get user record for Stripe subscription info (before deleting)
                var user = await _userService.GetUserByIdAsync(userId);
                if (user != null && !string.IsNullOrEmpty(user.StripeSubscriptionId))
                {
                    // Note: You may want to add a CancelSubscriptionAsync method to IStripeService
                    _logger.LogInformation("User {UserId} had active subscription {SubscriptionId}", userId, user.StripeSubscriptionId);
                }

                // 5. Delete user record
                await _userService.DeleteUserAsync(userId, cancellationToken);

                _logger.LogInformation("Successfully deleted all data for user {UserId}", userId);

                return Ok(new
                {
                    success = true,
                    message = "Your account and all associated data have been permanently deleted."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting account for user {UserId}", userId);
                return StatusCode(500, "An error occurred while deleting your account. Please contact support.");
            }
        }
    }

    public class UpgradeRequest
    {
        public string? PaymentMethodId { get; set; }
        public string? SubscriptionType { get; set; } = "monthly"; // monthly, yearly, etc.
    }
}
