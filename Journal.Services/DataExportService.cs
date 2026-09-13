using Journal.Models;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace Journal.Services
{
    public class DataExportService : IDataExportService
    {
        private readonly ILogger<DataExportService> _logger;
        private readonly ICosmosDbService _cosmosService;
        private readonly IUserService _userService;
        private readonly IChatService? _chatService;

        public DataExportService(
            ILogger<DataExportService> logger,
            ICosmosDbService cosmosService,
            IUserService userService,
            IChatService? chatService = null)
        {
            _logger = logger;
            _cosmosService = cosmosService;
            _userService = userService;
            _chatService = chatService;
        }

        public async Task<string> ExportToJsonAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Exporting data to JSON for user {UserId}", userId);

                // Get user data
                var user = await _userService.GetUserByIdAsync(userId);
                var entries = await _cosmosService.GetEntriesForUserAsync(userId, cancellationToken);

                var chatExport = new List<object>();
                if (_chatService != null)
                {
                    var summaries = await _chatService.GetUserSessionsAsync(userId);
                    foreach (var s in summaries)
                    {
                        var fullSession = await _chatService.GetSessionAsync(userId, s.id);
                        if (fullSession != null)
                        {
                            chatExport.Add(new
                            {
                                id = fullSession.id,
                                title = fullSession.Title,
                                createdAt = fullSession.CreatedAt,
                                lastMessageAt = fullSession.LastMessageAt,
                                messages = fullSession.Messages.Select(m => new
                                {
                                    role = m.Role,
                                    content = m.Content,
                                    timestamp = m.Timestamp
                                }).ToList()
                            });
                        }
                    }
                }

                // Create export object
                var exportData = new
                {
                    ExportDate = DateTime.UtcNow,
                    User = new
                    {
                        UserId = user?.ProviderId,
                        Provider = user?.Provider,
                        Username = user?.Username,
                        Email = user?.Email
                    },
                    TotalEntries = entries.Count,
                    TotalChatSessions = chatExport.Count,
                    Entries = entries.Select(e => new
                    {
                        e.id,
                        Date = e.Timestamp,
                        e.Text,
                        e.IsVoiceEntry,
                        e.AudioBlobUrl,
                        e.Sentiment,
                        SentimentConfidence = e.SentimentScore,
                        e.KeyPhrases,
                        e.Summary,
                        e.Affirmation
                    }).ToList(),
                    ChatSessions = chatExport
                };

                var options = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };

                string json = JsonSerializer.Serialize(exportData, options);
                _logger.LogInformation("Successfully exported {Count} entries to JSON for user {UserId}", entries.Count, userId);

                return json;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting data to JSON for user {UserId}", userId);
                throw;
            }
        }

        public async Task<string> ExportToCsvAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Exporting data to CSV for user {UserId}", userId);

                var entries = await _cosmosService.GetEntriesForUserAsync(userId, cancellationToken);

                var csv = new StringBuilder();
                
                // Header
                csv.AppendLine("Entry ID,Date,Text,Is Voice Entry,Audio URL,Sentiment,Sentiment Score,Key Phrases,Summary,Affirmation");

                // Data rows
                foreach (var entry in entries)
                {
                    csv.AppendLine(
                        $"\"{entry.id}\"," +
                        $"\"{entry.Timestamp:yyyy-MM-dd HH:mm:ss}\"," +
                        $"\"{EscapeCsv(entry.Text)}\"," +
                        $"\"{entry.IsVoiceEntry}\"," +
                        $"\"{entry.AudioBlobUrl}\"," +
                        $"\"{entry.Sentiment}\"," +
                        $"\"{entry.SentimentScore:F4}\"," +
                        $"\"{string.Join("; ", entry.KeyPhrases)}\"," +
                        $"\"{EscapeCsv(entry.Summary)}\"," +
                        $"\"{EscapeCsv(entry.Affirmation)}\""
                    );
                }

                _logger.LogInformation("Successfully exported {Count} entries to CSV for user {UserId}", entries.Count, userId);

                return csv.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting data to CSV for user {UserId}", userId);
                throw;
            }
        }

        private static string EscapeCsv(string? value)
        {
            if (string.IsNullOrEmpty(value))
                return string.Empty;

            // Escape quotes and remove newlines for CSV compatibility
            return value.Replace("\"", "\"\"").Replace("\n", " ").Replace("\r", "");
        }
    }
}
