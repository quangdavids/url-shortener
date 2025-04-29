using MongoDB.Driver;
using RedirectService.Models;
using Microsoft.Extensions.Options;
using RedirectService.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;

namespace RedirectService.Services
{
    public class RedirectServiceClass
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly ISubscriber _subscriber;
        private readonly IMongoCollection<UrlModel> _shortUrls;
        private readonly RedisCacheService _cache;
        private readonly ILogger<RedirectServiceClass> _logger;
        private readonly MongoDbSettings _settings;

        public RedirectServiceClass(
            IConnectionMultiplexer redis,
            IOptions<MongoDbSettings> mongoDbSettings, 
            RedisCacheService cache,
            ILogger<RedirectServiceClass> logger)
        {
            _redis = redis;
            _subscriber = redis.GetSubscriber();
            _cache = cache;
            _logger = logger;
            _settings = mongoDbSettings.Value;

            // Subscribe to URL creation events
            _subscriber.Subscribe("url-events", (channel, message) => {
                var urlData = JsonSerializer.Deserialize<UrlModel>(message);
                if (urlData != null)
                {
                    SyncUrlToLocalDb(urlData).Wait();
                }
            });

            try
            {
                var client = new MongoClient(_settings.ConnectionString);
                var database = client.GetDatabase(_settings.DatabaseName);
                _shortUrls = database.GetCollection<UrlModel>(_settings.CollectionName);
                
                _logger.LogInformation("MongoDB connected to database: {DatabaseName}, collection: {CollectionName}", 
                    _settings.DatabaseName, _settings.CollectionName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to MongoDB");
                throw;
            }
        }

        private async Task SyncUrlToLocalDb(UrlModel urlData)
        {
            try
            {
                // Store only necessary data for redirection
                var redirectData = new UrlModel
                {
                    UrlCode = urlData.UrlCode,
                    LongUrl = urlData.LongUrl,
                    Clicks = 0
                };

                await _shortUrls.ReplaceOneAsync(
                    x => x.UrlCode == urlData.UrlCode,
                    redirectData,
                    new ReplaceOptions { IsUpsert = true }
                );

                // Cache the URL data
                await _cache.SetAsync(urlData.UrlCode, redirectData);
                _logger.LogInformation("Synced URL data for code: {UrlCode}", urlData.UrlCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync URL data for code: {UrlCode}", urlData.UrlCode);
            }
        }

        public async Task<UrlModel?> GetOriginalUrlAsync(string shortCode)
        {
            try
            {
                _logger.LogInformation("Fetching URL for code: {ShortCode}", shortCode);
                
                // Try cache first
                var cachedUrl = await _cache.GetAsync<UrlModel>(shortCode);
                if (cachedUrl != null)
                {
                    _logger.LogInformation("Cache hit for code: {ShortCode}", shortCode);
                    return cachedUrl;
                }

                // Get from database
                var result = await _shortUrls.Find(s => s.UrlCode == shortCode).FirstOrDefaultAsync();
                if (result != null)
                {
                    _logger.LogInformation("Found URL in database, caching for code: {ShortCode}", shortCode);
                    
                    // Just await the cache operation without assigning its result
                    await _cache.SetAsync(shortCode, result);
                    _logger.LogInformation("URL cached for code: {ShortCode}", shortCode);
                }
                else
                {
                    _logger.LogWarning("URL not found for code: {ShortCode}", shortCode);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing URL for code: {ShortCode}", shortCode);
                throw;
            }
        }

        public async Task IncrementClicksAsync(string shortCode)
        {
            try
            {
                _logger.LogInformation("Incrementing clicks for URL with code: {ShortCode}", shortCode);
                
                // Update database
                var update = Builders<UrlModel>.Update.Inc(u => u.Clicks, 1);
                await _shortUrls.UpdateOneAsync(u => u.UrlCode == shortCode, update);

                // Invalidate cache to ensure next request gets updated click count
                await _cache.InvalidateAsync(shortCode);
                _logger.LogInformation("Cache invalidated for code: {ShortCode}", shortCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to increment clicks for code: {ShortCode}", shortCode);
                throw;
            }
        }
    }
}
