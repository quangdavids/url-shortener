using StackExchange.Redis;
using System.Text.Json;

namespace RedirectService.Services
{
    public class RedisCacheService
    {
        private readonly IDatabase _cache;
        private readonly ILogger<RedisCacheService> _logger;
        private readonly string _instanceName;
        private const int CacheExpiryHours = 24;

        public RedisCacheService(
            IConnectionMultiplexer redis, 
            IConfiguration configuration,
            ILogger<RedisCacheService> logger)
        {
            _cache = redis.GetDatabase();
            _logger = logger;
            _instanceName = configuration.GetValue<string>("Redis:InstanceName") ?? "RedirectService";
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            try
            {
                string redisKey = $"{_instanceName}:{key}";
                var value = await _cache.StringGetAsync(redisKey);
                
                if (!value.HasValue)
                {
                    _logger.LogInformation("Cache miss for key: {Key}", redisKey);
                    return default;
                }

                _logger.LogInformation("Cache hit for key: {Key}", redisKey);
                return JsonSerializer.Deserialize<T>(value!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting value from Redis for key: {Key}", key);
                return default;
            }
        }

        public async Task SetAsync<T>(string key, T value)
        {
            try
            {
                string redisKey = $"{_instanceName}:{key}";
                var serializedValue = JsonSerializer.Serialize(value);
                var expiryTime = TimeSpan.FromHours(CacheExpiryHours);
                
                await _cache.StringSetAsync(redisKey, serializedValue, expiryTime);
                _logger.LogInformation("Value cached for key: {Key}", redisKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting value in Redis for key: {Key}", key);
            }
        }

        public async Task InvalidateAsync(string key)
        {
            try
            {
                string redisKey = $"{_instanceName}:{key}";
                _logger.LogInformation("Invalidating Redis key: {Key}", redisKey);
                
                var result = await _cache.KeyDeleteAsync(redisKey);
                if (result)
                    _logger.LogInformation("Successfully invalidated key: {Key}", redisKey);
                else
                    _logger.LogWarning("Key not found for invalidation: {Key}", redisKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating Redis key: {Key}", key);
            }
        }
    }
}