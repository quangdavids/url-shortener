using Microsoft.AspNetCore.Http;
using RedirectService.Services;

namespace RedirectService.Middleware
{
    public class ClickTrackingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ClickTrackingMiddleware> _logger;

        public ClickTrackingMiddleware(RequestDelegate next, ILogger<ClickTrackingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during redirect");
                throw;
            }
        }
    }
}