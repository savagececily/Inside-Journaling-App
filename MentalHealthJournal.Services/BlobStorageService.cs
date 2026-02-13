using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
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
            _logger.LogInformation("Deleting all audio files for user {UserId}", userId);
            
            BlobContainerClient containerClient = _blobServiceClient.GetBlobContainerClient(_audioContainerName);
            
            // Collect all blob URIs to delete
            var blobsToDelete = new List<BlobClient>();
            await foreach (var blobItem in containerClient.GetBlobsAsync(prefix: $"{userId}/", cancellationToken: cancellationToken))
            {
                BlobClient blobClient = containerClient.GetBlobClient(blobItem.Name);
                blobsToDelete.Add(blobClient);
            }
            
            int totalBlobs = blobsToDelete.Count;
            _logger.LogInformation("Found {Count} audio files to delete for user {UserId}", totalBlobs, userId);
            
            if (totalBlobs == 0)
            {
                _logger.LogInformation("No audio files found for user {UserId}", userId);
                return 0;
            }
            
            // Use parallel deletion with controlled concurrency (max 10 concurrent deletions)
            const int maxConcurrency = 10;
            int deletedCount = 0;
            int failedCount = 0;
            
            using var semaphore = new SemaphoreSlim(maxConcurrency, maxConcurrency);
            var deletionTasks = blobsToDelete.Select(async blobClient =>
            {
                await semaphore.WaitAsync(cancellationToken);
                try
                {
                    await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
                    Interlocked.Increment(ref deletedCount);
                }
                catch (Exception ex)
                {
                    Interlocked.Increment(ref failedCount);
                    _logger.LogError(ex, "Failed to delete blob {BlobName} for user {UserId}", blobClient.Name, userId);
                }
                finally
                {
                    semaphore.Release();
                }
            }).ToArray();
            
            // Wait for all deletions to complete
            await Task.WhenAll(deletionTasks);
            
            _logger.LogInformation("Deletion complete for user {UserId}: {DeletedCount} deleted, {FailedCount} failed out of {TotalCount} total", 
                userId, deletedCount, failedCount, totalBlobs);
            
            // If any deletions failed, log audit entry and throw exception
            if (failedCount > 0)
            {
                if (_auditLogService != null)
                {
                    await _auditLogService.LogActionAsync(
                        userId,
                        "Delete",
                        "AudioFile",
                        "Partial",
                        successful: false,
                        additionalDetails: $"Deleted {deletedCount} of {totalBlobs} files, {failedCount} failed",
                        cancellationToken: cancellationToken);
                }
                
                throw new InvalidOperationException($"Failed to delete all audio files. Successfully deleted {deletedCount} of {totalBlobs} files, {failedCount} failed.");
            }
            
            // Audit log successful deletion
            if (_auditLogService != null)
            {
                await _auditLogService.LogActionAsync(
                    userId,
                    "Delete",
                    "AudioFile",
                    "All",
                    successful: true,
                    additionalDetails: $"Deleted {deletedCount} audio files using parallel operations",
                    cancellationToken: cancellationToken);
            }
            
            _logger.LogInformation("Successfully deleted {Count} audio files for user {UserId}", deletedCount, userId);
            return deletedCount;
        }

    }
}
