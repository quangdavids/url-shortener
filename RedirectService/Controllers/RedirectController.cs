using Microsoft.AspNetCore.Mvc;
using RedirectService.Services;
using Microsoft.Extensions.Logging;
using RedirectService.Models; // Add this for UrlModel
using StackExchange.Redis;   // Add this for Redis

namespace RedirectService.Controllers
{
    [ApiController]
    [Route("")]
    public class RedirectController : ControllerBase
    {
        private readonly RedirectServiceClass _redirectService;
        private readonly RedisCacheService _cache;
        private readonly ILogger<RedirectController> _logger;

        public RedirectController(
            RedirectServiceClass redirectService,
            RedisCacheService cache, 
            ILogger<RedirectController> logger)
        {
            _redirectService = redirectService;
            _cache = cache;
            _logger = logger;
        }

        [HttpGet("{shortCode}")]
        public async Task<IActionResult> RedirectToOriginal(string shortCode)
        {
            // Try to get URL from cache first
            var cachedUrl = await _cache.GetAsync<UrlModel>(shortCode);
            if (cachedUrl != null)
            {
                _logger.LogInformation("Cache hit for code: {ShortCode}", shortCode);
                return await HandleRedirect(cachedUrl, shortCode);
            }

            // If not in cache, get from database
            var shortUrl = await _redirectService.GetOriginalUrlAsync(shortCode);
            if (shortUrl == null)
            {
                return NotFound(new { message = "Short URL not found" });
            }

            // Cache the URL for future requests
            await _cache.SetAsync(shortCode, shortUrl);
            _logger.LogInformation("URL cached for code: {ShortCode}", shortCode);

            return await HandleRedirect(shortUrl, shortCode);
        }

        private async Task<IActionResult> HandleRedirect(UrlModel url, string shortCode)
        {
            try
            {
                // Increment clicks counter
                await _redirectService.IncrementClicksAsync(shortCode);
                _logger.LogInformation("Click tracked for URL code: {ShortCode}", shortCode);

                // Update cached URL with new click count
                url.Clicks += 1;
                await _cache.SetAsync(shortCode, url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to track click for URL code: {ShortCode}", shortCode);
            }

            var acceptHeader = Request.Headers.Accept.ToString();
            if (acceptHeader.Contains("application/json"))
            {
                return Ok(new { longUrl = url.LongUrl, clicks = url.Clicks });
            }

            return Redirect(url.LongUrl);
        }
    }
}
