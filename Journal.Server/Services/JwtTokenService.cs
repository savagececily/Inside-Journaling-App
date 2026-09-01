using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Journal.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Journal.Server.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
        bool IsAdminUser(string email);
    }

    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.userId),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim("ProviderId", user.ProviderId),
                new Claim("Provider", user.Provider)
            };

            if (IsAdminUser(user.Email))
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool IsAdminUser(string email)
        {
            var adminEmails = _configuration["AdminEmails"];

            if (string.IsNullOrEmpty(adminEmails))
            {
                return false;
            }

            return adminEmails
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Any(e => string.Equals(e, email, StringComparison.OrdinalIgnoreCase));
        }
    }
}
