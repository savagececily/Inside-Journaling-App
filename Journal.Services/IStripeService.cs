namespace Journal.Services;

public interface IStripeService
{
    /// <summary>
    /// Creates a Stripe Checkout session for upgrading to premium
    /// </summary>
    /// <param name="userId">The user's unique identifier</param>
    /// <param name="email">The user's email address</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The Stripe Checkout session URL</returns>
    Task<string> CreateCheckoutSessionAsync(string userId, string email, CancellationToken cancellationToken);

    /// <summary>
    /// Creates a Stripe Customer Portal session for managing billing
    /// </summary>
    /// <param name="userId">The user's unique identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The Stripe Customer Portal URL</returns>
    Task<string> CreateCustomerPortalSessionAsync(string userId, CancellationToken cancellationToken);

    /// <summary>
    /// Handles incoming Stripe webhook events
    /// </summary>
    /// <param name="payload">The raw webhook payload</param>
    /// <param name="signature">The Stripe signature header</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task HandleWebhookEventAsync(string payload, string signature, CancellationToken cancellationToken);
}
