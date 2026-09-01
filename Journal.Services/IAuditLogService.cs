using Journal.Models;

namespace Journal.Services;

public interface IAuditLogService
{
    Task LogActionAsync(
        string userId,
        string action,
        string resourceType,
        string resourceId,
        bool successful = true,
        string? errorMessage = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? additionalDetails = null,
        CancellationToken cancellationToken = default);

    Task<List<AuditLog>> GetUserAuditLogsAsync(string userId, int? limit = 100, CancellationToken cancellationToken = default);
}
