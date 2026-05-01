using Azure.AI.TextAnalytics;
using MentalHealthJournal.Models;
using Microsoft.Extensions.Logging;
using OpenAI;
using OpenAI.Chat;
using Azure;
using System.ClientModel;
using Azure.AI.OpenAI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Polly;

namespace MentalHealthJournal.Services
{
    public class JournalAnalysisService : IJournalAnalysisService
    {
        // Crisis keywords for pre-screening (cost optimization)
        private static readonly HashSet<string> CrisisKeywords = new(StringComparer.OrdinalIgnoreCase)
        {
            "suicide", "suicidal", "kill myself", "end it all", "end my life",
            "no reason to live", "better off dead", "want to die",
            "self-harm", "self harm", "hurt myself", "cut myself",
            "don't want to exist", "wish I was dead", "plan to die",
            "overdose", "jump off", "hang myself"
        };

        private readonly ILogger<JournalAnalysisService> _logger;
        private readonly TextAnalyticsClient _textClient;
        private readonly AzureOpenAIClient _openAIClient;
        private readonly IQuotaService? _quotaService;
        private readonly string _openAIDeployment;
        private readonly string _affirmationDeployment;
        private readonly string _crisisDeployment;
        private readonly ResiliencePipeline _cognitiveServicesRetryPipeline;
        private readonly ResiliencePipeline _openAIRetryPipeline;
        private string? _currentUserId;
        private string? _currentEntryId;

        public JournalAnalysisService(ILogger<JournalAnalysisService> logger,
            TextAnalyticsClient textClient,
            AzureOpenAIClient openAIClient,
            IOptions<AppSettings> configuration,
            IQuotaService? quotaService = null)
        {
            _logger = logger;
            _textClient = textClient;
            _openAIClient = openAIClient;
            _quotaService = quotaService;
            
            // Support both old single deployment and new cost-optimized dual deployment approach
            var config = configuration.Value.AzureOpenAI;
            _openAIDeployment = config.DeploymentName ?? throw new ArgumentNullException("AzureOpenAI:DeploymentName");
            
            // Use dedicated deployments if configured, otherwise fall back to main deployment
            _affirmationDeployment = !string.IsNullOrEmpty(config.AffirmationDeploymentName) 
                ? config.AffirmationDeploymentName 
                : _openAIDeployment;
            _crisisDeployment = !string.IsNullOrEmpty(config.CrisisDeploymentName) 
                ? config.CrisisDeploymentName 
                : _openAIDeployment;
            
            _logger.LogInformation("OpenAI deployments - Affirmation: {Affirmation}, Crisis: {Crisis}", 
                _affirmationDeployment, _crisisDeployment);
            
            _cognitiveServicesRetryPipeline = ResiliencePolicies.CreateCognitiveServicesRetryPipeline(_logger);
            _openAIRetryPipeline = ResiliencePolicies.CreateOpenAIRetryPipeline(_logger);
        }
        
        /// <summary>
        /// Set context for token tracking (call before AnalyzeAsync)
        /// </summary>
        public void SetTrackingContext(string userId, string entryId)
        {
            _currentUserId = userId;
            _currentEntryId = entryId;
        }

        public async Task<JournalAnalysisResult> AnalyzeAsync(string text, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(text))
                {
                    throw new ArgumentException("Text cannot be null or empty", nameof(text));
                }

                _logger.LogInformation("Starting analysis for text with length: {TextLength}", text.Length);

                // Perform sentiment analysis with retry policy
                Response<DocumentSentiment> sentimentResult = await _cognitiveServicesRetryPipeline.ExecuteAsync(
                    async token => await _textClient.AnalyzeSentimentAsync(text, cancellationToken: token),
                    cancellationToken
                );
                
                // Extract key phrases with retry policy
                Response<KeyPhraseCollection> keyPhrasesResult = await _cognitiveServicesRetryPipeline.ExecuteAsync(
                    async token => await _textClient.ExtractKeyPhrasesAsync(text, cancellationToken: token),
                    cancellationToken
                );

                // Generate summary based on sentiment
                string summary = GenerateSummary(sentimentResult.Value);
                
                // Generate personalized affirmation using Azure OpenAI with retry policy
                string affirmation = await GenerateAffirmationAsync(text, cancellationToken);

                // Check for crisis indicators with retry policy
                var (isCrisis, crisisReason) = await DetectCrisisAsync(text, cancellationToken);

                var result = new JournalAnalysisResult
                {
                    Sentiment = sentimentResult.Value.Sentiment.ToString(),
                    SentimentScore = sentimentResult.Value.ConfidenceScores.Positive,
                    KeyPhrases = keyPhrasesResult.Value.ToList(),
                    Summary = summary,
                    Affirmation = affirmation,
                    IsCrisisDetected = isCrisis,
                    CrisisReason = crisisReason,
                    CrisisResources = isCrisis ? CrisisResources.GetDefaultResources() : new List<CrisisResource>()
                };

                _logger.LogInformation("Analysis completed successfully. Sentiment: {Sentiment}, KeyPhrases count: {KeyPhrasesCount}, Crisis detected: {IsCrisis}", 
                    result.Sentiment, result.KeyPhrases.Count, result.IsCrisisDetected);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing journal entry text");
                throw;
            }
        }

        private async Task<string> GenerateAffirmationAsync(string journalText, CancellationToken cancellationToken = default)
        {
            try
            {
                string prompt = $@"Read this journal entry and generate a kind, supportive, and personalized affirmation for the user. 
The affirmation should be encouraging, empathetic, and help them feel validated and supported.
Keep it concise (1-2 sentences) and speak directly to them using 'you'.

Journal entry: ""{journalText}""";

                List<ChatMessage> chatMessages = new List<ChatMessage>()
                {
                    new SystemChatMessage("You are a compassionate mental health assistant who provides supportive and encouraging affirmations. Your responses should be warm, validating, and help the user feel understood and supported."),
                    new UserChatMessage(prompt),
                };

                ChatCompletionOptions requestOptions = new ChatCompletionOptions()
                {
                    MaxOutputTokenCount = 200,
                    Temperature = 0.7f,
                    TopP = 1.0f,
                };

                ChatClient chatClient = _openAIClient.GetChatClient(_affirmationDeployment);

                _logger.LogInformation("Generating affirmation for journal entry using deployment: {Deployment}", _affirmationDeployment);

                ClientResult<ChatCompletion> completions = await _openAIRetryPipeline.ExecuteAsync(
                    async token => await chatClient.CompleteChatAsync(chatMessages, requestOptions, cancellationToken: token),
                    cancellationToken
                );

                string affirmation = completions.Value.Content[0].Text.Trim();
                _logger.LogInformation("Generated affirmation successfully");
                
                // Record token usage for monitoring
                await RecordTokenUsageAsync(completions.Value, _affirmationDeployment, "affirmation", cancellationToken);
                
                return affirmation;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating affirmation");
                // Return a fallback affirmation if AI generation fails
                return "You are valued, your feelings are valid, and you have the strength to navigate through this moment.";
            }
        }

        private async Task<(bool isCrisis, string? reason)> DetectCrisisAsync(string journalText, CancellationToken cancellationToken = default)
        {
            try
            {
                // COST OPTIMIZATION: Pre-screen for crisis keywords before calling expensive GPT-4 API
                bool hasCrisisKeywords = CrisisKeywords.Any(keyword => 
                    journalText.Contains(keyword, StringComparison.OrdinalIgnoreCase));
                
                if (!hasCrisisKeywords)
                {
                    _logger.LogInformation("No crisis keywords detected - skipping GPT-4 crisis analysis (cost optimization)");
                    return (false, null);
                }
                
                _logger.LogWarning("Crisis keywords detected - performing detailed GPT-4 analysis");
                
                string prompt = $@"Analyze this journal entry for signs of immediate crisis or serious mental health concerns.
Specifically look for indicators of:
- Suicidal ideation or self-harm intentions
- Plans or methods to harm oneself or others
- Severe hopelessness or despair with no perceived way out
- Recent suicide attempts or severe self-harm
- Acute trauma or abuse

Do NOT flag general sadness, stress, anxiety, or normal difficult emotions.

Respond in JSON format:
{{
  ""isCrisis"": true or false,
  ""reason"": ""brief explanation if crisis detected, or null if not""
}}

Journal entry: ""{journalText}""";

                List<ChatMessage> chatMessages = new List<ChatMessage>()
                {
                    new SystemChatMessage("You are a mental health crisis detection system. Your role is to identify immediate safety concerns that require professional intervention. Be sensitive but accurate. Only flag genuine crises, not everyday struggles."),
                    new UserChatMessage(prompt),
                };

                ChatCompletionOptions requestOptions = new ChatCompletionOptions()
                {
                    MaxOutputTokenCount = 150,
                    Temperature = 0.3f, // Lower temperature for more consistent detection
                    TopP = 1.0f,
                    ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat()
                };

                ChatClient chatClient = _openAIClient.GetChatClient(_crisisDeployment);

                _logger.LogInformation("Performing crisis detection on journal entry using deployment: {Deployment}", _crisisDeployment);

                ClientResult<ChatCompletion> completions = await _openAIRetryPipeline.ExecuteAsync(
                    async token => await chatClient.CompleteChatAsync(chatMessages, requestOptions, cancellationToken: token),
                    cancellationToken
                );

                string response = completions.Value.Content[0].Text.Trim();
                
                // Record token usage for monitoring
                await RecordTokenUsageAsync(completions.Value, _crisisDeployment, "crisis-detection", cancellationToken);
                
                // Parse the JSON response
                using var jsonDoc = System.Text.Json.JsonDocument.Parse(response);
                var root = jsonDoc.RootElement;
                
                bool isCrisis = root.GetProperty("isCrisis").GetBoolean();
                string? reason = root.TryGetProperty("reason", out var reasonElement) && reasonElement.ValueKind != System.Text.Json.JsonValueKind.Null
                    ? reasonElement.GetString()
                    : null;

                if (isCrisis)
                {
                    _logger.LogWarning("Crisis detected in journal entry. Reason: {Reason}", reason);
                }
                else
                {
                    _logger.LogInformation("No crisis indicators detected");
                }
                
                return (isCrisis, reason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing crisis detection");
                // In case of error, err on the side of caution but don't false alarm
                return (false, null);
            }
        }

        private string GenerateSummary(DocumentSentiment sentiment)
        {
            var dominantSentiment = sentiment.Sentiment.ToString().ToLower();
            var positiveScore = sentiment.ConfidenceScores.Positive;
            var negativeScore = sentiment.ConfidenceScores.Negative;
            var neutralScore = sentiment.ConfidenceScores.Neutral;

            string summary = dominantSentiment switch
            {
                "positive" => $"This entry reflects a positive mindset with {positiveScore:P0} confidence. You seem to be in good spirits.",
                "negative" => $"This entry shows some challenging emotions with {negativeScore:P0} confidence. Remember that difficult feelings are temporary.",
                "neutral" => $"This entry maintains a balanced tone with {neutralScore:P0} confidence. You appear to be processing your thoughts thoughtfully.",
                "mixed" => "This entry contains a mix of emotions, showing the complexity of your current experience.",
                _ => $"This entry is mostly {dominantSentiment} in tone."
            };

            return summary;
        }
        
        /// <summary>
        /// Record token usage for monitoring and billing
        /// </summary>
        private async Task RecordTokenUsageAsync(ChatCompletion completion, string model, string operation, CancellationToken cancellationToken = default)
        {
            if (_quotaService == null || string.IsNullOrEmpty(_currentUserId))
            {
                return; // Quota service not available or no user context
            }
            
            try
            {
                var usage = completion.Usage;
                
                // Approximate costs per 1M tokens (as of April 2026)
                var (inputCost, outputCost) = model.ToLower() switch
                {
                    "gpt-4o-mini" => (0.15m, 0.60m),
                    "gpt-4o" => (5.00m, 15.00m),
                    "gpt-4" => (30.00m, 60.00m),
                    "gpt-4-turbo" => (10.00m, 30.00m),
                    _ => (5.00m, 15.00m) // Default to GPT-4o pricing
                };
                
                var estimatedCost = (usage.InputTokenCount * inputCost / 1_000_000m) + 
                                   (usage.OutputTokenCount * outputCost / 1_000_000m);
                
                var tokenUsage = new TokenUsage
                {
                    UserId = _currentUserId,
                    Model = model,
                    InputTokens = usage.InputTokenCount,
                    OutputTokens = usage.OutputTokenCount,
                    EstimatedCost = estimatedCost,
                    Operation = operation,
                    JournalEntryId = _currentEntryId ?? string.Empty
                };
                
                await _quotaService.RecordTokenUsageAsync(tokenUsage, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to record token usage for operation {Operation}", operation);
                // Don't throw - this is monitoring only
            }
        }
    }
}

