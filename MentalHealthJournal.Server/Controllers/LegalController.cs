using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MentalHealthJournal.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // Legal documents should be accessible without authentication
    public class LegalController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<LegalController> _logger;

        public LegalController(IWebHostEnvironment environment, ILogger<LegalController> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        [HttpGet("privacy")]
        public async Task<IActionResult> GetPrivacyPolicy()
        {
            try
            {
                var filePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "PRIVACY_POLICY.md");
                _logger.LogInformation("Attempting to read privacy policy from: {FilePath}", filePath);

                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Privacy policy file not found at: {FilePath}", filePath);
                    return NotFound("Privacy policy not found");
                }

                var content = await System.IO.File.ReadAllTextAsync(filePath);
                return Content(content, "text/markdown");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading privacy policy");
                return StatusCode(500, "Error retrieving privacy policy");
            }
        }

        [HttpGet("terms")]
        public async Task<IActionResult> GetTermsOfService()
        {
            try
            {
                var filePath = Path.Combine(_environment.ContentRootPath, "wwwroot", "TERMS_OF_SERVICE.md");
                _logger.LogInformation("Attempting to read terms of service from: {FilePath}", filePath);

                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Terms of service file not found at: {FilePath}", filePath);
                    return NotFound("Terms of service not found");
                }

                var content = await System.IO.File.ReadAllTextAsync(filePath);
                return Content(content, "text/markdown");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading terms of service");
                return StatusCode(500, "Error retrieving terms of service");
            }
        }
    }
}
