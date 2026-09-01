using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace Journal.Server
{
    /// <summary>
    /// Middleware to support Azure App Service Easy Auth (Authentication/Authorization)
    /// Reads X-MS-CLIENT-PRINCIPAL header and creates ClaimsPrincipal for the authenticated user
    /// </summary>
    public class EasyAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<EasyAuthMiddleware> _logger;

        public EasyAuthMiddleware(RequestDelegate next, ILogger<EasyAuthMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Check if Easy Auth headers are present
            var clientPrincipalHeader = context.Request.Headers["X-MS-CLIENT-PRINCIPAL"].FirstOrDefault();
            
            if (!string.IsNullOrEmpty(clientPrincipalHeader))
            {
                try
                {
                    // Decode the base64-encoded JSON
                    var decoded = Convert.FromBase64String(clientPrincipalHeader);
                    var json = Encoding.UTF8.GetString(decoded);
                    var clientPrincipal = JsonSerializer.Deserialize<ClientPrincipal>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (clientPrincipal != null && !string.IsNullOrEmpty(clientPrincipal.UserId))
                    {
                        var claims = new List<Claim>
                        {
                            new Claim(ClaimTypes.NameIdentifier, clientPrincipal.UserId),
                            new Claim("ProviderId", clientPrincipal.UserId),
                            new Claim("Provider", clientPrincipal.IdentityProvider ?? "aad")
                        };

                        // Add user name if available
                        if (!string.IsNullOrEmpty(clientPrincipal.UserDetails))
                        {
                            claims.Add(new Claim(ClaimTypes.Name, clientPrincipal.UserDetails));
                        }

                        // Add all claims from Easy Auth
                        if (clientPrincipal.Claims != null)
                        {
                            foreach (var claim in clientPrincipal.Claims)
                            {
                                if (claim.Type == "emails" && !string.IsNullOrEmpty(claim.Value))
                                {
                                    claims.Add(new Claim(ClaimTypes.Email, claim.Value));
                                }
                                else if (claim.Type == "name" && !string.IsNullOrEmpty(claim.Value))
                                {
                                    claims.Add(new Claim(ClaimTypes.Name, claim.Value));
                                }
                            }
                        }

                        var identity = new ClaimsIdentity(claims, "EasyAuth");
                        var principal = new ClaimsPrincipal(identity);
                        context.User = principal;

                        _logger.LogInformation("Easy Auth user authenticated: UserId={UserId}, Provider={Provider}", 
                            clientPrincipal.UserId, clientPrincipal.IdentityProvider);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error parsing Easy Auth principal from X-MS-CLIENT-PRINCIPAL header");
                }
            }

            await _next(context);
        }

        private class ClientPrincipal
        {
            public string? IdentityProvider { get; set; }
            public string? UserId { get; set; }
            public string? UserDetails { get; set; }
            public List<ClientPrincipalClaim>? Claims { get; set; }
        }

        private class ClientPrincipalClaim
        {
            public string Type { get; set; } = string.Empty;
            public string Value { get; set; } = string.Empty;
        }
    }
}
