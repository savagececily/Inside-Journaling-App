using Journal.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace Journal.Services
{
    /// <summary>
    /// Caches analysis results to reduce AI API calls for similar entries
    /// </summary>
    public class AnalysisCacheService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<AnalysisCacheService> _logger;
        private readonly TimeSpan _cacheExpiration = TimeSpan.FromHours(24);

        public AnalysisCacheService(IMemoryCache cache, ILogger<AnalysisCacheService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// Try to get cached analysis result
        /// </summary>
        public bool TryGetCached(string text, out JournalAnalysisResult? result)
        {
            var cacheKey = ComputeCacheKey(text);
            
            if (_cache.TryGetValue(cacheKey, out JournalAnalysisResult? cachedResult))
            {
                result = cachedResult;
                _logger.LogInformation("Cache hit for analysis (key: {Key})", cacheKey.Substring(0, 12));
                return true;
            }
            
            result = null;
            return false;
        }

        /// <summary>
        /// Cache an analysis result
        /// </summary>
        public void CacheResult(string text, JournalAnalysisResult result)
        {
            var cacheKey = ComputeCacheKey(text);
            
            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(_cacheExpiration)
                .SetSize(1); // Each entry counts as size 1
            
            _cache.Set(cacheKey, result, cacheEntryOptions);
            
            _logger.LogInformation("Cached analysis result (key: {Key}, expires in {Hours} hours)", 
                cacheKey.Substring(0, 12), _cacheExpiration.TotalHours);
        }

        /// <summary>
        /// Compute cache key from text content
        /// </summary>
        private string ComputeCacheKey(string text)
        {
            // Normalize text for consistent hashing
            var normalized = text.Trim().ToLowerInvariant();
            
            // Compute SHA256 hash
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(normalized));
            
            // Convert to hex string
            return Convert.ToHexString(hashBytes);
        }

        /// <summary>
        /// Clear all cached entries (for testing or admin purposes)
        /// </summary>
        public void ClearCache()
        {
            if (_cache is MemoryCache memoryCache)
            {
                memoryCache.Compact(1.0); // Remove all entries
                _logger.LogInformation("Analysis cache cleared");
            }
        }
    }
}
