using RedirectService.Configuration;
using RedirectService.Middleware;
using RedirectService.Models;
using RedirectService.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

builder.Services.AddSingleton<RedirectServiceClass>();

// Add Redis configuration
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<Program>>();
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetValue<string>("Redis:ConnectionString") ?? "localhost:6379";
    
    logger.LogInformation("Configuring Redis with connection string: {ConnectionString}", connectionString);
    
    var options = new ConfigurationOptions
    {
        EndPoints = { connectionString },
        AbortOnConnectFail = false,
        ConnectRetry = 5,
        ConnectTimeout = 5000
    };
    
    var multiplexer = ConnectionMultiplexer.Connect(options);
    
    logger.LogInformation("Redis Connection Status: {Status}", 
        multiplexer.IsConnected ? "Connected" : "Disconnected");
    
    return multiplexer;
});

builder.Services.AddSingleton<RedisCacheService>();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:4000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddControllers();

var app = builder.Build();
app.UseCors();
// Configure the HTTP request pipeline
app.UseRouting();
app.UseAuthorization();

// Add after other middleware registrations
app.UseMiddleware<ClickTrackingMiddleware>();


app.MapControllers();

app.Run();
