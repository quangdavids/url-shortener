using Microsoft.AspNetCore.Mvc;
using RedirectService.Services;

namespace RedirectService.Controllers
{
    [ApiController]
    [Route("")]
    public class RedirectController : ControllerBase
    {
        private readonly RedirectServiceClass _redirectService;

        public RedirectController(RedirectServiceClass redirectService)
        {
            _redirectService = redirectService;
        }

        [HttpGet("{shortCode}")]
        public async Task<IActionResult> RedirectToOriginal(string shortCode)
        {
            var shortUrl = await _redirectService.GetOriginalUrlAsync(shortCode);
            if (shortUrl == null)
            {
                return NotFound(new { message = "Short URL not found" });
            }

             var acceptHeader = Request.Headers.Accept.ToString();
            if (acceptHeader.Contains("application/json"))
            {
                // Return JSON response for API requests
                return Ok(new { longUrl = shortUrl.LongUrl });
            }

            return Redirect(shortUrl.LongUrl);
        }
    }
}
