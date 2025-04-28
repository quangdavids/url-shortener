using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace RedirectService.Services
{
    public class UrlRedirectService : IRedirectService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UrlRedirectService> _logger;
        private readonly string _redirectServiceBaseUrl;

        public UrlRedirectService(HttpClient httpClient, IConfiguration configuration, ILogger<UrlRedirectService> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _redirectServiceBaseUrl = configuration["RedirectService:BaseUrl"]  ?? throw new InvalidOperationException("Missing configuration: RedirectService:BaseUrl");
        }

        public async Task<string> RedirectAsync(string shortCode)
        {
            if (string.IsNullOrWhiteSpace(shortCode))
            {
                throw new ArgumentException("Short code must not be empty.", nameof(shortCode));
            }

            _logger.LogInformation("Processing redirect for short code: {ShortCode}", shortCode);

            var originalUrl = await GetOriginalUrlAsync(shortCode);

            if (originalUrl == null)
            {
                _logger.LogWarning("Short code {ShortCode} not found.", shortCode);
                return null;
            }

            await TrackVisitAsync(shortCode);

            return originalUrl;
        }

        private async Task<string> GetOriginalUrlAsync(string shortCode)
        {
            var requestUrl = $"{_redirectServiceBaseUrl}/api/url/{shortCode}";
            _logger.LogDebug("Fetching original URL from: {RequestUrl}", requestUrl);

            try
            {
                _logger.LogInformation("Calling URL Shortener service at: {RequestUrl}", requestUrl);
                var response = await _httpClient.GetAsync(requestUrl);

                if (response.IsSuccessStatusCode)
                {
                    var jsonElement = await response.Content.ReadFromJsonAsync<JsonElement>();
                    if (jsonElement.TryGetProperty("originalUrl", out var urlProperty) &&
                        urlProperty.ValueKind == JsonValueKind.String)
                    {
                        return urlProperty.GetString();
                    }

                    _logger.LogWarning("originalUrl property not found in response.");
                    return null;
                }

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return null;
                }

                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("ShortenerService error: {StatusCode} {ReasonPhrase}. Response: {ErrorBody}",
                    (int)response.StatusCode, response.ReasonPhrase, errorBody);

                response.EnsureSuccessStatusCode(); // Will throw
                return null;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request error while fetching original URL for {ShortCode}", shortCode);
                throw;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON parsing error for short code {ShortCode}", shortCode);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error fetching original URL for {ShortCode}", shortCode);
                throw;
            }
        }

        private async Task TrackVisitAsync(string shortCode)
        {
            var visitUrl = $"{_redirectServiceBaseUrl}/api/urls/{shortCode}/visit";
            _logger.LogDebug("Tracking visit to: {VisitUrl}", visitUrl);

            try
            {
                var content = new StringContent(
                    JsonSerializer.Serialize(new { }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync(visitUrl, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to track visit. Status: {StatusCode} {ReasonPhrase}. Response: {ErrorBody}",
                        (int)response.StatusCode, response.ReasonPhrase, errorBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking visit for short code {ShortCode}", shortCode);
            }
        }
    }
}
