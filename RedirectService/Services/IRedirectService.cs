
using System.Threading.Tasks;

namespace RedirectService.Services
{
    public interface IRedirectService
    {
        /// <summary>
        /// Handles the URL redirection using the provided short code
        /// </summary>
        /// <param name="shortCode">The short code to redirect from</param>
        /// <returns>The original URL for redirection, or null if not found</returns>
        Task<string> RedirectAsync(string shortCode);
    }
}