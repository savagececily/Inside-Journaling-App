using Journal.Models;

namespace Journal.Services;

public interface IUserConsentService
{
    public Task RecordConsentAsync(string userId, string consentType, string version, bool granted, string? ipAddress = null, string? userAgent = null, CancellationToken cancellationToken = default);
    public Task<UserConsent?> GetLatestConsentAsync(string userId, string consentType, CancellationToken cancellationToken = default);
    public Task<bool> HasValidConsentAsync(string userId, string consentType, string requiredVersion, CancellationToken cancellationToken = default);
    public Task<List<UserConsent>> GetAllUserConsentsAsync(string userId, CancellationToken cancellationToken = default);
    public Task RevokeConsentAsync(string userId, string consentType, CancellationToken cancellationToken = default);
}
