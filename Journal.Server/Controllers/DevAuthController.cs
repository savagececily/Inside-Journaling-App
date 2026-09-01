using Journal.Models;
using Journal.Services;
using Journal.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

namespace Journal.Server.Controllers;

/// <summary>
/// Development-only sign-in used in place of an external identity provider.
/// Requires both a non-production host environment and DevAuth:Enabled, so it
/// cannot be switched on in production by configuration alone.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class DevAuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IJwtTokenService _tokenService;
    private readonly DevAuthSettings _settings;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DevAuthController> _logger;

    public DevAuthController(
        IUserService userService,
        IJwtTokenService tokenService,
        IOptions<DevAuthSettings> settings,
        IWebHostEnvironment environment,
        ILogger<DevAuthController> logger)
    {
        _userService = userService;
        _tokenService = tokenService;
        _settings = settings.Value;
        _environment = environment;
        _logger = logger;
    }

    private bool IsAvailable => _settings.Enabled && !_environment.IsProduction();

    [HttpGet("users")]
    public ActionResult<IEnumerable<DevTestUser>> GetTestUsers()
    {
        if (!IsAvailable)
        {
            return NotFound();
        }

        return Ok(_settings.TestUsers.Select(u => new DevTestUser
        {
            Id = u.Id,
            Email = u.Email,
            Name = u.Name,
            Description = u.Description
        }));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> DevLogin([FromBody] DevLoginRequest request, CancellationToken cancellationToken = default)
    {
        if (!IsAvailable)
        {
            return NotFound();
        }

        var testUser = _settings.TestUsers
            .FirstOrDefault(u => string.Equals(u.Id, request.Id, StringComparison.OrdinalIgnoreCase));

        if (testUser is null)
        {
            _logger.LogWarning("Dev login rejected for unknown test user id {Id}", request.Id);
            return Unauthorized(new { error = "Unknown test user" });
        }

        _logger.LogWarning("Dev login used for test user {Email} in environment {Environment}",
            testUser.Email, _environment.EnvironmentName);

        var userId = GenerateDeterministicUserId("dev", testUser.Id);
        var existing = await _userService.GetUserByProviderIdAsync(testUser.Id, "dev");

        User user;
        if (existing is not null)
        {
            user = existing;
            user.LastLoginAt = DateTime.UtcNow;
            user.Email = testUser.Email;
            user.Name = testUser.Name;
        }
        else
        {
            user = new User
            {
                id = userId,
                userId = userId,
                Email = testUser.Email,
                Name = testUser.Name,
                Provider = "dev",
                ProviderId = testUser.Id,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow,
                DateOfBirth = new DateTime(1990, 1, 1),
                AgeVerified = true
            };
        }

        user = await _userService.CreateOrUpdateUserAsync(user);

        return Ok(new AuthResponse
        {
            Token = _tokenService.GenerateToken(user),
            User = user,
            RequiresAgeVerification = false
        });
    }

    private static string GenerateDeterministicUserId(string provider, string providerId)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{provider}:{providerId}"));
        return new Guid(hash.AsSpan(0, 16).ToArray()).ToString();
    }
}
