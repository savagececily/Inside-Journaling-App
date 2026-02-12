using Azure.Storage.Blobs;
using MentalHealthJournal.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MentalHealthJournal.Services
{
    public class BlobStorageService : IBlobStorageService
    {
        private readonly ILogger<BlobStorageService> _logger;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _audioContainerName;
        private readonly IAuditLogService? _auditLogService;

        public BlobStorageService(ILogger<BlobStorageService> logger, IOptions<AppSettings> configuration, BlobServiceClient blobServiceClient, IAuditLogService? auditLogService = null)
        {
            _logger = logger;
            _blobServiceClient = blobServiceClient;
            _audioContainerName = configuration.Value.AzureBlobStorage.ContainerName ?? throw new ArgumentNullException("AzureBlobStorage:ContainerName");
            _auditLogService = auditLogService;
        }


        public async Task<string> UploadAudioAsync(IFormFile audioFile, string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                if (audioFile == null || audioFile.Length == 0)
                {
                    throw new ArgumentException("Audio file is null or empty");
                }

                string blobName = $"{userId}/{Guid.NewGuid()}{Path.GetExtension(audioFile.FileName)}";
                _logger.LogInformation("Uploading audio file to blob storage: {BlobName}", blobName);
                
                BlobContainerClient containerClient = _blobServiceClient.GetBlobContainerClient(_audioContainerName);
                await containerClient.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

                BlobClient blobClient = containerClient.GetBlobClient(blobName);

                using var stream = audioFile.OpenReadStream();
                var uploadOptions = new Azure.Storage.Blobs.Models.BlobUploadOptions
                {
                    HttpHeaders = new Azure.Storage.Blobs.Models.BlobHttpHeaders
                    {
                        ContentType = audioFile.ContentType
                    }
                };

                await blobClient.UploadAsync(stream, uploadOptions, cancellationToken: cancellationToken);

                _logger.LogInformation("Successfully uploaded audio file to blob storage: {BlobUrl}", blobClient.Uri);
                
                // Audit log
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        userId,
                        "Create",
                        "AudioFile",
                        blobName,
                        successful: true,
                        cancellationToken: cancellationToken);
                }
                
                return blobClient.Uri.ToString();
            }
            catch (Azure.RequestFailedException ex)
            {
                _logger.LogError(ex, "Azure Storage error uploading audio file for user {UserId}. Status: {Status}", userId, ex.Status);
                throw new InvalidOperationException($"Failed to upload audio file: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading audio file to blob storage for user: {UserId}", userId);
                throw;
            }
        }
        
        public async Task<int> DeleteAllUserAudioAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Deleting all audio files for user {UserId}", userId);
                
                BlobContainerClient containerClient = _blobServiceClient.GetBlobContainerClient(_audioContainerName);
                int deletedCount = 0;
                
                // List all blobs in the user's folder
                await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: $"{userId}/", cancellationToken: cancellationToken))
                {
                    BlobClient blobClient = containerClient.GetBlobClient(blobItem.Name);
                    await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
                    deletedCount++;
                    _logger.LogInformation("Deleted blob: {BlobName}", blobItem.Name);
                }
                
                _logger.LogInformation("Deleted {Count} audio files for user {UserId}", deletedCount, userId);
                
                // Audit log
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        userId,
                        "Delete",
                        "AudioFile",
                        "All",
                        successful: true,
                        additionalDetails: $"Deleted {deletedCount} audio files during account deletion",
                        cancellationToken: cancellationToken);
                }
                
                return deletedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting audio files for user {UserId}", userId);
                throw;
            }
        }

    }
}
