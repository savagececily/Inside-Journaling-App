namespace Journal.Models
{
    /// <summary>
    /// Development-only sign-in that bypasses external identity providers.
    /// Never enable outside the development environment.
    /// </summary>
    public class DevAuthSettings
    {
        public bool Enabled { get; set; }
        public List<DevTestUser> TestUsers { get; set; } = new();
    }

    public class DevTestUser
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class DevLoginRequest
    {
        public string Id { get; set; } = string.Empty;
    }
}
