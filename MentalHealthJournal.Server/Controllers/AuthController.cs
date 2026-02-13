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

    public AuthController(
        IUserService userService,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _userService = userService;
        _configuration = configuration;
        _logger = logger;
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
                    LastLoginAt = DateTime.UtcNow,
                    DateOfBirth = request.DateOfBirth,
                    AgeVerified = request.DateOfBirth.HasValue && CalculateAge(request.DateOfBirth.Value) >= 13
                };
                
                // Use upsert to handle race conditions - if another request already created this user, it will update instead
                user = await _userService.CreateOrUpdateUserAsync(user);
                
                _logger.LogInformation("Created new user with deterministic ID: {UserId} for ProviderId: {ProviderId}", 
                    deterministicId, payload.Subject);
            }

            // Check if age verification is required
            bool requiresAgeVerification = !user.AgeVerified;

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
            expires: DateTime.UtcNow.AddMinutes(30), // 30-minute session timeout for compliance
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

            user.DateOfBirth = request.DateOfBirth;
            user.AgeVerified = true;
            await _userService.CreateOrUpdateUserAsync(user);

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
        // Normalize dateOfBirth to UTC date for consistent comparison
        // Preserve the date components (year, month, day) regardless of timezone
        var birthDateUtc = DateTime.SpecifyKind(dateOfBirth.Date, DateTimeKind.Utc);
        
        var today = DateTime.UtcNow.Date;
        var age = today.Year - birthDateUtc.Year;
        
        // Adjust if birthday hasn't occurred this year
        if (birthDateUtc > today.AddYears(-age))
        {
            age--;
        }
        
        return age;
    }
}
