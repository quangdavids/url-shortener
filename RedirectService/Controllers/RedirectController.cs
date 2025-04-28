using Microsoft.AspNetCore.Mvc;
using RedirectService.Services;

namespace RedirectService.Controllers
{
    [ApiController]
    [Route("")]
    public class RedirectController(IRedirectService redirectService, ILogger<RedirectController> logger) : ControllerBase
    {
        private readonly IRedirectService _redirectService = redirectService ?? throw new ArgumentNullException(nameof(redirectService));
        private readonly ILogger<RedirectController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        [HttpGet("{shortCode}")]
        public async Task<IActionResult> RedirectToUrl(string shortCode)
        {
            if (string.IsNullOrWhiteSpace(shortCode))
            {
                return BadRequest("Short code is required");
            }

            try
            {
                var originalUrl = await _redirectService.RedirectAsync(shortCode);
                
                if (originalUrl == null)
                {
                    return NotFound($"No URL found for code: {shortCode}");
                }

                _logger.LogInformation("Redirecting {ShortCode} to {OriginalUrl}", shortCode, originalUrl);
    
                return await Task.FromResult(Redirect(originalUrl));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing redirect for {ShortCode}", shortCode);
                return StatusCode(500, "An error occurred while processing your request");
            }
        }
    }  
    }
