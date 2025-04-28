using Microsoft.AspNetCore.Http;
using StackExchange.Redis;
using System.Text.Json;
using System.Threading.Tasks;
using RedirectService.Models;

namespace RedirectService.Middleware
{
    public class CacheMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConnectionMultiplexer _redis;
        private const int CACHE_EXPIRY = 3600; // 1 hour

        public CacheMiddleware(RequestDelegate next, IConnectionMultiplexer redis)
        {
            _next = next;
            _redis = redis;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var database = _redis.GetDatabase();
            var urlCode = context.Request.Path.Value.TrimStart('/');
            
            // Try to get URL from cache
            var cachedValue = await database.StringGetAsync($"url:{urlCode}");
            if (cachedValue.HasValue)
            {
                var urlData = JsonSerializer.Deserialize<UrlModel>(cachedValue);
                context.Items["CachedUrl"] = urlData;
            }

            await _next(context);
        }
    }
}