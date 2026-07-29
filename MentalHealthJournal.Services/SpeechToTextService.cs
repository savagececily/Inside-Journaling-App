using Azure.Core;
using Azure.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MentalHealthJournal.Models;

namespace MentalHealthJournal.Services
{
    public class SpeechToTextService: ISpeechToTextService
    {
        private readonly ILogger<SpeechToTextService> _logger;
        private readonly string _speechEndpoint;
        private readonly string _region;
        private readonly string? _managedIdentityClientId;

        public SpeechToTextService(ILogger<SpeechToTextService> logger, IOptions<AppSettings> configuration)
        {
            _logger = logger;
            // Use Azure AI Foundry Hub endpoint for Speech-to-Text
            _speechEndpoint = configuration.Value.AzureOpenAI.Endpoint ?? throw new ArgumentNullException("AzureOpenAI:Endpoint");
            _region = configuration.Value.AzureCognitiveServices.Region ?? "eastus";
            _managedIdentityClientId = configuration.Value.ManagedIdentityClientId;
        }

        public async Task<string> TranscribeAsync(IFormFile audioFile, CancellationToken cancellationToken = default)
        {
            try
            {
                // Use managed identity authentication with Foundry Hub endpoint
                var speechConfig = SpeechConfig.FromEndpoint(new Uri(_speechEndpoint));
                
                // Set up managed identity authentication
                if (!string.IsNullOrEmpty(_managedIdentityClientId))
                {
                    var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
                    {
                        ManagedIdentityClientId = _managedIdentityClientId
                    });
                    var tokenRequestContext = new TokenRequestContext(new[] { "https://cognitiveservices.azure.com/.default" });
                    var token = await credential.GetTokenAsync(tokenRequestContext, cancellationToken);
                    speechConfig.AuthorizationToken = token.Token;
                }
                
                var config = speechConfig;
                config.SpeechRecognitionLanguage = "en-US";

                using var stream = audioFile.OpenReadStream();
                using var audioInput = AudioConfig.FromStreamInput(new BinaryAudioStreamReader(stream));
                using var recognizer = new SpeechRecognizer(config, audioInput);

                _logger.LogInformation("Starting speech recognition for audio file: {FileName}", audioFile.FileName);

                var result = await recognizer.RecognizeOnceAsync();
                
                if (result.Reason == ResultReason.RecognizedSpeech)
                {
                    _logger.LogInformation("Speech recognition successful. Transcribed text length: {Length}", result.Text.Length);
                    return result.Text;
                }
                else if (result.Reason == ResultReason.NoMatch)
                {
                    _logger.LogWarning("No speech could be recognized from audio file: {FileName}", audioFile.FileName);
                    return string.Empty;
                }
                else if (result.Reason == ResultReason.Canceled)
                {
                    var cancellation = CancellationDetails.FromResult(result);
                    _logger.LogError("Speech recognition was canceled. Reason: {Reason}, Details: {ErrorDetails}", 
                        cancellation.Reason, cancellation.ErrorDetails);
                    
                    if (cancellation.Reason == CancellationReason.Error)
                    {
                        throw new InvalidOperationException($"Speech recognition failed: {cancellation.ErrorDetails}");
                    }
                }
                
                return string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during speech recognition for file: {FileName}", audioFile.FileName);
                throw;
            }
        }

        private class BinaryAudioStreamReader : PullAudioInputStreamCallback
        {
            private readonly Stream _stream;
            private bool _disposed;

            public BinaryAudioStreamReader(Stream stream)
            {
                _stream = stream ?? throw new ArgumentNullException(nameof(stream));
            }

            public override int Read(byte[] dataBuffer, uint size)
            {
                if (_disposed)
                    throw new ObjectDisposedException(nameof(BinaryAudioStreamReader));
                    
                return _stream.Read(dataBuffer, 0, (int)size);
            }

            public override void Close()
            {
                if (!_disposed)
                {
                    _disposed = true;
                    // Don't close the stream here - it's managed by the caller
                    base.Close();
                }
            }

            protected override void Dispose(bool disposing)
            {
                if (!_disposed && disposing)
                {
                    _disposed = true;
                    // Don't dispose the stream - it's managed by the caller
                }
                base.Dispose(disposing);
            }
        }
    }
}

