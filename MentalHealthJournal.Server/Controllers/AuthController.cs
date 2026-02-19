using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MentalHealthJournal.Models;
using MentalHealthJournal.Services;

namespace MentalHealthJournal.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly IAccountDeletionService _accountDeletionService;

    public AuthController(
        IUserService userService,
        IConfiguration configuration,
        ILogger<AuthController> logger,
        IAccountDeletionService accountDeletionService)
    {
        _userService = userService;
        _configuration = configuration;
        _logger = logger;
        _accountDeletionService = accountDeletionService;
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleTokenRequest request)
    {
        try
        {
            _logger.LogInformation("Google login attempt");
            // Get Google Client ID from configuration
            var googleClientId = _configuration["Google:ClientId"];
            if (string.IsNullOrEmpty(googleClientId))
            {
                _logger.LogError("Google Client ID not configured");
                return StatusCode(500, "Google authentication not configured");
            }

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
                // Update last login
                user = existingUser;
                user.LastLoginAt = DateTime.UtcNow;
                
                // Ensure email and name are up to date from provider
                user.Email = payload.Email;
                user.Name = payload.Name;
                user.ProfilePictureUrl = payload.Picture;
                
                user = await _userService.CreateOrUpdateUserAsync(user);
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
                    LastLoginAt = DateTime.UtcNow
                };
                
                // Use upsert to handle race conditions - if another request already created this user, it will update instead
                user = await _userService.CreateOrUpdateUserAsync(user);
                
                _logger.LogInformation("Created new user with deterministic ID: {UserId} for ProviderId: {ProviderId}", 
                    deterministicId, payload.Subject);
            }

            // Generate JWT token
            var jwtToken = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Token = jwtToken,
                User = user
            });
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google token");
            return Unauthorized("Invalid Google token");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google authentication");
            return StatusCode(500, "Authentication failed");
        }
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

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];

        if (string.IsNullOrEmpty(jwtKey))
        {
            throw new InvalidOperationException("JWT Key not configured");
        }

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claimsList = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.userId), // Use userId (partition key) for consistency
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim("ProviderId", user.ProviderId),
            new Claim("Provider", user.Provider)
        };

        // Add admin role if user email is in the admin list
        if (IsAdminUser(user.Email))
        {
            claimsList.Add(new Claim(ClaimTypes.Role, "Admin"));
            _logger.LogInformation("Admin role granted to user: {Email}", user.Email);
        }

        var claims = claimsList.ToArray();

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private bool IsAdminUser(string email)
    {
        // Get admin emails from configuration (comma-separated)
        var adminEmails = _configuration["AdminEmails"];
        
        if (string.IsNullOrEmpty(adminEmails))
        {
            return false;
        }

        var adminList = adminEmails.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(e => e.Trim().ToLowerInvariant())
            .ToList();

        return adminList.Contains(email.ToLowerInvariant());
    }

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

    [HttpPost("request-deletion")]
    [Authorize]
    public async Task<ActionResult<RequestAccountDeletionResponse>> RequestAccountDeletion()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            _logger.LogInformation("Account deletion requested for user {UserId}", userIdClaim);

            // Create deletion token
            var deletionToken = await _accountDeletionService.RequestAccountDeletionAsync(userIdClaim);

            return Ok(new RequestAccountDeletionResponse
            {
                Message = "Account deletion requested. Please use the confirmation token to complete the deletion within 24 hours. This action is irreversible and will permanently delete all your journal entries, audio recordings, and account data.",
                ExpiresAt = deletionToken.ExpiresAt,
                ConfirmationToken = deletionToken.Token
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting account deletion");
            return StatusCode(500, "Failed to request account deletion");
        }
    }

    [HttpPost("confirm-deletion")]
    [Authorize]
    public async Task<ActionResult> ConfirmAccountDeletion([FromBody] ConfirmAccountDeletionRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(request.ConfirmationToken))
            {
                return BadRequest("Confirmation token is required");
            }

            _logger.LogInformation("Account deletion confirmation for user {UserId}", userIdClaim);

            // Validate the confirmation token
            var isValid = await _accountDeletionService.ValidateConfirmationTokenAsync(userIdClaim, request.ConfirmationToken);

            if (!isValid)
            {
                _logger.LogWarning("Invalid or expired confirmation token for user {UserId}", userIdClaim);
                return BadRequest("Invalid or expired confirmation token");
            }

            // Delete all user data
            await _accountDeletionService.DeleteAllUserDataAsync(userIdClaim);

            _logger.LogInformation("Account deletion completed for user {UserId}", userIdClaim);

            return Ok(new { message = "Your account and all associated data have been permanently deleted." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming account deletion");
            return StatusCode(500, "Failed to complete account deletion");
        }
    }
}
