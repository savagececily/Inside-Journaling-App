namespace Journal.Models;

public class GoogleTokenRequest
{
    public string IdToken { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; } // Optional - for new users
}

public class MicrosoftTokenRequest
{
    public string IdToken { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; } // Optional - for new users
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public User User { get; set; } = null!;
    public bool RequiresAgeVerification { get; set; } = false;
}

public class AgeVerificationRequest
{
    public DateTime DateOfBirth { get; set; }
}
