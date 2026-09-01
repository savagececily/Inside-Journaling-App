using Stripe;
using Stripe.Checkout;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Journal.Models;

namespace Journal.Services;

public class StripeService : IStripeService
{
    private readonly ILogger<StripeService> _logger;
    private readonly IQuotaService _quotaService;
    private readonly IUserService _userService;
    private readonly StripeSettings _settings;

    public StripeService(
        ILogger<StripeService> logger,
        IQuotaService quotaService,
        IUserService userService,
        IOptions<StripeSettings> settings)
    {
        _logger = logger;
        _quotaService = quotaService;
        _userService = userService;
        _settings = settings.Value;
        
        StripeConfiguration.ApiKey = _settings.SecretKey;
    }

    public async Task<string> CreateCheckoutSessionAsync(string userId, string email, CancellationToken cancellationToken)
    {
        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    Price = _settings.PriceId,
                    Quantity = 1,
                }
            },
            SuccessUrl = $"{_settings.SuccessUrl}?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = _settings.CancelUrl,
            CustomerEmail = email,
            ClientReferenceId = userId, // Store userId for webhook processing
            Metadata = new Dictionary<string, string>
            {
                { "user_id", userId }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options, cancellationToken: cancellationToken);

        _logger.LogInformation("Created Stripe checkout session {SessionId} for user {UserId}", session.Id, userId);

        return session.Url;
    }

    public async Task<string> CreateCustomerPortalSessionAsync(string userId, CancellationToken cancellationToken)
    {
        // Get user's Stripe customer ID from database
        var user = await _userService.GetUserByIdAsync(userId);
        
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }
        
        if (string.IsNullOrEmpty(user.StripeCustomerId))
        {
            throw new InvalidOperationException("User does not have a Stripe customer ID");
        }

        var options = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = user.StripeCustomerId,
            ReturnUrl = "https://mentalhealthjournal.com/settings/billing",
        };

        var service = new Stripe.BillingPortal.SessionService();
        var session = await service.CreateAsync(options, cancellationToken: cancellationToken);

        return session.Url;
    }

    public async Task HandleWebhookEventAsync(string payload, string signature, CancellationToken cancellationToken)
    {
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                payload,
                signature,
                _settings.WebhookSecret
            );

            _logger.LogInformation("Processing Stripe webhook event: {EventType}", stripeEvent.Type);

            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                    await HandleCheckoutSessionCompletedAsync(stripeEvent, cancellationToken);
                    break;

                case "customer.subscription.created":
                case "customer.subscription.updated":
                    await HandleSubscriptionUpdatedAsync(stripeEvent, cancellationToken);
                    break;

                case "customer.subscription.deleted":
                    await HandleSubscriptionDeletedAsync(stripeEvent, cancellationToken);
                    break;

                case "invoice.payment_succeeded":
                    await HandleInvoicePaymentSucceededAsync(stripeEvent, cancellationToken);
                    break;

                case "invoice.payment_failed":
                    await HandleInvoicePaymentFailedAsync(stripeEvent, cancellationToken);
                    break;

                default:
                    _logger.LogInformation("Unhandled webhook event type: {EventType}", stripeEvent.Type);
                    break;
            }
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook processing failed");
            throw;
        }
    }

    private async Task HandleCheckoutSessionCompletedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var session = stripeEvent.Data.Object as Session;
        if (session == null) return;

        var userId = session.Metadata["user_id"];
        // Customer and Subscription can be either string IDs or expanded objects
        // Access the ID property which exists on both
        var customerId = session.Customer?.Id ?? session.CustomerId;
        var subscriptionId = session.Subscription?.Id ?? session.SubscriptionId;

        _logger.LogInformation("Checkout completed for user {UserId}, subscription {SubscriptionId}", userId, subscriptionId);

        // Update user record with Stripe IDs
        var user = await _userService.GetUserByIdAsync(userId);
        if (user != null)
        {
            user.StripeCustomerId = customerId;
            user.StripeSubscriptionId = subscriptionId;
            await _userService.CreateOrUpdateUserAsync(user);
        }

        // Activate premium (no expiration for active subscription)
        await _quotaService.UpgradeToPremiumAsync(userId, expiresAt: null, cancellationToken);
    }

    private async Task HandleSubscriptionUpdatedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        // Find user by subscription ID
        var user = await GetUserBySubscriptionIdAsync(subscription.Id);

        if (user == null)
        {
            _logger.LogWarning("No user found for subscription {SubscriptionId}", subscription.Id);
            return;
        }

        // Update premium status based on subscription state
        if (subscription.Status == "active")
        {
            // For active subscriptions, we don't set an expiration
            // The webhook will notify us if the subscription is cancelled or expires
            await _quotaService.UpgradeToPremiumAsync(user.userId, expiresAt: null, cancellationToken);
            _logger.LogInformation("Premium renewed for user {UserId} (active subscription)", user.userId);
        }
    }

    private async Task HandleSubscriptionDeletedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        var user = await GetUserBySubscriptionIdAsync(subscription.Id);

        if (user == null) return;

        await _quotaService.DowngradeToFreeAsync(user.userId, cancellationToken);
        _logger.LogInformation("Premium cancelled for user {UserId}", user.userId);
    }

    private Task HandleInvoicePaymentSucceededAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice == null) return Task.CompletedTask;

        _logger.LogInformation("Payment succeeded for invoice {InvoiceId}, amount: ${Amount}", 
            invoice.Id, invoice.AmountPaid / 100.0);
        
        // Optional: Send receipt email, update analytics, etc.
        return Task.CompletedTask;
    }

    private Task HandleInvoicePaymentFailedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice == null) return Task.CompletedTask;

        _logger.LogWarning("Payment failed for invoice {InvoiceId}", invoice.Id);
        
        // Optional: Send payment failure notification to user
        return Task.CompletedTask;
    }

    /// <summary>
    /// Helper method to find a user by their Stripe subscription ID
    /// </summary>
    private async Task<User?> GetUserBySubscriptionIdAsync(string subscriptionId)
    {
        return await _userService.GetUserByStripeSubscriptionIdAsync(subscriptionId);
    }
}
