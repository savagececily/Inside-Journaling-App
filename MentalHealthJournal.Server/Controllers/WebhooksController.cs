using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MentalHealthJournal.Services;

namespace MentalHealthJournal.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly ILogger<WebhooksController> _logger;
    private readonly IStripeService _stripeService;

    public WebhooksController(ILogger<WebhooksController> logger, IStripeService stripeService)
    {
        _logger = logger;
        _stripeService = stripeService;
    }

    /// <summary>
    /// Stripe webhook endpoint for payment events
    /// </summary>
    [HttpPost("stripe")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleStripeWebhook(CancellationToken cancellationToken = default)
    {
        var payload = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].ToString();

        if (string.IsNullOrEmpty(signature))
        {
            _logger.LogWarning("Stripe webhook received without signature");
            return BadRequest("No signature provided");
        }

        try
        {
            await _stripeService.HandleWebhookEventAsync(payload, signature, cancellationToken);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Webhook processing failed");
            return BadRequest("Webhook processing failed");
        }
    }
}
