using StackExchange.Redis;

namespace RedirectService.Configuration
{
    public static class RedisConfig
    {
        public static IConnectionMultiplexer CreateConnection(string connectionString = "localhost:6379")
        {
       
            return ConnectionMultiplexer.Connect(connectionString);
        }
    }
}