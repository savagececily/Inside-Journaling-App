using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Journal.Models;
using Journal.Services;
using Journal.Server.Services;
using System.Net.Http;
using System.Text.Json;

namespace Journal.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;
    private readonly IJwtTokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserService userService,
        IConfiguration configuration,
        IJwtTokenService tokenService,
        ILogger<AuthController> logger)
    {
        _userService = userService;
        _configuration = configuration;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleTokenRequest request)
    {
        try
        {
            // Log request details for debugging
            _logger.LogInformation("========== Google Login Request Received ==========");
            _logger.LogInformation("Request is null: {IsNull}", request == null);
            _logger.LogInformation("IdToken length: {TokenLength}", request?.IdToken?.Length ?? 0);
            _logger.LogInformation("IdToken is null or empty: {IsNullOrEmpty}", string.IsNullOrEmpty(request?.IdToken));
            _logger.LogInformation("DateOfBirth provided: {HasDateOfBirth}", request?.DateOfBirth.HasValue ?? false);
            
            // Log first 50 chars of token for debugging (not sensitive)
            if (request?.IdToken != null && request.IdToken.Length > 0)
            {
                var tokenPreview = request.IdToken.Length > 50 ? request.IdToken.Substring(0, 50) + "..." : request.IdToken;
                _logger.LogInformation("IdToken preview: {TokenPreview}", tokenPreview);
            }
            
            if (request == null || string.IsNullOrEmpty(request.IdToken))
            {
                _logger.LogWarning("❌ Google login request is null or IdToken is empty - returning BadRequest");
                return BadRequest(new { 
                    error = "IdToken is required", 
                    detail = "The request must include a valid Google ID token",
                    requestWasNull = request == null,
                    tokenWasEmpty = request == null || string.IsNullOrEmpty(request.IdToken)
                });
            }
            
            // Get Google Client ID from configuration
            var googleClientId = _configuration["Google:ClientId"];
            if (string.IsNullOrEmpty(googleClientId))
            {
                _logger.LogError("Google Client ID not configured");
                return StatusCode(500, "Google authentication not configured");
            }

            _logger.LogInformation("Validating token with Google Client ID: {ClientId}", googleClientId);
            
            // Validate the Google ID token
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { googleClientId }
            });

            if (payload == null)
            {
                _logger.LogWarning("Invalid Google token");
                return Unauthorized("Invalid Google token");
            }

            // Check if user exists
            var existingUser = await _userService.GetUserByProviderIdAsync(payload.Subject, "google");

            User user;
            if (existingUser != null)
            {
                _logger.LogInformation("🔍 Existing user RETRIEVED: UserId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}",
                    existingUser.userId, existingUser.DateOfBirth, existingUser.AgeVerified);
                
                // Update last login
                user = existingUser;
                user.LastLoginAt = DateTime.UtcNow;
                
                // Ensure email and name are up to date from provider
                user.Email = payload.Email;
                user.Name = payload.Name;
                user.ProfilePictureUrl = payload.Picture;
                
                _logger.LogInformation("👤 Before CreateOrUpdateUserAsync: UserId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}",
                    user.userId, user.DateOfBirth, user.AgeVerified);
                
                user = await _userService.CreateOrUpdateUserAsync(user);
                
                _logger.LogInformation("✅ After CreateOrUpdateUserAsync: UserId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}",
                    user.userId, user.DateOfBirth, user.AgeVerified);
            }
            else
            {
                // Create new user with deterministic ID to prevent duplicates
                // Use a hash of provider + providerId to ensure consistent userId across requests
                var deterministicId = GenerateDeterministicUserId("google", payload.Subject);
                
                user = new User
                {
                    id = deterministicId,
                    userId = deterministicId,
                    Email = payload.Email,
                    Name = payload.Name,
                    ProfilePictureUrl = payload.Picture,
                    Provider = "google",
                    ProviderId = payload.Subject,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow,
                    DateOfBirth = request.DateOfBirth,
                    AgeVerified = request.DateOfBirth.HasValue && CalculateAge(request.DateOfBirth.Value) >= 13
                };
                
                // Use upsert to handle race conditions - if another request already created this user, it will update instead
                user = await _userService.CreateOrUpdateUserAsync(user);
                
                _logger.LogInformation("Created new user with deterministic ID: {UserId} for ProviderId: {ProviderId}", 
                    deterministicId, payload.Subject);
            }

            // Check if age verification is required - user must have both DateOfBirth AND AgeVerified flag
            bool requiresAgeVerification = !user.AgeVerified || !user.DateOfBirth.HasValue;
            
            _logger.LogInformation("📤 Login response: UserId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}, RequiresAgeVerification={RequiresAgeVerification}",
                user.userId, user.DateOfBirth, user.AgeVerified, requiresAgeVerification);

            // Generate JWT token
            var jwtToken = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Token = jwtToken,
                User = user,
                RequiresAgeVerification = requiresAgeVerification
            });
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google token - this usually means Client ID mismatch. Token audience doesn't match backend's Google:ClientId");
            return Unauthorized(new { error = "Invalid Google token", detail = "Token validation failed - Client ID mismatch?" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google authentication: {Message}", ex.Message);
            return StatusCode(500, new { error = "Authentication failed", detail = ex.Message });
        }
    }

    [HttpPost("microsoft")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> MicrosoftLogin([FromBody] MicrosoftTokenRequest request)
    {
        try
        {
            _logger.LogInformation("========== Microsoft Login Request Received ==========");
            _logger.LogInformation("Request is null: {IsNull}", request == null);
            _logger.LogInformation("IdToken length: {TokenLength}", request?.IdToken?.Length ?? 0);
            _logger.LogInformation("DateOfBirth provided: {HasDateOfBirth}", request?.DateOfBirth.HasValue ?? false);

            if (request == null || string.IsNullOrEmpty(request.IdToken))
            {
                _logger.LogWarning("❌ Microsoft login request is null or IdToken is empty");
                return BadRequest(new
                {
                    error = "IdToken is required",
                    detail = "The request must include a valid Microsoft ID token"
                });
            }

            // Get Microsoft configuration
            string microsoftTenantId = _configuration["Microsoft:TenantId"] ?? "common";
            string microsoftClientId = _configuration["Microsoft:ClientId"];

            if (string.IsNullOrEmpty(microsoftClientId))
            {
                _logger.LogError("Microsoft Client ID not configured");
                return StatusCode(500, "Microsoft authentication not configured");
            }

            _logger.LogInformation("Validating Microsoft token with Client ID: {ClientId}, Tenant: {TenantId}", 
                microsoftClientId, microsoftTenantId);

            // Validate the Microsoft ID token
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(request.IdToken);

            // Get Microsoft's public keys for token validation
            string microsoftKeysUrl = $"https://login.microsoftonline.com/{microsoftTenantId}/discovery/v2.0/keys";
            using var httpClient = new HttpClient();
            string keysJson = await httpClient.GetStringAsync(microsoftKeysUrl);
            var keys = JsonSerializer.Deserialize<JsonElement>(keysJson);
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuers = new[]
                {
                    $"https://login.microsoftonline.com/{microsoftTenantId}/v2.0",
                    $"https://sts.windows.net/{microsoftTenantId}/"
                },
                ValidateAudience = true,
                ValidAudiences = new[] { microsoftClientId },
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = GetMicrosoftSigningKeys(keys)
            };

            ClaimsPrincipal claimsPrincipal;
            try
            {
                claimsPrincipal = handler.ValidateToken(request.IdToken, validationParameters, out _);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Invalid Microsoft token");
                return Unauthorized(new { error = "Invalid Microsoft token", detail = ex.Message });
            }

            // Extract claims from the validated token
            var claims = claimsPrincipal.Claims.ToDictionary(c => c.Type, c => c.Value);
            var subject = claims.GetValueOrDefault("sub") ?? claims.GetValueOrDefault("oid") ?? string.Empty;
            var email = claims.GetValueOrDefault("email") ?? claims.GetValueOrDefault("preferred_username") ?? string.Empty;
            var name = claims.GetValueOrDefault("name") ?? email;

            if (string.IsNullOrEmpty(subject))
            {
                _logger.LogWarning("No subject/oid found in Microsoft token");
                return Unauthorized("Invalid token: missing subject");
            }

            // Check if user exists
            var existingUser = await _userService.GetUserByProviderIdAsync(subject, "microsoft");

            User user;
            if (existingUser != null)
            {
                _logger.LogInformation("🔍 Existing user RETRIEVED: UserId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}",
                    existingUser.userId, existingUser.DateOfBirth, existingUser.AgeVerified);

                // Update last login
                user = existingUser;
                user.LastLoginAt = DateTime.UtcNow;

                // Ensure email and name are up to date from provider
                user.Email = email;
                user.Name = name;

                _logger.LogInformation("👤 Before CreateOrUpdateUserAsync: UserId={UserId}", user.userId);

                user = await _userService.CreateOrUpdateUserAsync(user);

                _logger.LogInformation("✅ After CreateOrUpdateUserAsync: UserId={UserId}", user.userId);
            }
            else
            {
                // Create new user with deterministic ID
                var deterministicId = GenerateDeterministicUserId("microsoft", subject);

                user = new User
                {
                    id = deterministicId,
                    userId = deterministicId,
                    Email = email,
                    Name = name,
                    Provider = "microsoft",
                    ProviderId = subject,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow,
                    DateOfBirth = request.DateOfBirth,
                    AgeVerified = request.DateOfBirth.HasValue && CalculateAge(request.DateOfBirth.Value) >= 13
                };

                user = await _userService.CreateOrUpdateUserAsync(user);

                _logger.LogInformation("Created new user with deterministic ID: {UserId} for ProviderId: {ProviderId}",
                    deterministicId, subject);
            }

            // Check if age verification is required
            bool requiresAgeVerification = !user.AgeVerified || !user.DateOfBirth.HasValue;

            _logger.LogInformation("📤 Login response: UserId={UserId}, RequiresAgeVerification={RequiresAgeVerification}",
                user.userId, requiresAgeVerification);

            // Generate JWT token
            var jwtTokenString = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Token = jwtTokenString,
                User = user,
                RequiresAgeVerification = requiresAgeVerification
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Microsoft authentication: {Message}", ex.Message);
            return StatusCode(500, new { error = "Authentication failed", detail = ex.Message });
        }
    }

    private IEnumerable<SecurityKey> GetMicrosoftSigningKeys(JsonElement keysJson)
    {
        var keys = new List<SecurityKey>();
        
        if (keysJson.TryGetProperty("keys", out var keysArray))
        {
            foreach (var key in keysArray.EnumerateArray())
            {
                if (key.TryGetProperty("x5c", out var x5cArray) && x5cArray.GetArrayLength() > 0)
                {
                    var x5c = x5cArray[0].GetString();
                    if (!string.IsNullOrEmpty(x5c))
                    {
                        var cert = new System.Security.Cryptography.X509Certificates.X509Certificate2(
                            Convert.FromBase64String(x5c));
                        keys.Add(new X509SecurityKey(cert));
                    }
                }
            }
        }
        
        return keys;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<User>> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            var providerId = User.FindFirst("ProviderId")?.Value;
            var provider = User.FindFirst("Provider")?.Value;

            if (string.IsNullOrEmpty(providerId) || string.IsNullOrEmpty(provider))
            {
                return Unauthorized();
            }

            var user = await _userService.GetUserByProviderIdAsync(providerId, provider);
            
            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, "Failed to get user information");
        }
    }

    [HttpPut("username")]
    [Authorize]
    public async Task<ActionResult<User>> UpdateUsername([FromBody] UpdateUsernameRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest("Username cannot be empty");
            }

            if (request.Username.Length < 3 || request.Username.Length > 20)
            {
                return BadRequest("Username must be between 3 and 20 characters");
            }

            // Validate username format and length: 3-20 chars, alphanumeric and underscores only
            if (!System.Text.RegularExpressions.Regex.IsMatch(request.Username, @"^[a-z0-9_]{3,20}$"))
            {
                return BadRequest("Username can only contain lowercase letters, numbers, and underscores");
            }

            // Check if username is available
            var isAvailable = await _userService.IsUsernameAvailableAsync(request.Username, userIdClaim);
            if (!isAvailable)
            {
                return BadRequest("Username is already taken");
            }

            // Get current user
            var user = await _userService.GetUserByIdAsync(userIdClaim);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Update username
            user.Username = request.Username;
            user = await _userService.CreateOrUpdateUserAsync(user);

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating username");
            return StatusCode(500, "Failed to update username");
        }
    }

    [HttpGet("username/check")]
    [Authorize]
    public async Task<ActionResult<bool>> CheckUsernameAvailability([FromQuery] string username)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAvailable = await _userService.IsUsernameAvailableAsync(username, userIdClaim);
            return Ok(new { available = isAvailable });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking username availability");
            return StatusCode(500, "Failed to check username availability");
        }
    }

    private string GenerateJwtToken(User user) => _tokenService.GenerateToken(user);

    private bool IsAdminUser(string email) => _tokenService.IsAdminUser(email);

    private string GenerateDeterministicUserId(string provider, string providerId)
    {
        // Create a deterministic GUID based on provider and providerId
        // This ensures the same user always gets the same userId, preventing duplicates
        var input = $"{provider}:{providerId}";
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
        
        // Use first 16 bytes of hash to create a GUID
        var guidBytes = new byte[16];
        Array.Copy(hash, guidBytes, 16);
        
        return new Guid(guidBytes).ToString();
    }

    [HttpPost("verify-age")]
    [Authorize]
    public async Task<IActionResult> VerifyAge([FromBody] AgeVerificationRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            _logger.LogInformation("🎂 Received age verification request: UserId={UserId}, DateOfBirth={DateOfBirth}",
                userId, request.DateOfBirth);

            // Calculate age
            int age = CalculateAge(request.DateOfBirth);
            
            if (age < 13)
            {
                _logger.LogWarning("Age verification failed for user {UserId}: Age {Age} is below minimum", userId, age);
                return BadRequest(new { error = "You must be at least 13 years old to use this service.", minimumAge = 13 });
            }

            // Update user with age verification
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            _logger.LogInformation("👤 User BEFORE update: UserId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}",
                user.userId, user.DateOfBirth, user.AgeVerified);

            user.DateOfBirth = request.DateOfBirth;
            user.AgeVerified = true;
            
            _logger.LogInformation("👤 User AFTER setting values: UserId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}",
                user.userId, user.DateOfBirth, user.AgeVerified);
            
            var updatedUser = await _userService.CreateOrUpdateUserAsync(user);
            
            _logger.LogInformation("✅ User AFTER save: UserId={UserId}, DateOfBirth={DateOfBirth}, AgeVerified={AgeVerified}",
                updatedUser.userId, updatedUser.DateOfBirth, updatedUser.AgeVerified);

            _logger.LogInformation("Age verified for user {UserId}: Age {Age}", userId, age);

            return Ok(new { message = "Age verified successfully", age, ageVerified = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying age");
            return StatusCode(500, new { error = "Failed to verify age" });
        }
    }

    private int CalculateAge(DateTime dateOfBirth)
    {
        // Use UTC for consistent age calculation regardless of server timezone
        // Extract date components only (year, month, day) for comparison
        var today = DateTime.UtcNow.Date;
        var birthDate = dateOfBirth.Date;
        
        var age = today.Year - birthDate.Year;
        
        // Adjust if birthday hasn't occurred this year
        if (birthDate.Month > today.Month || 
            (birthDate.Month == today.Month && birthDate.Day > today.Day))
        {
            age--;
        }
        
        return age;
    }

    /// <summary>
    /// Get or create user for Easy Auth (Azure App Service Authentication)
    /// This endpoint is called when the user is already authenticated via Easy Auth
    /// </summary>
    [HttpGet("easyauth/me")]
    [Authorize]
    public async Task<ActionResult<User>> GetOrCreateEasyAuthUser()
    {
        try
        {
            // User is already authenticated via Easy Auth middleware
            if (!User.Identity?.IsAuthenticated ?? true)
            {
                _logger.LogWarning("User is not authenticated via Easy Auth");
                return Unauthorized("Not authenticated via Easy Auth");
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var name = User.FindFirst(ClaimTypes.Name)?.Value;
            var provider = User.FindFirst("Provider")?.Value ?? "aad";
            var providerId = User.FindFirst("ProviderId")?.Value ?? userId;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(providerId))
            {
                _logger.LogError("Easy Auth: Missing required claims. UserId={UserId}, ProviderId={ProviderId}", userId, providerId);
                return BadRequest("Missing required user information from Easy Auth");
            }

            _logger.LogInformation("Easy Auth user request: UserId={UserId}, Email={Email}, Provider={Provider}", 
                userId, email, provider);

            // Check if user exists
            var existingUser = await _userService.GetUserByProviderIdAsync(providerId, provider);

            User user;
            if (existingUser != null)
            {
                _logger.LogInformation("Existing Easy Auth user found: UserId={UserId}", existingUser.userId);
                user = existingUser;
                user.LastLoginAt = DateTime.UtcNow;
                
                // Update email and name from Easy Auth if available
                if (!string.IsNullOrEmpty(email))
                {
                    user.Email = email;
                }
                if (!string.IsNullOrEmpty(name))
                {
                    user.Name = name;
                }
                
                await _userService.CreateOrUpdateUserAsync(user);
            }
            else
            {
                // Create new user
                _logger.LogInformation("Creating new Easy Auth user: ProviderId={ProviderId}, Provider={Provider}", providerId, provider);
                
                user = new User
                {
                    userId = Guid.NewGuid().ToString(),
                    ProviderId = providerId,
                    Provider = provider,
                    Email = email ?? $"{providerId}@{provider}.auth",
                    Name = name ?? "User",
                    ProfilePictureUrl = null,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow,
                    AgeVerified = false, // Will need to verify age
                    DateOfBirth = null
                };

                user = await _userService.CreateOrUpdateUserAsync(user);
                _logger.LogInformation("New Easy Auth user created: UserId={UserId}", user.userId);
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting or creating Easy Auth user");
            return StatusCode(500, new { error = "Failed to process Easy Auth login" });
        }
    }
}
