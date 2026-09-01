using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

namespace Journal.Server
{
    public static class RateLimitingExtensions
    {
        public static IServiceCollection AddRateLimiting(this IServiceCollection services)
        {
            services.AddRateLimiter(limiterOptions =>
            {
                // Limit journal entry creation to prevent abuse and control costs
                limiterOptions.AddFixedWindowLimiter(policyName: "journal-entries", configureOptions: options =>
                {
                    options.Window = TimeSpan.FromMinutes(1);
                    options.PermitLimit = 5; // Max 5 entries per minute per user
                    options.QueueLimit = 0; // No queueing
                });

                // More generous limit for read operations
                limiterOptions.AddFixedWindowLimiter(policyName: "journal-reads", configureOptions: options =>
                {
                    options.Window = TimeSpan.FromMinutes(1);
                    options.PermitLimit = 30; // Max 30 reads per minute
                    options.QueueLimit = 0;
                });

                // Limit for voice transcription (expensive operation)
                limiterOptions.AddFixedWindowLimiter(policyName: "voice-transcription", configureOptions: options =>
                {
                    options.Window = TimeSpan.FromMinutes(1);
                    options.PermitLimit = 3; // Max 3 transcriptions per minute
                    options.QueueLimit = 0;
                });

                limiterOptions.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    await context.HttpContext.Response.WriteAsJsonAsync(new
                    {
                        error = "Rate limit exceeded",
                        message = "You're making too many requests. Please wait a moment and try again.",
                        retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
                            ? retryAfter.TotalSeconds
                            : 60
                    }, cancellationToken: token);
                };
            });

            return services;
        }
    }
}
