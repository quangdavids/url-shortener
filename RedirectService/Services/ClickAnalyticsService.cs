using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;

namespace RedirectService.Services
{
    public class ClickAnalyticsService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<ClickAnalyticsService> _logger;

        public ClickAnalyticsService(
            IConnectionMultiplexer redis,
            ILogger<ClickAnalyticsService> logger)
        {
            _redis = redis;
            _logger = logger;
        }

        public async Task TrackClick(string urlCode)
        {
            try
            {
                var message = JsonSerializer.Serialize(new
                {
                    urlCode,
                    timestamp = DateTime.UtcNow,
                    eventType = "click"
                });

                await _redis.GetSubscriber().PublishAsync("click-events", message);
                _logger.LogInformation("Published click event for code: {UrlCode}", urlCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish click event for code: {UrlCode}", urlCode);
            }
        }
    }
}