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

        public BlobStorageService(ILogger<BlobStorageService> logger, IOptions<AppSettings> configuration, BlobServiceClient blobServiceClient)
        {
            _logger = logger;
            _blobServiceClient = blobServiceClient;
            _audioContainerName = configuration.Value.AzureBlobStorage.ContainerName ?? throw new ArgumentNullException("AzureBlobStorage:ContainerName");
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

        public async Task DeleteAudioAsync(string blobUrl, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrEmpty(blobUrl))
                {
                    throw new ArgumentException("Blob URL is null or empty");
                }

                _logger.LogInformation("Deleting audio file from blob storage: {BlobUrl}", blobUrl);

                // Extract blob name from URL
                var uri = new Uri(blobUrl);
                var blobName = uri.AbsolutePath.TrimStart('/');
                
                // Remove container name from path if present
                if (blobName.StartsWith(_audioContainerName + "/"))
                {
                    blobName = blobName.Substring(_audioContainerName.Length + 1);
                }

                BlobContainerClient containerClient = _blobServiceClient.GetBlobContainerClient(_audioContainerName);
                BlobClient blobClient = containerClient.GetBlobClient(blobName);

                await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);

                _logger.LogInformation("Successfully deleted audio file from blob storage: {BlobUrl}", blobUrl);
            }
            catch (Azure.RequestFailedException ex)
            {
                _logger.LogError(ex, "Azure Storage error deleting audio file {BlobUrl}. Status: {Status}", blobUrl, ex.Status);
                throw new InvalidOperationException($"Failed to delete audio file: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting audio file from blob storage: {BlobUrl}", blobUrl);
                throw;
            }
        }

    }
}
