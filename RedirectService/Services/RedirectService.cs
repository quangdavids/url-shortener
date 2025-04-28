using MongoDB.Driver;
using RedirectService.Models;
using Microsoft.Extensions.Options;
using RedirectService.Configuration;
using Microsoft.Extensions.Logging;

namespace RedirectService.Services
{
    public class RedirectServiceClass
    {
        private readonly IMongoCollection<UrlModel> _shortUrls;
        private readonly ILogger<RedirectServiceClass> _logger;
        private readonly MongoDbSettings _settings;

        public RedirectServiceClass(IOptions<MongoDbSettings> mongoDbSettings, ILogger<RedirectServiceClass> logger)
        {
            _logger = logger;
            _settings = mongoDbSettings.Value;

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

        public async Task<UrlModel?> GetOriginalUrlAsync(string shortCode)
        {
            _logger.LogInformation("Searching for URL with code: {ShortCode} in database: {DatabaseName}, collection: {CollectionName}", 
                shortCode, _settings.DatabaseName, _settings.CollectionName);
                
            var result = await _shortUrls.Find(s => s.UrlCode == shortCode).FirstOrDefaultAsync();
            
            if (result == null)
            {
                _logger.LogWarning("No URL found for code: {ShortCode}", shortCode);
            }
            else
            {
                _logger.LogInformation("Found URL for code: {ShortCode}, longUrl: {LongUrl}", shortCode, result.LongUrl);
            }
            
            return result;
        }
    }
}
