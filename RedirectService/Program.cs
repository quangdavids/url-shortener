using RedirectService.Configuration;
using RedirectService.Models;
using RedirectService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

builder.Services.AddSingleton<RedirectServiceClass>();

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
app.MapControllers();


app.Run();
