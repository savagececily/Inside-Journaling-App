namespace Journal.Models;

public class StripeSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string PriceId { get; set; } = string.Empty;
    public string PremiumPriceId { get; set; } = string.Empty;
    public string ProPriceId { get; set; } = string.Empty;
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;

    public string GetPriceIdForTier(UserTier tier)
    {
        return tier switch
        {
            UserTier.Pro => !string.IsNullOrEmpty(ProPriceId) ? ProPriceId : PriceId,
            UserTier.Premium => !string.IsNullOrEmpty(PremiumPriceId) ? PremiumPriceId : PriceId,
            _ => !string.IsNullOrEmpty(PremiumPriceId) ? PremiumPriceId : PriceId
        };
    }
}
