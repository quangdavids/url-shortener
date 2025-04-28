using Microsoft.AspNetCore.Mvc;
using RedirectService.Services;
using Microsoft.Extensions.Logging;

namespace RedirectService.Controllers
{
    [ApiController]
    [Route("")]
    public class RedirectController : ControllerBase
    {
        private readonly RedirectServiceClass _redirectService;
        private readonly ILogger<RedirectController> _logger;

        public RedirectController(RedirectServiceClass redirectService, ILogger<RedirectController> logger)
        {
            _redirectService = redirectService;
            _logger = logger;
        }

        [HttpGet("{shortCode}")]
        public async Task<IActionResult> RedirectToOriginal(string shortCode)
        {
            var shortUrl = await _redirectService.GetOriginalUrlAsync(shortCode);
            if (shortUrl == null)
            {
                return NotFound(new { message = "Short URL not found" });
            }

            try
            {
                // Increment clicks counter
                await _redirectService.IncrementClicksAsync(shortCode);
                _logger.LogInformation("Click tracked for URL code: {ShortCode}", shortCode);
            }
            catch (Exception ex)
            {
                // Log error but don't fail the redirect
                _logger.LogError(ex, "Failed to track click for URL code: {ShortCode}", shortCode);
            }

            var acceptHeader = Request.Headers.Accept.ToString();
            if (acceptHeader.Contains("application/json"))
            {
                // Return JSON response for API requests
                return Ok(new { longUrl = shortUrl.LongUrl, clicks = shortUrl.Clicks + 1 });
            }

            return Redirect(shortUrl.LongUrl);
        }
    }
}
